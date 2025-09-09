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
        // Optimización de chunks para mejor performance
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          utils: ['lucide-react'],
        },
        // Nombres de archivos optimizados
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      }
    },
    // Usar esbuild con configuración para remover console.logs
    minify: 'esbuild',
    esbuild: {
      // Remover console.logs y debugger en producción
      drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : []
    }
  },
  server: {
    port: 5173,
    strictPort: true,
    host: true
  }
})
