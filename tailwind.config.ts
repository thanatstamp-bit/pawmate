import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // PawMate design system — warm, playful, cozy pet café
        cream: "#FFF8F0",
        coral: {
          DEFAULT: "#FF6B5B",
          dark: "#E85647",
        },
        teal: {
          DEFAULT: "#2EC4B6",
          dark: "#26A89C",
        },
        amber: {
          DEFAULT: "#FFB84C",
          dark: "#F0A636",
        },
        brown: {
          DEFAULT: "#2D2A26",
          muted: "#8A8580",
        },
      },
      fontFamily: {
        // Nunito covers Latin, IBM Plex Sans Thai covers Thai glyphs
        sans: [
          "var(--font-nunito)",
          "var(--font-ibm-plex-thai)",
          ...defaultTheme.fontFamily.sans,
        ],
      },
      borderRadius: {
        card: "20px",
      },
      boxShadow: {
        card: "0 4px 16px rgba(0, 0, 0, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
