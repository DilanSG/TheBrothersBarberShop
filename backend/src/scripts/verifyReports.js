/**
 * SCRIPT DE VERIFICACIÓN AUTOMÁTICA DE REPORTES
 * 
 * Este script verifica que todos los endpoints de reportes
 * devuelvan los datos correctos según los patrones generados
 */

import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

// Servicios a probar
import SaleService from '../services/saleService.js';
import AppointmentService from '../services/appointmentService.js';

// Modelos
import Sale from '../models/Sale.js';
import Appointment from '../models/Appointment.js';
import Barber from '../models/Barber.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '../../.env') });

// Patrones esperados (deben coincidir con strategicBarberDebug.js)
const EXPECTED_PATTERNS = {
  DAILY: { sales: 5, appointments: 3 },
  WEEKLY: { sales: 21, appointments: 14 },
  BIWEEKLY: { sales: 45, appointments: 30 },
  MONTHLY: { sales: 90, appointments: 60 }
};

class ReportVerifier {
  constructor() {
    this.results = [];
    this.errors = [];
  }

  async connect() {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('🔗 Conectado a MongoDB para verificación');
    } catch (error) {
      console.error('❌ Error conectando:', error);
      process.exit(1);
    }
  }

  async disconnect() {
    await mongoose.disconnect();
  }

  /**
   * Verificar conteos directos en base de datos
   */
  async verifyDirectCounts() {
    console.log('\n📊 VERIFICANDO CONTEOS DIRECTOS EN BD...');
    
    const now = new Date();
    const periods = [
      { name: 'DAILY', days: 0, expected: EXPECTED_PATTERNS.DAILY },
      { name: 'WEEKLY', days: 6, expected: EXPECTED_PATTERNS.WEEKLY },
      { name: 'BIWEEKLY', days: 14, expected: EXPECTED_PATTERNS.BIWEEKLY },
      { name: 'MONTHLY', days: 29, expected: EXPECTED_PATTERNS.MONTHLY }
    ];

    for (const period of periods) {
      const startDate = new Date(now);
      startDate.setDate(now.getDate() - period.days);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);

      // Contar ventas de testing
      const salesCount = await Sale.countDocuments({
        saleDate: { $gte: startDate, $lte: endDate },
        notes: { $regex: /STRATEGIC_TEST/ }
      });

      // Contar citas de testing
      const appointmentsCount = await Appointment.countDocuments({
        date: { $gte: startDate, $lte: endDate },
        notes: { $regex: /STRATEGIC_TEST/ }
      });

      const salesOK = salesCount === period.expected.sales;
      const appointmentsOK = appointmentsCount === period.expected.appointments;
      
      this.results.push({
        test: `DB_COUNT_${period.name}`,
        period: period.name,
        salesExpected: period.expected.sales,
        salesActual: salesCount,
        appointmentsExpected: period.expected.appointments,
        appointmentsActual: appointmentsCount,
        salesOK,
        appointmentsOK,
        overall: salesOK && appointmentsOK
      });

      const status = (salesOK && appointmentsOK) ? '✅' : '❌';
      console.log(`${status} ${period.name}: Ventas ${salesCount}/${period.expected.sales}, Citas ${appointmentsCount}/${period.expected.appointments}`);
    }
  }

  /**
   * Verificar el servicio SaleService.getReportByPeriod
   */
  async verifySaleServiceReports() {
    console.log('\n📈 VERIFICANDO SaleService.getReportByPeriod...');
    
    const today = new Date();
    const testCases = [
      { type: 'daily', date: today, expected: EXPECTED_PATTERNS.DAILY },
      { type: 'weekly', date: today, expected: EXPECTED_PATTERNS.WEEKLY },
      { type: 'monthly', date: today, expected: EXPECTED_PATTERNS.MONTHLY }
    ];

    for (const testCase of testCases) {
      try {
        const report = await SaleService.getReportByPeriod(testCase.type, testCase.date);
        
        // Contar ventas en el reporte
        let totalSales = 0;
        let totalAppointments = 0;
        
        if (report.productSales && Array.isArray(report.productSales)) {
          totalSales = report.productSales.reduce((sum, barber) => {
            return sum + (barber.sales ? barber.sales.length : 0);
          }, 0);
        }

        // Los reportes de SaleService también incluyen appointments
        if (report.appointments && Array.isArray(report.appointments)) {
          totalAppointments = report.appointments.reduce((sum, barber) => {
            return sum + (barber.appointments ? barber.appointments.length : 0);
          }, 0);
        }

        const salesOK = totalSales >= testCase.expected.sales * 0.8; // Permitir 20% de tolerancia
        const appointmentsOK = totalAppointments >= testCase.expected.appointments * 0.8;

        this.results.push({
          test: `SALE_SERVICE_${testCase.type.toUpperCase()}`,
          period: testCase.type.toUpperCase(),
          salesExpected: testCase.expected.sales,
          salesActual: totalSales,
          appointmentsExpected: testCase.expected.appointments,
          appointmentsActual: totalAppointments,
          salesOK,
          appointmentsOK,
          overall: salesOK && appointmentsOK,
          reportData: {
            productSalesCount: report.productSales ? report.productSales.length : 0,
            appointmentsCount: report.appointments ? report.appointments.length : 0
          }
        });

        const status = (salesOK && appointmentsOK) ? '✅' : '❌';
        console.log(`${status} ${testCase.type}: Ventas ${totalSales}/${testCase.expected.sales}, Citas ${totalAppointments}/${testCase.expected.appointments}`);

      } catch (error) {
        console.error(`❌ Error en reporte ${testCase.type}:`, error.message);
        this.errors.push({
          test: `SALE_SERVICE_${testCase.type.toUpperCase()}`,
          error: error.message
        });
      }
    }
  }

  /**
   * Verificar filtros por barbero específico
   */
  async verifyBarberFilters() {
    console.log('\n👨‍💼 VERIFICANDO FILTROS POR BARBERO...');

    // Obtener barberos que tienen datos de testing
    const barbersWithData = await Sale.aggregate([
      {
        $match: {
          notes: { $regex: /STRATEGIC_TEST/ }
        }
      },
      {
        $group: {
          _id: '$barberId',
          barberName: { $first: '$barberName' },
          salesCount: { $sum: 1 }
        }
      },
      {
        $sort: { salesCount: -1 }
      }
    ]);

    if (barbersWithData.length === 0) {
      console.log('⚠️ No se encontraron barberos con datos de testing');
      return;
    }

    console.log(`Probando con ${barbersWithData.length} barberos:`);

    for (const barberData of barbersWithData) {
      try {
        // Probar reporte mensual filtrado por barbero
        const report = await SaleService.getReportByPeriod('monthly', new Date());
        
        // Filtrar por barbero específico (simulando lo que hace el controlador)
        const barberReport = report.productSales ? 
          report.productSales.filter(b => String(b._id) === String(barberData._id)) : [];

        const hasBarberData = barberReport.length > 0;
        
        this.results.push({
          test: `BARBER_FILTER_${barberData.barberName.replace(/\s+/g, '_')}`,
          period: 'MONTHLY_FILTERED',
          barberId: barberData._id,
          barberName: barberData.barberName,
          expectedData: true,
          actualData: hasBarberData,
          overall: hasBarberData,
          details: barberReport[0] || null
        });

        const status = hasBarberData ? '✅' : '❌';
        console.log(`${status} ${barberData.barberName}: ${hasBarberData ? 'Datos encontrados' : 'Sin datos'}`);

      } catch (error) {
        console.error(`❌ Error filtrando barbero ${barberData.barberName}:`, error.message);
        this.errors.push({
          test: `BARBER_FILTER_${barberData.barberName}`,
          error: error.message
        });
      }
    }
  }

  /**
   * Verificar agregaciones y cálculos
   */
  async verifyAggregations() {
    console.log('\n🧮 VERIFICANDO CÁLCULOS Y AGREGACIONES...');

    try {
      // Verificar que las sumas de ingresos sean correctas
      const monthlyReport = await SaleService.getReportByPeriod('monthly', new Date());
      
      if (monthlyReport.productSales && monthlyReport.productSales.length > 0) {
        const totalRevenue = monthlyReport.productSales.reduce((sum, barber) => {
          return sum + (barber.totalRevenue || 0);
        }, 0);

        const totalProducts = monthlyReport.productSales.reduce((sum, barber) => {
          return sum + (barber.totalProducts || 0);
        }, 0);

        // Verificar que los totales sean positivos y coherentes
        const revenueOK = totalRevenue > 0;
        const productsOK = totalProducts > 0;
        const coherentOK = totalProducts <= EXPECTED_PATTERNS.MONTHLY.sales * 3; // Máximo 3 productos por venta

        this.results.push({
          test: 'AGGREGATION_CALCULATIONS',
          period: 'MONTHLY',
          totalRevenue,
          totalProducts,
          revenueOK,
          productsOK,
          coherentOK,
          overall: revenueOK && productsOK && coherentOK
        });

        const status = (revenueOK && productsOK && coherentOK) ? '✅' : '❌';
        console.log(`${status} Cálculos: Revenue $${totalRevenue.toLocaleString()}, Productos ${totalProducts}`);
      }

    } catch (error) {
      console.error('❌ Error en verificación de agregaciones:', error.message);
      this.errors.push({
        test: 'AGGREGATION_CALCULATIONS',
        error: error.message
      });
    }
  }

  /**
   * Generar reporte final
   */
  generateFinalReport() {
    console.log('\n📋 REPORTE FINAL DE VERIFICACIÓN');
    console.log('='.repeat(80));

    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.overall).length;
    const failedTests = totalTests - passedTests;
    const errorCount = this.errors.length;

    console.log(`\n📊 RESUMEN:`);
    console.log(`   Total pruebas: ${totalTests}`);
    console.log(`   Exitosas: ${passedTests} ✅`);
    console.log(`   Fallidas: ${failedTests} ❌`);
    console.log(`   Errores: ${errorCount} 🚨`);

    const successRate = totalTests > 0 ? (passedTests / totalTests * 100).toFixed(1) : 0;
    console.log(`   Tasa de éxito: ${successRate}%`);

    if (failedTests > 0) {
      console.log(`\n❌ PRUEBAS FALLIDAS:`);
      this.results.filter(r => !r.overall).forEach(result => {
        console.log(`   • ${result.test}: ${result.period}`);
        if (result.salesExpected) {
          console.log(`     Ventas: ${result.salesActual}/${result.salesExpected}`);
        }
        if (result.appointmentsExpected) {
          console.log(`     Citas: ${result.appointmentsActual}/${result.appointmentsExpected}`);
        }
      });
    }

    if (this.errors.length > 0) {
      console.log(`\n🚨 ERRORES:`);
      this.errors.forEach(error => {
        console.log(`   • ${error.test}: ${error.error}`);
      });
    }

    if (passedTests === totalTests && errorCount === 0) {
      console.log('\n🎉 ¡TODAS LAS VERIFICACIONES PASARON!');
      console.log('✅ Los reportes de admin/barberos están funcionando correctamente');
    } else {
      console.log('\n⚠️ Algunas verificaciones fallaron');
      console.log('🔧 Revisa los errores arriba para corregir los problemas');
    }

    return {
      totalTests,
      passedTests,
      failedTests,
      errorCount,
      successRate: parseFloat(successRate),
      allPassed: passedTests === totalTests && errorCount === 0
    };
  }

  /**
   * Ejecutar todas las verificaciones
   */
  async runAllVerifications() {
    console.log('🔍 INICIANDO VERIFICACIÓN AUTOMÁTICA DE REPORTES');
    console.log('='.repeat(60));

    try {
      await this.connect();
      
      await this.verifyDirectCounts();
      await this.verifySaleServiceReports();
      await this.verifyBarberFilters();
      await this.verifyAggregations();
      
      const summary = this.generateFinalReport();
      
      return summary;

    } catch (error) {
      console.error('❌ Error en verificación:', error);
      throw error;
    } finally {
      await this.disconnect();
    }
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const verifier = new ReportVerifier();
  verifier.runAllVerifications()
    .then(summary => {
      process.exit(summary.allPassed ? 0 : 1);
    })
    .catch(error => {
      console.error('Error fatal:', error);
      process.exit(1);
    });
}

export default ReportVerifier;
