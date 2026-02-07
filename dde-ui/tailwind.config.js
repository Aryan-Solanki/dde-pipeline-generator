/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#09090b", // zinc-950 like
        sidebar: "#0c0c0e",    // slightly lighter
        surface: "#18181b",    // zinc-900
        primary: "#ffffff",
        secondary: "#a1a1aa",  // zinc-400
        accent: "#3b82f6",     // blue-500
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

