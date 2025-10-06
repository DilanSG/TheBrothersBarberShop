#!/usr/bin/env node

/**
 * Script de migración automática: Console.log → Logger centralizado
 * Convierte todos los console.log, console.warn, console.error a logger
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colores para terminal
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = (message, color = colors.reset) => {
  console.log(`${color}${message}${colors.reset}`);
};

class LoggerMigrator {
  constructor() {
    this.processed = 0;
    this.migrated = 0;
    this.errors = 0;
    this.report = [];
  }

  // Patrones a migrar
  getPatterns() {
    return [
      // console.log → logger.info
      {
        pattern: /console\.log\(/g,
        replacement: 'logger.info(',
        type: 'info'
      },
      // console.warn → logger.warn
      {
        pattern: /console\.warn\(/g,
        replacement: 'logger.warn(',
        type: 'warn'
      },
      // console.error → logger.error
      {
        pattern: /console\.error\(/g,
        replacement: 'logger.error(',
        type: 'error'
      },
      // console.debug → logger.debug
      {
        pattern: /console\.debug\(/g,
        replacement: 'logger.debug(',
        type: 'debug'
      }
    ];
  }

  // Verificar si el archivo ya importa el logger
  hasLoggerImport(content) {
    const importPatterns = [
      /import.*logger.*from/i,
      /const.*logger.*require/i,
      /import.*{.*logger.*}.*from/i
    ];
    
    return importPatterns.some(pattern => pattern.test(content));
  }

  // Añadir import del logger si es necesario
  addLoggerImport(content, filePath) {
    if (this.hasLoggerImport(content)) {
      return content;
    }

    // Determinar la ruta relativa al logger
    const relativePath = this.getLoggerImportPath(filePath);
    
    // Buscar dónde insertar el import
    const lines = content.split('\n');
    let insertIndex = 0;
    
    // Buscar después de los últimos imports existentes
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('import ') || lines[i].trim().startsWith('const ')) {
        insertIndex = i + 1;
      } else if (lines[i].trim() === '' || lines[i].trim().startsWith('//')) {
        continue;
      } else {
        break;
      }
    }

    // Insertar el import del logger
    const loggerImport = `import { logger } from '${relativePath}';`;
    lines.splice(insertIndex, 0, loggerImport, '');
    
    return lines.join('\n');
  }

  // Calcular ruta relativa al logger
  getLoggerImportPath(filePath) {
    if (filePath.includes('backend')) {
      // Para archivos del backend
      if (filePath.includes('scripts')) {
        return '../src/shared/utils/logger.js';
      } else if (filePath.includes('src')) {
        const depth = (filePath.split('src/')[1].match(/\//g) || []).length;
        const relativeDots = '../'.repeat(depth);
        return `${relativeDots}shared/utils/logger.js`;
      }
    } else if (filePath.includes('frontend')) {
      // Para archivos del frontend
      const depth = (filePath.split('src/')[1].match(/\//g) || []).length;
      const relativeDots = '../'.repeat(depth);
      return `${relativeDots}shared/utils/logger.js`;
    }
    
    return './shared/utils/logger.js'; // Fallback
  }

  // Procesar un archivo individual
  async processFile(filePath) {
    try {
      this.processed++;
      
      let content = fs.readFileSync(filePath, 'utf8');
      let modified = false;
      let changes = 0;

      // Aplicar cada patrón
      const patterns = this.getPatterns();
      for (const { pattern, replacement, type } of patterns) {
        const matches = content.match(pattern);
        if (matches) {
          content = content.replace(pattern, replacement);
          changes += matches.length;
          modified = true;
        }
      }

      if (modified) {
        // Añadir import del logger si es necesario
        content = this.addLoggerImport(content, filePath);
        
        // Escribir el archivo modificado
        fs.writeFileSync(filePath, content, 'utf8');
        
        this.migrated++;
        this.report.push({
          file: filePath,
          changes,
          status: 'migrated'
        });
        
        log(`✅ Migrado: ${path.relative(process.cwd(), filePath)} (${changes} cambios)`, colors.green);
      }

    } catch (error) {
      this.errors++;
      this.report.push({
        file: filePath,
        error: error.message,
        status: 'error'
      });
      
      log(`❌ Error en: ${path.relative(process.cwd(), filePath)} - ${error.message}`, colors.red);
    }
  }

  // Buscar archivos a procesar
  findFilesToProcess(dir, extensions = ['.js', '.jsx', '.ts', '.tsx']) {
    const files = [];
    
    const processDir = (currentDir) => {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          // Excluir node_modules, .git, dist, build
          if (!['node_modules', '.git', 'dist', 'build', 'coverage'].includes(item)) {
            processDir(fullPath);
          }
        } else if (stat.isFile()) {
          const ext = path.extname(fullPath);
          if (extensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    };

    processDir(dir);
    return files;
  }

  // Ejecutar migración
  async migrate() {
    log('🚀 Iniciando migración de console.log a logger centralizado...', colors.cyan);
    
    const projectRoot = path.resolve(__dirname, '..');
    const filesToProcess = this.findFilesToProcess(projectRoot);
    
    log(`📁 Encontrados ${filesToProcess.length} archivos para procesar`, colors.blue);
    
    // Procesar archivos
    for (const file of filesToProcess) {
      await this.processFile(file);
    }
    
    // Generar reporte final
    this.generateReport();
  }

  // Generar reporte de migración
  generateReport() {
    log('\n📊 REPORTE DE MIGRACIÓN', colors.cyan);
    log('========================', colors.cyan);
    log(`📄 Archivos procesados: ${this.processed}`, colors.yellow);
    log(`✅ Archivos migrados: ${this.migrated}`, colors.green);
    log(`❌ Errores: ${this.errors}`, this.errors > 0 ? colors.red : colors.green);
    
    if (this.migrated > 0) {
      log('\n🔄 Archivos modificados:', colors.yellow);
      const migrated = this.report.filter(r => r.status === 'migrated');
      migrated.forEach(({ file, changes }) => {
        log(`  • ${path.relative(process.cwd(), file)} (${changes} cambios)`, colors.green);
      });
    }
    
    if (this.errors > 0) {
      log('\n⚠️  Errores encontrados:', colors.red);
      const errored = this.report.filter(r => r.status === 'error');
      errored.forEach(({ file, error }) => {
        log(`  • ${path.relative(process.cwd(), file)}: ${error}`, colors.red);
      });
    }

    // Guardar reporte en archivo
    const reportPath = path.join(process.cwd(), 'migration-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: {
        processed: this.processed,
        migrated: this.migrated,
        errors: this.errors
      },
      details: this.report
    }, null, 2));

    log(`\n📋 Reporte detallado guardado en: ${reportPath}`, colors.blue);
    
    if (this.migrated > 0) {
      log('\n🎉 ¡Migración completada exitosamente!', colors.green);
      log('💡 Recuerda revisar los archivos modificados y hacer commit de los cambios.', colors.yellow);
    } else {
      log('\n✨ No se encontraron console.log para migrar. ¡El proyecto ya está limpio!', colors.green);
    }
  }
}

// Ejecutar migración si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const migrator = new LoggerMigrator();
  migrator.migrate().catch(error => {
    log(`❌ Error durante la migración: ${error.message}`, colors.red);
    process.exit(1);
  });
}

export default LoggerMigrator;