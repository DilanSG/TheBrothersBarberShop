# 🔄 Guía de Migración de Base de Datos

## Contexto del Problema

Tu aplicación inicialmente conectaba a MongoDB sin especificar un nombre de base de datos explícito, por lo que MongoDB creó automáticamente una base de datos llamada `test` con todos tus datos de producción.

Ahora necesitas migrar esos datos a una base de datos con nombre apropiado: `barbershop_production`.

---

## 📋 Pre-requisitos

1. ✅ Tener acceso a MongoDB (local o Atlas)
2. ✅ Tener el archivo `.env` configurado con `MONGODB_URI`
3. ✅ Node.js instalado (18+)
4. ✅ Suficiente espacio en disco para el backup

---

## 🚀 Proceso de Migración (Paso a Paso)

### **PASO 1: Crear Backup de Seguridad** 🔒

**¡IMPORTANTE!** Siempre crea un backup antes de cualquier migración.

```bash
cd C:\Users\ADMIN\Desktop\TheBrothersBarberShop
node backend/scripts/backup-before-migration.js
```

**Resultado esperado:**
- ✅ Se creará un archivo JSON en `backend/backups/migration/`
- ✅ Contendrá TODOS los datos de la DB `test`
- ✅ Verás un resumen con el número de colecciones y documentos

**Ejemplo de salida:**
```
✅ Backup guardado exitosamente
  📁 Ruta: backend/backups/migration/backup-test-2025-10-16T10-30-45.json
  📊 Tamaño: 2.45 MB
  📦 Colecciones: 10
  📄 Documentos: 1,234
```

---

### **PASO 2: Ejecutar Migración** 🚚

Una vez que tengas el backup, ejecuta el script de migración:

```bash
node backend/scripts/migrate-database.js
```

**¿Qué hace este script?**
1. 📥 Conecta a la DB `test` (origen)
2. 📦 Exporta todas las colecciones importantes
3. 📤 Conecta a la DB `barbershop_production` (destino)
4. ✅ Importa los datos (evita duplicados)
5. 🔍 Verifica que los conteos coincidan

**Resultado esperado:**
```
🎉 MIGRACIÓN COMPLETADA EXITOSAMENTE
  📊 Colecciones procesadas: 10
  📦 Documentos exportados: 1,234
  ✅ Documentos importados: 1,234
  🔍 Colecciones verificadas: 10
  ✅ Verificación exitosa: Sí
```

---

### **PASO 3: Actualizar MONGODB_URI en Render** 🔧

Una vez que la migración sea exitosa, actualiza la variable de entorno en **Render**:

1. Ve a tu dashboard de Render: https://dashboard.render.com
2. Selecciona tu servicio backend (thebrothersbarbershop)
3. Ve a **Environment** → **Environment Variables**
4. Busca `MONGODB_URI` y edítala:

**ANTES:**
```
mongodb+srv://usuario:password@cluster.mongodb.net/test
```

**DESPUÉS:**
```
mongodb+srv://usuario:password@cluster.mongodb.net/barbershop_production
```

5. **Guarda** los cambios
6. Render **redesplegará automáticamente** tu aplicación

---

### **PASO 4: Verificar en Producción** ✅

Una vez que Render termine el redespliegue (~2-3 minutos):

1. Abre tu aplicación: https://the-bro-barbers.vercel.app
2. Intenta hacer login con tu usuario
3. Verifica que veas tus datos (barberos, citas, inventario, etc.)

**Si algo sale mal:**
- ✅ Tienes el backup en `backend/backups/migration/`
- ✅ La DB `test` todavía existe intacta
- ✅ Puedes revertir la variable `MONGODB_URI` en Render

---

## 📊 Colecciones que se Migran

El script migra automáticamente estas colecciones:

- ✅ `users` - Usuarios del sistema
- ✅ `barbers` - Datos de barberos
- ✅ `services` - Servicios ofrecidos
- ✅ `appointments` - Citas agendadas
- ✅ `availabledates` - Fechas disponibles
- ✅ `sales` - Ventas de productos y servicios
- ✅ `inventory` - Inventario de productos
- ✅ `expenses` - Gastos del negocio
- ✅ `paymentmethods` - Métodos de pago
- ✅ `inventorysnapshots` - Snapshots de inventario

---

## ⚠️ Casos Especiales

### Si la migración falla a la mitad

El script está diseñado para:
- **NO sobrescribir** datos existentes
- **Detectar duplicados** y saltarlos
- **Continuar** con las siguientes colecciones

Puedes volver a ejecutar el script sin riesgo.

### Si necesitas migrar colecciones adicionales

Edita `migrate-database.js` y agrega el nombre de la colección a:

```javascript
const COLLECTIONS_TO_MIGRATE = [
  'users',
  'barbers',
  // ... otras colecciones
  'tu_nueva_coleccion' // ← Agregar aquí
];
```

### Si quieres hacer una migración parcial

Comenta las colecciones que NO quieres migrar en el array `COLLECTIONS_TO_MIGRATE`.

---

## 🔙 Cómo Revertir (Si algo sale mal)

### Opción 1: Cambiar MONGODB_URI de vuelta

En Render, cambia `MONGODB_URI` de vuelta a:
```
mongodb+srv://usuario:password@cluster.mongodb.net/test
```

### Opción 2: Restaurar desde backup

Si necesitas restaurar el backup JSON:

```bash
# Próximamente: Script de restauración
node backend/scripts/restore-from-backup.js backend/backups/migration/backup-test-YYYY-MM-DD.json
```

---

## 📝 Notas Técnicas

### Manejo de Índices

MongoDB **copiará automáticamente los índices** de las colecciones. No necesitas recrearlos manualmente.

### ObjectIds

Los `_id` de MongoDB se preservan durante la migración, por lo que todas las referencias entre documentos seguirán funcionando.

### Timestamps

Los campos `createdAt` y `updatedAt` se preservan tal cual.

### Performance

- Migración de ~1000 documentos: **~5-10 segundos**
- Migración de ~10000 documentos: **~30-60 segundos**

---

## ✅ Checklist Final

Antes de ejecutar en producción:

- [ ] Backup creado exitosamente
- [ ] Migración probada en local
- [ ] Verificado que `barbershop_production` existe
- [ ] Conteos de documentos coinciden
- [ ] MONGODB_URI actualizada en Render
- [ ] Aplicación redesplegada
- [ ] Login funciona correctamente
- [ ] Datos visibles en la aplicación

---

## 🆘 Soporte

Si encuentras problemas:

1. Revisa los logs del script (son muy detallados)
2. Verifica que `MONGODB_URI` esté correcta
3. Confirma que tienes permisos de lectura/escritura en MongoDB
4. Revisa los logs de Render para errores de conexión

---

**Autor:** GitHub Copilot  
**Fecha:** Octubre 16, 2025  
**Versión:** 1.0.0
