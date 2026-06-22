import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";
import typography from "@tailwindcss/typography";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50:  "#EEF2FF",
          100: "#C7D4F0",
          200: "#96AADC",
          300: "#6480C7",
          400: "#3257B2",
          500: "#1E3A5F",
          600: "#172E4D",
          700: "#10213B",
          800: "#0A1628",
          900: "#060D18",
        },
        brand: {
          50:  "#FCF5F3",
          100: "#F6E0DB",
          200: "#EBC0B6",
          300: "#DC9A8A",
          400: "#C16A53",
          500: "#963625",
          600: "#832F20",
          700: "#6B261A",
          800: "#511D14",
          900: "#38140E",
        },
        amber: {
          400: "#FBB040",
          500: "#F59E0B",
        },
        orange: {
          500: "#FF6B2C",
          600: "#E85A1E",
        },
      },
      fontFamily: {
        display: ["var(--font-syne)", "sans-serif"],
        body:    ["var(--font-inter)", "sans-serif"],
        mono:    ["var(--font-jetbrains)", "monospace"],
      },
      backgroundImage: {
        "gradient-radial":  "radial-gradient(var(--tw-gradient-stops))",
        "gradient-routes":  "linear-gradient(135deg, #0A1628 0%, #1E3A5F 50%, #0A1628 100%)",
        "noise":            "url('/noise.svg')",
      },
      animation: {
        "pulse-slow":  "pulse 3s ease-in-out infinite",
        "slide-up":    "slideUp 0.5s ease-out",
        "fade-in":     "fadeIn 0.4s ease-out",
        "draw-line":   "drawLine 1.5s ease-out forwards",
      },
      keyframes: {
        slideUp:  { from: { opacity: "0", transform: "translateY(20px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        fadeIn:   { from: { opacity: "0" }, to: { opacity: "1" } },
        drawLine: { from: { strokeDashoffset: "1000" }, to: { strokeDashoffset: "0" } },
      },
    },
  },
  plugins: [forms, typography],
};

export default config;
