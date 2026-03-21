import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/app/context/AuthContext";

export const metadata: Metadata = {
  title: "Fair Fare — Upload Flyers, Earn Coins, Save on Groceries",
  description: "Upload grocery store flyer PDFs, earn coins, compare prices at nearby stores, and redeem coins for real grocery savings.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
