import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

// NOTE: color tokens are kept as literal hex (not CSS vars) so Tailwind's
// alpha modifiers keep working — the app uses bg-coral/10, bg-teal/15,
// bg-amber/20 etc. in hundreds of places. globals.css mirrors the same hex
// as CSS custom properties (--coral, --coral-soft, …) for raw CSS / the
// Care Hub inline-style sweep. Keep the two in sync.
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Warm cream backgrounds (flat token kept for back-compat; the live
        // page background is now a gradient set on <body> in globals.css)
        cream: "#FFF8F0",
        "bg-top": "#FFF4EE",
        "bg-bot": "#FFFBF8",
        surface: "#FFFFFF",
        line: "#F1ECE7",
        // warm neutral fills (surfaced from Care Hub inline styles)
        fill: {
          1: "#F7F3EF",
          2: "#F4EEE9",
          3: "#E5DCD3",
        },

        // Primary
        coral: {
          DEFAULT: "#FF6B5B",
          deep: "#EF4E3C", // gradient end + CTA shadow base
          soft: "#FFE9E4", // tinted icon tiles / chips
          ink: "#C13B2C", // accent text on light, "see all" links
          dark: "#E85647", // back-compat alias (legacy hover state)
        },
        // Playdate / positive
        teal: {
          DEFAULT: "#2EC4B6",
          soft: "#DCF5F2",
          ink: "#137F75", // text/icon on teal-soft (AA)
          dark: "#26A89C", // back-compat
        },
        // Breeding / reminders
        amber: {
          DEFAULT: "#FFB84C",
          deep: "#C49010", // text/icon on amber-soft (AA contrast fix)
          soft: "#FFF1DA",
          dark: "#F0A636", // back-compat
        },
        // Destructive / urgent only (block, delete, lost status, urgent blood)
        rose: {
          DEFAULT: "#E0445A",
          soft: "#FBE2E6",
          ink: "#B12C3F",
        },
        // NEW — health-book accent (de-overloads teal)
        blue: {
          DEFAULT: "#5B8DEF",
          soft: "#E5EDFC",
          ink: "#2F5FBF",
        },
        // Ink text scale (primary brand text)
        ink: {
          DEFAULT: "#2D2A26",
          2: "#6B655E", // secondary — darkened vs old #8A8580 for AA
          3: "#A39D95", // muted / placeholder / inactive
        },
        // Back-compat alias for the legacy `brown` token. brown-muted is
        // intentionally remapped #8A8580 → #6B655E (the AA contrast fix
        // auto-applies everywhere brown-muted is used).
        brown: {
          DEFAULT: "#2D2A26",
          muted: "#6B655E",
        },
      },
      fontFamily: {
        // Prompt covers both Thai and Latin in one family
        sans: ["var(--font-prompt)", ...defaultTheme.fontFamily.sans],
      },
      borderRadius: {
        // Custom keys only — never override Tailwind's lg/md/sm defaults,
        // which existing rounded-lg / rounded-md usages depend on.
        card: "24px", // hero / feature cards (was 20px)
        panel: "18px", // standard cards, sheets, banners
        chip: "14px", // selectable chips / small tiles
      },
      boxShadow: {
        // Warm two-layer brown-tinted elevation (replaces flat black)
        card: "0 10px 30px -12px rgba(120,72,60,.18), 0 2px 6px -2px rgba(120,72,60,.08)",
        cta: "0 12px 24px -8px rgba(239,78,60,.55)", // coral glow on primary CTAs
        sheet: "0 -10px 40px -12px rgba(60,40,32,.4)",
        popup: "0 30px 70px -20px rgba(60,40,32,.5)",
      },
      backgroundImage: {
        "gradient-app": "linear-gradient(180deg, #FFF4EE 0%, #FFFBF8 46%, #FFFBF8 100%)",
        "gradient-cta": "linear-gradient(120deg, #FF6B5B 0%, #EF4E3C 100%)",
        "gradient-avatar": "linear-gradient(150deg, #FF8C6B 0%, #FF6B5B 50%, #FF5E7A 100%)",
        "gradient-logo": "linear-gradient(135deg, #FF6B5B 0%, #FF8A5B 100%)",
      },
      letterSpacing: {
        title: "-.02em", // page / hero titles
        tight2: "-.01em", // card / section heads
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(14px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "cta-pulse": {
          "0%, 100%": { boxShadow: "0 12px 24px -8px rgba(239,78,60,.55)" },
          "50%": { boxShadow: "0 16px 34px -8px rgba(239,78,60,.7)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        pop: {
          "0%": { opacity: "0", transform: "scale(.8)" },
          "60%": { transform: "scale(1.05)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        bloom: {
          "0%": { opacity: "0", transform: "scale(.6)" },
          "100%": { opacity: ".55", transform: "scale(1)" },
        },
      },
      animation: {
        "fade-up": "fade-up .5s cubic-bezier(.2,.7,.3,1) both",
        "cta-pulse": "cta-pulse 2.8s ease-in-out infinite",
        shimmer: "shimmer 1.4s linear infinite",
        pop: "pop .42s cubic-bezier(.2,.7,.3,1) both",
        bloom: "bloom .6s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
