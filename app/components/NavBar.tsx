"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";

export default function NavBar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { href: "/deals",         label: "Deals",        icon: "🏷️" },
    { href: "/flyer-analyzer",label: "Flyer AI",     icon: "📄" },
    { href: "/smart-basket",  label: "Price Compare",icon: "🛒" },
    { href: "/shop",          label: "Shop",         icon: "🛍️" },
    { href: "/upload",        label: "Upload",       icon: "⬆️" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg" style={{ background: "#003d28" }}>
            🪙
          </div>
          <span className="font-black text-xl tracking-tight" style={{ color: "#003d28" }}>
            Fair <span style={{ color: "#FFB800" }}>Fare</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              style={
                pathname === link.href
                  ? { background: "#f0fdf4", color: "#003d28" }
                  : { color: "#374151" }
              }
            >
              <span>{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              {/* Coins badge */}
              <Link
                href="/dashboard"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold border-2 transition-colors"
                style={{ borderColor: "#FFB800", color: "#003d28", background: "#fffbeb" }}
              >
                🪙 {user.coins.toLocaleString()} coins
              </Link>
              {/* Avatar / name */}
              <Link
                href="/dashboard"
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold text-white"
                style={{ background: "#003d28" }}
              >
                <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-xs font-black" style={{ color: "#003d28" }}>
                  {user.name[0].toUpperCase()}
                </span>
                {user.name.split(" ")[0]}
              </Link>
              <button
                onClick={logout}
                className="hidden sm:block text-xs text-gray-400 hover:text-red-500 transition-colors px-2"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="hidden sm:block text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-2">
                Log in
              </Link>
              <Link
                href="/signup"
                className="text-sm font-bold px-4 py-2 rounded-full text-white transition-opacity hover:opacity-90"
                style={{ background: "#003d28" }}
              >
                Get Started Free
              </Link>
            </>
          )}

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-500"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium"
              style={pathname === link.href ? { background: "#f0fdf4", color: "#003d28" } : { color: "#374151" }}
            >
              {link.icon} {link.label}
            </Link>
          ))}
          <div className="border-t border-gray-100 pt-2 mt-2">
            {user ? (
              <>
                <Link href="/dashboard" onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold" style={{ color: "#003d28" }}>
                  🪙 {user.coins.toLocaleString()} coins · {user.name}
                </Link>
                <button onClick={() => { logout(); setMenuOpen(false); }}
                  className="w-full text-left px-3 py-2.5 text-sm text-red-500">Sign out</button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2.5 text-sm font-medium text-gray-600">Log in</Link>
                <Link href="/signup" onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2.5 text-sm font-bold rounded-lg text-white text-center mt-1"
                  style={{ background: "#003d28" }}>Get Started Free</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
