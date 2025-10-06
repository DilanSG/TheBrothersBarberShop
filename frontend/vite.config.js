import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === 'production' ? '/TheBrothersBarberShop/' : '/',
  
  // Configuración de construcción optimizada
  build: {
    target: 'es2020',
    outDir: '../docs',
    assetsDir: 'assets',
    emptyOutDir: true,
    copyPublicDir: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['lucide-react', 'react-toastify'],
          utils: ['date-fns', 'xlsx']
        }
      }
    }
  },
  
  // Configuración del servidor de desarrollo
  server: {
    port: 5173,
    strictPort: true,
    host: '0.0.0.0',
    cors: true,
    hmr: {
      port: 5173,
      host: 'localhost'
    },
    watch: {
      usePolling: false,
      interval: 100
    }
  },
  
  // Configuración de dependencias optimizada para Vite 4.x
  optimizeDeps: {
    force: true,
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'date-fns',
      'lucide-react',
      'react-toastify',
      'react-calendar',
      'react-day-picker'
    ]
  },
  
  // Configuración de resolución
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  
  // Variables de entorno
  define: {
    __DEV__: process.env.NODE_ENV === 'development'
  }
})
