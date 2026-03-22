/**
 * Flipp API client (unofficial but widely used)
 * Powers flyer deals for Walmart, Costco, Kroger, Food Basics, Loblaws, etc.
 */

const FLIPP_BASE = "https://backflipp.wishabi.com/flipp";

export interface FlippItem {
  id: number;
  name: string;
  brand: string | null;
  description: string | null;
  current_price: number | null;
  pre_price_text: string | null;
  price_text: string | null;
  sale_story: string | null;
  valid_from: string | null;
  valid_to: string | null;
  merchant_name: string;
  merchant_id: number;
  flyer_id: number;
  category_names: string[];
  image_url: string | null;
  cutout_image_url: string | null;
}

export interface FlippDeal {
  productName: string;
  storeName: string;
  price: number | null;
  priceText: string | null;
  saleStory: string | null;
  validFrom: string | null;
  validTo: string | null;
  category: string | null;
  imageUrl: string | null;
}

/**
 * Search Flipp for deals matching a query
 * @param query - Search term (e.g., "milk", "eggs")
 * @param postalCode - Postal/zip code for local flyers (e.g., "91743" or "M5V2T6")
 * @param locale - "en-us" for US, "en-ca" for Canada
 */
export async function searchFlippDeals(
  query: string,
  postalCode: string,
  locale: "en-us" | "en-ca" = "en-us"
): Promise<FlippDeal[]> {
  try {
    const params = new URLSearchParams({
      locale,
      q: query,
      postal_code: postalCode,
    });

    const res = await fetch(`${FLIPP_BASE}/items/search?${params}`, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; FairFare/1.0)",
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!res.ok) {
      console.warn(`Flipp API returned ${res.status} for query "${query}"`);
      return [];
    }

    const data = await res.json();
    const items: FlippItem[] = data.items || [];

    return items
      .filter((item) => item.current_price !== null || item.price_text)
      .slice(0, 20)
      .map((item) => ({
        productName: item.name,
        storeName: item.merchant_name,
        price: item.current_price,
        priceText: item.price_text,
        saleStory: item.sale_story,
        validFrom: item.valid_from,
        validTo: item.valid_to,
        category: item.category_names?.[0] || null,
        imageUrl: item.cutout_image_url || item.image_url,
      }));
  } catch (err) {
    console.error(`Flipp search failed for "${query}":`, err);
    return [];
  }
}

/**
 * Get weekly flyer deals for a specific store + postal code
 */
export async function getFlippFlyerDeals(
  postalCode: string,
  locale: "en-us" | "en-ca" = "en-us",
  limit = 50
): Promise<FlippDeal[]> {
  try {
    const params = new URLSearchParams({
      locale,
      postal_code: postalCode,
    });

    const res = await fetch(`${FLIPP_BASE}/flyers?${params}`, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; FairFare/1.0)",
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) return [];

    const data = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const flyers = data.flyers || [];
    const deals: FlippDeal[] = [];

    for (const flyer of flyers.slice(0, 5)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const items: FlippItem[] = flyer.flyer_items || [];
      for (const item of items.slice(0, 10)) {
        if (item.current_price !== null || item.price_text) {
          deals.push({
            productName: item.name,
            storeName: flyer.merchant?.name || "Unknown Store",
            price: item.current_price,
            priceText: item.price_text,
            saleStory: item.sale_story,
            validFrom: flyer.valid_from,
            validTo: flyer.valid_to,
            category: item.category_names?.[0] || null,
            imageUrl: item.cutout_image_url || item.image_url,
          });
        }
      }
    }

    return deals.slice(0, limit);
  } catch (err) {
    console.error("Flipp flyer fetch failed:", err);
    return [];
  }
}

/**
 * Get the Flipp weekly ads URL for a given postal code
 */
export function getFlippUrl(postalCode: string, country: "US" | "CA" = "US"): string {
  const locale = country === "CA" ? "en-ca" : "en-us";
  return `https://flipp.com/${locale}/weekly_ads/groceries?postal_code=${postalCode}`;
}
