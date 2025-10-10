import { build } from 'vite';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

async function buildApp() {
  try {
    console.log('Iniciando build con Vite API...');
    
    await build({
      // Configuración base
      base: '/',
      mode: 'production',
      
      // Configuración de build
      build: {
        target: 'es2020',
        outDir: 'dist',
        assetsDir: 'assets',
        emptyOutDir: true,
        copyPublicDir: true,
        minify: 'esbuild',
        rollupOptions: {
          output: {
            manualChunks: undefined
          }
        }
      },
      
      // Variables de entorno
      define: {
        'import.meta.env.VITE_API_URL': JSON.stringify('https://thebrothersbarbershop.onrender.com/api/v1'),
        'import.meta.env.VITE_NODE_ENV': JSON.stringify('production'),
        'import.meta.env.PROD': true,
        'import.meta.env.DEV': false
      }
    });
    
    console.log('Build completado exitosamente con Vite API!');
  } catch (error) {
    console.error('Error en build:', error);
    process.exit(1);
  }
}

buildApp();