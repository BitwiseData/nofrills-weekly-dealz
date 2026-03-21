import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export const isSupabaseConfigured = () =>
  Boolean(supabaseUrl && supabaseAnonKey);

// Lazy singletons — only instantiated when Supabase is configured
let _supabase: SupabaseClient | null = null;
let _supabaseAdmin: SupabaseClient | null = null;

export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (!isSupabaseConfigured()) throw new Error("Supabase not configured");
    if (!_supabase) _supabase = createClient(supabaseUrl, supabaseAnonKey);
    return (_supabase as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (!isSupabaseConfigured()) throw new Error("Supabase not configured");
    const key = supabaseServiceKey || supabaseAnonKey;
    if (!_supabaseAdmin) _supabaseAdmin = createClient(supabaseUrl, key);
    return (_supabaseAdmin as unknown as Record<string | symbol, unknown>)[prop];
  },
});

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DbProfile {
  id: string;
  display_name: string | null;
  username: string | null;
  is_admin: boolean;
  coins: number;
  created_at: string;
}

export interface DbFlyerUpload {
  id: string;
  user_id: string | null;
  file_name: string;
  file_size_bytes: number | null;
  store_name: string | null;
  country: string | null;
  status: string;
  deals_found: number;
  completed_at: string | null;
  created_at: string;
}

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
