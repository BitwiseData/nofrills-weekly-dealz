"use client";

import { useState, useRef } from "react";
import NavBar from "@/app/components/NavBar";
import Link from "next/link";

interface PriceRow {
  store: string;
  address: string;
  distance: string;
  mapsUrl: string;
  items: Record<string, string>;
  total: string;
  isCheapest: boolean;
}

interface BasketResult {
  rows: PriceRow[];
  items: string[];
  cheapestPerItem: Record<string, string>;
  tips: string[];
  nearbyStores: { name: string; distance: string }[];
}

const SUGGESTED_ITEMS = ["Milk 2L", "Eggs 1 dozen", "Bread loaf", "Mixed nuts", "Butter 454g", "Yogurt", "Orange juice", "Chicken breast", "Bananas", "Strawberries"];

const RADIUS_OPTIONS = [
  { label: "3 miles", value: 3 },
  { label: "5 miles", value: 5 },
  { label: "10 miles", value: 10 },
];

export default function SmartBasketPage() {
  const [items, setItems] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [radius, setRadius] = useState(5);
  const [locationState, setLocationState] = useState<"idle" | "loading" | "granted" | "denied">("idle");
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [result, setResult] = useState<BasketResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const addItem = (item: string) => {
    const trimmed = item.trim();
    if (trimmed && !items.includes(trimmed)) {
      setItems((prev) => [...prev, trimmed]);
    }
    setInputValue("");
    inputRef.current?.focus();
  };

  const removeItem = (item: string) => setItems((prev) => prev.filter((i) => i !== item));

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addItem(inputValue); }
    if (e.key === "Backspace" && !inputValue && items.length) removeItem(items[items.length - 1]);
  };

  const getLocation = () => {
    setLocationState("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setLocationState("granted");
      },
      () => setLocationState("denied"),
      { timeout: 10000 }
    );
  };

  const compare = async () => {
    if (!items.length) { setError("Add at least one item to compare."); return; }
    if (!coords) { setError("Location is required. Click 'Use My Location' above."); return; }
    setIsSearching(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/smart-basket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, lat: coords.lat, lon: coords.lon, radiusMiles: radius }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const savings = result
    ? (() => {
        const totals = result.rows.map((r) => parseFloat(r.total.replace("$", ""))).filter((n) => !isNaN(n));
        if (totals.length < 2) return null;
        return (Math.max(...totals) - Math.min(...totals)).toFixed(2);
      })()
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <main className="max-w-4xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="text-5xl mb-3">🛒</div>
          <h1 className="text-3xl font-black text-gray-900">Smart Basket</h1>
          <p className="text-gray-500 mt-2 max-w-xl mx-auto">
            Enter what you need to buy. We find the cheapest price at stores near you within {radius} miles.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          {/* Step 1: Items */}
          <div className="mb-6">
            <label className="block font-semibold text-gray-800 mb-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-black mr-2" style={{ background: "#003d28" }}>1</span>
              What do you need to buy?
            </label>

            {/* Item chips */}
            <div className="flex flex-wrap gap-2 p-3 border border-gray-200 rounded-xl bg-gray-50 min-h-[52px] cursor-text" onClick={() => inputRef.current?.focus()}>
              {items.map((item) => (
                <span key={item} className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-3 py-1 text-sm font-medium text-gray-700 shadow-sm">
                  {item}
                  <button onClick={() => removeItem(item)} className="text-gray-400 hover:text-red-500 text-base leading-none">×</button>
                </span>
              ))}
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder={items.length === 0 ? "Type item and press Enter (e.g. Milk, Eggs, Bread...)" : "Add more..."}
                className="flex-1 min-w-[180px] bg-transparent text-sm outline-none text-gray-700"
              />
            </div>

            {/* Suggestions */}
            <div className="flex flex-wrap gap-2 mt-3">
              {SUGGESTED_ITEMS.filter((s) => !items.includes(s)).slice(0, 6).map((s) => (
                <button key={s} onClick={() => addItem(s)}
                  className="px-3 py-1 rounded-full text-xs font-medium border border-dashed border-gray-300 text-gray-500 hover:border-green-700 hover:text-green-800 transition-colors">
                  + {s}
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Location + radius */}
          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block font-semibold text-gray-800 mb-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-black mr-2" style={{ background: "#003d28" }}>2</span>
                Your location
              </label>
              <button
                onClick={getLocation}
                disabled={locationState === "loading" || locationState === "granted"}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm border-2 transition-colors"
                style={locationState === "granted"
                  ? { borderColor: "#003d28", background: "#f0fdf4", color: "#003d28" }
                  : locationState === "denied"
                  ? { borderColor: "#fca5a5", background: "#fef2f2", color: "#dc2626" }
                  : { borderColor: "#e5e7eb", background: "white", color: "#374151" }}
              >
                {locationState === "loading" ? "📍 Getting location..." : locationState === "granted" ? "✅ Location found!" : locationState === "denied" ? "❌ Location denied" : "📍 Use My Location"}
              </button>
              {locationState === "denied" && (
                <p className="text-xs text-red-500 mt-1">Please enable location in your browser settings.</p>
              )}
            </div>
            <div>
              <label className="block font-semibold text-gray-800 mb-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-black mr-2" style={{ background: "#003d28" }}>3</span>
                Search radius
              </label>
              <div className="flex gap-2">
                {RADIUS_OPTIONS.map((opt) => (
                  <button key={opt.value} onClick={() => setRadius(opt.value)}
                    className="flex-1 py-3 rounded-xl font-semibold text-sm border-2 transition-colors"
                    style={radius === opt.value ? { borderColor: "#003d28", background: "#f0fdf4", color: "#003d28" } : { borderColor: "#e5e7eb", color: "#374151" }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm mb-4">{error}</div>
          )}

          <button
            onClick={compare}
            disabled={!items.length || !coords || isSearching}
            className="w-full py-4 rounded-xl font-black text-white text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: items.length && coords && !isSearching ? "#003d28" : "#9ca3af" }}
          >
            {isSearching ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⏳</span>
                Finding cheapest prices near you...
              </span>
            ) : (
              `🔍 Compare Prices at ${radius}-Mile Radius`
            )}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
                <div className="text-3xl font-black mb-1" style={{ color: "#003d28" }}>{result.rows.length}</div>
                <div className="text-xs text-gray-500">Stores Found</div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
                <div className="text-3xl font-black mb-1" style={{ color: "#003d28" }}>{result.items.length}</div>
                <div className="text-xs text-gray-500">Items Compared</div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
                <div className="text-3xl font-black mb-1" style={{ color: "#059669" }}>
                  {savings ? `$${savings}` : "—"}
                </div>
                <div className="text-xs text-gray-500">Max Savings</div>
              </div>
            </div>

            {/* Best pick */}
            {result.rows.find((r) => r.isCheapest) && (
              <div className="rounded-2xl p-5" style={{ background: "linear-gradient(135deg, #003d28, #005a3c)" }}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="flex-1">
                    <p className="text-white font-black text-lg">
                      🏆 Best deal: {result.rows.find((r) => r.isCheapest)?.store}
                    </p>
                    <p style={{ color: "#91d520" }} className="text-sm mt-0.5">
                      Total for your basket: <strong>{result.rows.find((r) => r.isCheapest)?.total}</strong>
                      {savings && <span> — Save ${savings} vs priciest option</span>}
                    </p>
                    <p className="text-white text-xs mt-1 opacity-70">{result.rows.find((r) => r.isCheapest)?.address} · {result.rows.find((r) => r.isCheapest)?.distance}</p>
                  </div>
                  <a href={result.rows.find((r) => r.isCheapest)?.mapsUrl} target="_blank" rel="noopener noreferrer"
                    className="px-5 py-2.5 rounded-xl font-bold text-sm flex-shrink-0"
                    style={{ background: "#FFB800", color: "#003d28" }}>
                    📍 Get Directions →
                  </a>
                </div>
              </div>
            )}

            {/* Price table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <h2 className="font-bold text-gray-800">Price Comparison Table</h2>
                <p className="text-xs text-gray-400 mt-0.5">Prices estimated by AI based on current market data. Verify in-store.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Store</th>
                      {result.items.map((item) => (
                        <th key={item} className="text-center px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">{item}</th>
                      ))}
                      <th className="text-center px-4 py-3 font-semibold text-gray-600">Total</th>
                      <th className="text-center px-4 py-3 font-semibold text-gray-600">Map</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.map((row) => (
                      <tr key={row.store}
                        className="border-t border-gray-50 transition-colors hover:bg-gray-50"
                        style={row.isCheapest ? { background: "#f0fdf4" } : {}}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {row.isCheapest && <span className="text-base">🏆</span>}
                            <div>
                              <div className="font-bold text-gray-900">{row.store}</div>
                              <div className="text-xs text-gray-400">{row.distance}</div>
                            </div>
                          </div>
                        </td>
                        {result.items.map((item) => {
                          const isCheapestForItem = result.cheapestPerItem[item] === row.store;
                          return (
                            <td key={item} className="px-4 py-3 text-center">
                              <span className={`font-semibold ${isCheapestForItem ? "text-green-700" : "text-gray-700"}`}>
                                {isCheapestForItem && "✓ "}
                                {row.items[item] || "N/A"}
                              </span>
                            </td>
                          );
                        })}
                        <td className="px-4 py-3 text-center">
                          <span className="font-black text-base" style={{ color: row.isCheapest ? "#003d28" : "#374151" }}>
                            {row.total}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <a href={row.mapsUrl} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors hover:opacity-80"
                            style={{ background: "#f0fdf4", color: "#003d28" }}>
                            📍 Go
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cheapest per item */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-bold text-gray-800 mb-4">Cheapest Place Per Item</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {result.items.map((item) => {
                  const cheapestStore = result.cheapestPerItem[item];
                  const row = result.rows.find((r) => r.store === cheapestStore);
                  return (
                    <div key={item} className="flex items-center justify-between rounded-xl p-3" style={{ background: "#f0fdf4" }}>
                      <div>
                        <div className="font-semibold text-gray-800 text-sm">{item}</div>
                        <div className="text-xs text-gray-500">{cheapestStore || "N/A"}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-sm" style={{ color: "#003d28" }}>{row?.items[item] || "N/A"}</div>
                        {row && <a href={row.mapsUrl} target="_blank" rel="noopener noreferrer" className="text-xs underline" style={{ color: "#003d28" }}>Directions</a>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI tips */}
            {result.tips.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                <h2 className="font-bold text-gray-800 mb-3">💡 Money-Saving Tips</h2>
                <ul className="space-y-2">
                  {result.tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-amber-900">
                      <span className="mt-0.5">•</span> {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Earn coins CTA */}
            <div className="rounded-2xl p-6 text-center border-2 border-dashed" style={{ borderColor: "#d1fae5" }}>
              <p className="font-bold text-gray-700 mb-2">Have flyers from these stores?</p>
              <p className="text-sm text-gray-500 mb-4">Upload them and earn 100 coins per page. Our AI extracts all the deals!</p>
              <Link href="/upload" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white text-sm" style={{ background: "#003d28" }}>
                📄 Upload Flyers → Earn Coins
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
