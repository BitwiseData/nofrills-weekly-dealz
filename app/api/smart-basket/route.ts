import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

interface NearbyStore {
  name: string;
  address: string;
  distance: string;
  lat: number;
  lon: number;
  mapsUrl: string;
}

interface PriceRow {
  store: string;
  address: string;
  distance: string;
  mapsUrl: string;
  items: Record<string, string>; // item -> price string
  total: string;
  isCheapest: boolean;
}

// Fetch real nearby grocery stores from OpenStreetMap Overpass API
async function fetchNearbyStores(lat: number, lon: number, radiusKm: number): Promise<NearbyStore[]> {
  const radiusM = radiusKm * 1000;
  const query = `
    [out:json][timeout:15];
    (
      node["shop"="supermarket"](around:${radiusM},${lat},${lon});
      node["shop"="convenience"](around:${radiusM},${lat},${lon});
      node["shop"="grocery"](around:${radiusM},${lat},${lon});
      way["shop"="supermarket"](around:${radiusM},${lat},${lon});
    );
    out center 20;
  `;
  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: query,
    headers: { "Content-Type": "text/plain" },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) return [];

  const data = await res.json();
  const seen = new Set<string>();
  const stores: NearbyStore[] = [];

  for (const el of data.elements || []) {
    const name = el.tags?.name || el.tags?.["name:en"];
    if (!name) continue;
    if (seen.has(name.toLowerCase())) continue;
    seen.add(name.toLowerCase());

    const elLat = el.lat ?? el.center?.lat;
    const elLon = el.lon ?? el.center?.lon;
    if (!elLat || !elLon) continue;

    // Haversine distance
    const R = 6371;
    const dLat = ((elLat - lat) * Math.PI) / 180;
    const dLon = ((elLon - lon) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat * Math.PI) / 180) * Math.cos((elLat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    const distKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distMi = distKm * 0.621371;

    const addr = [el.tags?.["addr:housenumber"], el.tags?.["addr:street"], el.tags?.["addr:city"]]
      .filter(Boolean).join(" ") || `${elLat.toFixed(4)}, ${elLon.toFixed(4)}`;

    stores.push({
      name,
      address: addr,
      distance: `${distMi.toFixed(1)} mi`,
      lat: elLat,
      lon: elLon,
      mapsUrl: `https://www.google.com/maps/dir/?api=1&destination=${elLat},${elLon}`,
    });
  }

  return stores.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance)).slice(0, 6);
}

export async function POST(request: NextRequest) {
  try {
    const { items, lat, lon, radiusMiles = 5 } = await request.json();

    if (!items?.length) return NextResponse.json({ error: "No items provided" }, { status: 400 });
    if (!lat || !lon) return NextResponse.json({ error: "Location required" }, { status: 400 });

    const radiusKm = radiusMiles * 1.60934;

    // Fetch real nearby stores
    let nearbyStores: NearbyStore[] = [];
    try {
      nearbyStores = await fetchNearbyStores(lat, lon, radiusKm);
    } catch {
      // Overpass might be slow — continue with Claude's knowledge of stores
    }

    // Use store names found nearby, or fall back to common Canadian chains
    const storeNames = nearbyStores.length >= 2
      ? nearbyStores.slice(0, 5).map((s) => s.name)
      : ["No Frills", "Walmart", "Loblaws", "Food Basics", "Metro"];

    const storeList = storeNames.join(", ");
    const itemList = items.join(", ");

    const { text } = await generateText({
      model: anthropic("claude-opus-4-5"),
      messages: [
        {
          role: "user",
          content: `You are a Canadian grocery price expert. The user wants to buy these items: ${itemList}.

Nearby stores (within ${radiusMiles} miles): ${storeList}

For EACH store, estimate realistic Canadian grocery prices for each item based on current market knowledge (2025–2026). Use price formats like "$2.49", "$1.99/lb", "$3.99 ea".

Return ONLY a valid JSON object with this exact structure:
{
  "prices": {
    "STORE_NAME": {
      "ITEM_NAME": "PRICE",
      ...
    },
    ...
  },
  "tips": ["2-3 short money-saving tips for these specific items"]
}

Be realistic — No Frills and Food Basics are cheaper than Loblaws and Metro. Walmart prices are mid-range. Include all ${storeNames.length} stores.`,
        },
      ],
    });

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ error: "Could not generate price comparison" }, { status: 422 });

    const parsed = JSON.parse(jsonMatch[0]);
    const pricesMap: Record<string, Record<string, string>> = parsed.prices || {};

    // Build comparison rows
    const rows: PriceRow[] = storeNames.map((storeName) => {
      const storeItems = pricesMap[storeName] || {};
      const itemPrices: Record<string, string> = {};
      let totalCents = 0;
      let canTotal = true;

      for (const item of items) {
        // Try to find the item in Claude's response (case-insensitive)
        const key = Object.keys(storeItems).find((k) => k.toLowerCase().includes(item.toLowerCase()) || item.toLowerCase().includes(k.toLowerCase())) || item;
        const price = storeItems[key] || storeItems[item] || "N/A";
        itemPrices[item] = price;

        const num = parseFloat(price.replace(/[^0-9.]/g, ""));
        if (!isNaN(num)) totalCents += Math.round(num * 100);
        else canTotal = false;
      }

      const nearby = nearbyStores.find((s) => s.name.toLowerCase().includes(storeName.toLowerCase()) || storeName.toLowerCase().includes(s.name.toLowerCase()));

      return {
        store: storeName,
        address: nearby?.address || "Search Google Maps",
        distance: nearby?.distance || "< " + radiusMiles + " mi",
        mapsUrl: nearby?.mapsUrl || `https://www.google.com/maps/search/${encodeURIComponent(storeName + " near me")}`,
        items: itemPrices,
        total: canTotal ? `$${(totalCents / 100).toFixed(2)}` : "N/A",
        isCheapest: false,
      };
    });

    // Mark cheapest store
    const validRows = rows.filter((r) => r.total !== "N/A");
    if (validRows.length > 0) {
      const minTotal = Math.min(...validRows.map((r) => parseFloat(r.total.replace("$", ""))));
      validRows.forEach((r) => {
        if (parseFloat(r.total.replace("$", "")) === minTotal) r.isCheapest = true;
      });
    }

    // Cheapest per item
    const cheapestPerItem: Record<string, string> = {};
    for (const item of items) {
      let minPrice = Infinity;
      let minStore = "";
      for (const row of rows) {
        const price = parseFloat((row.items[item] || "").replace(/[^0-9.]/g, ""));
        if (!isNaN(price) && price < minPrice) {
          minPrice = price;
          minStore = row.store;
        }
      }
      if (minStore) cheapestPerItem[item] = minStore;
    }

    return NextResponse.json({
      rows,
      items,
      cheapestPerItem,
      tips: parsed.tips || [],
      nearbyStores,
    });
  } catch (error) {
    console.error("Smart basket error:", error);
    return NextResponse.json({ error: "Failed to compare prices" }, { status: 500 });
  }
}
