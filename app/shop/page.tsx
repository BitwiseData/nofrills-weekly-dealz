"use client";

import { useState } from "react";
import NavBar from "@/app/components/NavBar";
import { useAuth } from "@/app/context/AuthContext";
import { shopItems, shopCategories, type ShopItem } from "@/app/lib/shop-items";
import Link from "next/link";

export default function ShopPage() {
  const { user, spendCoins } = useAuth();
  const [activeCategory, setActiveCategory] = useState("All");
  const [confirming, setConfirming] = useState<ShopItem | null>(null);
  const [redeemCode, setRedeemCode] = useState<string | null>(null);
  const [error, setError] = useState("");

  const filtered = activeCategory === "All" ? shopItems : shopItems.filter((i) => i.category === activeCategory);

  const handleRedeem = (item: ShopItem) => {
    if (!user) return;
    setError("");
    if (user.coins < item.coinPrice) {
      setError(`You need ${(item.coinPrice - user.coins).toLocaleString()} more coins to redeem this item.`);
      return;
    }
    setConfirming(item);
  };

  const confirmRedeem = () => {
    if (!confirming) return;
    const code = spendCoins(confirming.coinPrice, confirming.name);
    if (code) {
      setRedeemCode(code);
      setConfirming(null);
    } else {
      setError("Not enough coins.");
      setConfirming(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <main className="max-w-6xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-900">🛍️ Fair Fare Shop</h1>
            <p className="text-gray-500 text-sm mt-1">Redeem your coins for real groceries. Use the code at checkout.</p>
          </div>
          {user ? (
            <div className="flex items-center gap-2 px-5 py-3 rounded-xl border-2 font-bold" style={{ borderColor: "#FFB800", background: "#fffbeb" }}>
              <span className="text-xl">🪙</span>
              <div>
                <div className="text-2xl font-black leading-none" style={{ color: "#003d28" }}>{user.coins.toLocaleString()}</div>
                <div className="text-xs text-gray-400">Fair Fare</div>
              </div>
            </div>
          ) : (
            <Link href="/signup" className="px-5 py-2.5 rounded-xl font-bold text-white text-sm" style={{ background: "#003d28" }}>
              Sign up to earn coins →
            </Link>
          )}
        </div>

        {/* Not logged in banner */}
        {!user && (
          <div className="rounded-2xl p-6 mb-8 flex items-center gap-4" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
            <span className="text-4xl">🪙</span>
            <div>
              <p className="font-bold text-gray-900">Sign up to earn Fair Fare</p>
              <p className="text-sm text-gray-500">Upload flyers and earn 100 coins per page. Redeem them here for grocery savings!</p>
            </div>
            <Link href="/signup" className="ml-auto flex-shrink-0 px-5 py-2 rounded-xl font-bold text-white text-sm" style={{ background: "#003d28" }}>
              Get Started Free →
            </Link>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm mb-5 flex items-center justify-between">
            {error}
            <button onClick={() => setError("")} className="ml-4 font-bold">✕</button>
          </div>
        )}

        {/* Redeem success */}
        {redeemCode && (
          <div className="rounded-2xl p-6 mb-8 text-center" style={{ background: "#f0fdf4", border: "2px solid #bbf7d0" }}>
            <div className="text-4xl mb-2">🎉</div>
            <p className="font-black text-xl text-gray-900 mb-2">Redeemed! Show this code at checkout:</p>
            <div className="inline-block font-mono text-3xl font-black tracking-widest px-8 py-4 rounded-xl" style={{ background: "#003d28", color: "#FFB800" }}>
              {redeemCode}
            </div>
            <p className="text-sm text-gray-500 mt-3">Code saved in your <Link href="/dashboard" className="underline font-semibold">dashboard</Link>. Valid in-store for 30 days.</p>
            <button onClick={() => setRedeemCode(null)} className="mt-4 text-sm text-gray-400 hover:text-gray-600">Dismiss</button>
          </div>
        )}

        {/* Category filter */}
        <div className="flex gap-2 flex-wrap mb-6">
          {shopCategories.map((cat) => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className="px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
              style={activeCategory === cat ? { background: "#003d28", color: "white" } : { background: "white", color: "#374151", border: "1px solid #e5e7eb" }}>
              {cat}
            </button>
          ))}
        </div>

        {/* Items grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map((item) => {
            const canAfford = user && user.coins >= item.coinPrice;
            return (
              <div key={item.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col transition-shadow hover:shadow-md ${!item.inStock ? "opacity-60" : ""}`}
                style={{ borderColor: "#e5e7eb" }}>
                {item.badge && (
                  <div className="text-white text-xs font-bold text-center py-1"
                    style={{ background: item.badge === "Hot" || item.badge === "Limited" ? "#E31837" : item.badge === "New" ? "#7c3aed" : "#003d28" }}>
                    {item.badge === "Hot" ? "🔥" : item.badge === "New" ? "✨" : "⭐"} {item.badge}
                  </div>
                )}
                <div className="p-4 flex-1 flex flex-col items-center text-center">
                  <div className="text-5xl mb-3">{item.emoji}</div>
                  <div className="font-bold text-gray-900 text-sm leading-tight mb-1">{item.name}</div>
                  <div className="text-xs text-gray-400 line-through mb-1">{item.regularPrice}</div>
                  <div className="text-xs font-semibold mb-3" style={{ color: "#059669" }}>{item.savings}</div>
                  <div className="mt-auto w-full">
                    <div className="font-black text-lg mb-3" style={{ color: "#FFB800" }}>
                      🪙 {item.coinPrice.toLocaleString()}
                    </div>
                    {!item.inStock ? (
                      <div className="w-full py-2 rounded-xl text-xs font-bold text-gray-400 bg-gray-100 text-center">Out of Stock</div>
                    ) : !user ? (
                      <Link href="/login" className="block w-full py-2 rounded-xl text-xs font-bold text-white text-center" style={{ background: "#003d28" }}>
                        Log in to redeem
                      </Link>
                    ) : (
                      <button
                        onClick={() => handleRedeem(item)}
                        className="w-full py-2 rounded-xl text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{ background: canAfford ? "#003d28" : "#9ca3af" }}
                        title={!canAfford ? `Need ${(item.coinPrice - (user?.coins || 0)).toLocaleString()} more coins` : ""}>
                        {canAfford ? "Redeem →" : `Need ${(item.coinPrice - user.coins).toLocaleString()} more 🪙`}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Earn more CTA */}
        <div className="mt-10 rounded-2xl p-8 text-center" style={{ background: "linear-gradient(135deg, #003d28, #005a3c)" }}>
          <div className="text-4xl mb-3">⬆️</div>
          <h2 className="text-white font-black text-xl mb-2">Need more coins?</h2>
          <p style={{ color: "#91d520" }} className="text-sm mb-5">Upload grocery flyers and earn 100 coins per page — no limits!</p>
          <Link href="/upload" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm"
            style={{ background: "#FFB800", color: "#003d28" }}>
            📄 Upload a Flyer →
          </Link>
        </div>
      </main>

      {/* Confirm modal */}
      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center">
            <div className="text-5xl mb-3">{confirming.emoji}</div>
            <h2 className="font-black text-xl text-gray-900 mb-1">{confirming.name}</h2>
            <p className="text-gray-500 text-sm mb-5">Redeem for <strong>{confirming.coinPrice.toLocaleString()} 🪙</strong>?<br />Your balance after: <strong>{((user?.coins || 0) - confirming.coinPrice).toLocaleString()} 🪙</strong></p>
            <div className="flex gap-3">
              <button onClick={() => setConfirming(null)}
                className="flex-1 py-2.5 rounded-xl border-2 font-bold text-sm" style={{ borderColor: "#e5e7eb", color: "#374151" }}>
                Cancel
              </button>
              <button onClick={confirmRedeem}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white"
                style={{ background: "#003d28" }}>
                Confirm Redeem
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
