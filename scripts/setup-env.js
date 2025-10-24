#!/usr/bin/env node

/**
 * Configurador de entorno para The Brothers Barber Shop
 * Detecta y configura automáticamente el entorno correcto
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const environments = {
  development: {
    VITE_API_URL: 'http://localhost:5000/api/v1',
    VITE_APP_NAME: 'The Brothers Barber Shop',
    VITE_APP_VERSION: '1.0.0',
    VITE_ENVIRONMENT: 'development',
    VITE_DEBUG: 'true',
    VITE_LOG_LEVEL: 'debug'
  },
  production: {
    VITE_API_URL: 'https://thebrothersbarbershop.onrender.com/api/v1',
    VITE_APP_NAME: 'The Brothers Barber Shop',
    VITE_APP_VERSION: '1.0.0',
    VITE_ENVIRONMENT: 'production',
    VITE_DEBUG: 'false',
    VITE_LOG_LEVEL: 'warn'
  },
  network: {
    VITE_API_URL: 'AUTO_DETECT',
    VITE_APP_NAME: 'The Brothers Barber Shop',
    VITE_APP_VERSION: '1.0.0',
    VITE_ENVIRONMENT: 'development',
    VITE_DEBUG: 'true',
    VITE_LOG_LEVEL: 'debug'
  }
};

function createEnvFile(environment, targetPath) {
  const config = environments[environment];
  if (!config) {
    console.error(`❌ Entorno '${environment}' no encontrado`);
    return false;
  }

  const envContent = Object.entries(config)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  try {
    fs.writeFileSync(targetPath, envContent + '\n');
    console.log(`✅ Archivo ${path.basename(targetPath)} creado para entorno '${environment}'`);
    return true;
  } catch (error) {
    console.error(`❌ Error creando archivo ${targetPath}:`, error.message);
    return false;
  }
}

function showUsage() {
  console.log(`
🔧 Configurador de Entorno - The Brothers Barber Shop

Uso: node setup-env.js [entorno]

Entornos disponibles:
  development  - Configuración para desarrollo local
  production   - Configuración para producción (Vercel + Render)  
  network      - Configuración para desarrollo en red local

Ejemplos:
  node setup-env.js development
  node setup-env.js production
  node setup-env.js network

Si no se especifica entorno, se usa 'development' por defecto.
  `);
}

function main() {
  const args = process.argv.slice(2);
  const environment = args[0] || 'development';

  if (args.includes('--help') || args.includes('-h')) {
    showUsage();
    return;
  }

  console.log(`🚀 Configurando entorno: ${environment}`);
  
  const frontendPath = path.join(__dirname, 'frontend', '.env');
  
  // Crear backup del archivo existente si existe
  if (fs.existsSync(frontendPath)) {
    const backupPath = `${frontendPath}.backup`;
    fs.copyFileSync(frontendPath, backupPath);
    console.log(`📋 Backup creado: ${path.basename(backupPath)}`);
  }

  createEnvFile(environment, frontendPath);
}

main();
