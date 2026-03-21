"use client";

import { useState } from "react";
import NavBar from "@/app/components/NavBar";
import { categories, searchDeals } from "@/lib/deals";
import DealCard from "@/components/DealCard";
import ChatDrawer from "@/components/ChatDrawer";
import Link from "next/link";

export default function DealsPage() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [chatOpen, setChatOpen] = useState(false);

  const filtered = searchDeals(query, activeCategory);

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      {/* Hero bar */}
      <div style={{ background: "#003d28" }} className="py-8 text-center">
        <h1 className="text-white text-3xl font-black mb-1">This Week&apos;s Deals 🏷️</h1>
        <p style={{ color: "#91d520" }} className="text-sm">No Frills · Week 10, 2026</p>
      </div>

      <div style={{ background: "#fea319" }} className="py-2.5 text-center">
        <p className="text-white font-semibold text-sm">
          🪙 Upload your store&apos;s flyer on the{" "}
          <Link href="/upload" className="underline font-black">Upload page</Link> and earn 100 coins per page!
        </p>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Search */}
        <div className="flex gap-3 mb-5">
          <div className="relative flex-1 max-w-xl">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Search deals... (produce, pasta, shrimp...)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white shadow-sm text-sm focus:outline-none focus:ring-2"
            />
          </div>
          <button
            onClick={() => setChatOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm text-white transition-opacity hover:opacity-90"
            style={{ background: "#003d28" }}
          >
            ✨ Ask AI
          </button>
        </div>

        {/* Categories */}
        <div className="flex gap-2 flex-wrap mb-6">
          {categories.map((cat) => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className="px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
              style={activeCategory === cat ? { background: "#003d28", color: "white" } : { background: "white", color: "#003d28", border: "1px solid #003d28" }}>
              {cat}
            </button>
          ))}
        </div>

        <p className="text-sm text-gray-500 mb-4">
          Showing <strong>{filtered.length}</strong> deal{filtered.length !== 1 ? "s" : ""}
          {activeCategory !== "All" ? ` in ${activeCategory}` : ""}
          {query ? ` matching "${query}"` : ""}
        </p>

        {filtered.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filtered.map((deal) => <DealCard key={deal.id} deal={deal} />)}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-3">🛒</div>
            <p className="text-lg font-medium">No deals found</p>
            <p className="text-sm mt-1">Try a different search or category</p>
          </div>
        )}

        {/* Upload CTA */}
        <div className="mt-12 rounded-2xl p-8 text-center border-2 border-dashed" style={{ borderColor: "#d1fae5" }}>
          <p className="text-xl font-black text-gray-700 mb-2">Have another store&apos;s flyer?</p>
          <p className="text-sm text-gray-500 mb-5">Upload it and earn 100 FlyerCoins per page. Our AI will extract all the deals instantly.</p>
          <Link href="/upload" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white text-sm"
            style={{ background: "#003d28" }}>
            📄 Upload Flyer — Earn Coins →
          </Link>
        </div>
      </main>

      <ChatDrawer open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}
