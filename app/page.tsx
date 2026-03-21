"use client";

import Link from "next/link";
import NavBar from "@/app/components/NavBar";
import { useAuth } from "@/app/context/AuthContext";

const features = [
  { icon: "📄", title: "Upload Any Flyer", desc: "Upload weekly grocery flyer PDFs from any store. Our AI reads every page instantly." },
  { icon: "🪙", title: "Earn FlyerCoins", desc: "Get 100 coins per PDF page uploaded. Stack them up and redeem for real grocery savings." },
  { icon: "🛒", title: "Smart Basket", desc: "Enter your shopping list. We find the cheapest prices across stores within 5 miles of you." },
  { icon: "🤖", title: "AI Deal Analysis", desc: "Claude AI extracts every deal, compares prices, and surfaces the best offers across all flyers." },
  { icon: "🛍️", title: "Redeem in Our Shop", desc: "Spend coins on groceries at checkout. No credit card needed — your uploads pay for your food." },
  { icon: "📍", title: "Nearby Store Prices", desc: "Real store locations within 3–5 miles. Compare live prices so you never overpay." },
];

const steps = [
  { step: "01", icon: "📄", title: "Upload a Flyer PDF", desc: "Drag & drop any grocery store flyer. Works with No Frills, Walmart, Loblaws, Food Basics, and more." },
  { step: "02", icon: "🪙", title: "Earn FlyerCoins", desc: "Get 100 coins per page uploaded. Welcome bonus: 500 free coins on signup. No limits on uploads." },
  { step: "03", icon: "🛍️", title: "Redeem for Groceries", desc: "Use your coins to get items from our shop at a fraction of the retail price. Coins never expire." },
];

const stats = [
  { value: "50K+", label: "Flyers Analyzed" },
  { value: "2M+", label: "Deals Extracted" },
  { value: "$847K", label: "Saved by Users" },
  { value: "12K+", label: "Active Members" },
];

