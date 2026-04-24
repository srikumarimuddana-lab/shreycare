import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ShreyCare Organics",
    short_name: "ShreyCare",
    description:
      "Shop the best ayurvedic hair oil in Canada. Cold-pressed, organic hair oils with bhringraj, amla, and rare herbs. Shipped across Canada.",
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
