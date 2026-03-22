"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import NavBar from "@/app/components/NavBar";
import { useAuth } from "@/app/context/AuthContext";
import type { ExtractedDeal } from "@/app/api/analyze-flyers/route";

const COINS_PER_PAGE = 100;
const MAX_FILE_SIZE = 4 * 1024 * 1024;

interface UploadFile {
  file: File;
  status: "pending" | "uploading" | "done" | "error";
  coinsEarned?: number;
  error?: string;
  deals?: number;
}

export default function UploadPage() {
  const { user, addUpload, isLoading } = useAuth();
  const router = useRouter();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [storeName, setStoreName] = useState("");
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [totalEarned, setTotalEarned] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
  }, [user, isLoading, router]);

  const addFiles = (newFiles: File[]) => {
    const valid = newFiles.filter((f) => f.type === "application/pdf");
    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.file.name));
      return [...prev, ...valid.filter((f) => !existing.has(f.name)).map((f) => ({ file: f, status: "pending" as const }))];
    });
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  }, []);

  const estimatePages = (sizeBytes: number) => Math.max(1, Math.round(sizeBytes / (300 * 1024)));

  const processUploads = async () => {
    if (!files.length || !user) return;

    const oversized = files.filter((f) => f.file.size > MAX_FILE_SIZE);
    if (oversized.length) {
      setFiles((prev) =>
        prev.map((f) =>
          f.file.size > MAX_FILE_SIZE ? { ...f, status: "error", error: "File too large (max 4 MB)" } : f
        )
      );
      return;
    }

    setIsProcessing(true);
    setDone(false);
    setTotalEarned(0);
    setProgress({ current: 0, total: files.length });
    let earned = 0;

    for (let i = 0; i < files.length; i++) {
      const item = files[i];
      setFiles((prev) => prev.map((f, idx) => (idx === i ? { ...f, status: "uploading" } : f)));
      setProgress({ current: i + 1, total: files.length });

      try {
        const formData = new FormData();
        formData.append("pdf", item.file);

        const res = await fetch("/api/analyze-flyers", { method: "POST", body: formData });
        let data: { deals?: ExtractedDeal[]; error?: string } = {};
        try { data = await res.json(); } catch { data = { error: `Error ${res.status}` }; }

        const pages = estimatePages(item.file.size);
        const coins = pages * COINS_PER_PAGE;

        if (!res.ok || data.error) {
          // Still award coins even if AI extraction fails — the upload happened
          setFiles((prev) => prev.map((f, idx) => idx === i ? { ...f, status: "done", coinsEarned: coins, deals: 0 } : f));
        } else {
          setFiles((prev) => prev.map((f, idx) => idx === i ? { ...f, status: "done", coinsEarned: coins, deals: data.deals?.length || 0 } : f));
        }

        earned += coins;
        addUpload({
          id: Date.now().toString() + i,
          fileName: item.file.name,
          storeName: storeName || item.file.name.replace(/\.pdf$/i, ""),
          uploadedAt: new Date().toISOString(),
          pointsEarned: coins,
          pages,
        });
      } catch {
        setFiles((prev) => prev.map((f, idx) => idx === i ? { ...f, status: "error", error: "Network error" } : f));
      }
    }

    setTotalEarned(earned);
    setDone(true);
    setIsProcessing(false);
  };

  if (isLoading || !user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <main className="max-w-2xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">⬆️</div>
          <h1 className="text-3xl font-black text-gray-900">Upload Flyers, Earn Coins</h1>
          <p className="text-gray-500 mt-2">Get <strong>{COINS_PER_PAGE} coins per page</strong> for every grocery flyer you upload.</p>
          <div className="inline-flex items-center gap-2 mt-3 bg-amber-50 border border-amber-200 rounded-full px-4 py-1.5 text-sm font-semibold" style={{ color: "#92400e" }}>
            🪙 Your balance: {user.coins.toLocaleString()} coins
          </div>
        </div>

        {/* Earnings info */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Per page", value: `${COINS_PER_PAGE} 🪙` },
            { label: "5-page flyer", value: `${5 * COINS_PER_PAGE} 🪙` },
            { label: "10-page flyer", value: `${10 * COINS_PER_PAGE} 🪙` },
          ].map((e) => (
            <div key={e.label} className="bg-white rounded-xl p-3 text-center border border-gray-100">
              <div className="font-black text-lg" style={{ color: "#FFB800" }}>{e.value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{e.label}</div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          {/* Store name */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1">Store name (optional)</label>
            <input type="text" value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
              placeholder="e.g. Food Basics, Walmart, Loblaws..." />
          </div>

          {/* Tip */}
          <div className="text-xs text-amber-700 mb-4 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
            💡 Max <strong>4 MB per PDF</strong>. For large multi-page flyers, split them first at{" "}
            <a href="https://www.ilovepdf.com/split_pdf" target="_blank" rel="noopener noreferrer" className="underline font-semibold">ilovepdf.com</a> — you&apos;ll earn more coins per page!
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
            <div className="text-4xl mb-3">📂</div>
            <p className="font-semibold text-gray-700">
              Drop PDFs here or <span style={{ color: "#003d28" }} className="underline">browse</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">Multiple files · Max 4 MB each</p>
            <input ref={fileInputRef} type="file" accept="application/pdf" multiple className="hidden" onChange={(e) => addFiles(Array.from(e.target.files || []))} />
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div className="mt-4 space-y-2">
              {files.map((f, i) => {
                const pages = estimatePages(f.file.size);
                const coins = pages * COINS_PER_PAGE;
                const isOversized = f.file.size > MAX_FILE_SIZE;
                return (
                  <div key={f.file.name} className="flex items-center justify-between rounded-xl px-4 py-3 border"
                    style={{
                      background: f.status === "done" ? "#f0fdf4" : f.status === "error" ? "#fef2f2" : isOversized ? "#fff7ed" : "#f9fafb",
                      borderColor: f.status === "done" ? "#bbf7d0" : f.status === "error" ? "#fecaca" : isOversized ? "#fed7aa" : "#e5e7eb",
                    }}>
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xl">
                        {f.status === "uploading" ? "⏳" : f.status === "done" ? "✅" : f.status === "error" ? "❌" : isOversized ? "⚠️" : "📄"}
                      </span>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-gray-800 truncate">{f.file.name}</div>
                        <div className="text-xs text-gray-400">
                          {(f.file.size / 1024 / 1024).toFixed(1)} MB · ~{pages} page{pages !== 1 ? "s" : ""}
                          {f.status === "done" && f.deals !== undefined && ` · ${f.deals} deals found`}
                          {f.error && ` · ${f.error}`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {f.status === "done" ? (
                        <span className="font-black text-sm" style={{ color: "#FFB800" }}>+{f.coinsEarned} 🪙</span>
                      ) : f.status !== "uploading" && (
                        <span className="text-xs text-gray-400">~{coins} 🪙</span>
                      )}
                      {!isProcessing && f.status !== "done" && (
                        <button onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                          className="text-red-400 hover:text-red-600 text-lg font-bold">×</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Progress */}
          {isProcessing && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Uploading {progress.current}/{progress.total}...</span>
                <span>{Math.round((progress.current / progress.total) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="h-2 rounded-full transition-all" style={{ background: "#FFB800", width: `${(progress.current / progress.total) * 100}%` }} />
              </div>
            </div>
          )}

          {/* Success state */}
          {done && totalEarned > 0 && (
            <div className="mt-5 rounded-xl p-5 text-center" style={{ background: "#f0fdf4", border: "2px solid #bbf7d0" }}>
              <div className="text-4xl mb-2">🎉</div>
              <p className="font-black text-xl" style={{ color: "#003d28" }}>+{totalEarned.toLocaleString()} coins earned!</p>
              <p className="text-sm text-gray-500 mt-1">Your new balance: <strong>{user.coins.toLocaleString()} 🪙</strong></p>
              <div className="flex gap-3 justify-center mt-4">
                <Link href="/shop" className="px-5 py-2 rounded-xl font-bold text-white text-sm" style={{ background: "#003d28" }}>
                  🛍️ Spend Coins
                </Link>
                <button onClick={() => { setFiles([]); setDone(false); }}
                  className="px-5 py-2 rounded-xl font-bold text-sm border-2 text-gray-700" style={{ borderColor: "#003d28" }}>
                  Upload More
                </button>
              </div>
            </div>
          )}

          <button
            onClick={processUploads}
            disabled={!files.length || isProcessing}
            className="mt-5 w-full py-3 rounded-xl font-bold text-white text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: files.length && !isProcessing ? "#003d28" : "#9ca3af" }}
          >
            {isProcessing ? `⏳ Uploading ${progress.current}/${progress.total}...` : `⬆️ Upload ${files.length} Flyer${files.length !== 1 ? "s" : ""} & Earn Coins`}
          </button>
        </div>
      </main>
    </div>
  );
}
