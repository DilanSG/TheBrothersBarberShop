# 🧪 Script de Testing de Optimizaciones - AdminBarbers
# PowerShell Version for Windows

Write-Host "🚀 INICIANDO TESTING DE OPTIMIZACIONES" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green

# Verificar que el frontend esté corriendo
try {
    $frontendCheck = Invoke-WebRequest -Uri "http://localhost:5173" -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ Frontend verificado" -ForegroundColor Green
} catch {
    Write-Host "❌ Frontend no está corriendo en localhost:5173" -ForegroundColor Red
    Write-Host "Por favor ejecuta: npm run dev" -ForegroundColor Yellow
    exit 1
}

# Verificar que el backend esté corriendo en puerto 5000
$backendPort = netstat -an | findstr :5000
if ($backendPort) {
    Write-Host "✅ Backend verificado (puerto 5000)" -ForegroundColor Green
} else {
    Write-Host "❌ Backend no está corriendo en localhost:5000" -ForegroundColor Red
    Write-Host "Por favor ejecuta el backend" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "📊 TESTING PLAN:" -ForegroundColor Cyan
Write-Host "1. ✅ Cache Local implementado" -ForegroundColor Green
Write-Host "2. ✅ Batch Processing implementado" -ForegroundColor Green
Write-Host "3. ✅ Debounce implementado" -ForegroundColor Green
Write-Host "4. ✅ Rate Limiting optimizado" -ForegroundColor Green
Write-Host "5. ✅ Hook optimizado creado" -ForegroundColor Green
Write-Host ""

Write-Host "🔧 PARA PROBAR LAS OPTIMIZACIONES:" -ForegroundColor Yellow
Write-Host "=================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. 📝 Cambiar en AdminBarbers.jsx línea ~693:" -ForegroundColor White
Write-Host "   DE: useBarberStats" -ForegroundColor Red
Write-Host "   A:  useBarberStatsOptimized" -ForegroundColor Green
Write-Host ""
Write-Host "2. 🖱️ Abrir DevTools > Console" -ForegroundColor White
Write-Host ""
Write-Host "3. 🎯 Cambiar rápidamente entre filtros:" -ForegroundColor White
Write-Host "   - General → 7 días → 1 día → 30 días" -ForegroundColor Gray
Write-Host "   - Observar mensajes de cache en console" -ForegroundColor Gray
Write-Host ""
Write-Host "4. 📊 Verificar mejoras esperadas:" -ForegroundColor White
Write-Host "   ✅ Mensajes '💾 Cache SET/HIT' en console" -ForegroundColor Green
Write-Host "   ✅ Mensajes '📦 Procesando lote X/Y'" -ForegroundColor Green
Write-Host "   ✅ Menos requests en Network tab" -ForegroundColor Green
Write-Host "   ✅ Carga más rápida en cambios subsecuentes" -ForegroundColor Green
Write-Host "   ✅ Sin errores 'Too Many Requests'" -ForegroundColor Green
Write-Host ""

Write-Host "🎛️ CONFIGURACIONES APLICADAS:" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan
Write-Host "• Cache TTL: 5 minutos" -ForegroundColor Gray
Write-Host "• Debounce: 300ms" -ForegroundColor Gray
Write-Host "• Batch size: 3 barberos simultáneos" -ForegroundColor Gray
Write-Host "• Rate limiting: 2000 req/5min general" -ForegroundColor Gray
Write-Host "• Rate limiting stats: 1000 req/2min" -ForegroundColor Gray
Write-Host ""

Write-Host "📈 MÉTRICAS A OBSERVAR:" -ForegroundColor Magenta
Write-Host "======================" -ForegroundColor Magenta
Write-Host "• Tiempo de carga: ~50-80% reducción" -ForegroundColor Gray
Write-Host "• Requests: De 10+ a 1-2 por cambio filtro" -ForegroundColor Gray
Write-Host "• Cache hits: Debería aumentar progresivamente" -ForegroundColor Gray
Write-Host "• Errores rate limiting: Debería ser 0" -ForegroundColor Gray
Write-Host ""

Write-Host "🐛 DEBUG COMMANDS:" -ForegroundColor Red
Write-Host "==================" -ForegroundColor Red
Write-Host "• Ver cache stats:" -ForegroundColor White
Write-Host "  window.cacheService.getStats" -ForegroundColor Gray
Write-Host ""
Write-Host "• Limpiar cache:" -ForegroundColor White
Write-Host "  window.cacheService.clear" -ForegroundColor Gray
Write-Host ""
Write-Host "• Ver batch stats:" -ForegroundColor White
Write-Host "  window.batchProcessingService.getStats" -ForegroundColor Gray
Write-Host ""

Write-Host "✨ LISTO PARA TESTING!" -ForegroundColor Green
Write-Host "Abre http://localhost:5173/admin/barbers para comenzar" -ForegroundColor Yellow

# Abrir automáticamente la página
try {
    Start-Process "http://localhost:5173/admin/barbers"
    Write-Host "🌐 Página abierta automáticamente" -ForegroundColor Green
} catch {
    Write-Host "⚠️ No se pudo abrir automáticamente. Abre manualmente la URL." -ForegroundColor Yellow
}
