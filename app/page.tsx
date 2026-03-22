"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import NavBar from "@/app/components/NavBar";

// ── Types ──────────────────────────────────────────────────────────────────────
interface StorePrice { store: string; price: number; display: string; isOnSale?: boolean; }
interface ItemData { name: string; unit: string; stores: StorePrice[]; emoji: string; source?: "live" | "cached" | "estimated"; updatedAt?: string; }
interface TrendRow { week: string; s1: number; s2: number; s3: number; }

// ── Canada Price Database (Food Basics · Walmart · Loblaws) ───────────────────
const ITEMS_CA: Record<string, ItemData> = {
  milk:    { name: "Milk",           unit: "2 L",        emoji: "🥛", stores: [
    { store: "Food Basics", price: 3.99,  display: "$3.99"  },
    { store: "Walmart",   price: 4.49,  display: "$4.49"  },
    { store: "Loblaws",   price: 5.29,  display: "$5.29"  },
  ]},
  eggs:    { name: "Eggs",           unit: "12 pack",    emoji: "🥚", stores: [
    { store: "Food Basics", price: 3.49,  display: "$3.49"  },
    { store: "Walmart",   price: 3.97,  display: "$3.97"  },
    { store: "Loblaws",   price: 4.79,  display: "$4.79"  },
  ]},
  bread:   { name: "Bread",          unit: "675 g loaf", emoji: "🍞", stores: [
    { store: "Walmart",   price: 2.97,  display: "$2.97"  },
    { store: "Food Basics", price: 3.19,  display: "$3.19"  },
    { store: "Loblaws",   price: 3.99,  display: "$3.99"  },
  ]},
  bananas: { name: "Bananas",        unit: "per kg",     emoji: "🍌", stores: [
    { store: "Food Basics", price: 1.49,  display: "$1.49"  },
    { store: "Walmart",   price: 1.67,  display: "$1.67"  },
    { store: "Loblaws",   price: 1.99,  display: "$1.99"  },
  ]},
  chicken: { name: "Chicken Breast", unit: "per kg",     emoji: "🍗", stores: [
    { store: "Walmart",   price: 9.97,  display: "$9.97"  },
    { store: "Food Basics", price: 10.99, display: "$10.99" },
    { store: "Loblaws",   price: 13.49, display: "$13.49" },
  ]},
  butter:  { name: "Butter",         unit: "454 g",      emoji: "🧈", stores: [
    { store: "Food Basics", price: 5.49,  display: "$5.49"  },
    { store: "Walmart",   price: 5.97,  display: "$5.97"  },
    { store: "Loblaws",   price: 6.99,  display: "$6.99"  },
  ]},
  pasta:   { name: "Pasta",          unit: "900 g",      emoji: "🍝", stores: [
    { store: "Walmart",   price: 2.47,  display: "$2.47"  },
    { store: "Food Basics", price: 2.79,  display: "$2.79"  },
    { store: "Loblaws",   price: 3.49,  display: "$3.49"  },
  ]},
  apples:  { name: "Apples",         unit: "3 lb bag",   emoji: "🍎", stores: [
    { store: "Food Basics", price: 4.99,  display: "$4.99"  },
    { store: "Walmart",   price: 5.47,  display: "$5.47"  },
    { store: "Loblaws",   price: 6.29,  display: "$6.29"  },
  ]},
  cheese:  { name: "Cheddar Cheese", unit: "400 g",      emoji: "🧀", stores: [
    { store: "Walmart",   price: 5.97,  display: "$5.97"  },
    { store: "Food Basics", price: 6.49,  display: "$6.49"  },
    { store: "Loblaws",   price: 7.99,  display: "$7.99"  },
  ]},
  rice:    { name: "White Rice",     unit: "2 kg",       emoji: "🍚", stores: [
    { store: "Food Basics", price: 4.49,  display: "$4.49"  },
    { store: "Walmart",   price: 4.97,  display: "$4.97"  },
    { store: "Loblaws",   price: 5.99,  display: "$5.99"  },
  ]},
};

