#!/usr/bin/env node

/**
 * The Brothers Barber Shop - Development Server Launcher (Simplified)
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Función para encontrar el ejecutable correcto de npm
function getNpmExecutable() {
  if (process.platform === 'win32') {
    // En Windows, probar diferentes opciones
    const possiblePaths = [
      'npm.cmd',
      'npm.bat', 
      'npm'
    ];
    
    for (const npmPath of possiblePaths) {
      try {
        // Verificar si existe ejecutando which/where
        require('child_process').execSync(`where ${npmPath}`, { stdio: 'ignore' });
        return npmPath;
      } catch (e) {
        // Continuar con el siguiente
      }
    }
    return 'npm'; // Fallback
  }
  return 'npm';
}

// Colores para terminal
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorLog(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Interface para pausar
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function pauseForUser(message = 'Presiona ENTER para continuar...') {
  return new Promise(resolve => {
    rl.question(`\n${message}`, () => {
      resolve();
    });
  });
}

async function main() {
  try {
    console.clear();
    colorLog('========================================', 'blue');
    colorLog('   THE BROTHERS BARBER SHOP - DEV MODE', 'blue');
    colorLog('========================================', 'blue');
    console.log('');
    
    colorLog(`📁 Directorio: ${process.cwd()}`, 'cyan');
    console.log('');
    
    // Verificar archivos básicos
    if (!fs.existsSync('package.json')) {
      colorLog('❌ package.json no encontrado', 'red');
      await pauseForUser('❌ Error: Ejecuta desde la raíz del proyecto. Presiona ENTER...');
      process.exit(1);
    }
    
    if (!fs.existsSync('backend') || !fs.existsSync('frontend')) {
      colorLog('❌ Carpetas backend/frontend no encontradas', 'red');
      await pauseForUser('❌ Error: Estructura de proyecto incorrecta. Presiona ENTER...');
      process.exit(1);
    }
    
    colorLog('✅ Estructura del proyecto verificada', 'green');
    
    // Verificar dependencias backend
    if (!fs.existsSync('backend/node_modules')) {
      colorLog('📦 Instalando dependencias del backend...', 'yellow');
      await new Promise((resolve, reject) => {
        const install = spawn('npm', ['install'], { cwd: 'backend', stdio: 'pipe' });
        install.on('close', (code) => {
          if (code === 0) {
            colorLog('✅ Dependencias del backend instaladas', 'green');
            resolve();
          } else {
            reject(new Error(`npm install backend falló con código ${code}`));
          }
        });
      });
    }
    
    // Verificar dependencias frontend
    if (!fs.existsSync('frontend/node_modules')) {
      colorLog('📦 Instalando dependencias del frontend...', 'yellow');
      await new Promise((resolve, reject) => {
        const install = spawn('npm', ['install'], { cwd: 'frontend', stdio: 'pipe' });
        install.on('close', (code) => {
          if (code === 0) {
            colorLog('✅ Dependencias del frontend instaladas', 'green');
            resolve();
          } else {
            reject(new Error(`npm install frontend falló con código ${code}`));
          }
        });
      });
    }
    
    console.log('');
    colorLog('🚀 Iniciando servidores...', 'cyan');
    console.log('');
    
    // Iniciar backend
    colorLog('🟣 Iniciando Backend...', 'magenta');
    const npmExecutable = getNpmExecutable();
    const backendProcess = spawn(npmExecutable, ['run', 'dev'], { 
      cwd: 'backend', 
      stdio: 'pipe',
      shell: process.platform === 'win32'
    });
    
    backendProcess.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        const timestamp = new Date().toLocaleTimeString();
        output.split('\n').forEach(line => {
          if (line.trim()) colorLog(`[${timestamp}] [Backend] ${line.trim()}`, 'magenta');
        });
      }
    });
    
    backendProcess.stderr.on('data', (data) => {
      const output = data.toString().trim();
      if (output && !output.includes('Warning') && !output.includes('ExperimentalWarning')) {
        const timestamp = new Date().toLocaleTimeString();
        colorLog(`[${timestamp}] [Backend] ${output}`, 'red');
      }
    });
    
    // Esperar 3 segundos antes de iniciar frontend
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Iniciar frontend
    colorLog('🔵 Iniciando Frontend...', 'blue');
    const frontendProcess = spawn(npmExecutable, ['run', 'dev'], { 
      cwd: 'frontend', 
      stdio: 'pipe',
      shell: process.platform === 'win32'
    });
    
    frontendProcess.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        const timestamp = new Date().toLocaleTimeString();
        output.split('\n').forEach(line => {
          if (line.trim()) colorLog(`[${timestamp}] [Frontend] ${line.trim()}`, 'blue');
        });
      }
    });
    
    frontendProcess.stderr.on('data', (data) => {
      const output = data.toString().trim();
      if (output && !output.includes('Warning') && !output.includes('ExperimentalWarning')) {
        const timestamp = new Date().toLocaleTimeString();
        colorLog(`[${timestamp}] [Frontend] ${output}`, 'red');
      }
    });
    
    console.log('');
    colorLog('========================================', 'green');
    colorLog('   SERVIDORES EJECUTÁNDOSE', 'green');
    colorLog('========================================', 'green');
    colorLog('🌐 Backend: http://localhost:5000', 'yellow');
    colorLog('🌐 Frontend: http://10.50.246.104:5173', 'yellow');
    colorLog('💡 Presiona Ctrl+C para detener', 'cyan');
    console.log('');
    
    // Abrir navegador después de 5 segundos
    setTimeout(() => {
      const { exec } = require('child_process');
      exec('start http://10.50.246.104:5173');
    }, 5000);
    
    // Indicador cada 30 segundos
    const keepAlive = setInterval(() => {
      const timestamp = new Date().toLocaleTimeString();
      colorLog(`[${timestamp}] Servidores ejecutándose...`, 'green');
    }, 120000);
    
    // Manejo de cierre
    const cleanup = () => {
      clearInterval(keepAlive);
      colorLog('\n🛑 Cerrando servidores...', 'yellow');
      
      if (backendProcess && !backendProcess.killed) {
        backendProcess.kill('SIGTERM');
      }
      if (frontendProcess && !frontendProcess.killed) {
        frontendProcess.kill('SIGTERM');
      }
      
      setTimeout(() => {
        colorLog('✅ Servidores cerrados', 'green');
        rl.close();
        process.exit(0);
      }, 2000);
    };
    
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    
    // Mantener ejecutándose
    await new Promise(() => {});
    
  } catch (error) {
    console.error('');
    colorLog(`❌ ERROR: ${error.message}`, 'red');
    console.error(error.stack);
    await pauseForUser('❌ Ha ocurrido un error. Presiona ENTER para cerrar...');
    rl.close();
    process.exit(1);
  }
}

// Manejo global de errores
process.on('uncaughtException', async (error) => {
  console.error('');
  colorLog('❌ ERROR NO CAPTURADO:', 'red');
  console.error(error.message);
  console.error(error.stack);
  
  try {
    await pauseForUser('❌ Error crítico. Presiona ENTER para cerrar...');
  } catch (e) {
    console.error('Error en pauseForUser:', e);
  }
  
  process.exit(1);
});

process.on('unhandledRejection', async (reason) => {
  console.error('');
  colorLog('❌ PROMESA RECHAZADA:', 'red');
  console.error(reason);
  
  try {
    await pauseForUser('❌ Error en promesa. Presiona ENTER para cerrar...');
  } catch (e) {
    console.error('Error en pauseForUser:', e);
  }
  
  process.exit(1);
});

// Ejecutar
if (require.main === module) {
  main().catch(async (error) => {
    console.error('');
    colorLog(`❌ ERROR PRINCIPAL: ${error.message}`, 'red');
    
    try {
      await pauseForUser('❌ Error en main. Presiona ENTER para cerrar...');
    } catch (e) {
      console.error('Error en pauseForUser:', e);
    }
    
    process.exit(1);
  });
}
