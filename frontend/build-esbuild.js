const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

async function buildWithEsbuild() {
  try {
    console.log('Building with esbuild...');
    
    // Crear directorio dist si no existe
    if (!fs.existsSync('dist')) {
      fs.mkdirSync('dist');
    }
    
    // Copiar index.html
    fs.copyFileSync('index.html', 'dist/index.html');
    
    // Copiar public folder si existe
    if (fs.existsSync('public')) {
      fs.cpSync('public', 'dist', { recursive: true });
    }
    
    // Build JavaScript/TypeScript
    await esbuild.build({
      entryPoints: ['src/main.jsx'],
      bundle: true,
      outfile: 'dist/assets/main.js',
      format: 'iife',
      platform: 'browser',
      target: 'es2015',
      minify: true,
      sourcemap: true,
      define: {
        'process.env.NODE_ENV': '"production"',
        'import.meta.env.PROD': 'true',
        'import.meta.env.DEV': 'false',
        'import.meta.env.VITE_API_URL': '"https://thebrothersbarbershop.onrender.com"'
      },
      loader: {
        '.jsx': 'jsx',
        '.js': 'jsx',
        '.ts': 'tsx',
        '.tsx': 'tsx',
        '.css': 'css',
        '.png': 'file',
        '.jpg': 'file',
        '.jpeg': 'file',
        '.gif': 'file',
        '.svg': 'file'
      },
      external: [],
      jsx: 'automatic',
      alias: {
        '@': path.resolve(process.cwd(), 'src')
      }
    });
    
    // Actualizar index.html para usar el bundle
    let html = fs.readFileSync('dist/index.html', 'utf8');
    html = html.replace(
      '<script type="module" src="/src/main.jsx"></script>',
      '<script src="/assets/main.js"></script>'
    );
    fs.writeFileSync('dist/index.html', html);
    
    console.log('Build completed with esbuild!');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

buildWithEsbuild();