import ExcelJS from 'exceljs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  title: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`),
  step: (msg) => console.log(`${colors.magenta}▸${colors.reset} ${msg}`)
};

// Mock de datos de snapshot
const mockSnapshot = {
  _id: '507f1f77bcf86cd799439011',
  date: new Date(),
  totalItems: 12,
  totalDifference: -5,
  items: [
    {
      productName: 'Pomada Gatsby Moving Rubber',
      category: 'productos',
      initialStock: 50,
      entries: 20,
      exits: 5,
      sales: 15,
      expectedStock: 50,
      realStock: 48,
      difference: -2
    },
    {
      productName: 'Gel American Crew',
      category: 'productos',
      initialStock: 30,
      entries: 10,
      exits: 2,
      sales: 8,
      expectedStock: 30,
      realStock: 32,
      difference: 2
    },
    {
      productName: 'Cera Layrite',
      category: 'productos',
      initialStock: 25,
      entries: 15,
      exits: 3,
      sales: 10,
      expectedStock: 27,
      realStock: 25,
      difference: -2
    },
    {
      productName: 'Navaja Profesional',
      category: 'herramientas',
      initialStock: 5,
      entries: 2,
      exits: 0,
      sales: 1,
      expectedStock: 6,
      realStock: 6,
      difference: 0
    },
    {
      productName: 'Tijeras Profesionales',
      category: 'herramientas',
      initialStock: 8,
      entries: 0,
      exits: 1,
      sales: 0,
      expectedStock: 7,
      realStock: 7,
      difference: 0
    },
    {
      productName: 'Shampoo Head & Shoulders',
      category: 'productos',
      initialStock: 40,
      entries: 25,
      exits: 5,
      sales: 20,
      expectedStock: 40,
      realStock: 38,
      difference: -2
    },
    {
      productName: 'Aceite para Barba',
      category: 'productos',
      initialStock: 20,
      entries: 10,
      exits: 2,
      sales: 8,
      expectedStock: 20,
      realStock: 21,
      difference: 1
    },
    {
      productName: 'Toallas Desechables',
      category: 'insumos',
      initialStock: 100,
      entries: 50,
      exits: 30,
      sales: 0,
      expectedStock: 120,
      realStock: 118,
      difference: -2
    },
    {
      productName: 'Capa de Barbero',
      category: 'herramientas',
      initialStock: 10,
      entries: 0,
      exits: 0,
      sales: 0,
      expectedStock: 10,
      realStock: 10,
      difference: 0
    },
    {
      productName: 'Desinfectante Barbicide',
      category: 'insumos',
      initialStock: 15,
      entries: 10,
      exits: 8,
      sales: 0,
      expectedStock: 17,
      realStock: 17,
      difference: 0
    },
    {
      productName: 'Brochas para Afeitado',
      category: 'herramientas',
      initialStock: 12,
      entries: 5,
      exits: 1,
      sales: 2,
      expectedStock: 14,
      realStock: 14,
      difference: 0
    },
    {
      productName: 'Espuma de Afeitar',
      category: 'productos',
      initialStock: 35,
      entries: 20,
      exits: 5,
      sales: 15,
      expectedStock: 35,
      realStock: 35,
      difference: 0
    }
  ]
};

