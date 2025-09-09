/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        secondary: '#1F2937',
        // Sobrescribimos los colores de fondo
        gray: {
          100: '#111827',  // Oscuro en lugar de claro
          200: '#1F2937',
          800: '#1F2937',
          900: '#111827'
        }
      }
    },
  },
  plugins: [],
}

