import type { Config } from "tailwindcss";

// Calm palette per Story Bible §9: soft, generous, quiet.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#FAF7F2",
        sand: "#DDD1BB",
        ink: "#0F0D0B",
        muted: "#2B2722",
        sage: "#4A6B4C",
        sageDark: "#345037",
        warmth: "#946033",
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
