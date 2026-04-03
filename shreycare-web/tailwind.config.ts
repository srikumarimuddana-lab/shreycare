import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#384527",
        "on-primary": "#ffffff",
        "primary-container": "#4f5d3d",
        "on-primary-container": "#c5d5ad",
        secondary: "#745b1c",
        "on-secondary": "#ffffff",
        "secondary-container": "#ffdc90",
        "on-secondary-container": "#785f20",
        tertiary: "#4d4024",
        "on-tertiary": "#ffffff",
        "tertiary-container": "#655739",
        surface: "#fcf9f4",
        "on-surface": "#1c1c19",
        "surface-dim": "#dcdad5",
        "surface-bright": "#fcf9f4",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f6f3ee",
        "surface-container": "#f0ede8",
        "surface-container-high": "#ebe8e3",
        "surface-container-highest": "#e5e2dd",
        "surface-variant": "#e5e2dd",
        "on-surface-variant": "#45483f",
        "on-background": "#1c1c19",
        background: "#fcf9f4",
        outline: "#75786e",
        "outline-variant": "#c6c8bc",
        "inverse-surface": "#31302d",
        "inverse-on-surface": "#f3f0eb",
        "inverse-primary": "#bccca4",
        error: "#ba1a1a",
        "on-error": "#ffffff",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a",
        "surface-tint": "#556343",
      },
      fontFamily: {
        headline: ["var(--font-noto-serif)", "serif"],
        body: ["var(--font-manrope)", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.125rem",
        md: "0.375rem",
        lg: "0.5rem",
      },
      boxShadow: {
        botanical: "0 12px 40px rgba(56, 69, 39, 0.06)",
        "botanical-lg": "0 20px 60px rgba(56, 69, 39, 0.1)",
      },
    },
  },
  plugins: [],
};
export default config;
