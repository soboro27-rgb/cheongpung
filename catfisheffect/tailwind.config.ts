import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "smoke-blue-dark": "var(--smoke-blue-dark)",
        "smoke-blue": "var(--smoke-blue)",
        "smoke-blue-light": "var(--smoke-blue-light)",
        "lime-mint": "var(--lime-mint)",
        "lime-mint-dark": "var(--lime-mint-dark)",
        "bg-dark": "var(--bg-dark)",
        "text-primary": "var(--text-primary)",
        "text-muted": "var(--text-muted)",
      },
      fontFamily: {
        sans: [
          "Pretendard Variable",
          "Pretendard",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "sans-serif",
        ],
      },
      maxWidth: {
        content: "1200px",
      },
    },
  },
  plugins: [],
};

export default config;
