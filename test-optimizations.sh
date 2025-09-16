#!/bin/bash

# 🧪 Script de Testing de Optimizaciones - AdminBarbers

echo "🚀 INICIANDO TESTING DE OPTIMIZACIONES"
echo "======================================"

# Verificar que el frontend esté corriendo
if ! curl -s http://localhost:5173 > /dev/null; then
    echo "❌ Frontend no está corriendo en localhost:5173"
    echo "Por favor ejecuta: npm run dev"
    exit 1
fi

# Verificar que el backend esté corriendo
if ! curl -s http://localhost:3000/api/health > /dev/null; then
    echo "❌ Backend no está corriendo en localhost:3000"
    echo "Por favor ejecuta el backend"
    exit 1
fi

echo "✅ Servicios verificados"
echo ""

echo "📊 TESTING PLAN:"
echo "1. ✅ Cache Local implementado"
echo "2. ✅ Batch Processing implementado"
echo "3. ✅ Debounce implementado"
echo "4. ✅ Rate Limiting optimizado"
echo "5. ✅ Hook optimizado creado"
echo ""

echo "🔧 PARA PROBAR LAS OPTIMIZACIONES:"
echo "================================="
echo ""
echo "1. 📝 Cambiar en AdminBarbers.jsx línea ~693:"
echo "   DE: useBarberStats()"
echo "   A:  useBarberStatsOptimized()"
echo ""
echo "2. 🖱️ Abrir DevTools > Console"
echo ""
echo "3. 🎯 Cambiar rápidamente entre filtros:"
echo "   - General → 7 días → 1 día → 30 días"
echo "   - Observar mensajes de cache en console"
echo ""
echo "4. 📊 Verificar mejoras esperadas:"
echo "   ✅ Mensajes '💾 Cache SET/HIT' en console"
echo "   ✅ Mensajes '📦 Procesando lote X/Y'"
echo "   ✅ Menos requests en Network tab"
echo "   ✅ Carga más rápida en cambios subsecuentes"
echo "   ✅ Sin errores 'Too Many Requests'"
echo ""

echo "🎛️ CONFIGURACIONES APLICADAS:"
echo "============================="
echo "• Cache TTL: 5 minutos"
echo "• Debounce: 300ms"
echo "• Batch size: 3 barberos simultáneos"
echo "• Rate limiting: 2000 req/5min general"
echo "• Rate limiting stats: 1000 req/2min"
echo ""

echo "📈 MÉTRICAS A OBSERVAR:"
echo "======================"
echo "• Tiempo de carga: ~50-80% reducción"
echo "• Requests: De 10+ a 1-2 por cambio filtro"
echo "• Cache hits: Debería aumentar progresivamente"
echo "• Errores rate limiting: Debería ser 0"
echo ""

echo "🐛 DEBUG COMMANDS:"
echo "=================="
echo "• Ver cache stats:"
echo "  window.cacheService?.getStats()"
echo ""
echo "• Limpiar cache:"
echo "  window.cacheService?.clear()"
echo ""
echo "• Ver batch stats:"
echo "  window.batchProcessingService?.getStats()"
echo ""

echo "✨ LISTO PARA TESTING!"
echo "Abre http://localhost:5173/admin/barbers para comenzar"
