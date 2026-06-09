import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#17212b",
        chalk: "#f7f4ec",
        protea: "#d94f45",
        veld: "#1f8a70",
        gold: "#f2b84b",
        sky: "#2274a5"
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"]
      },
      boxShadow: {
        soft: "0 18px 50px rgba(23, 33, 43, 0.12)",
        card: "0 1px 3px rgba(23,33,43,0.06), 0 4px 12px rgba(23,33,43,0.04)",
        "card-hover": "0 2px 6px rgba(23,33,43,0.09), 0 8px 24px rgba(23,33,43,0.07)",
        elevated: "0 4px 16px rgba(23,33,43,0.10), 0 12px 40px rgba(23,33,43,0.08)"
      }
    }
  },
  plugins: []
};

export default config;
