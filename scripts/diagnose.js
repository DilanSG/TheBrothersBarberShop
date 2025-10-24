#!/usr/bin/env node

/**
 * Diagnóstico rápido del proyecto - The Brothers Barber Shop
 */

const fs = require('fs');
const path = require('path');

console.log(`
🔍 DIAGNÓSTICO DEL PROYECTO - THE BROTHERS BARBER SHOP
======================================================
`);

function checkPath(filePath, description) {
  const exists = fs.existsSync(filePath);
  const status = exists ? '✅' : '❌';
  console.log(`${status} ${description}: ${filePath}`);
  return exists;
}

function checkNodeModules(dir, name) {
  const nodeModulesPath = path.join(dir, 'node_modules');
  const packageJsonPath = path.join(dir, 'package.json');
  
  console.log(`\n📦 Verificando ${name}:`);
  checkPath(packageJsonPath, 'package.json');
  checkPath(nodeModulesPath, 'node_modules');
  
  if (fs.existsSync(nodeModulesPath)) {
    const vitePath = path.join(nodeModulesPath, 'vite');
    if(name === 'Frontend') {
      checkPath(vitePath, 'vite instalado');
      
      if (fs.existsSync(vitePath)) {
        const viteCliPath = path.join(vitePath, 'dist', 'node', 'cli.js');
        checkPath(viteCliPath, 'vite CLI');
      }
    }
  }
}

function main() {
  const rootDir = process.cwd();
  const frontendDir = path.join(rootDir, 'frontend');
  const backendDir = path.join(rootDir, 'backend');

  console.log(`📁 Directorio actual: ${rootDir}\n`);

  // Verificar estructura del proyecto
  console.log('🏗️ Estructura del proyecto:');
  checkPath(frontendDir, 'Directorio frontend');
  checkPath(backendDir, 'Directorio backend');
  checkPath(path.join(rootDir, 'vercel.json'), 'vercel.json');
  checkPath(path.join(rootDir, 'simple-dev.js'), 'simple-dev.js');

  // Verificar dependencias
  checkNodeModules(rootDir, 'Proyecto raíz');
  checkNodeModules(frontendDir, 'Frontend');
  checkNodeModules(backendDir, 'Backend');

  // Verificar configuración de entorno
  console.log(`\n🔧 Configuración de entorno:`);
  checkPath(path.join(frontendDir, '.env'), 'Frontend .env');
  checkPath(path.join(frontendDir, '.env.development'), 'Frontend .env.development');
  checkPath(path.join(frontendDir, '.env.production'), 'Frontend .env.production');
  checkPath(path.join(backendDir, '.env'), 'Backend .env');

  console.log(`\n📋 RECOMENDACIONES:`);
  
  if (!fs.existsSync(path.join(frontendDir, 'node_modules'))) {
    console.log(`❗ Ejecuta: npm run fix:frontend`);
  }
  
  if (!fs.existsSync(path.join(backendDir, 'node_modules'))) {
    console.log(`❗ Ejecuta: cd backend && npm install`);
  }
  
  console.log(`\n🚀 Para iniciar desarrollo:`);
  console.log(`   npm run dev (launcher completo)`);
  console.log(`   npm run dev:frontend (solo frontend)`);
  console.log(`   npm run dev:backend (solo backend)`);
  
  console.log(`\n🔧 Scripts de reparación:`);
  console.log(`   npm run fix:frontend (reparar frontend)`);
  console.log(`   npm run install:all (instalar todo)`);
}

main();
