/**
 * Script para migrar imports profundos a aliases de Vite en el frontend
 * Ejecutar: node scripts/migrate-frontend-aliases.js
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Patrones de reemplazo ordenados por prioridad (más específicos primero)
const aliasReplacements = [
  // Recurring expenses (3 niveles)
  {
    pattern: /from ['"]\.\.\/\.\.\/\.\.\/shared\/recurring-expenses(['"])/g,
    replacement: "from '@shared/recurring-expenses$1",
    description: '../../../shared/recurring-expenses → @shared/recurring-expenses'
  },
  // Shared paths de 3 niveles
  {
    pattern: /from ['"]\.\.\/\.\.\/\.\.\/shared\/utils\/([^'"]+)(['"])/g,
    replacement: "from '@utils/$1$2",
    description: '../../../shared/utils/* → @utils/*'
  },
  {
    pattern: /from ['"]\.\.\/\.\.\/\.\.\/shared\/components\/([^'"]+)(['"])/g,
    replacement: "from '@components/$1$2",
    description: '../../../shared/components/* → @components/*'
  },
  {
    pattern: /from ['"]\.\.\/\.\.\/\.\.\/shared\/hooks\/([^'"]+)(['"])/g,
    replacement: "from '@hooks/$1$2",
    description: '../../../shared/hooks/* → @hooks/*'
  },
  {
    pattern: /from ['"]\.\.\/\.\.\/\.\.\/shared\/services\/([^'"]+)(['"])/g,
    replacement: "from '@services/$1$2",
    description: '../../../shared/services/* → @services/*'
  },
  {
    pattern: /from ['"]\.\.\/\.\.\/\.\.\/shared\/contexts\/([^'"]+)(['"])/g,
    replacement: "from '@contexts/$1$2",
    description: '../../../shared/contexts/* → @contexts/*'
  },
  {
    pattern: /from ['"]\.\.\/\.\.\/\.\.\/shared\/([^'"]+)(['"])/g,
    replacement: "from '@shared/$1$2",
    description: '../../../shared/* → @shared/*'
  },
  
  // Shared paths de 2 niveles
  {
    pattern: /from ['"]\.\.\/\.\.\/shared\/utils\/([^'"]+)(['"])/g,
    replacement: "from '@utils/$1$2",
    description: '../../shared/utils/* → @utils/*'
  },
  {
    pattern: /from ['"]\.\.\/\.\.\/shared\/components\/([^'"]+)(['"])/g,
    replacement: "from '@components/$1$2",
    description: '../../shared/components/* → @components/*'
  },
  {
    pattern: /from ['"]\.\.\/\.\.\/shared\/hooks\/([^'"]+)(['"])/g,
    replacement: "from '@hooks/$1$2",
    description: '../../shared/hooks/* → @hooks/*'
  },
  {
    pattern: /from ['"]\.\.\/\.\.\/shared\/services\/([^'"]+)(['"])/g,
    replacement: "from '@services/$1$2",
    description: '../../shared/services/* → @services/*'
  },
  {
    pattern: /from ['"]\.\.\/\.\.\/shared\/contexts\/([^'"]+)(['"])/g,
    replacement: "from '@contexts/$1$2",
    description: '../../shared/contexts/* → @contexts/*'
  },
  {
    pattern: /from ['"]\.\.\/\.\.\/shared\/config\/([^'"]+)(['"])/g,
    replacement: "from '@shared/config/$1$2",
    description: '../../shared/config/* → @shared/config/*'
  },
  {
    pattern: /from ['"]\.\.\/\.\.\/shared\/constants\/([^'"]+)(['"])/g,
    replacement: "from '@shared/constants/$1$2",
    description: '../../shared/constants/* → @shared/constants/*'
  },
  {
    pattern: /from ['"]\.\.\/\.\.\/shared\/([^'"]+)(['"])/g,
    replacement: "from '@shared/$1$2",
    description: '../../shared/* → @shared/*'
  },
  
  // Shared paths de 1 nivel (menos comunes pero incluidos)
  {
    pattern: /from ['"]\.\.\/shared\/utils\/([^'"]+)(['"])/g,
    replacement: "from '@utils/$1$2",
    description: '../shared/utils/* → @utils/*'
  },
  {
    pattern: /from ['"]\.\.\/shared\/components\/([^'"]+)(['"])/g,
    replacement: "from '@components/$1$2",
    description: '../shared/components/* → @components/*'
  },
  {
    pattern: /from ['"]\.\.\/shared\/hooks\/([^'"]+)(['"])/g,
    replacement: "from '@hooks/$1$2",
    description: '../shared/hooks/* → @hooks/*'
  },
  {
    pattern: /from ['"]\.\.\/shared\/services\/([^'"]+)(['"])/g,
    replacement: "from '@services/$1$2",
    description: '../shared/services/* → @services/*'
  },
  {
    pattern: /from ['"]\.\.\/shared\/contexts\/([^'"]+)(['"])/g,
    replacement: "from '@contexts/$1$2",
    description: '../shared/contexts/* → @contexts/*'
  },
  {
    pattern: /from ['"]\.\.\/shared\/([^'"]+)(['"])/g,
    replacement: "from '@shared/$1$2",
    description: '../shared/* → @shared/*'
  }
];

async function migrateFile(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);
  
  try {
    let content = await fs.readFile(fullPath, 'utf-8');
    const originalContent = content;
    let changesCount = 0;
    const changes = [];
    
    // Aplicar reemplazos en orden de prioridad
    for (const { pattern, replacement, description } of aliasReplacements) {
      const matches = content.match(pattern);
      if (matches) {
        content = content.replace(pattern, replacement);
        const count = matches.length;
        changesCount += count;
        changes.push({ description, count });
      }
    }
    
    if (content !== originalContent) {
      await fs.writeFile(fullPath, content, 'utf-8');
      return { file: filePath, changes: changesCount, details: changes };
    } else {
      return { file: filePath, changes: 0 };
    }
    
  } catch (error) {
    return { file: filePath, changes: 0, error: error.message };
  }
}

// Función recursiva para encontrar archivos .js y .jsx
async function findFiles(dir, fileList = []) {
  const files = await fs.readdir(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = await fs.stat(filePath);
    
    if (stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('dist') && !file.includes('build')) {
        await findFiles(filePath, fileList);
      }
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      fileList.push(filePath);
    }
  }
  
  return fileList;
}

async function main() {
  console.log('🚀 Iniciando migración de aliases en frontend...\n');
  
  // Buscar todos los archivos .js y .jsx en frontend/src
  const frontendSrc = path.join(__dirname, '..', 'frontend', 'src');
  const files = await findFiles(frontendSrc);
  
  // Convertir a rutas relativas para mejor display
  const projectRoot = path.join(__dirname, '..');
  const relativeFiles = files.map(f => path.relative(projectRoot, f).replace(/\\/g, '/'));
  
  console.log(`📁 Encontrados ${relativeFiles.length} archivos para analizar\n`);
  
  const results = [];
  let filesProcessed = 0;
  let filesUpdated = 0;
  let totalChanges = 0;
  
  for (const file of relativeFiles) {
    filesProcessed++;
    const result = await migrateFile(file);
    
    if (result.changes > 0) {
      filesUpdated++;
      totalChanges += result.changes;
      console.log(`✅ ${file}`);
      for (const detail of result.details) {
        console.log(`   ${detail.description} (${detail.count}x)`);
      }
    } else if (result.error) {
      console.log(`❌ ${file}: ERROR - ${result.error}`);
    }
    
    results.push(result);
  }
  
  console.log('\n\n📊 RESUMEN DE MIGRACIÓN:');
  console.log('═'.repeat(60));
  console.log(`📁 Archivos procesados:   ${filesProcessed}`);
  console.log(`✅ Archivos actualizados: ${filesUpdated}`);
  console.log(`📝 Total de cambios:      ${totalChanges} imports migrados a aliases`);
  console.log('═'.repeat(60));
  
  // Mostrar archivos con más cambios
  const topFiles = results
    .filter(r => r.changes > 0)
    .sort((a, b) => b.changes - a.changes)
    .slice(0, 10);
  
  if (topFiles.length > 0) {
    console.log('\n🏆 TOP 10 archivos con más cambios:');
    topFiles.forEach((result, index) => {
      console.log(`${index + 1}. ${result.file}: ${result.changes} cambios`);
    });
  }
  
  console.log('\n✨ Migración completada!');
  console.log('\n💡 Próximos pasos:');
  console.log('   1. Verificar que la app compile sin errores: npm run dev');
  console.log('   2. Probar funcionalidades críticas en el navegador');
  console.log('   3. Commit de cambios si todo funciona correctamente');
}

main().catch(console.error);
