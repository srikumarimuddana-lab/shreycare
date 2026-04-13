import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ShreyCare Organics",
    short_name: "ShreyCare",
    description:
      "Luxury botanical hair care crafted with cold-pressed oils and rare herbal infusions. Rooted in Ayurveda, blended with ancient herbal wisdom.",
    start_url: "/",
    display: "standalone",
    background_color: "#fcf9f4",
    theme_color: "#384527",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
