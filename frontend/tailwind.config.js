/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink:     "#050505",
        surface: "#0E0E11",
        card:    "#111114",
        accent:  "#4F46E5",
        violet:  "#8B5CF6",
        sky:     "#3B82F6",
        success: "#22C55E",
        danger:  "#EF4444",
        muted:   "#A1A1AA",
        line:    "rgba(255,255,255,0.08)",
      },
      boxShadow: {
        glow: "0 0 64px rgba(79,70,229,0.22)",
        soft: "0 24px 80px rgba(0,0,0,0.35)",
      },
      fontFamily: {
        sans:    ["Inter","ui-sans-serif","system-ui","sans-serif"],
        display: ["Inter","ui-sans-serif","system-ui","sans-serif"],
      },
    },
  },
  plugins: [],
};