#!/usr/bin/env node

/**
 * Script para configurar dinámicamente la conexión API
 * Detecta automáticamente la IP de red y configura el frontend
 */

import { writeFile } from 'fs/promises';
import { networkInterfaces } from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getLocalIPs = () => {
  const interfaces = networkInterfaces();
  const ips = [];
  
  Object.keys(interfaces).forEach(interfaceName => {
    interfaces[interfaceName].forEach(iface => {
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push(iface.address);
      }
    });
  });
  
  return ips;
};

const createEnvConfig = (useNetwork = false) => {
  const localIPs = getLocalIPs();
  const networkIP = localIPs[0]; // Usar la primera IP encontrada
  
  let config = `# API Configuration - Configuración automática
# Generado automáticamente el ${new Date().toLocaleString()}

`;

  if (useNetwork && networkIP) {
    config += `# Configuración para acceso en red local
VITE_API_URL=http://${networkIP}:5000/api/v1

# Información de red detectada:
# IP principal: ${networkIP}
# IPs disponibles: ${localIPs.join(', ')}
`;
  } else {
    config += `# Configuración para desarrollo local
VITE_API_URL=http://localhost:5000/api/v1

# IPs de red disponibles: ${localIPs.join(', ')}
# Para usar red: npm run config:network
`;
  }

  config += `
# Debug y logging
VITE_DEBUG=true
VITE_LOG_LEVEL=info

# Nota: La URL de API se detecta automáticamente según el hostname:
# - Si accedes por localhost:5173 → usa localhost:5000
# - Si accedes por IP → usa misma IP:5000
`;

  return config;
};

const configureForMode = async (mode) => {
  const envPath = path.join(__dirname, '..', '.env');
  
  console.log('🔧 Configurando API para modo:', mode);
  
  try {
    const useNetwork = mode === 'network';
    const config = createEnvConfig(useNetwork);
    
    await writeFile(envPath, config);
    
    console.log('✅ Configuración actualizada exitosamente');
    console.log('📁 Archivo:', envPath);
    
    if (useNetwork) {
      const localIPs = getLocalIPs();
      console.log('\n🌐 CONFIGURACIÓN PARA RED LOCAL:');
      console.log(`   Frontend: http://${localIPs[0]}:5173`);
      console.log(`   Backend:  http://${localIPs[0]}:5000`);
      console.log('\n📱 Accede desde cualquier dispositivo en la red usando la IP mostrada');
    } else {
      console.log('\n🏠 CONFIGURACIÓN LOCAL:');
      console.log('   Frontend: http://localhost:5173');
      console.log('   Backend:  http://localhost:5000');
    }
    
    console.log('\n🔄 Reinicia el servidor frontend para aplicar los cambios');
    
  } catch (error) {
    console.error('❌ Error configurando:', error);
    process.exit(1);
  }
};

// Obtener argumento de la línea de comandos
const mode = process.argv[2];

if (!mode || !['local', 'network'].includes(mode)) {
  console.log('🔧 Configurador de API - The Brothers Barber Shop');
  console.log('='.repeat(50));
  console.log('\nUso:');
  console.log('  npm run config:local    - Configurar para localhost');
  console.log('  npm run config:network  - Configurar para red local');
  console.log('\nIPs de red disponibles:');
  getLocalIPs().forEach(ip => console.log(`  • ${ip}`));
  console.log('\n💡 Recomendación: La configuración dinámica detecta automáticamente');
  console.log('   el mejor modo según cómo accedas a la aplicación.');
  process.exit(1);
}

configureForMode(mode);