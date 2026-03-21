"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { createClient } from "@supabase/supabase-js";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface UploadRecord {
  id: string;
  fileName: string;
  uploadedAt: string;
  pointsEarned: number;
  pages: number;
  storeName: string;
}

export interface PurchaseRecord {
  id: string;
  itemName: string;
  coinSpent: number;
  purchasedAt: string;
  redeemCode: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  coins: number;
  uploads: UploadRecord[];
  purchases: PurchaseRecord[];
  joinedAt: string;
  referralCode: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  addCoins: (coins: number) => void;
  addUpload: (record: UploadRecord) => void;
  spendCoins: (coins: number, itemName: string) => string | false;
  isLoading: boolean;
  getAccessToken: () => Promise<string | null>;
}

// ─── Supabase client (lazy, only when env vars available) ──────────────────

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// ─── localStorage fallback keys (used when Supabase not configured) ────────

const ACCOUNTS_KEY = "fairfare_accounts";
const USER_KEY = "fairfare_user";

// ─── Context ───────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Supabase helpers ─────────────────────────────────────────────────────

  async function fetchProfile(userId: string, supabase: ReturnType<typeof createClient>) {
    const { data } = await supabase
      .from("profiles")
      .select("display_name, is_admin, coins, created_at")
      .eq("id", userId)
      .single();
    return data;
  }

  async function buildUser(supabaseUser: { id: string; email?: string; created_at?: string; user_metadata?: Record<string, string> }, supabase: ReturnType<typeof createClient>): Promise<User> {
    const profile = await fetchProfile(supabaseUser.id, supabase);
    return {
      id: supabaseUser.id,
      name: profile?.display_name || supabaseUser.user_metadata?.name || supabaseUser.email?.split("@")[0] || "User",
      email: supabaseUser.email || "",
      isAdmin: profile?.is_admin ?? false,
      coins: profile?.coins ?? 500,
      uploads: [],
      purchases: [],
      joinedAt: supabaseUser.created_at || new Date().toISOString(),
      referralCode: supabaseUser.id.slice(-6).toUpperCase(),
    };
  }

  // ── Initialize auth ───────────────────────────────────────────────────────

  useEffect(() => {
    const supabase = getSupabaseClient();

    if (!supabase) {
      // localStorage fallback
      try {
        const stored = localStorage.getItem(USER_KEY);
        if (stored) setUser({ ...JSON.parse(stored), isAdmin: false });
      } catch {}
      setIsLoading(false);
      return;
    }

    // Check existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const u = await buildUser(session.user, supabase);
        setUser(u);
      }
      setIsLoading(false);
    });

    // Listen for auth state changes (login / logout / token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const u = await buildUser(session.user, supabase);
        setUser(u);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Auth methods ──────────────────────────────────────────────────────────

  const login = async (email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
    const supabase = getSupabaseClient();

    if (!supabase) {
      // localStorage fallback
      const accounts = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || "{}");
      const account = accounts[email];
      if (account && account.password === password) {
        const u = { ...account.user, isAdmin: false };
        setUser(u);
        localStorage.setItem(USER_KEY, JSON.stringify(u));
        return { ok: true };
      }
      return { ok: false, error: "Invalid email or password." };
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  };

  const signup = async (name: string, email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
    const supabase = getSupabaseClient();

    if (!supabase) {
      // localStorage fallback
      const accounts = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || "{}");
      if (accounts[email]) return { ok: false, error: "An account with this email already exists." };
      const newUser: User = {
        id: Date.now().toString(),
        name,
        email,
        isAdmin: false,
        coins: 500,
        uploads: [],
        purchases: [],
        joinedAt: new Date().toISOString(),
        referralCode: Math.random().toString(36).slice(2, 8).toUpperCase(),
      };
      accounts[email] = { user: newUser, password };
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
      setUser(newUser);
      localStorage.setItem(USER_KEY, JSON.stringify(newUser));
      return { ok: true };
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    if (error) return { ok: false, error: error.message };
    // onAuthStateChange will set user automatically after email confirm (or immediately if email confirm disabled)
    return { ok: true };
  };

  const logout = async () => {
    const supabase = getSupabaseClient();
    if (supabase) await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem(USER_KEY);
  };

  const getAccessToken = async (): Promise<string | null> => {
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  };

  // ── Coin / upload helpers ─────────────────────────────────────────────────

  async function syncCoins(userId: string, newCoins: number) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    await supabase.from("profiles").update({ coins: newCoins }).eq("id", userId);
  }

  const addCoins = (coins: number) => {
    if (!user) return;
    const updated = { ...user, coins: user.coins + coins };
    setUser(updated);
    syncCoins(updated.id, updated.coins);
  };

  const addUpload = (record: UploadRecord) => {
    if (!user) return;
    const updated = {
      ...user,
      coins: user.coins + record.pointsEarned,
      uploads: [record, ...user.uploads],
    };
    setUser(updated);
    syncCoins(updated.id, updated.coins);
  };

  const spendCoins = (coins: number, itemName: string): string | false => {
    if (!user || user.coins < coins) return false;
    const redeemCode = "FC-" + Math.random().toString(36).slice(2, 8).toUpperCase();
    const purchase: PurchaseRecord = {
      id: Date.now().toString(),
      itemName,
      coinSpent: coins,
      purchasedAt: new Date().toISOString(),
      redeemCode,
    };
    const updated = {
      ...user,
      coins: user.coins - coins,
      purchases: [purchase, ...user.purchases],
    };
    setUser(updated);
    syncCoins(updated.id, updated.coins);
    return redeemCode;
  };

  return (
    <AuthContext.Provider
      value={{ user, login, signup, logout, addCoins, addUpload, spendCoins, isLoading, getAccessToken }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
