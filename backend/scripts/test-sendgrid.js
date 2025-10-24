/**
 * Script de prueba para SendGrid
 * Envía un email de test para verificar la configuración
 * 
 * Uso: node backend/scripts/test-sendgrid.js
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import sgMail from '@sendgrid/mail';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '../../backend/.env') });

// Configurar SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.EMAIL_FROM_ADDRESS || 'thebrobarbers20@gmail.com';
const FROM_NAME = process.env.EMAIL_FROM_NAME || 'The Brothers Barber Shop';

if (!SENDGRID_API_KEY) {
  console.error('❌ ERROR: SENDGRID_API_KEY no está configurada');
  console.error('Asegúrate de tener la variable en tu .env file');
  process.exit(1);
}

sgMail.setApiKey(SENDGRID_API_KEY);

/**
 * Enviar email de prueba
 */
async function sendTestEmail() {
  console.log('\n🚀 INICIANDO PRUEBA DE SENDGRID...\n');
  console.log(`📧 From: ${FROM_NAME} <${FROM_EMAIL}>`);
  console.log(`📧 To: ${FROM_EMAIL} (mismo email para prueba)`);
  
  const msg = {
    to: FROM_EMAIL, // Enviamos al mismo email para prueba
    from: {
      email: FROM_EMAIL,
      name: FROM_NAME
    },
    subject: '✅ Prueba de SendGrid - The Brothers Barber Shop',
    text: 'Este es un email de prueba enviado desde el backend de The Brothers Barber Shop.',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f9fafb;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .success-icon {
              font-size: 48px;
              margin-bottom: 20px;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background: #667eea;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin-top: 20px;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              color: #666;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="success-icon">✅</div>
            <h1>¡SendGrid Configurado Correctamente!</h1>
          </div>
          <div class="content">
            <p>Hola,</p>
            <p>Este es un <strong>email de prueba</strong> del sistema de notificaciones de <strong>The Brothers Barber Shop</strong>.</p>
            
            <h3>✨ Sistema de Emails Activo</h3>
            <ul>
              <li>✅ SendGrid API configurada</li>
              <li>✅ Templates HTML funcionales</li>
              <li>✅ Sender verificado</li>
              <li>✅ Sistema listo para producción</li>
            </ul>
            
            <h3>📧 Funcionalidades Disponibles:</h3>
            <ul>
              <li>Confirmación de citas</li>
              <li>Recordatorios automáticos</li>
              <li>Notificaciones de stock bajo</li>
              <li>Reportes programados</li>
              <li>Recuperación de contraseña</li>
            </ul>
            
            <a href="https://thebrothersbarbershop.onrender.com" class="button">
              Ver Sistema
            </a>
          </div>
          <div class="footer">
            <p>
              <strong>The Brothers Barber Shop</strong><br>
              Calle 38 Sur, Kennedy, Bogotá<br>
              📞 311 5882528
            </p>
            <p style="font-size: 12px; color: #999;">
              Este es un email automático de prueba. No es necesario responder.
            </p>
          </div>
        </body>
      </html>
    `,
  };

  try {
    console.log('\n⏳ Enviando email...\n');
    
    const response = await sgMail.send(msg);
    
    console.log('✅ EMAIL ENVIADO EXITOSAMENTE!\n');
    console.log('📊 Detalles de la respuesta:');
    console.log(`   - Status Code: ${response[0].statusCode}`);
    console.log(`   - Message ID: ${response[0].headers['x-message-id']}`);
    console.log(`   - Timestamp: ${new Date().toISOString()}\n`);
    
    console.log('📬 Revisa la bandeja de entrada de:', FROM_EMAIL);
    console.log('   (puede tardar unos segundos en llegar)\n');
    
    console.log('🎉 PRUEBA COMPLETADA EXITOSAMENTE!\n');
    
  } catch (error) {
    console.error('\n❌ ERROR AL ENVIAR EMAIL:\n');
    
    if (error.response) {
      console.error('Código de error:', error.code);
      console.error('Mensaje:', error.message);
      console.error('Detalles:', JSON.stringify(error.response.body, null, 2));
    } else {
      console.error(error.message);
      console.error(error.stack);
    }
    
    console.log('\n📝 POSIBLES SOLUCIONES:');
    console.log('   1. Verifica que la API Key sea correcta');
    console.log('   2. Confirma que el sender esté verificado en SendGrid');
    console.log('   3. Revisa que el email FROM coincida con el sender verificado');
    console.log('   4. Verifica el saldo de tu cuenta SendGrid\n');
    
    process.exit(1);
  }
}

// Ejecutar prueba
sendTestEmail();
