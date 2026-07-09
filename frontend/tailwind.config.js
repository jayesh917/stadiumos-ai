/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: "#080b11",
        surface: "#0f1622",
        "surface-light": "#182232",
        border: "#1f2d42",
        primary: {
          DEFAULT: "#00d2ff",
          dark: "#0099ff"
        },
        status: {
          green: "#00e676",
          amber: "#ffb300",
          red: "#ff1744",
          blue: "#00b0ff"
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      }
    },
  },
  plugins: [],
}
