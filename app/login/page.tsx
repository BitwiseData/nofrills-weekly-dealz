"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import NavBar from "@/app/components/NavBar";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { ok, error: errMsg } = await login(form.email, form.password);
    if (ok) {
      router.push("/dashboard");
    } else {
      setError(errMsg || "Invalid email or password. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4" style={{ background: "#f0fdf4" }}>
              🔑
            </div>
            <h1 className="text-2xl font-black text-gray-900">Welcome back</h1>
            <p className="text-gray-500 text-sm mt-1">Log in to access your coins</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm mb-5">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
              <input type="email" required value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2"
                placeholder="jane@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input type="password" required value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2"
                placeholder="Your password" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-white text-sm transition-opacity hover:opacity-90 disabled:opacity-60 mt-2"
              style={{ background: "#003d28" }}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-semibold" style={{ color: "#003d28" }}>
              Sign up free — get 500 🪙
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
