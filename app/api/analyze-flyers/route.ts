import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 120;

export interface ExtractedDeal {
  name: string;
  category: string;
  price: string;
  size?: string;
  savingsPercent: number;
  badge?: string;
  emoji: string;
  source: string;
  isTopDeal?: boolean;
}

// Accepts ONE file at a time to stay within Vercel's 4.5 MB body limit
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("pdf") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No PDF file provided" }, { status: 400 });
    }

    // Safety check: warn if > 4 MB
    const MAX_SIZE = 4 * 1024 * 1024; // 4 MB
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

    const { text } = await generateText({
      model: anthropic("claude-opus-4-5"),
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
              text: `You are a grocery flyer deal extractor. Extract ALL visible deals/products from this flyer image and return ONLY a valid JSON array.

For each deal, extract:
- "name": product name (string)
- "category": one of Produce, Meat, Seafood, Pantry, Dairy, Frozen, Bakery, Beverage, Snacks, Household, Floral, Other
- "price": price as shown (e.g. "$1.99", "$1.29/lb", "$5.50")
- "size": package size if visible (e.g. "1 lb", "750g", null if not shown)
- "savingsPercent": numeric savings percent (e.g. 35 for "SAVE 35%", 59 for "SAVE 59%", 0 if not mentioned)
- "badge": promo badge text (e.g. "SAVE 50%", "PRICE DROP", "App Exclusive", null if none)
- "emoji": single most relevant emoji for the product

Return ONLY the JSON array with no other text, markdown, or explanation.`,
            },
          ],
        },
      ],
    });

    // Extract JSON array from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Could not extract deals from this PDF. Please try again." },
        { status: 422 }
      );
    }

    const deals: ExtractedDeal[] = JSON.parse(jsonMatch[0]).map(
      (d: Omit<ExtractedDeal, "source">) => ({
        ...d,
        savingsPercent: d.savingsPercent || 0,
        source: file.name.replace(/\.pdf$/i, "").replace(/[-_]/g, " "),
      })
    );

    return NextResponse.json({ deals, fileName: file.name });
  } catch (error) {
    console.error("Error analyzing flyer:", error);
    const message =
      error instanceof Error ? error.message : "Failed to analyze flyer";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
