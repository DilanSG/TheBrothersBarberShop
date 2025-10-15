#!/usr/bin/env node

/**
 * Script de instalación completo para The Brothers Barber Shop
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log(`
🔧 THE BROTHERS BARBER SHOP - INSTALACIÓN COMPLETA

Este script instalará todas las dependencias necesarias.
=======================================================
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
  try {
    // 1. Instalar dependencias raíz
    console.log('\n1️⃣ Instalando dependencias del proyecto raíz...');
    await runCommand('npm', ['install']);

    // 2. Instalar dependencias backend
    console.log('\n2️⃣ Instalando dependencias del backend...');
    await runCommand('npm', ['install'], path.join(process.cwd(), 'backend'));

    // 3. Instalar dependencias frontend
    console.log('\n3️⃣ Instalando dependencias del frontend...');
    await runCommand('npm', ['install'], path.join(process.cwd(), 'frontend'));

    // 4. Configurar entorno de desarrollo
    console.log('\n4️⃣ Configurando entorno de desarrollo...');
    await runCommand('node', ['setup-env.js', 'development']);

    console.log(`
✨ ¡INSTALACIÓN COMPLETADA!

🚀 Para iniciar el desarrollo:
   npm run dev

🌐 Para desarrollo en red:
   npm run dev:network

📝 Para más información:
   Consulta DEVELOPMENT_GUIDE.md

🔗 URLs de desarrollo:
   Frontend: http://localhost:5173
   Backend:  http://localhost:5000
   API:      http://localhost:5000/api/v1
    `);

  } catch (error) {
    console.error(`\n❌ Error durante la instalación: ${error.message}`);
    console.log(`\n🔧 Puedes intentar instalar manualmente:`);
    console.log(`   npm install`);
    console.log(`   cd backend && npm install`);
    console.log(`   cd ../frontend && npm install`);
    process.exit(1);
  }
}

main();
