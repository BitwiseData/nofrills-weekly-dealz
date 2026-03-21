/**
 * Kroger Developer API client
 * Docs: https://developer.kroger.com/documentation/public/getting-started/
 * Free tier — Certification environment
 */

const CLIENT_ID = process.env.KROGER_CLIENT_ID || "";
const CLIENT_SECRET = process.env.KROGER_CLIENT_SECRET || "";
const API_BASE = process.env.KROGER_API_BASE || "https://api.kroger.com/v1";

// ─── Token cache ──────────────────────────────────────────────────────────────
let _cachedToken: string | null = null;
let _tokenExpiry = 0;

export async function getKrogerToken(): Promise<string> {
  if (_cachedToken && Date.now() < _tokenExpiry) return _cachedToken;

  const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");

  const res = await fetch(`${API_BASE}/connect/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: "grant_type=client_credentials&scope=product.compact",
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Kroger token error ${res.status}: ${err}`);
  }

  const data = await res.json();
  _cachedToken = data.access_token;
  // Expire 60s before actual expiry
  _tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return _cachedToken!;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface KrogerProduct {
  productId: string;
  upc: string;
  brand: string;
  description: string;
  categories: string[];
  items?: KrogerItem[];
  images?: { perspective: string; sizes: { size: string; url: string }[] }[];
}

export interface KrogerItem {
  itemId: string;
  price?: {
    regular: number;
    promo: number;
  };
  size: string;
  soldBy: string;
}

export interface KrogerPriceResult {
  name: string;
  brand: string;
  price: number;
  salePrice: number | null;
  isOnSale: boolean;
  size: string;
  kroger_id: string;
  upc: string;
}

// ─── API calls ────────────────────────────────────────────────────────────────

/**
 * Search Kroger products by query string
 * Optional locationId for location-specific pricing
 */
export async function searchKrogerProducts(
  query: string,
  locationId?: string
): Promise<KrogerProduct[]> {
  const token = await getKrogerToken();

  const params = new URLSearchParams({
    "filter.term": query,
    "filter.limit": "10",
  });
  if (locationId) params.set("filter.locationId", locationId);

  const res = await fetch(`${API_BASE}/products?${params}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Kroger product search error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return (data.data as KrogerProduct[]) || [];
}

/**
 * Get prices for a list of product IDs at a specific Kroger location
 */
export async function getKrogerPrices(
  productIds: string[],
  locationId: string
): Promise<KrogerPriceResult[]> {
  const token = await getKrogerToken();
  const results: KrogerPriceResult[] = [];

  for (const productId of productIds) {
    const res = await fetch(
      `${API_BASE}/products/${productId}?filter.locationId=${locationId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }
    );
    if (!res.ok) continue;

    const data = await res.json();
    const product: KrogerProduct = data.data;
    const item = product.items?.[0];
    if (!item?.price) continue;

    results.push({
      name: product.description,
      brand: product.brand,
      price: item.price.regular,
      salePrice: item.price.promo > 0 ? item.price.promo : null,
      isOnSale: item.price.promo > 0 && item.price.promo < item.price.regular,
      size: item.size,
      kroger_id: product.productId,
      upc: product.upc,
    });
  }

  return results;
}

/**
 * Search for a grocery item and return the best price match from Kroger
 */
export async function getKrogerItemPrice(
  query: string,
  locationId?: string
): Promise<KrogerPriceResult | null> {
  try {
    const products = await searchKrogerProducts(query, locationId);
    if (!products.length) return null;

    // Find first product that has price data
    for (const product of products) {
      const item = product.items?.[0];
      if (item?.price?.regular) {
        return {
          name: product.description,
          brand: product.brand,
          price: item.price.regular,
          salePrice: item.price.promo > 0 ? item.price.promo : null,
          isOnSale:
            item.price.promo > 0 &&
            item.price.promo < item.price.regular,
          size: item.size,
          kroger_id: product.productId,
          upc: product.upc,
        };
      }
    }
    return null;
  } catch (err) {
    console.error(`Kroger price lookup failed for "${query}":`, err);
    return null;
  }
}

/**
 * Get nearby Kroger store locations
 */
export async function getNearbyKrogerStores(
  lat: number,
  lon: number,
  radiusMiles = 10
): Promise<{ locationId: string; name: string; chain: string; address: string }[]> {
  const token = await getKrogerToken();

  const params = new URLSearchParams({
    "filter.lat.near": lat.toString(),
    "filter.lon.near": lon.toString(),
    "filter.radiusInMiles": radiusMiles.toString(),
    "filter.limit": "5",
    "filter.chain": "KROGER",
  });

  const res = await fetch(`${API_BASE}/locations?${params}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) return [];

  const data = await res.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data.data || []).map((loc: any) => ({
    locationId: loc.locationId,
    name: loc.name,
    chain: loc.chain,
    address: `${loc.address?.addressLine1}, ${loc.address?.city}, ${loc.address?.state}`,
  }));
}
