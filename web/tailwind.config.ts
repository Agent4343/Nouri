import type { Config } from "tailwindcss";

// Calm palette per Story Bible §9: soft, generous, quiet.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#FAF7F2",
        sand: "#F1EBE0",
        ink: "#2E2A26",
        muted: "#6F6862",
        sage: "#8BA98A",
        sageDark: "#6E8C6E",
        warmth: "#D9A679",
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
