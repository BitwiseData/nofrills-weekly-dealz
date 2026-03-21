"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

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
  coins: number;
  uploads: UploadRecord[];
  purchases: PurchaseRecord[];
  joinedAt: string;
  referralCode: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  addCoins: (coins: number) => void;
  addUpload: (record: UploadRecord) => void;
  spendCoins: (coins: number, itemName: string) => string | false; // returns redeem code or false
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const ACCOUNTS_KEY = "fairfare_accounts";
const USER_KEY = "fairfare_user";

function saveToAccounts(user: User, password?: string) {
  const accounts = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || "{}");
  if (!accounts[user.email]) accounts[user.email] = {};
  accounts[user.email].user = user;
  if (password) accounts[user.email].password = password;
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(USER_KEY);
      if (stored) setUser(JSON.parse(stored));
    } catch {}
    setIsLoading(false);
  }, []);

  const persist = (u: User) => {
    setUser(u);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    saveToAccounts(u);
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    const accounts = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || "{}");
    const account = accounts[email];
    if (account && account.password === password) {
      persist(account.user);
      return true;
    }
    return false;
  };

  const signup = async (name: string, email: string, password: string): Promise<boolean> => {
    const accounts = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || "{}");
    if (accounts[email]) return false;
    const newUser: User = {
      id: Date.now().toString(),
      name,
      email,
      coins: 500, // welcome bonus
      uploads: [],
      purchases: [],
      joinedAt: new Date().toISOString(),
      referralCode: Math.random().toString(36).slice(2, 8).toUpperCase(),
    };
    saveToAccounts(newUser, password);
    persist(newUser);
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(USER_KEY);
  };

  const addCoins = (coins: number) => {
    if (!user) return;
    persist({ ...user, coins: user.coins + coins });
  };

  const addUpload = (record: UploadRecord) => {
    if (!user) return;
    persist({
      ...user,
      coins: user.coins + record.pointsEarned,
      uploads: [record, ...user.uploads],
    });
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
    persist({
      ...user,
      coins: user.coins - coins,
      purchases: [purchase, ...user.purchases],
    });
    return redeemCode;
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, addCoins, addUpload, spendCoins, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
