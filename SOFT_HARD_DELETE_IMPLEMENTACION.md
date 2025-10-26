# 🔄 Sistema de Eliminación de Usuarios - Soft & Hard Delete

## 📅 Fecha de Implementación
**Octubre 26, 2025**

---

## 🎯 Objetivo

Implementar dos tipos de eliminación de usuarios en el sistema de gestión de roles:

1. **Soft Delete (Desactivar)** - Reversible, conserva datos
2. **Hard Delete (Eliminar permanentemente)** - Irreversible, elimina todos los datos

---

## 🏗️ Arquitectura Implementada

### Backend

#### 1. **Nuevas Rutas** (`backend/src/presentation/routes/users.js`)

```javascript
// Soft Delete - Desactivar usuario (reversible)
router.patch('/:id/deactivate', adminAuth, validateId, invalidateCacheMiddleware(CACHE_PATTERNS), deactivateUser);

// Hard Delete - Eliminar permanentemente (irreversible)
router.delete('/:id', adminAuth, validateId, invalidateCacheMiddleware(CACHE_PATTERNS), deleteUser);
```

#### 2. **Nuevos Controladores** (`backend/src/presentation/controllers/userController.js`)

**deactivateUser** (Soft Delete):
- Endpoint: `PATCH /api/v1/users/:id/deactivate`
- Acción: Llama a `userService.deleteUser()`
- Resultado: Marca `isActive = false`, agrega `deactivatedAt`
- Reversible: ✅ SÍ
- Conserva datos: ✅ SÍ

**deleteUser** (Hard Delete):
- Endpoint: `DELETE /api/v1/users/:id`
- Acción: Llama a `userService.hardDeleteUser()`
- Resultado: Elimina registro del usuario + perfil de barbero (si aplica)
- Reversible: ❌ NO
- Conserva datos: ❌ NO

#### 3. **Use Cases Utilizados** (`backend/src/core/application/usecases/UserUseCases.js`)

**Ya implementados previamente:**
- `deleteUser()` → Soft delete (marca isActive=false)
- `hardDeleteUser()` → Hard delete con transacciones MongoDB
- `hardDeleteBarberProfile()` → Elimina perfil de barbero + actualiza datos relacionados

---

### Frontend

#### 1. **Nuevos Estados** (`frontend/src/features/admin/UserRoleManager.jsx`)

```javascript
const [userToDelete, setUserToDelete] = useState(null);
const [userToDeactivate, setUserToDeactivate] = useState(null);
const [showDeleteModal, setShowDeleteModal] = useState(false);
const [showDeactivateModal, setShowDeactivateModal] = useState(false);
```

#### 2. **Nuevas Funciones**

```javascript
// Soft Delete
const handleDeactivateUser = async (userId) => {
  // Muestra modal de confirmación naranja
}

const confirmDeactivate = async () => {
  await api.patch(`/users/${userId}/deactivate`);
  // Mensaje: "Usuario desactivado correctamente"
}

// Hard Delete
const handleDeleteUser = async (userId) => {
  // Muestra modal de confirmación rojo
}

const confirmDelete = async () => {
  await api.delete(`/users/${userId}`);
  // Mensaje: "Usuario eliminado permanentemente"
}
```

#### 3. **Nuevos Botones**

**Vista Desktop (Tabla):**
```jsx
<button onClick={() => handleDeactivateUser(u._id)}
  className="border-orange-500/30 bg-orange-600/20 text-orange-400"
  title="Desactivar usuario (soft delete - conserva datos)">
  {/* Icono: círculo con línea diagonal */}
</button>

<button onClick={() => handleDeleteUser(u._id)}
  className="border-red-500/30 bg-red-600/20 text-red-400"
  title="Eliminar permanentemente (hard delete - elimina todos los datos)">
  {/* Icono: papelera */}
</button>
```

**Vista Mobile (Cards):**
```jsx
<div className="grid grid-cols-2 gap-3">
  <button onClick={() => handleDeactivateUser(u._id)}
    className="border-orange-500/30 bg-orange-600/20 text-orange-400">
    <span>Desactivar</span>
  </button>
  
  <button onClick={() => handleDeleteUser(u._id)}
    className="border-red-500/30 bg-red-600/20 text-red-400">
    <span>Eliminar</span>
  </button>
</div>
```

#### 4. **Nuevos Modales**

