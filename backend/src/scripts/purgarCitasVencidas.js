import '../config/database.js';
import AppointmentService from '../services/appointmentService.js';

async function cleanupExpiredAppointments() {
  try {
    console.log('🧹 Iniciando limpieza de citas pendientes expiradas...');
    
    const result = await AppointmentService.cleanupExpiredPendingAppointments();
    
    console.log(`✅ Limpieza completada:`);
    console.log(`   - Citas limpiadas: ${result.cleaned}`);
    
    if (result.expiredAppointments.length > 0) {
      console.log(`   - Citas afectadas:`);
      result.expiredAppointments.forEach((app, index) => {
        console.log(`     ${index + 1}. ID: ${app.id} - Fecha: ${app.date}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error ejecutando limpieza:', error);
    process.exit(1);
  }
}

cleanupExpiredAppointments();
