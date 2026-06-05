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
      boxShadow: {
        soft: "0 18px 50px rgba(23, 33, 43, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
