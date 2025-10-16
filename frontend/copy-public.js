import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, 'public');
const distDir = path.join(__dirname, 'dist');

// Archivos críticos de PWA que deben copiarse a la raíz de dist/
const criticalFiles = [
  'manifest.json',
  'sw.js',
  'offline.html',
  '404.html'
];

// Copiar archivos críticos a la raíz de dist/
console.log('📋 Copiando archivos críticos de PWA...');
criticalFiles.forEach(file => {
  const src = path.join(publicDir, file);
  const dest = path.join(distDir, file);
  
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`✅ ${file} → dist/${file}`);
  } else {
    console.warn(`⚠️  ${file} no encontrado en /public/`);
  }
});

// Copiar carpeta images/ completa a dist/images/
const imagesDir = path.join(publicDir, 'images');
const distImagesDir = path.join(distDir, 'images');

if (fs.existsSync(imagesDir)) {
  // Crear directorio dist/images si no existe
  if (!fs.existsSync(distImagesDir)) {
    fs.mkdirSync(distImagesDir, { recursive: true });
  }
  
  console.log('🖼️  Copiando imágenes...');
  const images = fs.readdirSync(imagesDir);
  images.forEach(image => {
    const src = path.join(imagesDir, image);
    const dest = path.join(distImagesDir, image);
    
    if (fs.statSync(src).isFile()) {
      fs.copyFileSync(src, dest);
      console.log(`✅ images/${image} → dist/images/${image}`);
    }
  });
}

console.log('✨ Archivos PWA copiados exitosamente');