// ── USA Price Database (Walmart · Target · Kroger) ────────────────────────────
const ITEMS_US: Record<string, ItemData> = {
  milk:    { name: "Milk",           unit: "1 gallon",   emoji: "🥛", stores: [
    { store: "Kroger",  price: 3.49,  display: "$3.49"  },
    { store: "Walmart", price: 3.78,  display: "$3.78"  },
    { store: "Target",  price: 4.19,  display: "$4.19"  },
  ]},
  eggs:    { name: "Eggs",           unit: "12 count",   emoji: "🥚", stores: [
    { store: "Kroger",  price: 2.79,  display: "$2.79"  },
    { store: "Walmart", price: 2.97,  display: "$2.97"  },
    { store: "Target",  price: 3.49,  display: "$3.49"  },
  ]},
  bread:   { name: "Bread",          unit: "20 oz loaf", emoji: "🍞", stores: [
    { store: "Walmart", price: 1.98,  display: "$1.98"  },
    { store: "Kroger",  price: 2.29,  display: "$2.29"  },
    { store: "Target",  price: 2.49,  display: "$2.49"  },
  ]},
  bananas: { name: "Bananas",        unit: "per lb",     emoji: "🍌", stores: [
    { store: "Walmart", price: 0.57,  display: "$0.57"  },
    { store: "Kroger",  price: 0.59,  display: "$0.59"  },
    { store: "Target",  price: 0.69,  display: "$0.69"  },
  ]},
  chicken: { name: "Chicken Breast", unit: "per lb",     emoji: "🍗", stores: [
    { store: "Kroger",  price: 3.79,  display: "$3.79"  },
    { store: "Walmart", price: 3.97,  display: "$3.97"  },
    { store: "Target",  price: 4.99,  display: "$4.99"  },
  ]},
  butter:  { name: "Butter",         unit: "1 lb",       emoji: "🧈", stores: [
    { store: "Kroger",  price: 3.79,  display: "$3.79"  },
    { store: "Walmart", price: 3.97,  display: "$3.97"  },
    { store: "Target",  price: 4.49,  display: "$4.49"  },
  ]},
  pasta:   { name: "Pasta",          unit: "16 oz",      emoji: "🍝", stores: [
    { store: "Walmart", price: 1.28,  display: "$1.28"  },
    { store: "Kroger",  price: 1.49,  display: "$1.49"  },
    { store: "Target",  price: 1.79,  display: "$1.79"  },
  ]},
  apples:  { name: "Apples",         unit: "3 lb bag",   emoji: "🍎", stores: [
    { store: "Walmart", price: 3.97,  display: "$3.97"  },
    { store: "Kroger",  price: 4.19,  display: "$4.19"  },
    { store: "Target",  price: 4.49,  display: "$4.49"  },
  ]},
  cheese:  { name: "Cheddar Cheese", unit: "8 oz",       emoji: "🧀", stores: [
    { store: "Kroger",  price: 2.79,  display: "$2.79"  },
    { store: "Walmart", price: 2.97,  display: "$2.97"  },
    { store: "Target",  price: 3.49,  display: "$3.49"  },
  ]},
  rice:    { name: "White Rice",     unit: "5 lb",       emoji: "🍚", stores: [
    { store: "Kroger",  price: 4.49,  display: "$4.49"  },
    { store: "Walmart", price: 4.97,  display: "$4.97"  },
    { store: "Target",  price: 5.99,  display: "$5.99"  },
  ]},
};

const STORES_CA = ["Food Basics", "Walmart", "Loblaws"];
const STORES_US = ["Walmart", "Target", "Kroger"];

// 4-week milk price trend
const TREND_CA: TrendRow[] = [
  { week: "Wk 10", s1: 3.79, s2: 4.29, s3: 5.09 },
  { week: "Wk 11", s1: 3.89, s2: 4.39, s3: 5.19 },
  { week: "Wk 12", s1: 3.99, s2: 4.49, s3: 5.29 },
  { week: "Wk 13", s1: 3.99, s2: 4.59, s3: 5.49 },
];
const TREND_CA_STORES = ["Food Basics", "Walmart", "Loblaws"];

const TREND_US: TrendRow[] = [
  { week: "Wk 10", s1: 3.39, s2: 3.68, s3: 4.09 },
  { week: "Wk 11", s1: 3.45, s2: 3.73, s3: 4.14 },
  { week: "Wk 12", s1: 3.49, s2: 3.78, s3: 4.19 },
  { week: "Wk 13", s1: 3.49, s2: 3.88, s3: 4.29 },
];
const TREND_US_STORES = ["Kroger", "Walmart", "Target"];

const QUICK_SEARCHES = ["milk", "eggs", "bread", "chicken", "cheese"];
const ALL_BASKET_KEYS = ["milk", "eggs", "bread", "bananas", "chicken", "butter", "pasta", "apples"];
const DEFAULT_BASKET  = ["milk", "eggs", "bread", "bananas", "chicken"];

