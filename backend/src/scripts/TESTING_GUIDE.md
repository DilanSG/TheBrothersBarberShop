# 🎯 GUÍA DE TESTING - ADMIN/BARBEROS 

## ✅ Estado Actual: DATOS LISTOS PARA TESTING

### 📊 Números Exactos Esperados:

| Filtro | Ventas | Citas | Período |
|--------|--------|-------|---------|
| **DIARIO** | **5** | **3** | Hoy (15/09/2025) |
| **SEMANAL** | **20** | **12** | Últimos 7 días |
| **QUINCENAL** | **44** | **28** | Últimos 15 días |
| **MENSUAL** | **89** | **58** | Últimos 30 días |

### 👨‍💼 Distribución por Barberos:

| Barbero | Ventas | Ingresos |
|---------|--------|----------|
| **Carlos Martínez** | **31** | **$569,000** |
| **Miguel González** | **29** | **$463,000** |
| **Diego Herrera** | **29** | **$664,000** |

---

## 🧪 PASOS DE TESTING

### 1️⃣ **Acceso al Frontend**
```bash
# Si no está corriendo, iniciar frontend
cd frontend
npm run dev
# Ir a: http://localhost:5173
```

### 2️⃣ **Navegación**
- Login como Admin
- Ir a: **Admin/Barberos** o **Reportes**

### 3️⃣ **Pruebas de Filtros Temporales**

**✅ FILTRO DIARIO:**
- Seleccionar: "1 día" o "Hoy"
- Esperar: 5 ventas, 3 citas
- ✅ Si coincide: Filtro funciona
- ❌ Si no: Problema en cálculo diario

**✅ FILTRO SEMANAL:**
- Seleccionar: "7 días" o "Última semana"
- Esperar: ~20 ventas, ~12 citas
- ✅ Si está entre 18-22 ventas: OK
- ❌ Si muy diferente: Problema semanal

**✅ FILTRO QUINCENAL:**
- Seleccionar: "15 días"
- Esperar: ~44 ventas, ~28 citas
- ✅ Si está entre 42-46 ventas: OK
- ❌ Si muy diferente: Problema quincenal

**✅ FILTRO MENSUAL:**
- Seleccionar: "30 días" o "Mes"
- Esperar: ~89 ventas, ~58 citas
- ✅ Si está entre 85-95 ventas: OK
- ❌ Si muy diferente: Problema mensual

### 4️⃣ **Pruebas de Filtros por Barbero**

**Carlos Martínez:**
- Filtrar por este barbero
- Esperar: ~31 ventas, $569,000
- Verificar que solo aparezcan sus datos

**Miguel González:**
- Filtrar por este barbero  
- Esperar: ~29 ventas, $463,000
- Verificar que solo aparezcan sus datos

**Diego Herrera:**
- Filtrar por este barbero
- Esperar: ~29 ventas, $664,000
- Verificar que solo aparezcan sus datos

### 5️⃣ **Verificaciones de Cálculos**

**Sumas Correctas:**
- Suma de los 3 barberos = Total general
- 31 + 29 + 29 = 89 ventas ✅
- $569k + $463k + $664k = $1,696k total

**Coherencia de Datos:**
- Las fechas están en el rango correcto
- Los nombres de clientes son "Cliente Test X-Y"
- Las notas contienen "STRATEGIC_TEST"

### 6️⃣ **Pruebas de Responsividad**

**Mobile Testing:**
- F12 → Responsive Design
- Probar en 375px (móvil)
- Verificar que:
  - Filtros se ven completos
  - Números son legibles
  - Botones son tocables
  - No hay overflow horizontal

### 7️⃣ **Casos Edge**

**Barbero sin datos:**
- Si hay barberos sin datos de testing
- Verificar que muestre "0" correctamente

**Fechas futuras:**
- Cambiar fecha a mañana
- No debe mostrar datos de testing

**Parámetros inválidos:**
- URLs con barberId inexistente
- Fechas mal formateadas
- Verificar manejo de errores

---

## 🐛 TROUBLESHOOTING

### ❌ **Si los números no coinciden:**

1. **Verificar Backend:**
   ```bash
   cd backend/src/scripts
   node simpleVerify.js
   ```

2. **Regenerar datos:**
   ```bash
   node strategicBarberDebug.js
   ```

3. **Verificar endpoints API directamente:**
   - GET `/api/v1/sales/reports?type=daily&date=2025-09-15`
   - GET `/api/v1/sales/reports?type=weekly&date=2025-09-15`
   - GET `/api/v1/sales/reports?type=monthly&date=2025-09-15`

### ❌ **Si hay errores en frontend:**

1. **Verificar consola del navegador**
2. **Verificar Network tab** (F12)
3. **Comprobar que backend esté corriendo** (puerto 3000)

### ❌ **Si datos incorrectos:**

1. **Limpiar y regenerar:**
   ```bash
   node cleanTestData.js
   node strategicBarberDebug.js
   ```

---

## ✅ **CHECKLIST DE COMPLETION**

- [ ] ✅ Filtro diario: 5 ventas, 3 citas
- [ ] ✅ Filtro semanal: ~20 ventas, ~12 citas  
- [ ] ✅ Filtro quincenal: ~44 ventas, ~28 citas
- [ ] ✅ Filtro mensual: ~89 ventas, ~58 citas
- [ ] ✅ Filtro Carlos: ~31 ventas, $569k
- [ ] ✅ Filtro Miguel: ~29 ventas, $463k
- [ ] ✅ Filtro Diego: ~29 ventas, $664k
- [ ] ✅ Sumas correctas en todos los filtros
- [ ] ✅ Responsividad móvil funcional
- [ ] ✅ Manejo de casos edge

---

## 🗑️ **LIMPIAR AL TERMINAR**

Una vez completadas todas las pruebas:

```bash
cd backend/src/scripts
node cleanTestData.js
```

Esto eliminará SOLO los datos de testing, manteniendo todos los datos reales del sistema.

---

## 📞 **SUPPORT**

Si encuentras problemas:
1. Verifica que los scripts hayan generado datos correctamente
2. Confirma que backend y frontend estén corriendo
3. Revisa logs de consola para errores específicos
4. Compara números exactos con esta guía

**¡LISTO PARA DEBUGGEAR COMPLETAMENTE LOS REPORTES! 🚀**
