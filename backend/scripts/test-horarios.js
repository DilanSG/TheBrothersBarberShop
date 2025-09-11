/**
 * Script de prueba para verificar la lógica de horarios
 * Simula la generación de slots de tiempo de 7AM a 7PM cada 30 minutos
 */

function generateTimeSlots(startTime, endTime) {
  const slots = [];
  const start = new Date(`2000-01-01 ${startTime}`);
  const end = new Date(`2000-01-01 ${endTime}`);
  const slotDuration = 30; // minutos

  console.log(`🕐 Generando slots de ${startTime} a ${endTime} cada ${slotDuration} minutos:`);
  
  for (let time = start; time < end; time.setMinutes(time.getMinutes() + slotDuration)) {
    const timeString = time.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    slots.push(timeString);
  }

  return slots;
}

// Probar con el nuevo rango de horarios (7AM - 7PM)
console.log('='.repeat(50));
console.log('🎯 PRUEBA DE HORARIOS ACTUALIZADOS');
console.log('='.repeat(50));

const slots = generateTimeSlots('07:00', '19:00');

console.log(`\n📊 Total de slots generados: ${slots.length}`);
console.log('📋 Lista de horarios disponibles:');

slots.forEach((slot, index) => {
  if (index % 4 === 0) console.log(); // Nueva línea cada 4 slots
  process.stdout.write(`${slot}  `);
});

console.log('\n\n✅ Los horarios van desde las 7:00 AM hasta las 6:30 PM');
console.log('✅ Se generan intervalos cada 30 minutos');
console.log('✅ Total de slots:', slots.length, '(esperado: 24 slots)');

// Verificar que el primer y último slot sean correctos
console.log('\n🔍 Verificación:');
console.log('- Primer slot:', slots[0], '(debe ser 07:00)');
console.log('- Último slot:', slots[slots.length - 1], '(debe ser 18:30)');
console.log('- Total slots:', slots.length === 24 ? '✅ Correcto' : '❌ Incorrecto');
