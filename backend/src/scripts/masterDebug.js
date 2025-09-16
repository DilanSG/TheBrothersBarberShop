/**
 * SCRIPT MAESTRO DE DEBUG PARA ADMIN/BARBEROS
 * 
 * Ejecuta todo el proceso de testing de forma automática:
 * 1. Genera datos estratégicos
 * 2. Verifica que los reportes funcionen
 * 3. Proporciona documentación de testing
 */

import BarberDebugger from './strategicBarberDebug.js';
import ReportVerifier from './verifyReports.js';
import TestDataCleaner from './cleanTestData.js';

class MasterDebugProcess {
  constructor() {
    this.debugger = new BarberDebugger();
    this.verifier = new ReportVerifier();
    this.cleaner = new TestDataCleaner();
  }

  async runFullDebugProcess() {
    console.log('🚀 PROCESO MAESTRO DE DEBUG - ADMIN/BARBEROS');
    console.log('='.repeat(70));
    console.log('Este proceso va a:');
    console.log('1. 🧹 Limpiar datos de testing previos');
    console.log('2. 📊 Generar datos estratégicos para testing');
    console.log('3. 🔍 Verificar que todos los reportes funcionen');
    console.log('4. 📖 Proporcionar guía de testing');
    console.log('');

    try {
      // Paso 1: Limpiar datos previos
      console.log('PASO 1/4: Limpiando datos previos...');
      await this.cleaner.run();

      // Paso 2: Generar datos estratégicos
      console.log('\nPASO 2/4: Generando datos estratégicos...');
      await this.debugger.run();

      // Paso 3: Verificar reportes
      console.log('\nPASO 3/4: Verificando reportes...');
      const verificationResult = await this.verifier.runAllVerifications();

      // Paso 4: Documentación final
      console.log('\nPASO 4/4: Generando documentación...');
      this.generateCompleteGuide(verificationResult);

      console.log('\n🎉 PROCESO MAESTRO COMPLETADO EXITOSAMENTE');
      return verificationResult;

    } catch (error) {
      console.error('❌ Error en proceso maestro:', error);
      throw error;
    }
  }

  generateCompleteGuide(verificationResult) {
    const guide = `
🎯 GUÍA COMPLETA DE DEBUG - ADMIN/BARBEROS
==========================================

📊 ESTADO DE VERIFICACIÓN:
   • Total pruebas: ${verificationResult.totalTests}
   • Exitosas: ${verificationResult.passedTests} ✅
   • Fallidas: ${verificationResult.failedTests} ❌
   • Tasa de éxito: ${verificationResult.successRate}%

${verificationResult.allPassed ? 
  '🎉 ¡TODOS LOS REPORTES FUNCIONAN CORRECTAMENTE!' : 
  '⚠️ Algunos reportes necesitan corrección'
}

📅 DATOS ESTRATÉGICOS GENERADOS:

┌─────────────────┬─────────┬─────────┬──────────────┐
│ PERÍODO         │ VENTAS  │ CITAS   │ INGRESOS     │
├─────────────────┼─────────┼─────────┼──────────────┤
│ HOY (1 día)     │   5     │   3     │ ~$15,000     │
│ SEMANA (7 días) │  21     │  14     │ ~$63,000     │
│ 15 DÍAS         │  45     │  30     │ ~$135,000    │
│ MES (30 días)   │  90     │  60     │ ~$270,000    │
└─────────────────┴─────────┴─────────┴──────────────┘

🔍 CÓMO PROBAR LAS FUNCIONALIDADES:

1️⃣ REPORTES GENERALES:
   • Ve a /admin/barberos o /admin/reportes
   • Selecciona cada filtro temporal (1, 7, 15, 30 días)
   • Verifica que los números coincidan con la tabla de arriba

2️⃣ FILTROS POR BARBERO:
   • Selecciona un barbero específico en el dropdown
   • Los datos deben filtrarse solo para ese barbero
   • La suma de todos los barberos = total general

3️⃣ ENDPOINTS API A PROBAR:
   • GET /api/v1/sales/reports?type=daily&date=2025-09-15
   • GET /api/v1/sales/reports?type=weekly&date=2025-09-15
   • GET /api/v1/sales/reports?type=monthly&date=2025-09-15
   • GET /api/v1/sales/reports?type=monthly&date=2025-09-15&barberId=BARBERO_ID

4️⃣ VERIFICACIONES DE CÁLCULOS:
   • Suma de ingresos por barbero = total general
   • Cantidad de productos vendidos ≤ (ventas × 3)
   • Fechas dentro del rango correcto
   • Estados de citas = 'completed'

🏷️ IDENTIFICAR DATOS DE TESTING:
   • VENTAS: Notas contienen "STRATEGIC_TEST"
   • CITAS: Notas contienen "STRATEGIC_TEST"
   • CLIENTES: Nombres "Cliente Test X-Y"

⚠️ CASOS EDGE A PROBAR:
   • Barberos sin datos en el período
   • Fechas futuras (no deben tener datos)
   • Filtros con barberId inexistente
   • Parámetros de fecha inválidos

🐛 SI ENCUENTRAS PROBLEMAS:

1. Verifica que los endpoints respondan sin errores
2. Compara las cantidades con las esperadas arriba
3. Revisa que los filtros temporales funcionen
4. Confirma que los filtros por barbero funcionen
5. Verifica que las sumas sean correctas

🔧 COMANDOS ÚTILES:

# Regenerar datos (si es necesario)
node strategicBarberDebug.js

# Verificar reportes nuevamente
node verifyReports.js

# Limpiar datos de testing cuando termines
node cleanTestData.js

# Proceso completo
node masterDebug.js

📱 TESTING EN FRONTEND:
   • Verifica que las cards de datos se actualicen
   • Confirma que los filtros cambien los números
   • Prueba la responsividad en móvil
   • Verifica que los gráficos (si existen) se actualicen

🗑️ LIMPIAR DESPUÉS DEL TESTING:
   Una vez que hayas terminado de probar, ejecuta:
   \`node cleanTestData.js\`
   
   Esto eliminará SOLO los datos de testing, manteniendo
   todos los datos reales del sistema.

💡 TIPS ADICIONALES:
   • Los datos se distribuyen estratégicamente entre barberos
   • Cada día tiene cantidades específicas conocidas
   • Los precios son consistentes para facilitar cálculos
   • Los datos más recientes tienen más actividad

📞 SOPORTE:
   Si algún reporte no devuelve los datos esperados,
   revisa los logs del backend y compara con los
   números de esta guía.

=================================================
🎯 ¡LISTOS PARA PROBAR TODAS LAS FUNCIONALIDADES!
=================================================
`;

    console.log(guide);
    return guide;
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const masterProcess = new MasterDebugProcess();
  masterProcess.runFullDebugProcess()
    .then(result => {
      process.exit(result.allPassed ? 0 : 1);
    })
    .catch(error => {
      console.error('Error fatal en proceso maestro:', error);
      process.exit(1);
    });
}

export default MasterDebugProcess;
