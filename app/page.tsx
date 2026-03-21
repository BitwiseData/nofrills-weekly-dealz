"use client";

import { useState } from "react";
import Link from "next/link";
import { categories, searchDeals } from "@/lib/deals";
import DealCard from "@/components/DealCard";
import ChatDrawer from "@/components/ChatDrawer";

export default function Home() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [chatOpen, setChatOpen] = useState(false);

  const filtered = searchDeals(query, activeCategory);

  return (
    <div className="min-h-screen" style={{ background: "#f5f9f5" }}>
      {/* Header */}
      <header style={{ background: "#003d28" }} className="shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🛒</span>
            <div>
              <h1 className="text-white text-xl font-bold leading-tight">No Frills Dealz</h1>
              <p className="text-xs" style={{ color: "#91d520" }}>Week 10 · 2026 Flyer Deals</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/flyer-analyzer"
              style={{ background: "white", color: "#003d28" }}
              className="flex items-center gap-1 px-3 py-2 rounded-full font-semibold text-sm hover:opacity-90 transition-opacity shadow"
            >
              <span>📄</span> Flyer AI
            </Link>
            <button
              onClick={() => setChatOpen(true)}
              style={{ background: "#91d520", color: "#003d28" }}
              className="flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm hover:opacity-90 transition-opacity shadow"
            >
              <span>✨</span> Ask AI
            </button>
          </div>
        </div>
      </header>

      {/* Hero banner */}
      <div style={{ background: "#fea319" }} className="py-3 text-center">
        <p className="text-white font-semibold text-sm">
          🏷️ 18 deals this week — Save big on groceries!
        </p>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Search */}
        <div className="mb-5">
          <div className="relative max-w-xl mx-auto">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
            <input
              type="text"
              placeholder="Search deals... (e.g. produce, pasta, shrimp)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-green-800 focus:border-transparent"
            />
          </div>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 flex-wrap mb-6 justify-center">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="px-4 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer"
              style={
                activeCategory === cat
                  ? { background: "#003d28", color: "white" }
                  : { background: "white", color: "#003d28", border: "1px solid #003d28" }
              }
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results count */}
        <p className="text-sm text-gray-500 mb-4 text-center">
          Showing <strong>{filtered.length}</strong> deal{filtered.length !== 1 ? "s" : ""}
          {activeCategory !== "All" ? ` in ${activeCategory}` : ""}
          {query ? ` matching "${query}"` : ""}
        </p>

        {/* Deals grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filtered.map((deal) => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-3">🛒</div>
            <p className="text-lg font-medium">No deals found</p>
            <p className="text-sm mt-1">Try a different search or category</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{ background: "#003d28" }} className="mt-12 py-6 text-center">
        <p className="text-sm" style={{ color: "#91d520" }}>No Frills · Week 10 Flyer · 2026</p>
        <p className="text-xs text-gray-400 mt-1">Prices subject to change. While supplies last.</p>
      </footer>

      {/* AI Chat Drawer */}
      <ChatDrawer open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}
