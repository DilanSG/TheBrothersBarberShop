/**
 * Script para migrar todos los console.log/error/warn restantes a logger
 * Ejecutar: node scripts/migrate-remaining-logs.js
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Archivos a procesar (usecases y otros archivos de producción)
const filesToProcess = [
  'backend/src/core/application/usecases/saleService.js',
  'backend/src/core/application/usecases/appointmentService.js',
];

// Patrones de reemplazo
const replacements = [
  {
    pattern: /console\.log\(/g,
    replacement: 'logger.info(',
    description: 'console.log → logger.info'
  },
  {
    pattern: /console\.error\(/g,
    replacement: 'logger.error(',
    description: 'console.error → logger.error'
  },
  {
    pattern: /console\.warn\(/g,
    replacement: 'logger.warn(',
    description: 'console.warn → logger.warn'
  },
  {
    pattern: /console\.info\(/g,
    replacement: 'logger.info(',
    description: 'console.info → logger.info'
  },
  {
    pattern: /console\.debug\(/g,
    replacement: 'logger.debug(',
    description: 'console.debug → logger.debug'
  }
];

async function migrateFile(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);
  console.log(`\n📝 Procesando: ${filePath}`);
  
  try {
    let content = await fs.readFile(fullPath, 'utf-8');
    const originalContent = content;
    let changesCount = 0;
    
    // Verificar si ya tiene el import de logger
    const hasLoggerImport = content.includes('import { logger }') || content.includes('from \'../../../shared/utils/logger.js\'');
    
    // Aplicar reemplazos
    for (const { pattern, replacement, description } of replacements) {
      const matches = content.match(pattern);
      if (matches) {
        content = content.replace(pattern, replacement);
        changesCount += matches.length;
        console.log(`  ✅ ${description}: ${matches.length} ocurrencias`);
      }
    }
    
    // Agregar import de logger si no existe y se hicieron cambios
    if (changesCount > 0 && !hasLoggerImport) {
      // Buscar el último import
      const importRegex = /import .+ from .+;/g;
      const imports = content.match(importRegex);
      
      if (imports && imports.length > 0) {
        const lastImport = imports[imports.length - 1];
        const loggerImport = "import { logger } from '../../../shared/utils/logger.js';";
        content = content.replace(lastImport, `${lastImport}\n${loggerImport}`);
        console.log(`  ➕ Agregado import de logger`);
      }
    }
    
    if (content !== originalContent) {
      await fs.writeFile(fullPath, content, 'utf-8');
      console.log(`  ✅ Archivo actualizado: ${changesCount} cambios`);
      return { file: filePath, changes: changesCount };
    } else {
      console.log(`  ⏭️  Sin cambios necesarios`);
      return { file: filePath, changes: 0 };
    }
    
  } catch (error) {
    console.error(`  ❌ Error procesando ${filePath}:`, error.message);
    return { file: filePath, changes: 0, error: error.message };
  }
}

async function main() {
  console.log('🚀 Iniciando migración de logs a logger...\n');
  
  const results = [];
  
  for (const file of filesToProcess) {
    const result = await migrateFile(file);
    results.push(result);
  }
  
  console.log('\n\n📊 RESUMEN DE MIGRACIÓN:');
  console.log('═'.repeat(50));
  
  let totalChanges = 0;
  let filesUpdated = 0;
  
  for (const result of results) {
    if (result.changes > 0) {
      console.log(`✅ ${result.file}: ${result.changes} cambios`);
      totalChanges += result.changes;
      filesUpdated++;
    } else if (result.error) {
      console.log(`❌ ${result.file}: ERROR - ${result.error}`);
    } else {
      console.log(`⏭️  ${result.file}: Sin cambios`);
    }
  }
  
  console.log('═'.repeat(50));
  console.log(`\n📈 Total: ${totalChanges} console.* migrados a logger en ${filesUpdated} archivos`);
  console.log('\n✨ Migración completada!');
}

main().catch(console.error);
