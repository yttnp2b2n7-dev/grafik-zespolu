import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Grafik ImpactVision",
    short_name: "ImpactVision",
    description: "Przypisywanie ludzi do wydarzeń w tygodniowym grafiku",
    start_url: "/schedule",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#09090b",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
