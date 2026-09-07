import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0b0f17",
        surface: "#111827",
        "surface-raised": "#1a2234",
        "surface-border": "#24324d",
        trade: {
          green: "#10b981",
          "green-dark": "#064e3b",
          "green-light": "#34d399",
          red: "#ef4444",
          "red-dark": "#7f1d1d",
          "red-light": "#f87171",
        }
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
