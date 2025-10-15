#!/usr/bin/env node

/**
 * Script para reparar el frontend - The Brothers Barber Shop
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log(`
🔧 REPARANDO FRONTEND - THE BROTHERS BARBER SHOP

Este script limpiará e instalará correctamente Vite y sus dependencias.
=======================================================================
`);

function runCommand(command, args, cwd = process.cwd()) {
  return new Promise((resolve, reject) => {
    console.log(`\n📦 Ejecutando: ${command} ${args.join(' ')}`);
    console.log(`📁 En directorio: ${cwd}`);
    
    const child = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      shell: true
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ Comando completado exitosamente`);
        resolve();
      } else {
        console.log(`❌ Comando falló con código ${code}`);
        reject(new Error(`Comando falló con código ${code}`));
      }
    });

    child.on('error', (error) => {
      console.log(`❌ Error ejecutando comando: ${error.message}`);
      reject(error);
    });
  });
}

async function main() {
  const frontendPath = path.join(process.cwd(), 'frontend');
  
  try {
    console.log('\n1️⃣ Limpiando cache de npm...');
    await runCommand('npm', ['cache', 'clean', '--force']);

    console.log('\n2️⃣ Eliminando node_modules del frontend...');
    const nodeModulesPath = path.join(frontendPath, 'node_modules');
    if (fs.existsSync(nodeModulesPath)) {
      fs.rmSync(nodeModulesPath, { recursive: true, force: true });
      console.log('✅ node_modules eliminado');
    }

    console.log('\n3️⃣ Eliminando package-lock.json del frontend...');
    const lockPath = path.join(frontendPath, 'package-lock.json');
    if (fs.existsSync(lockPath)) {
      fs.unlinkSync(lockPath);
      console.log('✅ package-lock.json eliminado');
    }

    console.log('\n4️⃣ Reinstalando dependencias del frontend...');
    await runCommand('npm', ['install'], frontendPath);

    console.log('\n5️⃣ Verificando instalación de Vite...');
    await runCommand('npm', ['list', 'vite'], frontendPath);

    console.log(`
✨ ¡FRONTEND REPARADO!

🚀 Ahora puedes usar:
   npm run dev (desde la raíz)
   
🎨 O solo el frontend:
   cd frontend && npm run dev

🔗 URL del frontend:
   http://localhost:5173
    `);

  } catch (error) {
    console.error(`\n❌ Error durante la reparación: ${error.message}`);
    console.log(`\n🔧 Puedes intentar manualmente:`);
    console.log(`   cd frontend`);
    console.log(`   rm -rf node_modules package-lock.json`);
    console.log(`   npm install`);
    process.exit(1);
  }
}

main();
