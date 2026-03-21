"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import NavBar from "@/app/components/NavBar";
import { useAuth } from "@/app/context/AuthContext";

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
  }, [user, isLoading, router]);

  if (isLoading || !user) return null;

  const totalUploads = user.uploads.length;
  const totalCoinsEarned = user.uploads.reduce((sum, u) => sum + u.pointsEarned, 0) + 500;
  const totalCoinsSpent = user.purchases.reduce((sum, p) => sum + p.coinSpent, 0);
  const memberSince = new Date(user.joinedAt).toLocaleDateString("en-CA", { year: "numeric", month: "long" });

  const COIN_VALUE = 0.001; // 1 coin = $0.001, so 1000 coins = $1
  const savings = (totalCoinsSpent * COIN_VALUE).toFixed(2);

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <main className="max-w-5xl mx-auto px-4 py-10">
        {/* Welcome row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-900">Hey, {user.name.split(" ")[0]} 👋</h1>
            <p className="text-gray-500 text-sm mt-1">Member since {memberSince} · Code: <span className="font-mono font-bold">{user.referralCode}</span></p>
          </div>
          <Link href="/upload"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white text-sm hover:opacity-90 transition-opacity"
            style={{ background: "#003d28" }}>
            ⬆️ Upload Flyer — Earn Coins
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "FlyerCoins Balance", value: user.coins.toLocaleString() + " 🪙", accent: "#FFB800", bg: "#fffbeb" },
            { label: "Total Coins Earned", value: totalCoinsEarned.toLocaleString() + " 🪙", accent: "#003d28", bg: "#f0fdf4" },
            { label: "Flyers Uploaded", value: totalUploads, accent: "#003d28", bg: "#f0fdf4" },
            { label: "Total Savings", value: "$" + savings, accent: "#059669", bg: "#f0fdf4" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="text-2xl font-black mb-1" style={{ color: s.accent }}>{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Coins progress */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-800">Your FlyerCoins</h2>
            <Link href="/shop" className="text-sm font-semibold" style={{ color: "#003d28" }}>Redeem in Shop →</Link>
          </div>
          <div className="flex items-end gap-2 mb-3">
            <span className="text-5xl font-black" style={{ color: "#FFB800" }}>{user.coins.toLocaleString()}</span>
            <span className="text-lg text-gray-400 mb-1">/ 5,000 coins to Gold tier</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3 mb-2">
            <div className="h-3 rounded-full transition-all" style={{ width: `${Math.min((user.coins / 5000) * 100, 100)}%`, background: "#FFB800" }} />
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>🥈 Silver (you)</span>
            <span>🥇 Gold at 5,000</span>
            <span>💎 Diamond at 15,000</span>
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-3 gap-3 mt-5 border-t border-gray-100 pt-5">
            <Link href="/upload" className="text-center bg-gray-50 hover:bg-gray-100 rounded-xl p-3 transition-colors">
              <div className="text-2xl mb-1">⬆️</div>
              <div className="text-xs font-semibold text-gray-700">Upload</div>
              <div className="text-xs text-gray-400">+100/page</div>
            </Link>
            <Link href="/shop" className="text-center bg-gray-50 hover:bg-gray-100 rounded-xl p-3 transition-colors">
              <div className="text-2xl mb-1">🛍️</div>
              <div className="text-xs font-semibold text-gray-700">Shop</div>
              <div className="text-xs text-gray-400">Redeem coins</div>
            </Link>
            <Link href="/smart-basket" className="text-center bg-gray-50 hover:bg-gray-100 rounded-xl p-3 transition-colors">
              <div className="text-2xl mb-1">🛒</div>
              <div className="text-xs font-semibold text-gray-700">Compare</div>
              <div className="text-xs text-gray-400">Nearby prices</div>
            </Link>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {/* Upload history */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="font-bold text-gray-800 mb-4">Recent Uploads</h2>
            {user.uploads.length === 0 ? (
              <div className="text-center py-10">
                <div className="text-4xl mb-3">📄</div>
                <p className="text-sm text-gray-400">No uploads yet</p>
                <Link href="/upload" className="mt-3 inline-block text-sm font-semibold" style={{ color: "#003d28" }}>
                  Upload your first flyer →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {user.uploads.slice(0, 6).map((u) => (
                  <div key={u.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">📄</span>
                      <div>
                        <div className="text-sm font-semibold text-gray-800 truncate max-w-[160px]">{u.storeName || u.fileName}</div>
                        <div className="text-xs text-gray-400">{new Date(u.uploadedAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <span className="text-sm font-black" style={{ color: "#FFB800" }}>+{u.pointsEarned} 🪙</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Purchase history */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="font-bold text-gray-800 mb-4">Recent Redemptions</h2>
            {user.purchases.length === 0 ? (
              <div className="text-center py-10">
                <div className="text-4xl mb-3">🛍️</div>
                <p className="text-sm text-gray-400">No purchases yet</p>
                <Link href="/shop" className="mt-3 inline-block text-sm font-semibold" style={{ color: "#003d28" }}>
                  Browse the shop →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {user.purchases.slice(0, 6).map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🛍️</span>
                      <div>
                        <div className="text-sm font-semibold text-gray-800">{p.itemName}</div>
                        <div className="text-xs font-mono text-gray-400">{p.redeemCode}</div>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-red-500">-{p.coinSpent} 🪙</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
