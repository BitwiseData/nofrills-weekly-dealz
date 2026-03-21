"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import type { ExtractedDeal } from "../api/analyze-flyers/route";

interface AnalyzeResult {
  deals: ExtractedDeal[];
  totalDeals: number;
  filesProcessed: number;
  byCategory: Record<string, ExtractedDeal[]>;
  topDeals: ExtractedDeal[];
}

const CATEGORY_EMOJIS: Record<string, string> = {
  Produce: "🥦",
  Meat: "🥩",
  Seafood: "🦐",
  Pantry: "🫙",
  Dairy: "🧀",
  Frozen: "🧊",
  Bakery: "🍞",
  Beverage: "☕",
  Snacks: "🍿",
  Household: "🧴",
  Floral: "🌸",
  Other: "🛒",
};

export default function FlyerAnalyzer() {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [isGeneratingFlyer, setIsGeneratingFlyer] = useState(false);
  const [generatedFlyer, setGeneratedFlyer] = useState<string | null>(null);
  const [showFlyerModal, setShowFlyerModal] = useState(false);
  const [storeName, setStoreName] = useState("Weekly Grocery Deals");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const dropped = Array.from(e.dataTransfer.files).filter((f) =>
        f.type === "application/pdf"
      );
      setFiles((prev) => {
        const existing = new Set(prev.map((f) => f.name));
        return [...prev, ...dropped.filter((f) => !existing.has(f.name))];
      });
    },
    []
  );

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []).filter(
      (f) => f.type === "application/pdf"
    );
    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name));
      return [...prev, ...selected.filter((f) => !existing.has(f.name))];
    });
  };

  const removeFile = (name: string) =>
    setFiles((prev) => prev.filter((f) => f.name !== name));

  const analyzeFlyers = async () => {
    if (!files.length) return;
    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    setGeneratedFlyer(null);
    setActiveCategory("All");

    try {
      const formData = new FormData();
      files.forEach((f) => formData.append("pdfs", f));
      const res = await fetch("/api/analyze-flyers", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateFlyer = async () => {
    if (!result) return;
    setIsGeneratingFlyer(true);
    try {
      const res = await fetch("/api/generate-flyer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deals: result.topDeals.concat(result.deals.slice(5, 12)), storeName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setGeneratedFlyer(data.html);
      setShowFlyerModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Flyer generation failed");
    } finally {
      setIsGeneratingFlyer(false);
    }
  };

  const downloadFlyer = () => {
    if (!generatedFlyer) return;
    const blob = new Blob([generatedFlyer], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${storeName.replace(/\s+/g, "-").toLowerCase()}-flyer.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredDeals = result
    ? activeCategory === "All"
      ? result.deals
      : result.deals.filter((d) => d.category === activeCategory)
    : [];

  const categories = result
    ? ["All", ...Object.keys(result.byCategory).sort()]
    : [];

  return (
    <div className="min-h-screen" style={{ background: "#f5f9f5" }}>
      {/* Header */}
      <header style={{ background: "#003d28" }} className="shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📄</span>
            <div>
              <h1 className="text-white text-xl font-bold leading-tight">
                AI Flyer Analyzer
              </h1>
              <p className="text-xs" style={{ color: "#91d520" }}>
                Upload flyer PDFs → Extract deals → Generate AI Flyer
              </p>
            </div>
          </div>
          <Link
            href="/"
            style={{ background: "#91d520", color: "#003d28" }}
            className="flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm hover:opacity-90 transition-opacity shadow"
          >
            ← Back to Deals
          </Link>
        </div>
      </header>

      {/* Yellow banner */}
      <div style={{ background: "#fea319" }} className="py-3 text-center">
        <p className="text-white font-semibold text-sm">
          🤖 Powered by Claude AI · Upload multiple store flyers to compare &amp; find the best deals
        </p>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Upload Section */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
          <h2 className="text-lg font-bold mb-1" style={{ color: "#003d28" }}>
            📤 Upload Grocery Flyers
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Drag &amp; drop multiple store flyer PDFs. Claude AI will read every page and extract all deals.
          </p>

          {/* Store name input */}
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Store / Flyer Name (for generated flyer)
            </label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full max-w-sm focus:outline-none focus:ring-2 focus:ring-green-700"
              placeholder="e.g. No Frills Week 10 Deals"
            />
          </div>

          {/* Drop zone */}
          <div
            onDrop={onDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all"
            style={{
              borderColor: isDragging ? "#003d28" : "#d1fae5",
              background: isDragging ? "#f0fdf4" : "#fafffe",
            }}
          >
            <div className="text-5xl mb-3">📂</div>
            <p className="font-semibold text-gray-700">
              Drop PDF flyers here or{" "}
              <span style={{ color: "#003d28" }} className="underline">
                click to browse
              </span>
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Supports multiple PDFs · Each page is analyzed
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              multiple
              className="hidden"
              onChange={onFileChange}
            />
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div className="mt-4 space-y-2">
              {files.map((f) => (
                <div
                  key={f.name}
                  className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-red-500">📄</span>
                    <span className="font-medium text-gray-700 truncate max-w-xs">
                      {f.name}
                    </span>
                    <span className="text-gray-400">
                      ({(f.size / 1024 / 1024).toFixed(1)} MB)
                    </span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeFile(f.name); }}
                    className="text-red-400 hover:text-red-600 font-bold text-lg leading-none"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Analyze button */}
          <button
            onClick={analyzeFlyers}
            disabled={!files.length || isAnalyzing}
            className="mt-5 w-full py-3 rounded-xl font-bold text-white text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: files.length && !isAnalyzing ? "#003d28" : "#9ca3af" }}
          >
            {isAnalyzing ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⏳</span>
                Analyzing {files.length} flyer{files.length > 1 ? "s" : ""} with Claude AI...
              </span>
            ) : (
              `🔍 Analyze ${files.length} Flyer${files.length !== 1 ? "s" : ""}`
            )}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-700 text-sm">
            ❌ {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <>
            {/* Stats bar */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: "Flyers Analyzed", value: result.filesProcessed, icon: "📄" },
                { label: "Deals Found", value: result.totalDeals, icon: "🏷️" },
                { label: "Categories", value: Object.keys(result.byCategory).length, icon: "📦" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white rounded-xl p-4 text-center shadow-sm"
                >
                  <div className="text-2xl mb-1">{stat.icon}</div>
                  <div
                    className="text-3xl font-black"
                    style={{ color: "#003d28" }}
                  >
                    {stat.value}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* 🔥 Top Deals */}
            <div
              className="rounded-2xl p-5 mb-6 shadow-md"
              style={{ background: "linear-gradient(135deg, #003d28, #005a3c)" }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-black text-lg">
                  🔥 Best Deals Across All Flyers
                </h2>
                <span
                  className="text-xs font-bold px-3 py-1 rounded-full"
                  style={{ background: "#91d520", color: "#003d28" }}
                >
                  Top {result.topDeals.length} by Savings
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {result.topDeals.map((deal, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-xl p-3 text-center relative overflow-hidden"
                  >
                    {deal.savingsPercent > 0 && (
                      <div
                        className="absolute top-0 right-0 text-white text-xs font-bold px-2 py-0.5 rounded-bl-lg"
                        style={{ background: "#E31837" }}
                      >
                        -{deal.savingsPercent}%
                      </div>
                    )}
                    <div className="text-3xl mb-1">{deal.emoji}</div>
                    <div
                      className="text-lg font-black"
                      style={{ color: "#E31837" }}
                    >
                      {deal.price}
                    </div>
                    <div className="text-xs font-semibold text-gray-800 leading-tight mt-1">
                      {deal.name}
                    </div>
                    {deal.size && (
                      <div className="text-xs text-gray-400 mt-0.5">{deal.size}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Generate AI Flyer button */}
            <div className="bg-white rounded-2xl shadow-md p-5 mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-gray-800">
                    ✨ Generate AI Promotional Flyer
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Claude will design a beautiful printable flyer with the best deals
                  </p>
                </div>
                <button
                  onClick={generateFlyer}
                  disabled={isGeneratingFlyer}
                  className="px-6 py-3 rounded-xl font-bold text-white text-sm whitespace-nowrap transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                  style={{
                    background: isGeneratingFlyer ? "#9ca3af" : "linear-gradient(135deg, #fea319, #f97316)",
                  }}
                >
                  {isGeneratingFlyer ? (
                    <>
                      <span className="animate-spin">⏳</span> Generating Flyer...
                    </>
                  ) : (
                    <>🎨 Generate AI Flyer</>
                  )}
                </button>
              </div>
            </div>

            {/* Category filter */}
            <div className="flex gap-2 flex-wrap mb-4">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className="px-3 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer flex items-center gap-1"
                  style={
                    activeCategory === cat
                      ? { background: "#003d28", color: "white" }
                      : { background: "white", color: "#003d28", border: "1px solid #003d28" }
                  }
                >
                  {cat !== "All" && CATEGORY_EMOJIS[cat]}
                  {cat}
                  {cat !== "All" && result.byCategory[cat] && (
                    <span
                      className="ml-1 text-xs px-1.5 py-0.5 rounded-full"
                      style={
                        activeCategory === cat
                          ? { background: "#91d520", color: "#003d28" }
                          : { background: "#e5e7eb", color: "#374151" }
                      }
                    >
                      {result.byCategory[cat].length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Deals grid */}
            <p className="text-sm text-gray-500 mb-4">
              Showing <strong>{filteredDeals.length}</strong> deal{filteredDeals.length !== 1 ? "s" : ""}
              {activeCategory !== "All" ? ` in ${activeCategory}` : ""}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredDeals.map((deal, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Badge */}
                  {deal.badge && (
                    <div
                      className="text-white text-xs font-bold text-center py-1 px-2"
                      style={{
                        background: deal.badge.includes("DROP")
                          ? "#E31837"
                          : deal.badge.includes("App")
                          ? "#7c3aed"
                          : "#E31837",
                      }}
                    >
                      {deal.badge}
                    </div>
                  )}
                  {deal.isTopDeal && !deal.badge && (
                    <div
                      className="text-white text-xs font-bold text-center py-1"
                      style={{ background: "#E31837" }}
                    >
                      🔥 TOP DEAL
                    </div>
                  )}
                  <div className="p-3 text-center">
                    <div className="text-4xl mb-2">{deal.emoji}</div>
                    <div
                      className="text-xl font-black mb-1"
                      style={{ color: "#E31837" }}
                    >
                      {deal.price}
                    </div>
                    {deal.savingsPercent > 0 && (
                      <div
                        className="text-xs font-bold mb-1"
                        style={{ color: "#003d28" }}
                      >
                        SAVE {deal.savingsPercent}%
                      </div>
                    )}
                    <div className="text-xs font-semibold text-gray-800 leading-tight">
                      {deal.name}
                    </div>
                    {deal.size && (
                      <div className="text-xs text-gray-400 mt-1">{deal.size}</div>
                    )}
                    <div
                      className="text-xs mt-2 px-2 py-0.5 rounded-full inline-block"
                      style={{ background: "#f0fdf4", color: "#003d28" }}
                    >
                      {CATEGORY_EMOJIS[deal.category] || "🛒"} {deal.category}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* AI Flyer Modal */}
      {showFlyerModal && generatedFlyer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)" }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div
              className="flex items-center justify-between px-5 py-4 rounded-t-2xl"
              style={{ background: "#003d28" }}
            >
              <h2 className="text-white font-bold text-lg">
                ✨ AI-Generated Promotional Flyer
              </h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={downloadFlyer}
                  className="text-sm font-bold px-4 py-1.5 rounded-full"
                  style={{ background: "#91d520", color: "#003d28" }}
                >
                  ⬇️ Download HTML
                </button>
                <button
                  onClick={() => setShowFlyerModal(false)}
                  className="text-white text-2xl leading-none hover:opacity-70"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <iframe
                srcDoc={generatedFlyer}
                className="w-full rounded-xl border border-gray-200"
                style={{ height: "70vh", minHeight: "500px" }}
                title="Generated Flyer"
              />
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{ background: "#003d28" }} className="mt-12 py-6 text-center">
        <p className="text-sm" style={{ color: "#91d520" }}>
          No Frills Dealz · AI Flyer Analyzer
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Prices extracted from flyers. Subject to change. While supplies last.
        </p>
      </footer>
    </div>
  );
}
