/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyan: {
          400: '#3eede7', // Tu color cyan personalizado
          500: '#2dd8d2',
        },
        gray: {
          800: '#161823', // Tu color navy background
          900: '#0f1119', // Tu color dark background
        }
      }
    },
  },
  plugins: [],
}