/**
 * GET /api/prices?items=milk,eggs&country=US&postalCode=91743
 *
 * Returns price comparison data for grocery items.
 * Priority: Supabase cache → Kroger API (US) → Flipp API → mock fallback
 */

import { NextRequest, NextResponse } from "next/server";
import { getKrogerItemPrice } from "@/lib/kroger";
import { searchFlippDeals } from "@/lib/flipp";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

// ─── Mock fallback data ───────────────────────────────────────────────────────
const MOCK_US: Record<string, { store: string; price: number }[]> = {
  milk: [
    { store: "Walmart", price: 3.98 },
    { store: "Kroger", price: 3.49 },
    { store: "Target", price: 4.19 },
    { store: "Costco", price: 2.89 },
  ],
  eggs: [
    { store: "Walmart", price: 4.28 },
    { store: "Kroger", price: 3.99 },
    { store: "Target", price: 4.49 },
    { store: "Costco", price: 3.29 },
  ],
  bread: [
    { store: "Walmart", price: 2.48 },
    { store: "Kroger", price: 2.99 },
    { store: "Target", price: 3.19 },
    { store: "Costco", price: 1.99 },
  ],
  chicken: [
    { store: "Walmart", price: 5.98 },
    { store: "Kroger", price: 5.49 },
    { store: "Target", price: 6.29 },
    { store: "Costco", price: 4.79 },
  ],
  cheese: [
    { store: "Walmart", price: 4.98 },
    { store: "Kroger", price: 4.49 },
    { store: "Target", price: 5.29 },
    { store: "Costco", price: 3.89 },
  ],
  butter: [
    { store: "Walmart", price: 5.48 },
    { store: "Kroger", price: 4.99 },
    { store: "Target", price: 5.79 },
    { store: "Costco", price: 4.29 },
  ],
  apples: [
    { store: "Walmart", price: 2.98 },
    { store: "Kroger", price: 2.79 },
    { store: "Target", price: 3.29 },
    { store: "Costco", price: 2.49 },
  ],
  bananas: [
    { store: "Walmart", price: 1.28 },
    { store: "Kroger", price: 0.99 },
    { store: "Target", price: 1.49 },
    { store: "Costco", price: 0.89 },
  ],
  pasta: [
    { store: "Walmart", price: 1.48 },
    { store: "Kroger", price: 1.29 },
    { store: "Target", price: 1.69 },
    { store: "Costco", price: 1.09 },
  ],
  rice: [
    { store: "Walmart", price: 4.98 },
    { store: "Kroger", price: 4.49 },
    { store: "Target", price: 5.29 },
    { store: "Costco", price: 3.79 },
  ],
};

const MOCK_CA: Record<string, { store: string; price: number }[]> = {
  milk: [
    { store: "Food Basics", price: 3.99 },
    { store: "Walmart", price: 4.49 },
    { store: "Loblaws", price: 5.29 },
    { store: "Costco", price: 3.29 },
  ],
  eggs: [
    { store: "Food Basics", price: 4.97 },
    { store: "Walmart", price: 5.47 },
    { store: "Loblaws", price: 6.29 },
    { store: "Costco", price: 4.49 },
  ],
  bread: [
    { store: "Food Basics", price: 2.99 },
    { store: "Walmart", price: 3.49 },
    { store: "Loblaws", price: 4.29 },
    { store: "Costco", price: 2.49 },
  ],
  chicken: [
    { store: "Food Basics", price: 7.99 },
    { store: "Walmart", price: 8.49 },
    { store: "Loblaws", price: 9.99 },
    { store: "Costco", price: 6.99 },
  ],
  cheese: [
    { store: "Food Basics", price: 6.99 },
    { store: "Walmart", price: 7.49 },
    { store: "Loblaws", price: 8.99 },
    { store: "Costco", price: 5.99 },
  ],
  butter: [
    { store: "Food Basics", price: 5.99 },
    { store: "Walmart", price: 6.49 },
    { store: "Loblaws", price: 7.99 },
    { store: "Costco", price: 5.29 },
  ],
  apples: [
    { store: "Food Basics", price: 3.49 },
    { store: "Walmart", price: 3.99 },
    { store: "Loblaws", price: 4.49 },
    { store: "Costco", price: 2.99 },
  ],
  bananas: [
    { store: "Food Basics", price: 1.49 },
    { store: "Walmart", price: 1.79 },
    { store: "Loblaws", price: 1.99 },
    { store: "Costco", price: 1.29 },
  ],
  pasta: [
    { store: "Food Basics", price: 1.99 },
    { store: "Walmart", price: 2.49 },
    { store: "Loblaws", price: 2.99 },
    { store: "Costco", price: 1.79 },
  ],
  rice: [
    { store: "Food Basics", price: 5.99 },
    { store: "Walmart", price: 6.49 },
    { store: "Loblaws", price: 7.99 },
    { store: "Costco", price: 4.99 },
  ],
};

