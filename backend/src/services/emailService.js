import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export async function sendAppointmentConfirmation({ to, name, service, barber, date }) {
  const mailOptions = {
    from: `The Brothers Barber Shop <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Confirmación de Reserva',
    html: `
      <h2>¡Hola ${name}!</h2>
      <p>Tu reserva ha sido confirmada:</p>
      <ul>
        <li><strong>Servicio:</strong> ${service.name}</li>
        <li><strong>Barbero:</strong> ${barber.user.name || barber.user.email}</li>
        <li><strong>Fecha y hora:</strong> ${new Date(date).toLocaleString()}</li>
      </ul>
      <p>¡Gracias por reservar con nosotros!</p>
    `
  };
  await transporter.sendMail(mailOptions);
}