const DATA_HEALTH = [
  { value: "47",   label: "Flyers indexed",     sub: "this week",          icon: "📄", color: "#003d28" },
  { value: "High", label: "Produce volatility",  sub: "↑ 12% vs last week", icon: "📈", color: "#d97706" },
  { value: "11%",  label: "Avg. savings found",  sub: "across basket",      icon: "💰", color: "#059669" },
  { value: "2h",   label: "Last data refresh",   sub: "prices current",     icon: "🔄", color: "#6366f1" },
];

const STORE_COLORS: Record<string, string> = {
  "Food Basics": "#FFB800",
  "Walmart":   "#0071CE",
  "Loblaws":   "#d62b1f",
  "Target":    "#CC0000",
  "Kroger":    "#004990",
};

// ── Source badge helper ───────────────────────────────────────────────────────
function SourceBadge({ source }: { source?: "live" | "cached" | "estimated" }) {
  if (!source) return null;
  const cfg = {
    live:      { label: "🟢 Live",      bg: "#f0fdf4", color: "#166534" },
    cached:    { label: "🟡 Cached",    bg: "#fefce8", color: "#854d0e" },
    estimated: { label: "⚪ Estimated", bg: "#f9fafb", color: "#6b7280" },
  }[source];
  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  );
}

// ── PriceCard component ──────────────────────────────────────────────────────
function PriceCard({ item }: { item: ItemData }) {
  const sorted = [...item.stores].sort((a, b) => a.price - b.price);
  const best   = sorted[0];
  const worst  = sorted[sorted.length - 1];
  const saved  = (worst.price - best.price).toFixed(2);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 pt-5 pb-3 flex items-center gap-3">
        <span className="text-3xl">{item.emoji}</span>
        <div className="min-w-0">
          <div className="font-bold text-gray-900 truncate">{item.name}</div>
          <div className="text-xs text-gray-400">{item.unit}</div>
        </div>
        <div className="ml-auto flex flex-col items-end gap-1 flex-shrink-0">
          <div className="text-xs font-semibold px-2 py-1 rounded-full" style={{ background: "#f0fdf4", color: "#059669" }}>
            Save ${saved}
          </div>
          <SourceBadge source={item.source} />
        </div>
      </div>
      <div className="px-5 pb-5 space-y-2">
        {sorted.map((s) => (
          <div key={s.store}
            className={`flex items-center justify-between rounded-xl px-3 py-2 ${s.store === best.store ? "ring-2 ring-green-200" : "bg-gray-50"}`}
            style={s.store === best.store ? { background: "#f0fdf4" } : {}}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: STORE_COLORS[s.store] || "#9ca3af" }} />
              <span className="text-sm font-medium text-gray-700">{s.store}</span>
              {s.store === best.store && (
                <span className="text-xs font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: "#003d28" }}>Best</span>
              )}
              {s.isOnSale && (
                <span className="text-xs font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#fef2f2", color: "#dc2626" }}>Sale</span>
              )}
            </div>
            <span className="font-black text-sm" style={{ color: s.store === best.store ? "#003d28" : "#6b7280" }}>
              {s.display}
            </span>
          </div>
        ))}
        {item.updatedAt && (
          <p className="text-xs text-gray-300 pt-1">Updated {new Date(item.updatedAt).toLocaleDateString()}</p>
        )}
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function Home() {
  const [query,      setQuery]      = useState("");
  const [results,    setResults]    = useState<ItemData[] | null>(null);
  const [searching,  setSearching]  = useState(false);
  const [basket,     setBasket]     = useState<string[]>(DEFAULT_BASKET);
  const [postalCode, setPostalCode] = useState("");
  const [country,    setCountry]    = useState<"US" | "CA">("US");

  // Auto-detect country from IP
  useEffect(() => {
    fetch("https://ipapi.co/json/")
      .then((r) => r.json())
      .then((data) => { setCountry(data?.country_code === "CA" ? "CA" : "US"); })
      .catch(() => {});
  }, []);

  // Reset search results when country changes
  useEffect(() => { setResults(null); setQuery(""); }, [country]);

  const activeItems  = country === "CA" ? ITEMS_CA  : ITEMS_US;
  const activeStores = country === "CA" ? STORES_CA : STORES_US;
  const activeTrend  = country === "CA" ? TREND_CA  : TREND_US;
  const trendStores  = country === "CA" ? TREND_CA_STORES : TREND_US_STORES;

  const flippLocale       = country === "CA" ? "en-ca" : "en-us";
  const countryLabel      = country === "CA" ? "🇨🇦 Canada" : "🇺🇸 United States";
  const postalPlaceholder = country === "CA" ? "e.g. M5V 3A8 or K1A 0A9" : "e.g. 91743 or 10001";
  const heroStores        = country === "CA" ? "Food Basics, Walmart, and Loblaws" : "Walmart, Target, and Kroger";

  const openFlipp = () => {
    const code = postalCode.trim();
    if (!code) return;
    window.open(`https://flipp.com/${flippLocale}/weekly_ads/groceries?postal_code=${encodeURIComponent(code)}`, "_blank", "noopener,noreferrer");
  };

  const handleSearch = async (q: string) => {
    const term = q.toLowerCase().trim();
    if (!term) { setResults(null); return; }
    setQuery(q);
    setSearching(true);

    try {
      const params = new URLSearchParams({ items: term, country });
      if (postalCode.trim()) params.set("postalCode", postalCode.trim());
      const res = await fetch(`/api/prices?${params}`);
      if (res.ok) {
        const data = await res.json();
        if (data.results?.length) {
          const mapped: ItemData[] = data.results.map((r: {
            name: string; unit: string; emoji: string;
            stores: { store: string; price: number; display: string; isOnSale?: boolean }[];
            source: "live" | "cached" | "estimated"; updatedAt: string;
          }) => ({
            name: r.name, unit: r.unit, emoji: r.emoji,
            stores: r.stores, source: r.source, updatedAt: r.updatedAt,
          }));
          setResults(mapped);
          setSearching(false);
          return;
        }
      }
    } catch { /* fall through to local */ }

    // Local fallback
    const matches = Object.values(activeItems).filter(
      (item) => item.name.toLowerCase().includes(term) || term.includes(item.name.toLowerCase().split(" ")[0])
    );
    setResults(matches.length ? matches.map(m => ({ ...m, source: "estimated" as const })) : []);
    setSearching(false);
  };

  const toggleBasket = (key: string) =>
    setBasket((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);

  // Basket store totals
  const basketTotals = activeStores.map((store) => {
    let total = 0;
    basket.forEach((key) => {
      const item  = activeItems[key];
      const price = item?.stores.find((s) => s.store === store)?.price ?? 0;
      total += price;
    });
    return { store, total };
  }).sort((a, b) => a.total - b.total);

  const cheapestStore  = basketTotals[0];
  const expensiveStore = basketTotals[basketTotals.length - 1];
  const savings        = (expensiveStore.total - cheapestStore.total).toFixed(2);

  const trendValues = activeTrend.flatMap((w) => [w.s1, w.s2, w.s3]);
  const maxPrice    = Math.max(...trendValues);

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
            {country === "CA" ? "🍁" : "🦅"} Updated weekly · {country === "CA" ? "Canadian" : "US"} grocery prices
          </div>

          <h1 className="text-5xl sm:text-6xl font-black tracking-tight text-gray-900 mb-5 leading-tight">
            Pay less for groceries,<br />
            <span style={{ color: "#003d28" }}>every week.</span>
          </h1>

          <p className="text-xl text-gray-500 mb-9 max-w-2xl mx-auto leading-relaxed">
            Compare prices across {heroStores} instantly.
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
              <button onClick={() => handleSearch(query)} disabled={searching}
                className="px-5 py-2.5 rounded-xl font-bold text-white text-sm disabled:opacity-60 transition-opacity"
                style={{ background: "#003d28" }}>
                {searching ? "..." : "Compare"}
              </button>
            </div>
          </div>

          {/* Quick chips */}
          <div className="flex gap-2 justify-center flex-wrap mb-10">
            {QUICK_SEARCHES.map((k) => (
              <button key={k} onClick={() => { setQuery(activeItems[k].name); setResults([activeItems[k]]); }}
                className="px-3 py-1.5 rounded-full text-xs font-medium border hover:border-gray-400 transition-colors bg-white text-gray-600 border-gray-200">
                {activeItems[k].emoji} {activeItems[k].name}
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

          {/* Default preview cards */}
          {results === null && (
            <div className="max-w-4xl mx-auto text-left">
              <p className="text-xs text-gray-400 text-center mb-3 uppercase tracking-wider font-medium">Popular comparisons this week</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {QUICK_SEARCHES.slice(0, 3).map((k) => <PriceCard key={k} item={activeItems[k]} />)}
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
          <p className="text-gray-500 text-sm mb-4">Enter your ZIP or postal code to see all current flyers near you on Flipp.</p>

          {/* Country toggle */}
          <div className="flex items-center justify-center mb-5">
            <div className="flex rounded-xl border border-gray-200 overflow-hidden text-xs font-bold">
              <button onClick={() => setCountry("US")}
                className={`px-3 py-1.5 transition-colors ${country === "US" ? "text-white" : "text-gray-500 hover:bg-gray-50"}`}
                style={country === "US" ? { background: "#003d28" } : {}}>
                🇺🇸 USA
              </button>
              <button onClick={() => setCountry("CA")}
                className={`px-3 py-1.5 transition-colors border-l border-gray-200 ${country === "CA" ? "text-white" : "text-gray-500 hover:bg-gray-50"}`}
                style={country === "CA" ? { background: "#003d28" } : {}}>
                🇨🇦 Canada
              </button>
            </div>
          </div>

          <div className="flex gap-2 max-w-sm mx-auto">
            <input
              type="text"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && openFlipp()}
              placeholder={postalPlaceholder}
              maxLength={10}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:border-transparent text-gray-900 placeholder-gray-400"
            />
            <button onClick={openFlipp} disabled={!postalCode.trim()}
              className="px-5 py-3 rounded-xl font-bold text-white text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-opacity hover:opacity-90"
              style={{ background: "#003d28" }}>
              View Flyers →
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Showing {countryLabel} flyers on Flipp.com · Opens in a new tab
          </p>
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
                  const item    = activeItems[key];
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
                    <div key={st.store}
                      className={`flex items-center justify-between rounded-xl px-3 py-2.5 ${idx === 0 ? "ring-2" : "bg-gray-50"}`}
                      style={idx === 0 ? { background: "#f0fdf4" } : {}}>
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: STORE_COLORS[st.store] || "#9ca3af" }} />
                        <span className="text-sm font-medium text-gray-700">{st.store}</span>
                        {idx === 0 && <span className="text-xs font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: "#003d28" }}>Cheapest</span>}
                      </div>
                      <span className="font-black text-sm" style={{ color: idx === 0 ? "#003d28" : "#6b7280" }}>
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
            <p className="text-gray-500 text-sm mt-2">
              Flyer data refreshed weekly from major {country === "CA" ? "Canadian" : "US"} grocery chains.
            </p>
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
            <h3 className="font-bold text-gray-800 mb-1">
              Milk ({country === "CA" ? "2 L" : "1 gallon"}) — 4-week price trend
            </h3>
            <p className="text-xs text-gray-400 mb-5">Weekly low price by store</p>
            <div className="space-y-4">
              {activeTrend.map((w) => (
                <div key={w.week} className="grid grid-cols-[48px_1fr] gap-3 items-center">
                  <span className="text-xs text-gray-400 font-medium">{w.week}</span>
                  <div className="space-y-1.5">
                    {([w.s1, w.s2, w.s3] as number[]).map((price, i) => {
                      const store = trendStores[i];
                      return (
                        <div key={store} className="flex items-center gap-2">
                          <div className="w-16 text-xs text-gray-500 flex-shrink-0">{store}</div>
                          <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                            <div className="h-4 rounded-full flex items-center pl-2 transition-all"
                              style={{ width: `${(price / maxPrice) * 100}%`, background: STORE_COLORS[store] || "#9ca3af" }}>
                              <span className="text-white text-xs font-bold whitespace-nowrap">${price.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
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
          <span className="font-black text-lg" style={{ color: "#003d28" }}>
            Fair <span style={{ color: "#FFB800" }}>Fare</span>
          </span>
          <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center text-sm text-gray-400">
            <Link href="/deals"        className="hover:text-gray-700">Deals</Link>
            <Link href="/smart-basket" className="hover:text-gray-700">Price Compare</Link>
            <Link href="/flyer-analyzer" className="hover:text-gray-700">Flyer AI</Link>
            <Link href="/upload"       className="hover:text-gray-700">Upload</Link>
            <Link href="/shop"         className="hover:text-gray-700">Shop</Link>
          </div>
          <p className="text-xs text-gray-300">© 2026 Fair Fare. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
