import type { Config } from "tailwindcss";

// Calm palette per Story Bible §9: soft, generous, quiet.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#FAF7F2",
        sand: "#E8DFCF",
        ink: "#1F1B17",
        muted: "#4A4540",
        sage: "#5F8060",
        sageDark: "#436148",
        warmth: "#B07A4A",
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
