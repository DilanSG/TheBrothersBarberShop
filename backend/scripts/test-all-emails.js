/**
 * Script de Prueba Completa del Sistema de Emails
 * Envía emails de ejemplo de todos los templates implementados
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno desde el directorio correcto
// El script se ejecuta desde backend/, entonces .env está en la raíz actual
dotenv.config();

// IMPORTANTE: Importar emailService DESPUÉS de cargar dotenv
const { default: emailService } = await import('../src/services/emailService.js');

// Mock de datos para testing
const mockUser = {
  _id: '507f1f77bcf86cd799439011',
  name: 'Juan Pérez',
  email: process.env.TEST_EMAIL || process.env.EMAIL_FROM_ADDRESS || 'thebrobarbers20@gmail.com',
  phone: '3001234567',
  role: 'user'
};

const mockBarber = {
  _id: '507f1f77bcf86cd799439012',
  name: 'Carlos Rodríguez',
  email: process.env.TEST_EMAIL || process.env.EMAIL_FROM_ADDRESS || 'thebrobarbers20@gmail.com',
  specialty: 'Corte Clásico'
};

const mockAppointment = {
  _id: '507f1f77bcf86cd799439013',
  date: new Date(Date.now() + 86400000), // Mañana
  time: '10:00 AM',
  service: {
    name: 'Corte + Barba',
    price: 35000
  },
  barber: mockBarber,
  user: mockUser,
  notes: 'Por favor usar máquina número 2'
};

const mockSale = {
  _id: '507f1f77bcf86cd799439014',
  items: [
    {
      productName: 'Shampoo Premium',
      quantity: 2,
      price: 25000
    },
    {
      productName: 'Cera para Cabello',
      quantity: 1,
      price: 18000
    }
  ],
  total: 68000,
  discount: 5000,
  paymentMethod: 'Tarjeta de Crédito',
  barber: mockBarber,
  createdAt: new Date()
};

const DELAY_BETWEEN_EMAILS = 2000; // 2 segundos

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testAllEmails() {
  console.log('\n🚀 INICIANDO PRUEBA COMPLETA DEL SISTEMA DE EMAILS\n');
  console.log('═'.repeat(60));
  
  if (!emailService.isConfigured) {
    console.error('❌ ERROR: Servicio de email no configurado');
    console.log('\nVerifica tus variables de entorno:');
    console.log('  - SENDGRID_API_KEY (recomendado)');
    console.log('  - O EMAIL_USER + EMAIL_PASSWORD (SMTP)');
    process.exit(1);
  }

  const provider = emailService.provider === 'sendgrid' ? 'SendGrid' : 'SMTP';
  console.log(`\n✅ Provider Activo: ${provider}`);
  console.log(`📧 Emails de prueba se enviarán a: ${mockUser.email}\n`);
  console.log('═'.repeat(60));

  let successful = 0;
  let failed = 0;
  const tests = [];

  // Test 1: Email de Bienvenida
  tests.push({
    name: '1. Welcome Email (Registro)',
    fn: async () => {
      console.log('\n📧 1/10 - Enviando Welcome Email...');
      return await emailService.sendWelcomeEmail(mockUser);
    }
  });

  // Test 2: Login Notification
  tests.push({
    name: '2. Login Notification',
    fn: async () => {
      console.log('\n📧 2/10 - Enviando Login Notification...');
      return await emailService.sendLoginNotification(mockUser, {
        timestamp: new Date(),
        ip: '192.168.1.100',
        device: 'Chrome 120 on Windows 11',
        location: 'Bogotá, Colombia'
      });
    }
  });

  // Test 3: Password Reset
  tests.push({
    name: '3. Password Reset Email',
    fn: async () => {
      console.log('\n📧 3/10 - Enviando Password Reset Email...');
      const resetToken = 'abc123def456ghi789test';
      return await emailService.sendPasswordResetEmail(mockUser, resetToken);
    }
  });

  // Test 4: Password Changed Confirmation
  tests.push({
    name: '4. Password Changed Confirmation',
    fn: async () => {
      console.log('\n📧 4/10 - Enviando Password Changed Confirmation...');
      return await emailService.sendPasswordChangedConfirmation(mockUser);
    }
  });

  // Test 5: Appointment Confirmation
  tests.push({
    name: '5. Appointment Confirmation (Cliente)',
    fn: async () => {
      console.log('\n📧 5/10 - Enviando Appointment Confirmation...');
      return await emailService.sendAppointmentConfirmation(mockAppointment, mockUser);
    }
  });

  // Test 6: Appointment Reminder
  tests.push({
    name: '6. Appointment Reminder',
    fn: async () => {
      console.log('\n📧 6/10 - Enviando Appointment Reminder...');
      return await emailService.sendAppointmentReminder(mockAppointment, mockUser);
    }
  });

  // Test 7: New Appointment Notification (Barbero)
  tests.push({
    name: '7. New Appointment Notification (Barbero)',
    fn: async () => {
      console.log('\n📧 7/10 - Enviando New Appointment Notification...');
      return await emailService.sendNewAppointmentNotification(mockAppointment, mockBarber, mockUser);
    }
  });

  // Test 8: Daily Summary (Barbero)
  tests.push({
    name: '8. Daily Summary (Barbero)',
    fn: async () => {
      console.log('\n📧 8/10 - Enviando Daily Summary...');
      const appointments = [mockAppointment, mockAppointment]; // 2 citas
      return await emailService.sendDailySummary(mockBarber, appointments);
    }
  });

  // Test 9: Appointment Cancellation
  tests.push({
    name: '9. Appointment Cancellation',
    fn: async () => {
      console.log('\n📧 9/10 - Enviando Appointment Cancellation...');
      return await emailService.sendAppointmentCancellation(
        mockAppointment, 
        mockUser, 
        'El barbero tuvo una emergencia familiar'
      );
    }
  });

  // Test 10: Sale Confirmation
  tests.push({
    name: '10. Sale Confirmation',
    fn: async () => {
      console.log('\n📧 10/10 - Enviando Sale Confirmation...');
      return await emailService.sendSaleConfirmation(mockSale, mockUser);
    }
  });

  // Ejecutar todos los tests con delay
  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    try {
      const result = await test.fn();
      
      if (result.success) {
        console.log(`   ✅ ${test.name} - ENVIADO`);
        console.log(`   📬 Message ID: ${result.messageId || 'N/A'}`);
        successful++;
      } else {
        console.log(`   ⚠️ ${test.name} - ${result.message}`);
        failed++;
      }
    } catch (error) {
      console.log(`   ❌ ${test.name} - ERROR: ${error.message}`);
      failed++;
    }

    // Delay entre emails para no saturar
    if (i < tests.length - 1) {
      await delay(DELAY_BETWEEN_EMAILS);
    }
  }

  // Resumen final
  console.log('\n' + '═'.repeat(60));
  console.log('\n📊 RESUMEN DE PRUEBAS');
  console.log('═'.repeat(60));
  console.log(`✅ Exitosos: ${successful}/${tests.length}`);
  console.log(`❌ Fallidos: ${failed}/${tests.length}`);
  console.log(`📧 Total de emails enviados: ${successful}`);
  console.log(`\n📬 Revisa la bandeja de entrada de: ${mockUser.email}`);
  console.log('   (Los emails pueden tardar unos segundos en llegar)');
  console.log('   (Revisa también la carpeta de SPAM)');
  console.log('\n' + '═'.repeat(60));

  if (failed === 0) {
    console.log('\n🎉 ¡TODAS LAS PRUEBAS PASARON EXITOSAMENTE!\n');
    process.exit(0);
  } else {
    console.log(`\n⚠️ ${failed} prueba(s) fallaron. Revisa los errores arriba.\n`);
    process.exit(1);
  }
}

// Ejecutar tests
testAllEmails().catch(error => {
  console.error('\n💥 ERROR FATAL:', error);
  process.exit(1);
});
