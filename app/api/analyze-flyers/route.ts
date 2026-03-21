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

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("pdfs") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No PDF files provided" }, { status: 400 });
    }

    const allDeals: ExtractedDeal[] = [];

    for (const file of files) {
      try {
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
        if (jsonMatch) {
          const deals = JSON.parse(jsonMatch[0]);
          const fileName = file.name.replace(/\.pdf$/i, "").replace(/-/g, " ");
          allDeals.push(
            ...deals.map((d: Omit<ExtractedDeal, "source">) => ({
              ...d,
              source: fileName,
              savingsPercent: d.savingsPercent || 0,
            }))
          );
        }
      } catch (fileError) {
        console.error(`Failed to process ${file.name}:`, fileError);
      }
    }

    // Sort by savings percent descending
    allDeals.sort((a, b) => (b.savingsPercent || 0) - (a.savingsPercent || 0));

    // Mark top deals (top 5 by savings)
    allDeals.slice(0, 5).forEach((deal) => {
      deal.isTopDeal = true;
    });

    // Group by category for best deals summary
    const byCategory = allDeals.reduce(
      (acc, deal) => {
        if (!acc[deal.category]) acc[deal.category] = [];
        acc[deal.category].push(deal);
        return acc;
      },
      {} as Record<string, ExtractedDeal[]>
    );

    return NextResponse.json({
      deals: allDeals,
      totalDeals: allDeals.length,
      filesProcessed: files.length,
      byCategory,
      topDeals: allDeals.slice(0, 5),
    });
  } catch (error) {
    console.error("Error analyzing flyers:", error);
    return NextResponse.json(
      { error: "Failed to analyze flyers. Please try again." },
      { status: 500 }
    );
  }
}
