import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        miriam: {
          purple: "#9D4EDD",
          blue: "#3B82F6",
          green: "#22C55E",
          gray: "#9CA3AF",
          bg: "#0B0B10",
          bgSoft: "#1C1130",
          text: "#F9FAFB",
        },
      },
      fontFamily: {
        heading: ['"Space Grotesk"', "system-ui", "-apple-system", "sans-serif"],
        body: ['"Inter"', "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
