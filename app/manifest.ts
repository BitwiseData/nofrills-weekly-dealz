import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Fair Fare — Grocery Price Tracker",
    short_name: "Fair Fare",
    description:
      "Compare grocery prices, upload store flyers, and find the best deals near you.",
    start_url: "/",
    display: "standalone",
    background_color: "#003d28",
    theme_color: "#003d28",
    orientation: "portrait",
    categories: ["food", "shopping", "lifestyle"],
    icons: [
      { src: "/icons/icon-72.png", sizes: "72x72", type: "image/png" },
      { src: "/icons/icon-96.png", sizes: "96x96", type: "image/png" },
      { src: "/icons/icon-128.png", sizes: "128x128", type: "image/png" },
      { src: "/icons/icon-144.png", sizes: "144x144", type: "image/png" },
      { src: "/icons/icon-152.png", sizes: "152x152", type: "image/png" },
      { src: "/icons/icon-180.png", sizes: "180x180", type: "image/png" },
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      { src: "/icons/icon-384.png", sizes: "384x384", type: "image/png" },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
    screenshots: [],
    shortcuts: [
      {
        name: "Compare Prices",
        url: "/",
        description: "Search and compare grocery prices",
      },
      {
        name: "Smart Basket",
        url: "/smart-basket",
        description: "Get the cheapest basket across stores",
      },
      {
        name: "Upload Flyer",
        url: "/flyer-analyzer",
        description: "Upload a store flyer PDF to extract deals",
      },
    ],
  };
}
