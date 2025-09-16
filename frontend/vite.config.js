import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === 'production' ? '/TheBrothersBarberShop/' : '/',
  build: {
    target: 'es2019',
    outDir: '../docs',
    assetsDir: 'assets',
    emptyOutDir: true,
    copyPublicDir: true,
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  server: {
    port: 5173,
    strictPort: true,
    host: true,
    hmr: {
      port: 5173,
      overlay: false
    }
  }
})
