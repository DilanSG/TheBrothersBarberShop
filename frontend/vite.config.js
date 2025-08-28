const { defineConfig } = require('vite')
const react = require('@vitejs/plugin-react')

// https://vitejs.dev/config/
module.exports = defineConfig({
  plugins: [react()],
  base: '/TheBrothersBarberShop/',
  build: {
    target: 'es2019',
    outDir: 'dist'
  },
  server: {
    port: 5173,
    strictPort: true,
    host: true
  }
})
