import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { NextRequest, NextResponse } from "next/server";
import type { ExtractedDeal } from "../analyze-flyers/route";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const { deals, storeName }: { deals: ExtractedDeal[]; storeName: string } =
      await request.json();

    if (!deals || deals.length === 0) {
      return NextResponse.json({ error: "No deals provided" }, { status: 400 });
    }

    const topDeals = deals.slice(0, 12);
    const dealsText = topDeals
      .map(
        (d) =>
          `${d.emoji} ${d.name} — ${d.price}${d.size ? ` (${d.size})` : ""}${d.badge ? ` [${d.badge}]` : ""}`
      )
      .join("\n");

    const { text } = await generateText({
      model: anthropic("claude-opus-4-5"),
      messages: [
        {
          role: "user",
          content: `Generate a beautiful, modern grocery promotional flyer as a complete self-contained HTML page.

Store: ${storeName || "Weekly Grocery Deals"}
Deals to feature:
${dealsText}

Requirements:
- Bold, eye-catching design with bright yellow (#FFD700) and red (#E31837) color scheme (like a real grocery flyer)
- Large price tags with savings badges
- Clean grid layout of deal cards
- "BEST DEALS THIS WEEK" header
- Each deal card shows: emoji, product name, price (large and bold), size, savings badge
- Highlight the top 3 deals with a special "🔥 HOT DEAL" banner
- Add a "Valid while supplies last" footer
- Make it look like a real grocery store weekly flyer
- Include CSS animations (pulse on prices, hover effects)
- Use Google Fonts (Montserrat or similar bold font)
- Make it 800px wide, suitable for printing/sharing
- NO external images, only emojis and CSS

Return ONLY the complete HTML code starting with <!DOCTYPE html>, nothing else.`,
        },
      ],
    });

    // Extract HTML from response
    const htmlMatch = text.match(/<!DOCTYPE html>[\s\S]*/i);
    const html = htmlMatch ? htmlMatch[0] : text;

    return NextResponse.json({ html });
  } catch (error) {
    console.error("Error generating flyer:", error);
    return NextResponse.json(
      { error: "Failed to generate flyer. Please try again." },
      { status: 500 }
    );
  }
}