async function generateMockExcel() {
  log.title('🧪 TEST: GENERACIÓN DE EXCEL CON EXCELJS (MOCK DATA)');

  try {
    log.step('1. Creando workbook con ExcelJS...');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Inventario');
    log.success('Workbook creado');

    log.step('2. Agregando información del header...');
    const formattedDate = mockSnapshot.date.toLocaleDateString('es-ES');
    const headerInfo = [
      ['Inventario Guardado - The Brothers Barber Shop'],
      [`Fecha: ${formattedDate}`],
      [`Total de productos: ${mockSnapshot.totalItems}`],
      [`Diferencia total: ${mockSnapshot.totalDifference}`],
      []
    ];

    headerInfo.forEach((row, idx) => {
      const excelRow = worksheet.getRow(idx + 1);
      excelRow.values = row;
      if (idx === 0) {
        excelRow.font = { bold: true, size: 14, color: { argb: 'FF1F2937' } };
      } else if (idx < 4) {
        excelRow.font = { size: 11, color: { argb: 'FF374151' } };
      }
    });
    log.success('Headers agregados con estilos');

    log.step('3. Definiendo columnas con estilos...');
    worksheet.getRow(6).values = [
      'Producto', 'Categoría', 'Stock Inicial', 'Entradas',
      'Salidas', 'Ventas', 'Stock Esperado', 'Stock Real', 'Diferencia'
    ];
    worksheet.getRow(6).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(6).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF3B82F6' } // Azul profesional
    };
    worksheet.getRow(6).alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(6).height = 25;
    log.success('Columnas definidas con estilo azul');

    log.step('4. Configurando anchos de columna...');
    worksheet.columns = [
      { width: 30 },  // Producto
      { width: 15 },  // Categoría
      { width: 12 },  // Stock Inicial
      { width: 10 },  // Entradas
      { width: 10 },  // Salidas
      { width: 10 },  // Ventas
      { width: 15 },  // Stock Esperado
      { width: 12 },  // Stock Real
      { width: 12 }   // Diferencia
    ];
    log.success('Anchos optimizados');

    log.step('5. Agregando datos de productos...');
    let positiveCount = 0;
    let negativeCount = 0;
    let zeroCount = 0;

    mockSnapshot.items.forEach((item, idx) => {
      const row = worksheet.addRow([
        item.productName,
        item.category,
        item.initialStock,
        item.entries,
        item.exits,
        item.sales,
        item.expectedStock,
        item.realStock,
        item.difference
      ]);

      // Alineación de números
      for (let i = 3; i <= 9; i++) {
        row.getCell(i).alignment = { horizontal: 'center' };
      }

      // Colorear diferencias
      const diffCell = row.getCell(9);
      if (item.difference < 0) {
        diffCell.font = { bold: true, color: { argb: 'FFEF4444' } }; // Rojo
        negativeCount++;
      } else if (item.difference > 0) {
        diffCell.font = { bold: true, color: { argb: 'FF10B981' } }; // Verde
        positiveCount++;
      } else {
        diffCell.font = { color: { argb: 'FF6B7280' } }; // Gris
        zeroCount++;
      }

      // Alternar colores de fila para mejor lectura
      if (idx % 2 === 0) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF9FAFB' }
        };
      }
    });

    log.success(`${mockSnapshot.items.length} productos agregados`);
    log.info(`  └─ Diferencias positivas: ${positiveCount} (verde)`);
    log.info(`  └─ Diferencias negativas: ${negativeCount} (rojo)`);
    log.info(`  └─ Sin diferencias: ${zeroCount} (gris)`);

    log.step('6. Agregando bordes a las celdas...');
    const lastRow = 6 + mockSnapshot.items.length;
    for (let row = 6; row <= lastRow; row++) {
      for (let col = 1; col <= 9; col++) {
        const cell = worksheet.getRow(row).getCell(col);
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
        };
      }
    }
    log.success('Bordes agregados');

    log.step('7. Generando buffer del archivo...');
    const startTime = Date.now();
    const excelBuffer = await workbook.xlsx.writeBuffer();
    const generationTime = Date.now() - startTime;
    log.success(`Buffer generado en ${generationTime}ms`);

    log.step('8. Guardando archivo para inspección...');
    const outputDir = join(__dirname, '../uploads/temp');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const filename = `test-excel-exceljs-${Date.now()}.xlsx`;
    const filepath = join(outputDir, filename);
    fs.writeFileSync(filepath, excelBuffer);

    log.success(`Archivo guardado: ${filepath}`);

    log.step('9. Análisis de características implementadas...');
    console.log('\n📋 Características verificadas:');
    console.table({
      '✓ Header profesional': 'Con título y metadatos',
      '✓ Colores en header': 'Azul (#3B82F6) con texto blanco',
      '✓ Diferencias coloreadas': `${negativeCount} rojas, ${positiveCount} verdes`,
      '✓ Anchos optimizados': '9 columnas configuradas',
      '✓ Bordes': 'Todas las celdas de datos',
      '✓ Filas alternadas': 'Fondo gris claro para legibilidad',
      '✓ Alineación': 'Números centrados, texto a la izquierda',
      '✓ Formato Excel': 'XLSX (OpenXML)',
      '✓ Tamaño': `${(excelBuffer.length / 1024).toFixed(2)} KB`
    });

    log.step('10. Estadísticas del archivo generado:');
    console.table({
      'Productos procesados': mockSnapshot.totalItems,
      'Diferencia total': mockSnapshot.totalDifference,
      'Tiempo de generación': `${generationTime}ms`,
      'Tamaño del buffer': `${(excelBuffer.length / 1024).toFixed(2)} KB`,
      'Biblioteca': 'ExcelJS 4.4.0',
      'Ruta completa': filepath
    });

    log.title('✅ TEST COMPLETADO EXITOSAMENTE');
    
    console.log('📝 Próximos pasos de validación manual:');
    log.info('  1. Abrir el archivo Excel generado en Microsoft Excel o LibreOffice');
    log.info('  2. Verificar que el header tiene el título en grande y negrita');
    log.info('  3. Confirmar que los headers de columna tienen fondo azul');
    log.info('  4. Validar que las diferencias negativas están en ROJO');
    log.info('  5. Validar que las diferencias positivas están en VERDE');
    log.info('  6. Comprobar que los anchos de columna son apropiados');
    log.info('  7. Verificar que las filas alternan colores de fondo');
    log.info('  8. Confirmar que todos los bordes son visibles');
    
    console.log(`\n📂 Ubicación del archivo:`);
    console.log(`   ${filepath}`);
    
    return true;

  } catch (error) {
    log.error(`Error durante el test: ${error.message}`);
    console.error(error.stack);
    return false;
  }
}

async function main() {
  const success = await generateMockExcel();
  process.exit(success ? 0 : 1);
}

main();
