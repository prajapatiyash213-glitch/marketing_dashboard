/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#F5F7FB",
        panel: "#FFFFFF",
        rail: "#FFFFFF",
        railInk: "#5A6878",
        ink: "#1A202C",
        ink2: "#4A5568",
        muted: "#718096",
        faint: "#A0AEC0",
        hairline: "#E2E8F0",
        hair: "#EDF2F7",
        accent: "#FA2E76",
        accentSoft: "#FFF0F5",
        brandPink: "#FA2E76",
        brandPurple: "#7B61FF",
        brandCyan: "#00C2FF",
        brandAmber: "#FF9F43",
        brandGreen: "#10B981",
        cardHeader: "#1E293B",
        won: "#10B981",
        lost: "#FA2E76",
        warn: "#FF9F43",
      },
      borderRadius: {
        "xl": "1rem",
        "2xl": "1.25rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        "subtle": "0 2px 10px rgba(0, 0, 0, 0.04)",
        "card": "0 4px 20px -2px rgba(0, 0, 0, 0.05)",
        "glow-pink": "0 4px 20px rgba(250, 46, 118, 0.35)",
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
        display: ["Plus Jakarta Sans", "Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
