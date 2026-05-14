/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        dark: {
          900: "#0f172a",
          800: "#1e293b",
          700: "#334155",
          600: "#475569",
        },
        accent: {
          DEFAULT: "#10b981",
          light: "#34d399",
          dark: "#059669",
        },
      },
    },
  },
  plugins: [],
};
