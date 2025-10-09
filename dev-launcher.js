#!/usr/bin/env node

/**
 * The Brothers Barber Shop - Development Server Launcher (Simplified & Modern)
 */

const { execa } = require('execa');
const fs = require('fs');
const readline = require('readline');

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

// Función para filtrar warnings de npm
function filterNpmWarnings(output) {
  const lines = output.split('\n');
  return lines.filter(line => {
    const trimmed = line.trim();
    return !(
      trimmed.includes('npm warn config') ||
      trimmed.includes('Use `--omit=dev` instead') ||
      trimmed.includes('Use `--omit=optional`') ||
      trimmed.includes('Default value does install') ||
      trimmed.includes('Please use --include=dev') ||
      trimmed.includes('This option has been deprecated') ||
      trimmed.includes('--prefer-online') ||
      trimmed === 'npm warn config' ||
      trimmed === ''
    );
  }).join('\n');
}

async function main() {
  let frontendProcess, backendProcess;
  
  try {
    console.clear();
    colorLog('THE BROTHERS BARBER SHOP - DEV MODE', 'blue');
    console.log('');
    colorLog(`Ruta : ${process.cwd()}`, 'cyan');
    console.log('');
    colorLog('  SERVIDORES EJECUTÁNDOSE', 'green');
    colorLog('Frontend: http://localhost:5173', 'blue');
    colorLog('Backend: http://localhost:5000', 'magenta');
    colorLog('Presiona Ctrl+C para detener', 'cyan');
    console.log('');
      
 
    // Verificar estructura del proyecto
    if (!fs.existsSync('package.json')) {
      colorLog('package.json no encontrado', 'red');
      process.exit(1);
    }
    
    if (!fs.existsSync('backend') || !fs.existsSync('frontend')) {
      colorLog('Carpetas backend/frontend no encontradas', 'red');
      process.exit(1);
    }
    
    colorLog('Estructura del proyecto verificada', 'green');
    
    // Verificar dependencias
    for (const folder of ['backend', 'frontend']) {
      if (!fs.existsSync(`${folder}/node_modules`)) {
        colorLog(`Instalando dependencias del ${folder}...`, 'yellow');
        try {
          await execa('npm', ['install'], { 
            cwd: folder,
            shell: true,
            env: {
              ...process.env,
              NODE_NO_WARNINGS: '1',
              NODE_OPTIONS: '--no-warnings --no-deprecation'
            }
          });
          colorLog(`Dependencias del ${folder} instaladas`, 'green');
        } catch (error) {
          throw new Error(`npm install ${folder} falló: ${error.message}`);
        }
      }
    }
    
    colorLog('Iniciando servidores...', 'cyan');
    
    // ===== FRONTEND PRIMERO =====
    colorLog('Iniciando Frontend...', 'blue');
    
    frontendProcess = execa('npm', ['run', 'dev'], { 
      cwd: 'frontend',
      shell: true,
      env: { 
        ...process.env, 
        NODE_NO_WARNINGS: '1',
        NODE_OPTIONS: '--no-warnings --no-deprecation',
        npm_config_fund: 'false',
        npm_config_audit: 'false',
        npm_config_loglevel: 'error'
      },
      reject: false
    });
    
    let frontendReady = false;
    
    frontendProcess.stdout.on('data', (data) => {
      const output = filterNpmWarnings(data.toString().trim());
      if (output) {
        const timestamp = new Date().toLocaleTimeString();
        output.split('\n').forEach(line => {
          const trimmed = line.trim();
          if (trimmed) {
            colorLog(`[${timestamp}] [Frontend] ${trimmed}`, 'blue');
            
            // Detectar cuando Vite está listo
            if ((trimmed.includes('ready in') || 
                trimmed.includes('Local:') || 
                (trimmed.includes('VITE') && trimmed.includes('ready'))) && !frontendReady) {
              frontendReady = true;
              setTimeout(() => {
                startBackend();
              }, 1000);
            }
          }
        });
      }
    });
    
    frontendProcess.stderr.on('data', (data) => {
      const output = filterNpmWarnings(data.toString().trim());
      if (output && !output.includes('Warning') && !output.includes('ExperimentalWarning')) {
        const timestamp = new Date().toLocaleTimeString();
        colorLog(`[${timestamp}] [Frontend] ${output}`, 'red');
      }
    });

    // Timeout para frontend
    setTimeout(() => {
      if (!frontendReady) {
        colorLog('⚠️ Frontend iniciado (timeout) - iniciando Backend...', 'yellow');
        startBackend();
      }
    }, 15000);

    
    // ===== FUNCIÓN PARA INICIAR BACKEND =====
    function startBackend() {
      if (frontendReady) {        
      }
      
      colorLog('Iniciando Backend...', 'magenta');
      
      backendProcess = execa('npm', ['run', 'dev'], { 
        cwd: 'backend',
        shell: true,
        env: { 
          ...process.env, 
          NODE_NO_WARNINGS: '1',
          NODE_OPTIONS: '--no-warnings --no-deprecation',
          npm_config_fund: 'false',
          npm_config_audit: 'false',
          npm_config_loglevel: 'error'
        },
        reject: false
      });
      
      backendProcess.stdout.on('data', (data) => {
        const output = filterNpmWarnings(data.toString().trim());
        if (output) {
          const timestamp = new Date().toLocaleTimeString();
          output.split('\n').forEach(line => {
            if (line.trim()) colorLog(`[${timestamp}] [Backend] ${line.trim()}`, 'magenta');
          });
        }
      });
      
      backendProcess.stderr.on('data', (data) => {
        const output = filterNpmWarnings(data.toString().trim());
        if (output && !output.includes('Warning') && !output.includes('ExperimentalWarning') && !output.includes('DeprecationWarning')) {
          const timestamp = new Date().toLocaleTimeString();
          colorLog(`[${timestamp}] [Backend] ${output}`, 'red');
        }
      });     
    }
    
    // Abrir navegador
    setTimeout(async () => {
      try {
        if (process.platform === 'win32') {
          await execa('cmd', ['/c', 'start', 'http://localhost:5173'], { reject: false });
        } else if (process.platform === 'darwin') {
          await execa('open', ['http://localhost:5173'], { reject: false });
        } else {
          await execa('xdg-open', ['http://localhost:5173'], { reject: false });
        }
      } catch (error) {
        colorLog('ℹ️ No se pudo abrir el navegador automáticamente', 'yellow');
      }
    }, 8000);
    
    // Indicador cada 2 minutos
    const keepAlive = setInterval(() => {
      const timestamp = new Date().toLocaleTimeString();
      colorLog(`[${timestamp}] Servidores ejecutándose...`, 'green');
    }, 120000);
    
    // Manejo de cierre
    const cleanup = () => {
      clearInterval(keepAlive);
      colorLog('\n🛑 Cerrando servidores...', 'yellow');
      
      if (backendProcess && backendProcess.kill) {
        try {
          backendProcess.kill('SIGTERM');
        } catch (error) {
          if (backendProcess.pid) {
            process.kill(backendProcess.pid, 'SIGTERM');
          }
        }
      }
      
      if (frontendProcess && frontendProcess.kill) {
        try {
          frontendProcess.kill('SIGTERM');
        } catch (error) {
          if (frontendProcess.pid) {
            process.kill(frontendProcess.pid, 'SIGTERM');
          }
        }
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
    rl.close();
    process.exit(1);
  }
}

// Manejo global de errores
process.on('uncaughtException', async (error) => {
  console.error('');
  colorLog('❌ ERROR NO CAPTURADO:', 'red');
  console.error(error.message);
  process.exit(1);
});

process.on('unhandledRejection', async (reason) => {
  console.error('');
  colorLog('❌ PROMESA RECHAZADA:', 'red');
  console.error(reason);
  process.exit(1);
});

// Ejecutar
if (require.main === module) {
  main().catch((error) => {
    colorLog(`❌ ERROR PRINCIPAL: ${error.message}`, 'red');
    process.exit(1);
  });
}