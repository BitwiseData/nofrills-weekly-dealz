import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/app/context/AuthContext";
import ServiceWorkerRegistration from "@/app/components/ServiceWorkerRegistration";

export const metadata: Metadata = {
  title: "Fair Fare — Upload Flyers, Earn Coins, Save on Groceries",
  description:
    "Upload grocery store flyer PDFs, earn coins, compare prices at nearby stores, and redeem coins for real grocery savings.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Fair Fare",
    startupImage: [
      { url: "/icons/icon-512.png" },
    ],
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-180.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#003d28",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        {/* iOS PWA splash / status bar */}
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/icons/icon-180.png" />
      </head>
      <body className="min-h-full flex flex-col">
        <AuthProvider>{children}</AuthProvider>
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
