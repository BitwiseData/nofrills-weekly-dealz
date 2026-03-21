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

interface FileStatus {
  file: File;
  status: "pending" | "processing" | "done" | "error";
  error?: string;
  dealsFound?: number;
}

const CATEGORY_EMOJIS: Record<string, string> = {
  Produce: "🥦", Meat: "🥩", Seafood: "🦐", Pantry: "🫙",
  Dairy: "🧀", Frozen: "🧊", Bakery: "🍞", Beverage: "☕",
  Snacks: "🍿", Household: "🧴", Floral: "🌸", Other: "🛒",
};

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4 MB hard limit

export default function FlyerAnalyzer() {
  const [files, setFiles] = useState<File[]>([]);
  const [fileStatuses, setFileStatuses] = useState<FileStatus[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [isGeneratingFlyer, setIsGeneratingFlyer] = useState(false);
  const [generatedFlyer, setGeneratedFlyer] = useState<string | null>(null);
  const [showFlyerModal, setShowFlyerModal] = useState(false);
  const [storeName, setStoreName] = useState("Weekly Grocery Deals");
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = (newFiles: File[]) => {
    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name));
      return [...prev, ...newFiles.filter((f) => !existing.has(f.name))];
    });
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(Array.from(e.dataTransfer.files).filter((f) => f.type === "application/pdf"));
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(e.target.files || []).filter((f) => f.type === "application/pdf"));
  };

  const removeFile = (name: string) =>
    setFiles((prev) => prev.filter((f) => f.name !== name));

  const analyzeFlyers = async () => {
    if (!files.length) return;

    // Block oversized files immediately — don't even try the API
    const oversized = files.filter((f) => f.size > MAX_FILE_SIZE);
    if (oversized.length > 0) {
      setError(
        `⚠️ File too large: ${oversized.map((f) => `"${f.name}" (${(f.size / 1024 / 1024).toFixed(1)} MB)`).join(", ")}.\n\nMax is 4 MB per file. Please split multi-page PDFs into individual pages using ilovepdf.com or Adobe, then re-upload.`
      );
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    setGeneratedFlyer(null);
    setActiveCategory("All");

    const statuses: FileStatus[] = files.map((f) => ({ file: f, status: "pending" }));
    setFileStatuses(statuses);
    setProgress({ current: 0, total: files.length });

    const allDeals: ExtractedDeal[] = [];
    let successCount = 0;

    // Send ONE file at a time to stay under Vercel's 4.5 MB body limit
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      setFileStatuses((prev) =>
        prev.map((s, idx) => (idx === i ? { ...s, status: "processing" } : s))
      );
      setProgress({ current: i + 1, total: files.length });

      try {
        const formData = new FormData();
        formData.append("pdf", file);

        const res = await fetch("/api/analyze-flyers", { method: "POST", body: formData });

        // Safely parse response — handle non-JSON (413, 500, etc.)
        let data: { deals?: ExtractedDeal[]; error?: string } = {};
        try {
          data = await res.json();
        } catch {
          data = {
            error:
              res.status === 413
                ? `File too large for server (${(file.size / 1024 / 1024).toFixed(1)} MB). Split into smaller pages.`
                : `Server error ${res.status}: ${res.statusText}`,
          };
        }

        if (!res.ok || data.error) {
          setFileStatuses((prev) =>
            prev.map((s, idx) =>
              idx === i ? { ...s, status: "error", error: data.error || "Failed" } : s
            )
          );
        } else if (data.deals && data.deals.length > 0) {
          allDeals.push(...data.deals);
          successCount++;
          setFileStatuses((prev) =>
            prev.map((s, idx) =>
              idx === i ? { ...s, status: "done", dealsFound: data.deals!.length } : s
            )
          );
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Network error";
        setFileStatuses((prev) =>
          prev.map((s, idx) => (idx === i ? { ...s, status: "error", error: msg } : s))
        );
      }
    }

    if (allDeals.length > 0) {
      allDeals.sort((a, b) => (b.savingsPercent || 0) - (a.savingsPercent || 0));
      allDeals.slice(0, 5).forEach((d) => (d.isTopDeal = true));

      const byCategory = allDeals.reduce((acc, deal) => {
        if (!acc[deal.category]) acc[deal.category] = [];
        acc[deal.category].push(deal);
        return acc;
      }, {} as Record<string, ExtractedDeal[]>);

      setResult({
        deals: allDeals,
        totalDeals: allDeals.length,
        filesProcessed: successCount,
        byCategory,
        topDeals: allDeals.slice(0, 5),
      });
    } else {
      setError("No deals could be extracted. Check that your PDFs are valid grocery flyers under 4 MB.");
    }

    setIsAnalyzing(false);
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

  const categories = result ? ["All", ...Object.keys(result.byCategory).sort()] : [];

  return (
    <div className="min-h-screen" style={{ background: "#f5f9f5" }}>
      {/* Header */}
      <header style={{ background: "#003d28" }} className="shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📄</span>
            <div>
              <h1 className="text-white text-xl font-bold leading-tight">AI Flyer Analyzer</h1>
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

      <div style={{ background: "#fea319" }} className="py-3 text-center">
        <p className="text-white font-semibold text-sm">
          🤖 Powered by Claude AI · Each PDF analyzed separately for best results
        </p>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
          <h2 className="text-lg font-bold mb-1" style={{ color: "#003d28" }}>
            📤 Upload Grocery Flyers
          </h2>
          <p className="text-sm text-gray-500 mb-2">
            Upload store flyer PDFs — max <strong>4 MB per file</strong>. Each file is analyzed separately.
          </p>

          {/* Size warning tip */}
          <div className="text-xs text-amber-700 mb-4 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
            💡 <strong>Large PDFs?</strong> Split them into individual pages first at{" "}
            <a href="https://www.ilovepdf.com/split_pdf" target="_blank" rel="noopener noreferrer"
              className="underline font-semibold">ilovepdf.com/split_pdf</a>{" "}
            — then upload each page separately (they should be under 2 MB each).
          </div>

          {/* Store name */}
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 block mb-1">Store / Flyer Name</label>
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
            style={{ borderColor: isDragging ? "#003d28" : "#d1fae5", background: isDragging ? "#f0fdf4" : "#fafffe" }}
          >
            <div className="text-5xl mb-3">📂</div>
            <p className="font-semibold text-gray-700">
              Drop PDF flyers here or{" "}
              <span style={{ color: "#003d28" }} className="underline">click to browse</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">Multiple PDFs supported · Max 4 MB per file</p>
            <input ref={fileInputRef} type="file" accept="application/pdf" multiple className="hidden" onChange={onFileChange} />
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div className="mt-4 space-y-2">
              {files.map((f, i) => {
                const status = fileStatuses[i];
                const isOversized = f.size > MAX_FILE_SIZE;
                return (
                  <div
                    key={f.name}
                    className="flex items-center justify-between rounded-lg px-4 py-2.5 text-sm border"
                    style={{
                      background: isOversized ? "#fff7ed" : status?.status === "done" ? "#f0fdf4" : status?.status === "error" ? "#fef2f2" : "#f9fafb",
                      borderColor: isOversized ? "#fed7aa" : status?.status === "error" ? "#fecaca" : status?.status === "done" ? "#bbf7d0" : "#e5e7eb",
                    }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span>
                        {status?.status === "processing" ? "⏳" : status?.status === "done" ? "✅" : status?.status === "error" ? "❌" : isOversized ? "⚠️" : "📄"}
                      </span>
                      <span className="font-medium text-gray-700 truncate max-w-[200px]">{f.name}</span>
                      <span className={`text-xs ${isOversized ? "text-orange-500 font-bold" : "text-gray-400"}`}>
                        ({(f.size / 1024 / 1024).toFixed(1)} MB{isOversized ? " — TOO LARGE" : ""})
                      </span>
                      {status?.status === "done" && (
                        <span className="text-xs text-green-700 font-semibold">{status.dealsFound} deals found</span>
                      )}
                      {status?.error && (
                        <span className="text-xs text-red-500">{status.error}</span>
                      )}
                    </div>
                    {!isAnalyzing && (
                      <button onClick={(e) => { e.stopPropagation(); removeFile(f.name); }}
                        className="text-red-400 hover:text-red-600 font-bold text-xl leading-none ml-2 flex-shrink-0">×</button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Progress bar */}
          {isAnalyzing && progress.total > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Analyzing file {progress.current} of {progress.total}...</span>
                <span>{Math.round((progress.current / progress.total) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="h-2.5 rounded-full transition-all duration-500"
                  style={{ background: "#003d28", width: `${(progress.current / progress.total) * 100}%` }} />
              </div>
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
                Analyzing {progress.current}/{progress.total} with Claude AI...
              </span>
            ) : (
              `🔍 Analyze ${files.length} Flyer${files.length !== 1 ? "s" : ""}`
            )}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-700 text-sm whitespace-pre-line">
            ❌ {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <>
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: "Flyers Analyzed", value: result.filesProcessed, icon: "📄" },
                { label: "Deals Found", value: result.totalDeals, icon: "🏷️" },
                { label: "Categories", value: Object.keys(result.byCategory).length, icon: "📦" },
              ].map((stat) => (
                <div key={stat.label} className="bg-white rounded-xl p-4 text-center shadow-sm">
                  <div className="text-2xl mb-1">{stat.icon}</div>
                  <div className="text-3xl font-black" style={{ color: "#003d28" }}>{stat.value}</div>
                  <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Top Deals */}
            <div className="rounded-2xl p-5 mb-6 shadow-md" style={{ background: "linear-gradient(135deg, #003d28, #005a3c)" }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-black text-lg">🔥 Best Deals Across All Flyers</h2>
                <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: "#91d520", color: "#003d28" }}>
                  Top {result.topDeals.length} by Savings
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {result.topDeals.map((deal, i) => (
                  <div key={i} className="bg-white rounded-xl p-3 text-center relative overflow-hidden">
                    {deal.savingsPercent > 0 && (
                      <div className="absolute top-0 right-0 text-white text-xs font-bold px-2 py-0.5 rounded-bl-lg" style={{ background: "#E31837" }}>
                        -{deal.savingsPercent}%
                      </div>
                    )}
                    <div className="text-3xl mb-1">{deal.emoji}</div>
                    <div className="text-lg font-black" style={{ color: "#E31837" }}>{deal.price}</div>
                    <div className="text-xs font-semibold text-gray-800 leading-tight mt-1">{deal.name}</div>
                    {deal.size && <div className="text-xs text-gray-400 mt-0.5">{deal.size}</div>}
                  </div>
                ))}
              </div>
            </div>

            {/* Generate AI Flyer */}
            <div className="bg-white rounded-2xl shadow-md p-5 mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-gray-800">✨ Generate AI Promotional Flyer</h3>
                  <p className="text-sm text-gray-500 mt-0.5">Claude designs a printable flyer with the best deals</p>
                </div>
                <button
                  onClick={generateFlyer}
                  disabled={isGeneratingFlyer}
                  className="px-6 py-3 rounded-xl font-bold text-white text-sm whitespace-nowrap transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                  style={{ background: isGeneratingFlyer ? "#9ca3af" : "linear-gradient(135deg, #fea319, #f97316)" }}
                >
                  {isGeneratingFlyer ? <><span className="animate-spin">⏳</span> Generating...</> : <>🎨 Generate AI Flyer</>}
                </button>
              </div>
            </div>

            {/* Category filter */}
            <div className="flex gap-2 flex-wrap mb-4">
              {categories.map((cat) => (
                <button key={cat} onClick={() => setActiveCategory(cat)}
                  className="px-3 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer flex items-center gap-1"
                  style={activeCategory === cat ? { background: "#003d28", color: "white" } : { background: "white", color: "#003d28", border: "1px solid #003d28" }}
                >
                  {cat !== "All" && CATEGORY_EMOJIS[cat]} {cat}
                  {cat !== "All" && result.byCategory[cat] && (
                    <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full"
                      style={activeCategory === cat ? { background: "#91d520", color: "#003d28" } : { background: "#e5e7eb", color: "#374151" }}>
                      {result.byCategory[cat].length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <p className="text-sm text-gray-500 mb-4">
              Showing <strong>{filteredDeals.length}</strong> deal{filteredDeals.length !== 1 ? "s" : ""}
              {activeCategory !== "All" ? ` in ${activeCategory}` : ""}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredDeals.map((deal, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  {deal.badge && (
                    <div className="text-white text-xs font-bold text-center py-1 px-2"
                      style={{ background: deal.badge.includes("App") ? "#7c3aed" : "#E31837" }}>
                      {deal.badge}
                    </div>
                  )}
                  {deal.isTopDeal && !deal.badge && (
                    <div className="text-white text-xs font-bold text-center py-1" style={{ background: "#E31837" }}>🔥 TOP DEAL</div>
                  )}
                  <div className="p-3 text-center">
                    <div className="text-4xl mb-2">{deal.emoji}</div>
                    <div className="text-xl font-black mb-1" style={{ color: "#E31837" }}>{deal.price}</div>
                    {deal.savingsPercent > 0 && (
                      <div className="text-xs font-bold mb-1" style={{ color: "#003d28" }}>SAVE {deal.savingsPercent}%</div>
                    )}
                    <div className="text-xs font-semibold text-gray-800 leading-tight">{deal.name}</div>
                    {deal.size && <div className="text-xs text-gray-400 mt-1">{deal.size}</div>}
                    <div className="text-xs mt-2 px-2 py-0.5 rounded-full inline-block" style={{ background: "#f0fdf4", color: "#003d28" }}>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 rounded-t-2xl" style={{ background: "#003d28" }}>
              <h2 className="text-white font-bold text-lg">✨ AI-Generated Promotional Flyer</h2>
              <div className="flex items-center gap-3">
                <button onClick={downloadFlyer} className="text-sm font-bold px-4 py-1.5 rounded-full"
                  style={{ background: "#91d520", color: "#003d28" }}>⬇️ Download HTML</button>
                <button onClick={() => setShowFlyerModal(false)} className="text-white text-2xl leading-none hover:opacity-70">×</button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <iframe srcDoc={generatedFlyer} className="w-full rounded-xl border border-gray-200"
                style={{ height: "70vh", minHeight: "500px" }} title="Generated Flyer" />
            </div>
          </div>
        </div>
      )}

      <footer style={{ background: "#003d28" }} className="mt-12 py-6 text-center">
        <p className="text-sm" style={{ color: "#91d520" }}>Fair Fare · AI Flyer Analyzer</p>
        <p className="text-xs text-gray-400 mt-1">Prices extracted from flyers. Subject to change. While supplies last.</p>
      </footer>
    </div>
  );
}
