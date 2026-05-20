import type { Config } from "tailwindcss";

// Calm palette per Story Bible §9: soft, generous, quiet.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // Dark, warm palette. "cream" is the page bg, "card" is the surface
      // above it, "sand" is the border. Bright text (ink) and lifted accents
      // (sage, warmth) pop on the dark bg.
      colors: {
        cream: "#1A1714",      // page background
        card: "#2A2520",       // raised surface (cards, inputs)
        sand: "#3A322B",       // subtle borders / dividers
        ink: "#F5EFE5",        // primary text — warm off-white
        muted: "#C2B7A8",      // secondary text
        sage: "#9DC79F",       // accent — bright sage
        sageDark: "#7AAE7D",   // hover / deeper accent
        warmth: "#E5B07A",     // warm amber accent
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica", "Arial"],
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
