import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ── Helpers ────────────────────────────────────────────────────────────────

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function getAnonClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// ── GET /api/admin/uploads ─────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const service = getServiceClient();
  const anon = getAnonClient();

  if (!service || !anon) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  // Verify caller is an admin via their Supabase JWT
  const authHeader = request.headers.get("Authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim();

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify JWT and get user
  const { data: { user }, error: authError } = await anon.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }

  // Check admin flag in profiles table (uses service role to bypass RLS)
  const { data: profile } = await service
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: "Forbidden — admin access required" }, { status: 403 });
  }

  // ── Fetch all uploads ──────────────────────────────────────────────────

  const { data: uploads, error: uploadsError } = await service
    .from("flyer_uploads")
    .select("id, file_name, file_size_bytes, store_name, country, status, deals_found, created_at, completed_at, user_id")
    .order("created_at", { ascending: false });

  if (uploadsError) {
    return NextResponse.json({ error: uploadsError.message }, { status: 500 });
  }

  // ── Fetch all deals (for CSV export) ─────────────────────────────────────

  const { data: deals } = await service
    .from("flyer_deals")
    .select("id, store_chain, country, product_name, category, price, original_price, savings_pct, badge, emoji, valid_from, valid_to, source, created_at, upload_id")
    .order("created_at", { ascending: false });

  // ── Fetch user profiles (to show names) ─────────────────────────────────

  const { data: profiles } = await service
    .from("profiles")
    .select("id, display_name");

  const profileMap: Record<string, string> = {};
  (profiles || []).forEach((p: { id: string; display_name: string }) => {
    profileMap[p.id] = p.display_name;
  });

  const enrichedUploads = (uploads || []).map((u: { user_id: string; [key: string]: unknown }) => ({
    ...u,
    user_name: u.user_id ? (profileMap[u.user_id] || "Unknown") : "Anonymous",
  }));

  return NextResponse.json({
    uploads: enrichedUploads,
    deals: deals || [],
    total_uploads: enrichedUploads.length,
    total_deals: (deals || []).length,
  });
}
