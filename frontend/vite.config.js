import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  
  // Configuración de construcción optimizada
  build: {
    target: 'es2020',
    outDir: 'dist',
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
          utils: ['date-fns', 'exceljs']
        },
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          let extType = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            extType = 'img';
          } else if (/woff|woff2|eot|ttf|otf/i.test(extType)) {
            extType = 'fonts';
          }
          return `assets/${extType}/[name]-[hash][extname]`;
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js'
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
    },
    // Proxy para desarrollo local si es necesario
    proxy: process.env.NODE_ENV === 'development' ? {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    } : undefined
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
      'react-day-picker',
      'exceljs'
    ]
  },
  
  // Configuración de resolución
  resolve: {
    alias: {
      '@': '/src',
      '@shared': '/src/shared',
      '@utils': '/src/shared/utils',
      '@components': '/src/shared/components',
      '@hooks': '/src/shared/hooks',
      '@services': '/src/shared/services',
      '@contexts': '/src/shared/contexts',
      '@recurring-expenses': '/shared/recurring-expenses'
    }
  },
  
  // Variables de entorno
  define: {
    __DEV__: process.env.NODE_ENV === 'development'
  }
})