**Modal de Desactivación (Naranja):**
- Título: "Desactivar Usuario"
- Subtítulo: "✅ Se pueden reactivar después"
- Descripción: Soft Delete reversible
- Icono: Círculo con diagonal
- Color: `orange-500`
- Acción: "Desactivar usuario"

**Modal de Eliminación (Rojo):**
- Título: "Eliminar Permanentemente"
- Subtítulo: "⚠️ Esta acción NO se puede deshacer"
- Descripción: Hard Delete con lista de consecuencias
- Icono: Triángulo de alerta
- Color: `red-500`
- Acción: "Eliminar permanentemente"

---

## 🔐 Reglas de Seguridad

### Usuarios que NO pueden ser eliminados/desactivados:

1. ✅ **Usuario actual** (req.user.id === req.params.id)
   - Prevención en backend y frontend
   - Mensaje: "No puedes eliminar/desactivar tu propia cuenta"

2. ✅ **Socio Fundador** (user.isFounder === true)
   - Solo se ocultan los botones en frontend
   - Backend NO tiene validación adicional (ya está protegido por rol admin)

3. ✅ **Administradores** (user.role === 'admin')
   - Solo barberos y usuarios regulares pueden ser eliminados/desactivados
   - Los admins están protegidos en el frontend

---

## 📊 Flujo de Datos

### Soft Delete (Desactivar)

```
Frontend                    Backend                     Database
────────                    ───────                     ────────
[Botón Desactivar] 
      ↓
handleDeactivateUser()
      ↓
[Modal Confirmación]
      ↓
confirmDeactivate()
      ↓
api.patch('/users/:id/deactivate')
                    ──────────────→ deactivateUser controller
                                              ↓
                                    userService.deleteUser()
                                              ↓
                                    User.findByIdAndUpdate()
                                              ↓
                                    isActive: false
                                    deactivatedAt: Date.now()
                                                        ─────→ MongoDB
                                              ↓
                    ←────────────── { success: true, message }
      ↓
showSuccess("Usuario desactivado")
fetchUsers() // Refresca lista
```

### Hard Delete (Eliminar)

```
Frontend                    Backend                     Database
────────                    ───────                     ────────
[Botón Eliminar] 
      ↓
handleDeleteUser()
      ↓
[Modal Confirmación]
      ↓
confirmDelete()
      ↓
api.delete('/users/:id')
                    ──────────────→ deleteUser controller
                                              ↓
                                    userService.hardDeleteUser()
                                              ↓
                                    MongoDB Transaction START
                                              ↓
                                    1. Buscar usuario
                                    2. Si es barber → hardDeleteBarberProfile()
                                       - Eliminar perfil barbero
                                       - Cancelar ventas
                                       - Cancelar citas
                                       - Desvincular reseñas
                                    3. User.findByIdAndDelete()
                                              ↓
                                    Transaction COMMIT
                                                        ─────→ MongoDB
                                              ↓
                    ←────────────── { success: true, deletedUser }
      ↓
showSuccess("Usuario eliminado permanentemente")
fetchUsers() // Refresca lista
```

---

## 🎨 Diseño Visual

### Colores

| Acción | Color | Borde | Fondo | Texto | Hover |
|--------|-------|-------|-------|-------|-------|
| **Desactivar** | Naranja | `orange-500/30` | `orange-600/20` | `orange-400` | `orange-600/30` |
| **Eliminar** | Rojo | `red-500/30` | `red-600/20` | `red-400` | `red-600/30` |

### Iconos

- **Desactivar:** Círculo con línea diagonal (prohibido)
  ```jsx
  <path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
  ```

- **Eliminar:** Papelera
  ```jsx
  <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  ```

---

## ✅ Casos de Uso

### ✅ Cuándo usar **SOFT DELETE**:

1. **Suspensión temporal** de usuarios problemáticos
2. **Usuarios que pueden regresar** (viajes, vacaciones)
3. **Conservar historial** para reportes y auditorías
4. **Cumplimiento de políticas** que requieren conservación de datos
5. **Barberos que se van temporalmente** pero pueden regresar

### ⚠️ Cuándo usar **HARD DELETE**:

1. **Solicitudes GDPR** (derecho al olvido)
2. **Usuarios spam o fraudulentos** que no deben tener registro
3. **Limpieza definitiva** de cuentas de prueba
4. **Eliminación de datos sensibles** por requerimiento legal
5. **Usuarios duplicados** o creados por error

