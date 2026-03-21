"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import NavBar from "@/app/components/NavBar";
import { useAuth } from "@/app/context/AuthContext";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Upload {
  id: string;
  file_name: string;
  file_size_bytes: number | null;
  store_name: string | null;
  country: string | null;
  status: string;
  deals_found: number;
  created_at: string;
  completed_at: string | null;
  user_id: string | null;
  user_name: string;
}

interface Deal {
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
  upload_id: string | null;
}

// ─── CSV helpers ─────────────────────────────────────────────────────────────

function escapeCsv(val: unknown): string {
  if (val === null || val === undefined) return "";
  const s = String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escapeCsv(r[h])).join(",")),
  ];
  return lines.join("\n");
}

function downloadCsv(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AdminPage() {
  const { user, isLoading, getAccessToken } = useAuth();
  const router = useRouter();

  const [uploads, setUploads] = useState<Upload[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"uploads" | "deals">("uploads");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUpload, setSelectedUpload] = useState<string | null>(null);

  // ── Fetch data from admin API ─────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setFetching(true);
    setError("");
    try {
      const token = await getAccessToken();
      const res = await fetch("/api/admin/uploads", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to fetch");
      setUploads(json.uploads || []);
      setDeals(json.deals || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setFetching(false);
    }
  }, [getAccessToken]);

  // ── Auth guard ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (isLoading) return;
    if (!user) { router.push("/login"); return; }
    if (!user.isAdmin) { router.push("/"); return; }
    fetchData();
  }, [user, isLoading, router, fetchData]);

  // ── Filter logic ──────────────────────────────────────────────────────────

  const filteredUploads = uploads.filter((u) =>
    !searchQuery ||
    u.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.store_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.user_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const dealsForUpload = selectedUpload
    ? deals.filter((d) => d.upload_id === selectedUpload)
    : deals;

  const filteredDeals = dealsForUpload.filter(
    (d) =>
      !searchQuery ||
      d.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.store_chain || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.category || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── CSV exports ───────────────────────────────────────────────────────────

  const exportUploadsCsv = () => {
    const rows = filteredUploads.map((u) => ({
      ID: u.id,
      "File Name": u.file_name,
      "Store Name": u.store_name || "",
      Country: u.country || "",
      "Uploaded By": u.user_name,
      Status: u.status,
      "Deals Found": u.deals_found,
      "File Size (bytes)": u.file_size_bytes || "",
      "Uploaded At": u.created_at,
      "Completed At": u.completed_at || "",
    }));
    downloadCsv(toCsv(rows), `fairfare-uploads-${Date.now()}.csv`);
  };

  const exportDealsCsv = () => {
    const rows = filteredDeals.map((d) => ({
      ID: d.id,
      "Product Name": d.product_name,
      Category: d.category || "",
      "Store Chain": d.store_chain || "",
      Country: d.country || "",
      Price: d.price !== null ? `$${d.price}` : "",
      "Original Price": d.original_price !== null ? `$${d.original_price}` : "",
      "Savings %": d.savings_pct || 0,
      Badge: d.badge || "",
      Emoji: d.emoji || "",
      "Valid From": d.valid_from || "",
      "Valid To": d.valid_to || "",
      Source: d.source || "",
      "Created At": d.created_at,
      "Upload ID": d.upload_id || "",
    }));
    downloadCsv(toCsv(rows), `fairfare-deals-${Date.now()}.csv`);
  };

  // ── Status badge color ────────────────────────────────────────────────────

  function statusBadge(status: string) {
    const map: Record<string, string> = {
      completed: "bg-green-100 text-green-700",
      processing: "bg-yellow-100 text-yellow-700",
      failed: "bg-red-100 text-red-700",
    };
    return map[status] || "bg-gray-100 text-gray-600";
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (isLoading || fetching) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <div className="text-4xl mb-4 animate-spin">⚙️</div>
            <p className="text-gray-500 text-sm">Loading admin panel…</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user?.isAdmin) return null;

  const totalDealsFromUploads = uploads.reduce((s, u) => s + u.deals_found, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
              🛡️ Admin Panel
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage PDF scans, extracted deals, and user data
            </p>
          </div>
          <button
            onClick={fetchData}
            disabled={fetching}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
            style={{ background: "#003d28" }}
          >
            🔄 Refresh
          </button>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Uploads", value: uploads.length, icon: "📄" },
            { label: "Total Deals", value: totalDealsFromUploads, icon: "🏷️" },
            { label: "Completed", value: uploads.filter((u) => u.status === "completed").length, icon: "✅" },
            { label: "Failed", value: uploads.filter((u) => u.status === "failed").length, icon: "❌" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-2xl font-black text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-6">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(["uploads", "deals"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setSearchQuery(""); setSelectedUpload(null); }}
              className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
                activeTab === tab
                  ? "text-white shadow-sm"
                  : "bg-white text-gray-500 border border-gray-200 hover:border-gray-300"
              }`}
              style={activeTab === tab ? { background: "#003d28" } : {}}
            >
              {tab === "uploads" ? `📄 PDF Uploads (${uploads.length})` : `🏷️ Deals (${deals.length})`}
            </button>
          ))}
        </div>

        {/* Search + Export row */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input
            type="text"
            placeholder={activeTab === "uploads" ? "Search by file, store, or user…" : "Search by product, store, or category…"}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
          />
          <button
            onClick={activeTab === "uploads" ? exportUploadsCsv : exportDealsCsv}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold border-2 transition-colors hover:bg-gray-50"
            style={{ borderColor: "#003d28", color: "#003d28" }}
          >
            ⬇️ Export CSV
          </button>
        </div>

        {/* ── Uploads table ── */}
        {activeTab === "uploads" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">File</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Store</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Country</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Uploaded By</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Status</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Deals</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Date</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUploads.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-gray-400">
                        {uploads.length === 0 ? "No uploads yet" : "No results match your search"}
                      </td>
                    </tr>
                  ) : (
                    filteredUploads.map((u) => (
                      <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-red-500">📄</span>
                            <div>
                              <div className="font-medium text-gray-900 truncate max-w-[180px]">{u.file_name}</div>
                              {u.file_size_bytes && (
                                <div className="text-xs text-gray-400">{(u.file_size_bytes / 1024).toFixed(0)} KB</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{u.store_name || "—"}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                            {u.country || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{u.user_name}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusBadge(u.status)}`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">{u.deals_found}</td>
                        <td className="px-4 py-3 text-xs text-gray-400">
                          {new Date(u.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => {
                              setSelectedUpload(selectedUpload === u.id ? null : u.id);
                              setActiveTab("deals");
                            }}
                            className="text-xs font-semibold px-3 py-1 rounded-lg hover:bg-gray-100 transition-colors"
                            style={{ color: "#003d28" }}
                          >
                            View Deals →
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {filteredUploads.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-50 text-xs text-gray-400">
                Showing {filteredUploads.length} of {uploads.length} uploads
              </div>
            )}
          </div>
        )}

        {/* ── Deals table ── */}
        {activeTab === "deals" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {selectedUpload && (
              <div className="px-4 py-3 border-b border-gray-100 bg-blue-50 flex items-center gap-2 text-sm">
                <span className="text-blue-600">🔍 Showing deals for one upload</span>
                <button
                  onClick={() => setSelectedUpload(null)}
                  className="ml-auto text-xs text-blue-600 font-semibold hover:underline"
                >
                  Show all deals
                </button>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Product</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Category</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Store</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Country</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Price</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Was</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Save%</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Badge</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Valid</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDeals.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-12 text-gray-400">
                        {deals.length === 0 ? "No deals extracted yet" : "No results match your search"}
                      </td>
                    </tr>
                  ) : (
                    filteredDeals.map((d) => (
                      <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span>{d.emoji || "🛒"}</span>
                            <span className="font-medium text-gray-900 truncate max-w-[200px]">{d.product_name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{d.category || "Other"}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{d.store_chain || "—"}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{d.country || "—"}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">
                          {d.price !== null ? `$${d.price.toFixed(2)}` : "—"}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-400 line-through text-xs">
                          {d.original_price !== null ? `$${d.original_price.toFixed(2)}` : ""}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {(d.savings_pct || 0) > 0 ? (
                            <span className="text-xs font-bold text-green-600">{d.savings_pct}%</span>
                          ) : "—"}
                        </td>
                        <td className="px-4 py-3">
                          {d.badge ? (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">{d.badge}</span>
                          ) : "—"}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400">
                          {d.valid_from && d.valid_to
                            ? `${d.valid_from} – ${d.valid_to}`
                            : d.valid_to || d.valid_from || "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {filteredDeals.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-50 text-xs text-gray-400">
                Showing {filteredDeals.length} of {deals.length} deals
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
