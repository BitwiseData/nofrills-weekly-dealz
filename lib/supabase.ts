import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Public client (browser-safe)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-only admin client (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export const isSupabaseConfigured = () =>
  Boolean(supabaseUrl && supabaseAnonKey);

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DbProduct {
  id: string;
  name: string;
  category: string | null;
  unit: string | null;
  emoji: string | null;
  upc: string | null;
  kroger_id: string | null;
  created_at: string;
}

export interface DbPrice {
  id: string;
  product_id: string;
  store_chain: string;
  country: string;
  price: number;
  sale_price: number | null;
  is_on_sale: boolean;
  source: string | null;
  updated_at: string;
  products?: DbProduct;
}

export interface DbFlyerDeal {
  id: string;
  store_chain: string | null;
  country: string | null;
  product_name: string;
  category: string | null;
  price: number | null;
  original_price: number | null;
  savings_pct: number | null;
  badge: string | null;
  emoji: string | null;
  valid_from: string | null;
  valid_to: string | null;
  source: string | null;
  created_at: string;
}

export interface DbPriceHistory {
  id: string;
  product_name: string;
  store_chain: string;
  country: string;
  price: number;
  recorded_at: string;
}