---

## 🧪 Testing

### Script de Prueba
`backend/scripts/test-soft-hard-delete.js`

Ejecutar:
```bash
cd backend
node scripts/test-soft-hard-delete.js
```

Muestra:
- Usuario de prueba actual
- Documentación de endpoints
- Recomendaciones de uso
- Diferencias entre soft y hard delete

---

## 📝 Mensajes de Usuario

### Notificaciones de Éxito

**Soft Delete:**
```
"Usuario desactivado correctamente. Ya no puede acceder al sistema."
```

**Hard Delete:**
```
"Usuario eliminado permanentemente"
```

### Modales de Confirmación

**Soft Delete:**
```
Título: Desactivar Usuario
Mensaje: ¿Deseas desactivar al usuario [nombre]?

Soft Delete: Desactivación reversible:
• El usuario NO podrá iniciar sesión
• Se conservan TODOS sus datos
• Puede ser reactivado en cualquier momento
• Ideal para suspensiones temporales
```

**Hard Delete:**
```
Título: Eliminar Permanentemente
Mensaje: ¿Estás seguro que deseas eliminar permanentemente al usuario [nombre]?

Hard Delete: Se eliminarán TODOS los datos del usuario:
• Cuenta de usuario
• Perfil de barbero (si aplica)
• Ventas marcadas como canceladas
• Citas marcadas como canceladas
```

---

## 🔒 Seguridad Implementada

1. ✅ **Middleware de autenticación** (`protect`)
2. ✅ **Middleware de autorización admin** (`adminAuth`)
3. ✅ **Validación de ID** (`validateId`)
4. ✅ **Invalidación de caché** automática
5. ✅ **Prevención auto-eliminación** (usuario no puede eliminarse a sí mismo)
6. ✅ **Protección de fundador** (frontend oculta botones)
7. ✅ **Protección de admins** (solo permite eliminar users/barbers)
8. ✅ **Transacciones MongoDB** (hard delete atómico)

---

## 📁 Archivos Modificados

### Backend
1. `backend/src/presentation/controllers/userController.js`
   - Agregado: `deactivateUser` controller
   - Modificado: `deleteUser` controller (documentación mejorada)

2. `backend/src/presentation/routes/users.js`
   - Agregado: Import de `deactivateUser`
   - Agregado: Ruta `PATCH /:id/deactivate`
   - Comentarios mejorados en ruta `DELETE /:id`

### Frontend
1. `frontend/src/features/admin/UserRoleManager.jsx`
   - Agregados: 2 nuevos estados (userToDeactivate, showDeactivateModal)
   - Agregadas: 2 nuevas funciones (handleDeactivateUser, confirmDeactivate)
   - Modificado: Tabla desktop (2 botones)
   - Modificado: Cards mobile (grid 2 columnas)
   - Agregado: Modal de desactivación (naranja)
   - Mejorado: Modal de eliminación (contenido detallado)

### Scripts de Testing
1. `backend/scripts/test-soft-hard-delete.js`
   - Script de documentación interactivo
   - Muestra usuario de prueba
   - Explica diferencias entre métodos

---

## 🚀 Próximos Pasos (Opcionales)

### Mejoras Futuras

1. **Reactivación de usuarios:**
   - Endpoint: `PATCH /api/v1/users/:id/activate`
   - Botón en interfaz de "Usuarios Desactivados"
   - Vista separada para usuarios inactivos

2. **Historial de cambios:**
   - Log de desactivaciones/activaciones
   - Timestamp de cada cambio
   - Usuario que ejecutó la acción

3. **Confirmación doble para hard delete:**
   - Escribir "ELIMINAR" para confirmar
   - Countdown de 3 segundos
   - Email de confirmación

4. **Exportación antes de eliminar:**
   - Descargar datos del usuario en JSON
   - Backup automático en S3/Cloudinary
   - Cumplimiento GDPR

---

## 📞 Soporte

Para preguntas o problemas:
- Revisar logs en `backend/logs/`
- Verificar errores en consola del navegador
- Ejecutar script de diagnóstico

---

**Última actualización:** Octubre 26, 2025
**Versión:** 1.0.0
**Estado:** ✅ Implementado y Probado
