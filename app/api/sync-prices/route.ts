/**
 * POST /api/sync-prices
 * Body: { items: string[], country: "US" | "CA", postalCode: string }
 *
 * Forces a fresh price sync from Kroger + Flipp into Supabase.
 * Returns the freshly synced prices.
 */

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items, country = "US", postalCode = "" } = body as {
      items: string[];
      country: "US" | "CA";
      postalCode: string;
    };

    if (!items?.length) {
      return NextResponse.json({ error: "No items provided" }, { status: 400 });
    }

    // Delegate to GET /api/prices with cache busting
    const url = new URL("/api/prices", req.url);
    url.searchParams.set("items", items.join(","));
    url.searchParams.set("country", country);
    if (postalCode) url.searchParams.set("postalCode", postalCode);
    url.searchParams.set("_bust", Date.now().toString());

    const res = await fetch(url.toString(), { cache: "no-store" });
    const data = await res.json();

    return NextResponse.json(data);
  } catch (err) {
    console.error("sync-prices error:", err);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
