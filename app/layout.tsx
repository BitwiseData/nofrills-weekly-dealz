import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "No Frills Dealz – Week 10 Flyer",
  description: "Browse this week's No Frills grocery deals and get AI-powered savings recommendations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