export interface PriceEntry {
  store: string;
  price: number;
  display: string;
  isOnSale?: boolean;
  salePrice?: number | null;
}

export interface PriceResult {
  name: string;
  query: string;
  unit: string;
  emoji: string;
  stores: PriceEntry[];
  source: "live" | "cached" | "estimated";
  updatedAt: string;
  flippDeals?: { store: string; price: number; saleStory: string | null }[];
}

function getEmoji(name: string): string {
  const map: Record<string, string> = {
    milk: "🥛", eggs: "🥚", bread: "🍞", chicken: "🍗", cheese: "🧀",
    butter: "🧈", apples: "🍎", bananas: "🍌", pasta: "🍝", rice: "🍚",
  };
  const key = Object.keys(map).find((k) => name.toLowerCase().includes(k));
  return key ? map[key] : "🛒";
}

function getUnit(name: string): string {
  const map: Record<string, string> = {
    milk: "2 L", eggs: "12 ct", bread: "675 g", chicken: "per lb",
    cheese: "400 g", butter: "454 g", apples: "3 lb bag", bananas: "per lb",
    pasta: "500 g", rice: "2 kg",
  };
  const key = Object.keys(map).find((k) => name.toLowerCase().includes(k));
  return key ? map[key] : "each";
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const itemsParam = searchParams.get("items") || "";
  const country = (searchParams.get("country") || "US").toUpperCase() as "US" | "CA";
  const postalCode = searchParams.get("postalCode") || "";

  const items = itemsParam
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 10);

  if (!items.length) {
    return NextResponse.json({ error: "No items specified" }, { status: 400 });
  }

  const results: PriceResult[] = [];
  const now = new Date().toISOString();

  for (const query of items) {
    // 1. Check Supabase cache first (< 6 hours old)
    if (isSupabaseConfigured()) {
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
      const { data: cachedPrices } = await supabaseAdmin
        .from("prices")
        .select("*, products(*)")
        .eq("country", country)
        .gte("updated_at", sixHoursAgo)
        .ilike("products.name", `%${query}%`)
        .limit(8);

      if (cachedPrices && cachedPrices.length > 0) {
        const stores: PriceEntry[] = cachedPrices.map((p) => ({
          store: p.store_chain,
          price: p.sale_price && p.is_on_sale ? p.sale_price : p.price,
          display: `$${(p.sale_price && p.is_on_sale ? p.sale_price : p.price).toFixed(2)}`,
          isOnSale: p.is_on_sale,
          salePrice: p.sale_price,
        }));

        results.push({
          name: cachedPrices[0].products?.name || query,
          query,
          unit: cachedPrices[0].products?.unit || getUnit(query),
          emoji: cachedPrices[0].products?.emoji || getEmoji(query),
          stores,
          source: "cached",
          updatedAt: cachedPrices[0].updated_at,
        });
        continue;
      }
    }

    // 2. Fetch from Kroger API (US only)
    if (country === "US") {
      try {
        const krogerResult = await getKrogerItemPrice(query);
        if (krogerResult) {
          // Also fetch Flipp deals for comparison
          let flippDeals: PriceResult["flippDeals"] = [];
          if (postalCode) {
            const flippItems = await searchFlippDeals(query, postalCode, "en-us");
            flippDeals = flippItems.slice(0, 3).map((d) => ({
              store: d.storeName,
              price: d.price || 0,
              saleStory: d.saleStory,
            }));
          }

          // Build store list: Kroger real price + mock for others
          const mockStores = MOCK_US[query] || [];
          const storeMap = new Map(mockStores.map((s) => [s.store, s.price]));
          storeMap.set(
            "Kroger",
            krogerResult.isOnSale ? krogerResult.salePrice! : krogerResult.price
          );

          const stores: PriceEntry[] = Array.from(storeMap.entries()).map(
            ([store, price]) => ({
              store,
              price,
              display: `$${price.toFixed(2)}`,
              isOnSale: store === "Kroger" ? krogerResult.isOnSale : false,
              salePrice: store === "Kroger" ? krogerResult.salePrice : null,
            })
          );

          // Save to Supabase
          if (isSupabaseConfigured()) {
            // Upsert product
            const { data: product } = await supabaseAdmin
              .from("products")
              .upsert(
                {
                  name: krogerResult.name,
                  unit: krogerResult.size,
                  emoji: getEmoji(query),
                  upc: krogerResult.upc,
                  kroger_id: krogerResult.kroger_id,
                },
                { onConflict: "kroger_id" }
              )
              .select()
              .single();

            if (product) {
              await supabaseAdmin.from("prices").upsert(
                {
                  product_id: product.id,
                  store_chain: "Kroger",
                  country: "US",
                  price: krogerResult.price,
                  sale_price: krogerResult.salePrice,
                  is_on_sale: krogerResult.isOnSale,
                  source: "kroger_api",
                  updated_at: now,
                },
                { onConflict: "product_id,store_chain,country" }
              );

              // Record price history
              await supabaseAdmin.from("price_history").insert({
                product_name: krogerResult.name,
                store_chain: "Kroger",
                country: "US",
                price: krogerResult.price,
              });
            }
          }

          results.push({
            name: krogerResult.name,
            query,
            unit: krogerResult.size || getUnit(query),
            emoji: getEmoji(query),
            stores,
            source: "live",
            updatedAt: now,
            flippDeals,
          });
          continue;
        }
      } catch (err) {
        console.warn(`Kroger lookup failed for "${query}":`, err);
      }
    }

    // 3. Try Flipp API
    if (postalCode) {
      try {
        const locale = country === "CA" ? "en-ca" : "en-us";
        const flippItems = await searchFlippDeals(query, postalCode, locale);
        if (flippItems.length > 0) {
          const stores: PriceEntry[] = flippItems
            .filter((d) => d.price !== null)
            .slice(0, 6)
            .map((d) => ({
              store: d.storeName,
              price: d.price!,
              display: d.priceText || `$${d.price!.toFixed(2)}`,
              isOnSale: Boolean(d.saleStory),
            }));

          if (stores.length > 0) {
            results.push({
              name: flippItems[0].productName,
              query,
              unit: getUnit(query),
              emoji: getEmoji(query),
              stores,
              source: "live",
              updatedAt: now,
            });
            continue;
          }
        }
      } catch (err) {
        console.warn(`Flipp lookup failed for "${query}":`, err);
      }
    }

    // 4. Fall back to mock data
    const mockData = country === "CA" ? MOCK_CA : MOCK_US;
    const mockKey = Object.keys(mockData).find((k) =>
      query.toLowerCase().includes(k) || k.includes(query.toLowerCase())
    );

    const storeData = mockKey ? mockData[mockKey] : [];
    results.push({
      name: query.charAt(0).toUpperCase() + query.slice(1),
      query,
      unit: getUnit(query),
      emoji: getEmoji(query),
      stores: storeData.map((s) => ({
        store: s.store,
        price: s.price,
        display: `$${s.price.toFixed(2)}`,
      })),
      source: "estimated",
      updatedAt: now,
    });
  }

  return NextResponse.json({ results, country, fetchedAt: now });
}
