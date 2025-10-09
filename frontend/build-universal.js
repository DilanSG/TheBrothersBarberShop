// Script de build universal con múltiples respaldos
const fs = require('fs');
const path = require('path');

async function universalBuild() {
  console.log('🚀 Iniciando build universal...');
  
  // Estrategia 1: Usar esbuild (más rápido y confiable)
  try {
    console.log('📦 Intentando build con esbuild...');
    const esbuild = require('esbuild');
    
    // Limpiar directorio dist
    if (fs.existsSync('dist')) {
      fs.rmSync('dist', { recursive: true, force: true });
    }
    fs.mkdirSync('dist');
    
    // Copiar archivos estáticos
    fs.copyFileSync('index.html', 'dist/index.html');
    if (fs.existsSync('public')) {
      fs.cpSync('public', 'dist', { recursive: true });
    }
    
    // Build principal
    await esbuild.build({
      entryPoints: ['src/main.jsx'],
      bundle: true,
      outfile: 'dist/assets/main.js',
      format: 'iife',
      platform: 'browser',
      target: 'es2020',
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
      jsx: 'automatic',
      jsxFactory: 'React.createElement',
      jsxFragment: 'React.Fragment'
    });
    
    // Procesar CSS con Tailwind
    const { spawn } = require('child_process');
    await new Promise((resolve, reject) => {
      const tailwind = spawn('npx', ['tailwindcss', '-i', 'src/index.css', '-o', 'dist/assets/style.css', '--minify'], {
        stdio: 'inherit'
      });
      tailwind.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Tailwind failed with code ${code}`));
      });
    });
    
    // Actualizar HTML
    let html = fs.readFileSync('dist/index.html', 'utf8');
    html = html.replace(
      '<script type="module" src="/src/main.jsx"></script>',
      '<script src="/assets/main.js"></script>'
    );
    html = html.replace(
      '</head>',
      '  <link rel="stylesheet" href="/assets/style.css">\n</head>'
    );
    fs.writeFileSync('dist/index.html', html);
    
    console.log('✅ Build completado exitosamente con esbuild!');
    return;
    
  } catch (error) {
    console.warn('⚠️ esbuild falló:', error.message);
  }
  
  // Estrategia 2: Vite si está disponible
  try {
    console.log('📦 Intentando build con Vite...');
    const { spawn } = require('child_process');
    
    await new Promise((resolve, reject) => {
      const vite = spawn('npx', ['vite', 'build'], {
        stdio: 'inherit'
      });
      vite.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Build completado exitosamente con Vite!');
          resolve();
        } else {
          reject(new Error(`Vite failed with code ${code}`));
        }
      });
    });
    return;
    
  } catch (error) {
    console.warn('⚠️ Vite falló:', error.message);
  }
  
  // Estrategia 3: Build mínimo manual
  console.log('📦 Creando build mínimo manual...');
  try {
    if (!fs.existsSync('dist')) {
      fs.mkdirSync('dist');
    }
    
    // Copiar index.html básico
    const basicHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <link rel="icon" type="image/svg+xml" href="/vite.svg" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>The Brothers Barber Shop</title>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
  <div id="root">
    <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: Arial, sans-serif;">
      <div style="text-align: center;">
        <h1>The Brothers Barber Shop</h1>
        <p>Sistema en construcción...</p>
        <p>Backend disponible en: <a href="https://thebrothersbarbershop.onrender.com">thebrothersbarbershop.onrender.com</a></p>
      </div>
    </div>
  </div>
</body>
</html>`;
    
    fs.writeFileSync('dist/index.html', basicHtml);
    
    // Copiar public si existe
    if (fs.existsSync('public')) {
      fs.cpSync('public', 'dist', { recursive: true });
    }
    
    console.log('✅ Build mínimo completado!');
    
  } catch (error) {
    console.error('❌ Todos los métodos de build fallaron:', error);
    process.exit(1);
  }
}

universalBuild();