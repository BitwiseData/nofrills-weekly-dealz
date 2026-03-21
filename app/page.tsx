"use client";

import { useState } from "react";
import Link from "next/link";
import NavBar from "@/app/components/NavBar";

// ── Mock Price Database ────────────────────────────────────────────────────────
interface StorePrice { store: string; price: number; display: string; }
interface ItemData { name: string; unit: string; stores: StorePrice[]; emoji: string; }

const ITEMS: Record<string, ItemData> = {
  milk:       { name: "Milk",           unit: "2 L",       emoji: "🥛", stores: [
    { store: "No Frills", price: 3.99, display: "$3.99" },
    { store: "Walmart",   price: 4.49, display: "$4.49" },
    { store: "Loblaws",   price: 5.29, display: "$5.29" },
  ]},
  eggs:       { name: "Eggs",           unit: "12 pack",   emoji: "🥚", stores: [
    { store: "No Frills", price: 3.49, display: "$3.49" },
    { store: "Walmart",   price: 3.97, display: "$3.97" },
    { store: "Loblaws",   price: 4.79, display: "$4.79" },
  ]},
  bread:      { name: "Bread",          unit: "675 g loaf",emoji: "🍞", stores: [
    { store: "Walmart",   price: 2.97, display: "$2.97" },
    { store: "No Frills", price: 3.19, display: "$3.19" },
    { store: "Loblaws",   price: 3.99, display: "$3.99" },
  ]},
  bananas:    { name: "Bananas",        unit: "per kg",    emoji: "🍌", stores: [
    { store: "No Frills", price: 1.49, display: "$1.49" },
    { store: "Walmart",   price: 1.67, display: "$1.67" },
    { store: "Loblaws",   price: 1.99, display: "$1.99" },
  ]},
  chicken:    { name: "Chicken Breast", unit: "per kg",    emoji: "🍗", stores: [
    { store: "Walmart",   price: 9.97, display: "$9.97" },
    { store: "No Frills", price: 10.99, display: "$10.99" },
    { store: "Loblaws",   price: 13.49, display: "$13.49" },
  ]},
  butter:     { name: "Butter",         unit: "454 g",     emoji: "🧈", stores: [
    { store: "No Frills", price: 5.49, display: "$5.49" },
    { store: "Walmart",   price: 5.97, display: "$5.97" },
    { store: "Loblaws",   price: 6.99, display: "$6.99" },
  ]},
  pasta:      { name: "Pasta",          unit: "900 g",     emoji: "🍝", stores: [
    { store: "Walmart",   price: 2.47, display: "$2.47" },
    { store: "No Frills", price: 2.79, display: "$2.79" },
    { store: "Loblaws",   price: 3.49, display: "$3.49" },
  ]},
  apples:     { name: "Apples",         unit: "3 lb bag",  emoji: "🍎", stores: [
    { store: "No Frills", price: 4.99, display: "$4.99" },
    { store: "Walmart",   price: 5.47, display: "$5.47" },
    { store: "Loblaws",   price: 6.29, display: "$6.29" },
  ]},
  cheese:     { name: "Cheddar Cheese", unit: "400 g",     emoji: "🧀", stores: [
    { store: "Walmart",   price: 5.97, display: "$5.97" },
    { store: "No Frills", price: 6.49, display: "$6.49" },
    { store: "Loblaws",   price: 7.99, display: "$7.99" },
  ]},
  rice:       { name: "White Rice",     unit: "2 kg",      emoji: "🍚", stores: [
    { store: "No Frills", price: 4.49, display: "$4.49" },
    { store: "Walmart",   price: 4.97, display: "$4.97" },
    { store: "Loblaws",   price: 5.99, display: "$5.99" },
  ]},
};

const QUICK_SEARCHES = ["milk", "eggs", "bread", "chicken", "cheese"];
const DEFAULT_BASKET = ["milk", "eggs", "bread", "bananas", "chicken"];
const ALL_BASKET_KEYS = ["milk", "eggs", "bread", "bananas", "chicken", "butter", "pasta", "apples"];
const STORES = ["No Frills", "Walmart", "Loblaws"];

const DATA_HEALTH = [
  { value: "47",    label: "Flyers indexed",       sub: "this week",     icon: "📄", color: "#003d28" },
  { value: "High",  label: "Produce volatility",   sub: "↑ 12% vs last week", icon: "📈", color: "#d97706" },
  { value: "11%",   label: "Avg. savings found",   sub: "across basket", icon: "💰", color: "#059669" },
  { value: "2h",    label: "Last data refresh",    sub: "prices current",icon: "🔄", color: "#6366f1" },
];

