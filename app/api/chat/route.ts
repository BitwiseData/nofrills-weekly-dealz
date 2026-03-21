import { anthropic } from "@ai-sdk/anthropic";
import { streamText, convertToModelMessages, UIMessage } from "ai";
import { deals } from "@/lib/deals";

export const maxDuration = 30;

const dealsContext = deals
  .map(
    (d) =>
      `- ${d.name} (${d.category}): ${d.price}${d.size ? `, ${d.size}` : ""}${d.note ? ` [${d.note}]` : ""}`
  )
  .join("\n");

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: anthropic("claude-haiku-4-5-20251001"),
    system: `You are a helpful grocery shopping assistant for No Frills store. Help customers find the best deals and save money on groceries.

Current weekly deals (Week 10, 2026):
${dealsContext}

Be concise, friendly, and helpful. When recommending deals, mention the price and any special notes. If someone asks about a category, list relevant deals. Always try to help them save money.`,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