const testimonials = [
  { name: "Priya S.", city: "Brampton, ON", avatar: "P", text: "I uploaded 10 flyers and had enough coins for free eggs and bread in one week. This app is insane!", coins: 1200 },
  { name: "Marco D.", city: "Mississauga, ON", avatar: "M", text: "The smart basket feature saved me $23 on my weekly groceries. Found cheaper prices 4 minutes away!", coins: 3400 },
  { name: "Aisha K.", city: "Toronto, ON", avatar: "A", text: "Finally a free tool that actually works. The AI reads the flyers better than I do lol.", coins: 890 },
];

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      <NavBar />

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 80% 60% at 50% -10%, #d1fae5 0%, transparent 70%)" }} />
        <div className="max-w-5xl mx-auto px-4 pt-20 pb-24 text-center relative">
          <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-4 py-1.5 text-sm font-semibold mb-8" style={{ color: "#92400e" }}>
            🪙 New: Earn coins on every upload — no limits
          </div>

          <h1 className="text-5xl sm:text-6xl font-black tracking-tight text-gray-900 mb-6 leading-tight">
            Upload flyers.<br />
            <span style={{ color: "#FFB800" }}>Earn coins.</span>{" "}
            <span style={{ color: "#003d28" }}>Save more.</span>
          </h1>

          <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            Upload any grocery store flyer PDF and our AI extracts every deal instantly. Earn FlyerCoins, compare prices near you, and redeem coins for real groceries.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {user ? (
              <>
                <Link href="/upload"
                  className="px-8 py-4 rounded-xl font-bold text-white text-base shadow-lg hover:opacity-90 transition-opacity"
                  style={{ background: "#003d28" }}>
                  ⬆️ Upload a Flyer — Earn Coins
                </Link>
                <Link href="/dashboard"
                  className="px-8 py-4 rounded-xl font-bold text-base border-2 hover:bg-gray-50 transition-colors"
                  style={{ borderColor: "#003d28", color: "#003d28" }}>
                  🪙 My Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link href="/signup"
                  className="px-8 py-4 rounded-xl font-bold text-white text-base shadow-lg hover:opacity-90 transition-opacity"
                  style={{ background: "#003d28" }}>
                  Get Started Free — 500 coins bonus 🎉
                </Link>
                <Link href="/deals"
                  className="px-8 py-4 rounded-xl font-bold text-base border-2 hover:bg-gray-50 transition-colors"
                  style={{ borderColor: "#003d28", color: "#003d28" }}>
                  Browse This Week&apos;s Deals →
                </Link>
              </>
            )}
          </div>

          {/* Coin illustration row */}
          <div className="mt-14 flex items-center justify-center gap-4 flex-wrap">
            {[
              { store: "No Frills", coins: "+100", color: "#FFB800" },
              { store: "Walmart",   coins: "+100", color: "#0071CE" },
              { store: "Loblaws",   coins: "+100", color: "#d62b1f" },
              { store: "Food Basics", coins: "+100", color: "#003d28" },
            ].map((s) => (
              <div key={s.store} className="flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm border border-gray-100 text-sm font-semibold text-gray-700">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                {s.store}
                <span className="font-black" style={{ color: "#FFB800" }}>{s.coins} 🪙</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────── */}
      <section className="border-y border-gray-100 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 py-10 grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="text-4xl font-black mb-1" style={{ color: "#003d28" }}>{s.value}</div>
              <div className="text-sm text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 py-24">
        <div className="text-center mb-14">
          <span className="text-sm font-semibold uppercase tracking-widest" style={{ color: "#FFB800" }}>How it works</span>
          <h2 className="text-4xl font-black text-gray-900 mt-2">Three steps to free groceries</h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-8">
          {steps.map((s) => (
            <div key={s.step} className="relative">
              <div className="text-6xl font-black mb-4 opacity-10 leading-none" style={{ color: "#003d28" }}>{s.step}</div>
              <div className="text-4xl mb-3">{s.icon}</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{s.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────── */}
      <section className="bg-gray-50 py-24">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <span className="text-sm font-semibold uppercase tracking-widest" style={{ color: "#FFB800" }}>Features</span>
            <h2 className="text-4xl font-black text-gray-900 mt-2">Everything you need to save more</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SMART BASKET CTA ─────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="rounded-3xl p-10 sm:p-14 text-center" style={{ background: "linear-gradient(135deg, #003d28 0%, #005a3c 100%)" }}>
            <div className="text-5xl mb-4">🛒</div>
            <h2 className="text-3xl font-black text-white mb-4">Find the cheapest basket near you</h2>
            <p className="text-lg mb-8 max-w-xl mx-auto" style={{ color: "#91d520" }}>
              Enter your shopping list — milk, eggs, bread, nuts. We scan stores within 5 miles and show you the cheapest place to buy each item.
            </p>
            <Link href="/smart-basket"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-base shadow-lg hover:opacity-90 transition-opacity"
              style={{ background: "#FFB800", color: "#003d28" }}>
              📍 Compare Prices Near Me →
            </Link>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────── */}
      <section className="bg-gray-50 py-24">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <span className="text-sm font-semibold uppercase tracking-widest" style={{ color: "#FFB800" }}>Community</span>
            <h2 className="text-4xl font-black text-gray-900 mt-2">Real savings from real members</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black text-white" style={{ background: "#003d28" }}>
                    {t.avatar}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 text-sm">{t.name}</div>
                    <div className="text-xs text-gray-400">{t.city}</div>
                  </div>
                  <div className="ml-auto text-xs font-bold px-2 py-1 rounded-full" style={{ background: "#fffbeb", color: "#92400e" }}>
                    🪙 {t.coins.toLocaleString()}
                  </div>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">&ldquo;{t.text}&rdquo;</p>
                <div className="flex gap-0.5 mt-4">
                  {[...Array(5)].map((_, i) => <span key={i} className="text-amber-400 text-sm">★</span>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────── */}
      <section className="py-24 text-center">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-6xl mb-6">🪙</div>
          <h2 className="text-4xl font-black text-gray-900 mb-4">Start earning today</h2>
          <p className="text-lg text-gray-500 mb-8">Free forever. No credit card. 500 welcome coins on signup.</p>
          {user ? (
            <Link href="/upload"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-white text-base shadow-lg hover:opacity-90 transition-opacity"
              style={{ background: "#003d28" }}>
              ⬆️ Upload Your First Flyer
            </Link>
          ) : (
            <Link href="/signup"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-white text-base shadow-lg hover:opacity-90 transition-opacity"
              style={{ background: "#003d28" }}>
              Create Free Account →
            </Link>
          )}
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer className="border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🪙</span>
            <span className="font-black text-lg" style={{ color: "#003d28" }}>Flyer<span style={{ color: "#FFB800" }}>Coins</span></span>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center text-sm text-gray-400">
            <Link href="/deals" className="hover:text-gray-700">Deals</Link>
            <Link href="/shop" className="hover:text-gray-700">Shop</Link>
            <Link href="/upload" className="hover:text-gray-700">Upload</Link>
            <Link href="/smart-basket" className="hover:text-gray-700">Price Compare</Link>
            <Link href="/flyer-analyzer" className="hover:text-gray-700">Flyer AI</Link>
          </div>
          <p className="text-xs text-gray-300">© 2026 FlyerCoins. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