const PRICE_TREND = [
  { week: "Wk 10", nofrills: 3.79, walmart: 4.29, loblaws: 5.09 },
  { week: "Wk 11", nofrills: 3.89, walmart: 4.39, loblaws: 5.19 },
  { week: "Wk 12", nofrills: 3.99, walmart: 4.49, loblaws: 5.29 },
  { week: "Wk 13", nofrills: 3.99, walmart: 4.59, loblaws: 5.49 },
];

const STORE_COLORS: Record<string, string> = {
  "No Frills": "#FFB800",
  "Walmart":   "#0071CE",
  "Loblaws":   "#d62b1f",
};

// ── PriceCard component ─────────────────────────────────────────────────────
function PriceCard({ item }: { item: ItemData }) {
  const sorted = [...item.stores].sort((a, b) => a.price - b.price);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  const saved = (worst.price - best.price).toFixed(2);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 pt-5 pb-3 flex items-center gap-3">
        <span className="text-3xl">{item.emoji}</span>
        <div>
          <div className="font-bold text-gray-900">{item.name}</div>
          <div className="text-xs text-gray-400">{item.unit}</div>
        </div>
        <div className="ml-auto text-xs font-semibold px-2 py-1 rounded-full" style={{ background: "#f0fdf4", color: "#059669" }}>
          Save ${saved}
        </div>
      </div>
      <div className="px-5 pb-5 space-y-2">
        {sorted.map((s) => (
          <div key={s.store} className={`flex items-center justify-between rounded-xl px-3 py-2 ${s.store === best.store ? "ring-2" : "bg-gray-50"}`}
            style={s.store === best.store ? { background: "#f0fdf4" } : {}}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: STORE_COLORS[s.store] || "#9ca3af" }} />
              <span className="text-sm font-medium text-gray-700">{s.store}</span>
              {s.store === best.store && <span className="text-xs font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: "#003d28" }}>Best</span>}
            </div>
            <span className={`font-black text-sm ${s.store === best.store ? "" : "text-gray-500"}`}
              style={s.store === best.store ? { color: "#003d28" } : {}}>
              {s.display}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────
export default function Home() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ItemData[] | null>(null);
  const [basket, setBasket] = useState<string[]>(DEFAULT_BASKET);
  const [postalCode, setPostalCode] = useState("");

  const openFlipp = () => {
    const code = postalCode.trim();
    if (!code) return;
    window.open(`https://flipp.com/en-us/weekly_ads/groceries?postal_code=${encodeURIComponent(code)}`, "_blank", "noopener,noreferrer");
  };

  const handleSearch = (q: string) => {
    const term = q.toLowerCase().trim();
    if (!term) { setResults(null); return; }
    const matches = Object.values(ITEMS).filter(
      (item) => item.name.toLowerCase().includes(term) || term.includes(item.name.toLowerCase().split(" ")[0])
    );
    setResults(matches.length ? matches : null);
    setQuery(q);
  };

  const toggleBasket = (key: string) => {
    setBasket((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
  };

  // Compute store totals for basket
  const basketTotals = STORES.map((store) => {
    let total = 0;
    basket.forEach((key) => {
      const item = ITEMS[key];
      const price = item?.stores.find((s) => s.store === store)?.price ?? 0;
      total += price;
    });
    return { store, total };
  }).sort((a, b) => a.total - b.total);

  const cheapestStore = basketTotals[0];
  const expensiveStore = basketTotals[basketTotals.length - 1];
  const savings = (expensiveStore.total - cheapestStore.total).toFixed(2);

  // Milk trend max for bar scaling
  const maxPrice = Math.max(...PRICE_TREND.flatMap((w) => [w.nofrills, w.walmart, w.loblaws]));

  return (
    <div className="min-h-screen bg-white">
      <NavBar />

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 90% 55% at 50% -5%, #dcfce7 0%, transparent 65%)" }} />
        <div className="max-w-5xl mx-auto px-4 pt-20 pb-10 text-center relative">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold mb-7 border"
            style={{ background: "#f0fdf4", borderColor: "#bbf7d0", color: "#166534" }}>
            🍁 Updated weekly · Canadian grocery prices
          </div>

          <h1 className="text-5xl sm:text-6xl font-black tracking-tight text-gray-900 mb-5 leading-tight">
            Pay less for groceries,<br />
            <span style={{ color: "#003d28" }}>every week.</span>
          </h1>

          <p className="text-xl text-gray-500 mb-9 max-w-2xl mx-auto leading-relaxed">
            Compare prices across No Frills, Walmart, and Loblaws instantly.
            Find the cheapest basket before you leave home.
          </p>

          {/* Search bar */}
          <div className="max-w-xl mx-auto mb-4">
            <div className="flex gap-2 bg-white rounded-2xl shadow-md border border-gray-200 p-2">
              <input
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); handleSearch(e.target.value); }}
                onKeyDown={(e) => e.key === "Enter" && handleSearch(query)}
                placeholder="Search for an item — milk, eggs, bread..."
                className="flex-1 px-4 py-2.5 text-sm focus:outline-none bg-transparent text-gray-900 placeholder-gray-400"
              />
              <button
                onClick={() => handleSearch(query)}
                className="px-5 py-2.5 rounded-xl font-bold text-white text-sm"
                style={{ background: "#003d28" }}>
                Compare
              </button>
            </div>
          </div>

          {/* Quick chips */}
          <div className="flex gap-2 justify-center flex-wrap mb-10">
            {QUICK_SEARCHES.map((k) => (
              <button key={k} onClick={() => { setQuery(ITEMS[k].name); setResults([ITEMS[k]]); }}
                className="px-3 py-1.5 rounded-full text-xs font-medium border hover:border-gray-400 transition-colors bg-white text-gray-600 border-gray-200">
                {ITEMS[k].emoji} {ITEMS[k].name}
              </button>
            ))}
          </div>

          {/* Search results */}
          {results !== null && (
            <div className="max-w-4xl mx-auto text-left">
              {results.length === 0 ? (
                <p className="text-center text-gray-400 py-6">No results found. Try "milk", "eggs", or "bread".</p>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.map((item) => <PriceCard key={item.name} item={item} />)}
                </div>
              )}
            </div>
          )}

          {/* Default preview cards (no search yet) */}
          {results === null && (
            <div className="max-w-4xl mx-auto text-left">
              <p className="text-xs text-gray-400 text-center mb-3 uppercase tracking-wider font-medium">Popular comparisons this week</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {QUICK_SEARCHES.slice(0, 3).map((k) => <PriceCard key={k} item={ITEMS[k]} />)}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── BROWSE WEEKLY FLYERS ──────────────────────────────────────────── */}
      <section className="py-14 border-y border-gray-100 bg-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#003d28" }}>Weekly Flyers</span>
          <h2 className="text-2xl font-black text-gray-900 mt-2 mb-2">Browse this week&apos;s grocery ads</h2>
          <p className="text-gray-500 text-sm mb-6">Enter your ZIP or postal code to see all current flyers near you on Flipp.</p>
          <div className="flex gap-2 max-w-sm mx-auto">
            <input
              type="text"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && openFlipp()}
              placeholder="e.g. 91743 or M5V 3A8"
              maxLength={10}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:border-transparent text-gray-900 placeholder-gray-400"
            />
            <button
              onClick={openFlipp}
              disabled={!postalCode.trim()}
              className="px-5 py-3 rounded-xl font-bold text-white text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-opacity hover:opacity-90"
              style={{ background: "#003d28" }}
            >
              View Flyers →
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-3">Opens weekly ads on Flipp.com in a new tab</p>
        </div>
      </section>

      {/* ── SMART BASKET ──────────────────────────────────────────────────── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-10">
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#003d28" }}>Smart Basket</span>
            <h2 className="text-3xl font-black text-gray-900 mt-2">Build your basket, find the best store</h2>
            <p className="text-gray-500 text-sm mt-2">Select the items you need — we calculate where to shop to spend the least.</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Item checklist */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-bold text-gray-800 mb-4 text-sm">Select items in your basket</h3>
              <div className="grid sm:grid-cols-2 gap-2">
                {ALL_BASKET_KEYS.map((key) => {
                  const item = ITEMS[key];
                  const checked = basket.includes(key);
                  const cheapest = [...item.stores].sort((a, b) => a.price - b.price)[0];
                  return (
                    <button key={key} onClick={() => toggleBasket(key)}
                      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all border ${checked ? "border-green-200" : "border-gray-100 bg-gray-50 hover:bg-gray-100"}`}
                      style={checked ? { background: "#f0fdf4" } : {}}>
                      <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border-2 ${checked ? "border-green-600 bg-green-600" : "border-gray-300"}`}>
                        {checked && <span className="text-white text-xs font-black">✓</span>}
                      </div>
                      <span className="text-lg">{item.emoji}</span>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-gray-800 truncate">{item.name}</div>
                        <div className="text-xs text-gray-400">{item.unit}</div>
                      </div>
                      <div className="ml-auto text-xs font-bold flex-shrink-0" style={{ color: "#003d28" }}>
                        {cheapest.display}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Store totals + recommendation */}
            <div className="flex flex-col gap-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="font-bold text-gray-800 mb-4 text-sm">Store totals ({basket.length} items)</h3>
                <div className="space-y-3">
                  {basketTotals.map((st, idx) => (
                    <div key={st.store} className={`flex items-center justify-between rounded-xl px-3 py-2.5 ${idx === 0 ? "ring-2" : "bg-gray-50"}`}
                      style={idx === 0 ? { background: "#f0fdf4" } : {}}>
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: STORE_COLORS[st.store] || "#9ca3af" }} />
                        <span className="text-sm font-medium text-gray-700">{st.store}</span>
                        {idx === 0 && <span className="text-xs font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: "#003d28" }}>Cheapest</span>}
                      </div>
                      <span className={`font-black text-sm ${idx === 0 ? "" : "text-gray-500"}`}
                        style={idx === 0 ? { color: "#003d28" } : {}}>
                        ${st.total.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendation card */}
              <div className="rounded-2xl p-5 text-white flex-1" style={{ background: "linear-gradient(135deg, #003d28, #005a3c)" }}>
                <div className="text-2xl mb-2">💡</div>
                <p className="font-black text-lg mb-1">Shop at {cheapestStore.store}</p>
                <p className="text-sm mb-3" style={{ color: "#91d520" }}>
                  Save <strong className="text-white">${savings}</strong> vs {expensiveStore.store}
                </p>
                <p className="text-xs opacity-70">Based on {basket.length} selected items · Prices updated weekly</p>
                <Link href="/smart-basket"
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl"
                  style={{ background: "#FFB800", color: "#003d28" }}>
                  📍 Find nearby stores →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── DATA HEALTH ───────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-10">
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#003d28" }}>Market Activity</span>
            <h2 className="text-3xl font-black text-gray-900 mt-2">This week&apos;s data health</h2>
            <p className="text-gray-500 text-sm mt-2">Flyer data refreshed weekly from major Canadian grocery chains.</p>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
            {DATA_HEALTH.map((d) => (
              <div key={d.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="text-2xl mb-2">{d.icon}</div>
                <div className="text-2xl font-black mb-0.5" style={{ color: d.color }}>{d.value}</div>
                <div className="text-sm font-semibold text-gray-700">{d.label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{d.sub}</div>
              </div>
            ))}
          </div>

          {/* Milk price trend chart */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-bold text-gray-800 mb-1">Milk (2 L) — 4-week price trend</h3>
            <p className="text-xs text-gray-400 mb-5">Weekly low price by store</p>
            <div className="space-y-4">
              {PRICE_TREND.map((w) => (
                <div key={w.week} className="grid grid-cols-[48px_1fr] gap-3 items-center">
                  <span className="text-xs text-gray-400 font-medium">{w.week}</span>
                  <div className="space-y-1.5">
                    {[
                      { store: "No Frills", price: w.nofrills },
                      { store: "Walmart",   price: w.walmart   },
                      { store: "Loblaws",   price: w.loblaws   },
                    ].map((s) => (
                      <div key={s.store} className="flex items-center gap-2">
                        <div className="w-16 text-xs text-gray-500 flex-shrink-0">{s.store}</div>
                        <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                          <div className="h-4 rounded-full flex items-center pl-2 transition-all"
                            style={{ width: `${(s.price / maxPrice) * 100}%`, background: STORE_COLORS[s.store] || "#9ca3af" }}>
                            <span className="text-white text-xs font-bold whitespace-nowrap">${s.price.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="rounded-3xl p-10 sm:p-14 text-center" style={{ background: "linear-gradient(135deg, #003d28 0%, #005a3c 100%)" }}>
            <div className="text-5xl mb-4">🛒</div>
            <h2 className="text-3xl font-black text-white mb-4">Find the cheapest basket near you</h2>
            <p className="text-lg mb-8 max-w-xl mx-auto" style={{ color: "#91d520" }}>
              Enter your shopping list. We scan stores within 5 miles and show you the cheapest place to buy.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/smart-basket"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-base shadow-lg hover:opacity-90 transition-opacity"
                style={{ background: "#FFB800", color: "#003d28" }}>
                📍 Compare Prices Near Me →
              </Link>
              <Link href="/flyer-analyzer"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-base border-2 border-white text-white hover:bg-white/10 transition-colors">
                🤖 Analyze a Flyer →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-black text-lg" style={{ color: "#003d28" }}>Fair <span style={{ color: "#FFB800" }}>Fare</span></span>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center text-sm text-gray-400">
            <Link href="/deals" className="hover:text-gray-700">Deals</Link>
            <Link href="/smart-basket" className="hover:text-gray-700">Price Compare</Link>
            <Link href="/flyer-analyzer" className="hover:text-gray-700">Flyer AI</Link>
            <Link href="/upload" className="hover:text-gray-700">Upload</Link>
            <Link href="/shop" className="hover:text-gray-700">Shop</Link>
          </div>
          <p className="text-xs text-gray-300">© 2026 Fair Fare. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
