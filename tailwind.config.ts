import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        display: [
          "Inter",
          "system-ui",
          "sans-serif",
        ],
      },
      colors: {
        // Obsidian Studio palette — premium dark creative tool
        ink: {
          950: "#0A0A0B", // pure base
          900: "#0F0F11",
          800: "#16171A",
          700: "#1F2024",
          600: "#2A2B2F",
          500: "#3A3B40",
          400: "#5C5D63",
          300: "#8B8C92",
          200: "#B8B9BD",
          100: "#E5E5E7",
          50: "#FAFAFA",
        },
        amber: {
          // Primary accent — warm gold for CTAs
          400: "#FBBF24",
          500: "#F59E0B",
          600: "#D97706",
        },
        cyan: {
          // Secondary accent — electric cyan
          400: "#22D3EE",
          500: "#06B6D4",
          600: "#0891B2",
        },
        coral: {
          // Tertiary — warmth, alerts
          400: "#FB7185",
          500: "#F43F5E",
        },
      },
      animation: {
        "gradient-shift": "gradient-shift 22s ease infinite",
        "pulse-slow": "pulse 4s cubic-bezier(0.4,0,0.6,1) infinite",
        "shimmer": "shimmer 2s linear infinite",
        "float": "float 6s ease-in-out infinite",
      },
      keyframes: {
        "gradient-shift": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      boxShadow: {
        "glow-amber": "0 0 40px -8px rgba(245, 158, 11, 0.4)",
        "glow-cyan": "0 0 40px -8px rgba(34, 211, 238, 0.35)",
        "glow-coral": "0 0 40px -8px rgba(251, 113, 133, 0.35)",
        "inner-soft": "inset 0 1px 0 0 rgba(255, 255, 255, 0.05)",
      },
    },
  },
  plugins: [],
};

export default config;
