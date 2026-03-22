import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

export const maxDuration = 120;

// ─── Types ─────────────────────────────────────────────────────────────────

export interface ExtractedDeal {
  name: string;
  category: string;
  price: string;
  originalPrice?: string;
  size?: string;
  savingsPercent: number;
  badge?: string;
  emoji: string;
  source: string;
  isTopDeal?: boolean;
  validFrom?: string;
  validTo?: string;
}

// ─── OCR: extract embedded text from PDF (free, no API) ───────────────────

async function extractTextFromPdf(buffer: ArrayBuffer): Promise<string | null> {
  try {
    // Dynamically import pdf-parse to avoid build-time issues
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse");
    const { text } = await pdfParse(Buffer.from(buffer));
    // Only useful if there's meaningful text (> 100 chars after trimming whitespace)
    const cleaned = text.replace(/\s+/g, " ").trim();
    return cleaned.length > 100 ? cleaned : null;
  } catch {
    return null;
  }
}

// ─── Shared extraction prompt ─────────────────────────────────────────────

const DEAL_EXTRACTION_PROMPT = `You are a grocery flyer deal extractor. Extract ALL deals/products and return ONLY a valid JSON array.

For each deal extract:
- "name": product name (string)
- "category": one of Produce, Meat, Seafood, Pantry, Dairy, Frozen, Bakery, Beverage, Snacks, Household, Floral, Other
- "price": price as shown (e.g. "$1.99", "$1.29/lb")
- "originalPrice": original price if visible (e.g. "$2.99"), null if not shown
- "size": package size if visible (e.g. "1 lb", "750g"), null if not shown
- "savingsPercent": numeric savings percent (e.g. 35 for "SAVE 35%", 0 if not mentioned)
- "badge": promo badge text (e.g. "SAVE 50%", "PRICE DROP", "App Exclusive"), null if none
- "emoji": single most relevant emoji for the product
- "validFrom": flyer valid-from date if visible (ISO YYYY-MM-DD), null if not shown
- "validTo": flyer valid-to date if visible (ISO YYYY-MM-DD), null if not shown

Return ONLY the JSON array with no other text, markdown, or explanation.`;

// ─── Method 1: Text-based extraction (free — uses pdf-parse) ──────────────

async function extractDealsFromText(pdfText: string): Promise<string> {
  const { text } = await generateText({
    model: anthropic("claude-haiku-4-5"),   // Cheapest model — text is already extracted
    messages: [
      {
        role: "user",
        content: `${DEAL_EXTRACTION_PROMPT}\n\nHere is the extracted text from a grocery flyer:\n\n${pdfText.slice(0, 12000)}`,
      },
    ],
  });
  return text;
}

// ─── Method 2: Vision-based extraction (Claude document API) ─────────────

async function extractDealsFromDocument(base64: string): Promise<string> {
  const { text } = await generateText({
    model: anthropic("claude-opus-4-5"),    // Full vision model — needed for image PDFs
    messages: [
      {
        role: "user",
        content: [
          {
            type: "file",
            data: base64,
            mediaType: "application/pdf",
          },
          {
            type: "text",
            text: DEAL_EXTRACTION_PROMPT,
          },
        ],
      },
    ],
  });
  return text;
}

// ─── Main handler ──────────────────────────────────────────────────────────

// Accepts ONE file at a time to stay within Vercel's 4.5 MB body limit
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("pdf") as File | null;
    const storeName = (formData.get("storeName") as string) || "";
    const country = (formData.get("country") as string) || "US";

    if (!file) {
      return NextResponse.json({ error: "No PDF file provided" }, { status: 400 });
    }

    // Safety check: warn if > 4 MB
    const MAX_SIZE = 4 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        {
          error: `PDF "${file.name}" is ${(file.size / 1024 / 1024).toFixed(1)} MB — max is 4 MB. Please split multi-page PDFs into individual pages before uploading.`,
        },
        { status: 413 }
      );
    }

    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    // ── Save upload record to Supabase ────────────────────────────────────────
    let uploadId: string | null = null;
    if (isSupabaseConfigured()) {
      const { data: uploadRecord } = await supabaseAdmin
        .from("flyer_uploads")
        .insert({
          file_name: file.name,
          file_size_bytes: file.size,
          store_name: storeName || file.name.replace(/\.pdf$/i, "").replace(/[-_]/g, " "),
          country: country.toUpperCase(),
          status: "processing",
        })
        .select()
        .single();
      uploadId = uploadRecord?.id || null;
    }

    // ── Smart OCR: try free text extraction first, fall back to vision ─────────

    let rawText: string;
    let extractionMethod: "text_ocr" | "vision_ai";

    // Step 1: Try free pdf-parse text extraction
    const pdfText = await extractTextFromPdf(buffer);

    if (pdfText) {
      // PDF has embedded text — use cheap Claude Haiku to parse it (no vision cost)
      console.log(`[OCR] Text extracted (${pdfText.length} chars) — using Haiku text mode`);
      rawText = await extractDealsFromText(pdfText);
      extractionMethod = "text_ocr";
    } else {
      // Image-based PDF (scanned flyer) — use Claude Opus full vision
      console.log("[OCR] No embedded text — falling back to Claude vision");
      rawText = await extractDealsFromDocument(base64);
      extractionMethod = "vision_ai";
    }

    // ── Parse JSON response ───────────────────────────────────────────────────

    const jsonMatch = rawText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      if (isSupabaseConfigured() && uploadId) {
        await supabaseAdmin
          .from("flyer_uploads")
          .update({ status: "failed", deals_found: 0 })
          .eq("id", uploadId);
      }
      return NextResponse.json(
        { error: "Could not extract deals from this PDF. Please try again." },
        { status: 422 }
      );
    }

    const sourceName = storeName || file.name.replace(/\.pdf$/i, "").replace(/[-_]/g, " ");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const deals: ExtractedDeal[] = JSON.parse(jsonMatch[0]).map((d: any) => ({
      ...d,
      savingsPercent: d.savingsPercent || 0,
      source: sourceName,
    }));

    // ── Save deals to Supabase ────────────────────────────────────────────────

    if (isSupabaseConfigured() && deals.length > 0) {
      const parsePrice = (priceStr: string): number | null => {
        const match = priceStr?.match(/[\d.]+/);
        return match ? parseFloat(match[0]) : null;
      };

      const dealRows = deals.map((d) => ({
        store_chain: sourceName,
        country: country.toUpperCase(),
        product_name: d.name,
        category: d.category,
        price: parsePrice(d.price),
        original_price: d.originalPrice ? parsePrice(d.originalPrice) : null,
        savings_pct: d.savingsPercent || 0,
        badge: d.badge || null,
        emoji: d.emoji,
        valid_from: d.validFrom || null,
        valid_to: d.validTo || null,
        source: "pdf_upload",
        upload_id: uploadId,
        extraction_method: extractionMethod,
      }));

      await supabaseAdmin.from("flyer_deals").insert(dealRows);

      if (uploadId) {
        await supabaseAdmin
          .from("flyer_uploads")
          .update({
            status: "completed",
            deals_found: deals.length,
            completed_at: new Date().toISOString(),
          })
          .eq("id", uploadId);
      }
    }

    return NextResponse.json({
      deals,
      fileName: file.name,
      savedToDb: isSupabaseConfigured() && deals.length > 0,
      uploadId,
      extractionMethod,        // tells the UI which engine was used
      textExtracted: !!pdfText, // true = free OCR, false = paid vision
    });
  } catch (error) {
    console.error("Error analyzing flyer:", error);
    const message = error instanceof Error ? error.message : "Failed to analyze flyer";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
