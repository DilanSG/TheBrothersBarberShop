# Copilot Instructions for The Brothers Barber Shop

## Idioma y Comunicación
**IMPORTANTE**: Responde SIEMPRE en español. Todos los comentarios, explicaciones, mensajes de commit, documentación y comunicación deben ser en español. Los nombres de variables y funciones pueden estar en inglés según convenciones técnicas, pero toda la comunicación debe ser en español.

## Overview
Full-stack barber shop management app with Node.js/Express backend (MongoDB) and React/Vite frontend. Manages users, barbers, services, appointments, and inventory with role-based access (user/barber/admin).

## Architecture
- **Backend**: Modular structure in `backend/src/` - controllers handle requests, services contain business logic, models define schemas, routes mount endpoints, middleware for auth/validation/security.
- **Frontend**: React app in `frontend/src/` with routing, auth context, notification system, and Tailwind CSS.
- **Data Flow**: Frontend calls REST API endpoints; backend uses Mongoose for MongoDB, JWT for auth, bcryptjs for passwords.
- **Why Modular**: Separates concerns for maintainability; services encapsulate logic to avoid controller bloat.

## Key Patterns

### Backend Patterns
- **Controllers**: Always use `asyncHandler` wrapper, call services, return JSON with `{success, message, data}`. Log actions with winston logger.
- **Services**: Static classes with methods like `AuthService.login()`. Throw `AppError` for errors, use `config` for settings.
- **Models**: Mongoose schemas with validation, pre-save hooks (e.g., password hashing in `User.js`).
- **Auth**: JWT tokens, roles enum ['user', 'barber', 'admin']. Use `protect` middleware for auth, `adminAuth` for admin routes.
- **Validation**: Use express-validator with `handleValidationErrors` middleware. Import common validations from `validation.js`.
- **Error Handling**: Global `errorHandler` middleware catches `AppError` and formats responses. Use `asyncHandler` to wrap async routes.

### Frontend Patterns
- **Context**: Use `AuthContext` for user state, `NotificationContext` for user feedback, `AppContext` for global state.
- **API Service**: Import from `services/api.js`. Handles auth headers, retry logic, caching, and error handling automatically.
- **Components**: Use functional components with hooks. Import from `components/` and `pages/` directories.
- **Auth**: Access `user`, `token`, `login`, `logout` from `useAuth()` hook.
- **Notifications**: Use `useNotification()` for `showSuccess`, `showError`, `showWarning`, `showInfo`.

## Workflows

### Development
- **Backend**: `npm run dev` (nodemon). Requires `.env` with `MONGODB_URI`, `JWT_SECRET`, `CLOUDINARY_*` variables.
- **Frontend**: `npm run dev` (Vite on port 3000). Auto-reloads on changes.
- **Full Stack**: Start both servers, frontend proxies API calls to backend.

### Testing & Quality
- **Backend Testing**: `npm run test` (Jest). Use `supertest` for API integration tests.
- **Linting**: `npm run lint` (ESLint). Fix unused imports/variables before commits.
- **Scripts**: `npm run seed` populates DB, various debug scripts in `backend/src/scripts/`.

### Build & Deploy
- **Frontend Build**: `npm run build` (Vite), outputs to `docs/` for GitHub Pages.
- **Environment**: Production requires all env vars validated in `config/index.js`.

## Conventions

### Code Style
- **Imports**: ES modules only. Use relative paths like `../services/authService.js`.
- **Config**: Centralized in `backend/src/config/index.js`. Validates required env vars on startup.
- **Logging**: Winston logger in `utils/logger.js`. Use `logger.info()`, `logger.warn()`, `logger.error()`.
- **Error Messages**: Spanish for user-facing, English for logs/dev.
- **Comments**: All code comments must be in Spanish. Examples:
  ```javascript
  // Buscar usuario por ID
  const user = await User.findById(id);
  
  // Validar que el token sea válido
  if (!token) {
    throw new AppError('Token requerido', 401);
  }
  
  // Configurar middleware de autenticación
  router.use(protect);
  ```

### Security & Performance
- **Security**: Helmet, CORS, rate limiting, mongo sanitization, XSS protection, JWT validation.
- **File Uploads**: Multer with Cloudinary storage. Config in `config/cloudinary.js`.
- **Caching**: Frontend uses cache helper in `api.js` for performance.

### Frontend Structure
- **Layout**: `MainLayout` wraps all pages. Use `PageContainer` for consistent spacing.
- **Routing**: Protected routes use `ProtectedRoute`, public routes use `PublicRoute`.
- **State**: Use React hooks, context for global state. Avoid prop drilling.

## Implementation Examples

### Add New API Endpoint
1. Create service method in `backend/src/services/`
2. Create controller in `backend/src/controllers/` using `asyncHandler`
3. Add route in `backend/src/routes/` with validation middleware
4. Mount route in `backend/src/routes/index.js`
5. Add frontend service method in `frontend/src/services/api.js`

### Auth Implementation
```javascript
// Backend route protection
import { protect, adminAuth } from '../middleware/auth.js';
router.get('/admin-only', protect, adminAuth, controller);

// Frontend auth check
const { user, token } = useAuth();
if (user?.role === 'admin') { /* admin UI */ }
```

### Error Handling
```javascript
// Backend service
throw new AppError('Usuario no encontrado', 404);

// Frontend with notifications
const { showError, showSuccess } = useNotification();
try {
  await api.post('/endpoint', data);
  showSuccess('Operación exitosa');
} catch (error) {
  showError(error.message);
}
```

### Database Queries
```javascript
// Include hidden fields
const user = await User.findOne({email}).select('+password');

// Safe user data (remove sensitive fields)
const safeUser = AuthService.sanitizeUser(user);
```

### Form Validation
```javascript
// Backend validation
export const validateUser = [
  body('email').isEmail().normalizeEmail(),
  body('name').trim().isLength({min: 2, max: 50}),
  handleValidationErrors
];

// Frontend form handling
const { register, handleSubmit, errors } = useForm();
```

## Quick Reference

### Essential Imports
```javascript
// Backend
import { asyncHandler } from '../middleware/index.js';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

// Frontend
import { useAuth } from '../utils/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { api } from '../services/api';
```

### Common Commands
- **Dev**: `npm run dev` (both backend/frontend)
- **Test**: `npm run test` (backend only)
- **Seed**: `npm run seed` (populate database)
- **Build**: `npm run build` (frontend for production)
- **Lint**: `npm run lint` (check code style)

## Comunicación y Documentación

### Estilo de Respuestas
- Todas las explicaciones deben ser en español
- Los mensajes de commit deben estar en español
- La documentación técnica debe estar en español
- Ejemplos de buenas respuestas:
  ```
  ✅ "He corregido el error de validación en el formulario de inventario"
  ✅ "Se agregó la funcionalidad de autenticación JWT"
  ✅ "Solucionado: El componente ahora maneja correctamente los estados de carga"
  
  ❌ "Fixed validation error in inventory form"
  ❌ "Added JWT authentication functionality"
  ```

### Mensajes de Commit Sugeridos
```bash
feat: agregar sistema de notificaciones al frontend
fix: corregir error de scope en API service
docs: actualizar instrucciones de instalación
refactor: mejorar estructura del componente de inventario
style: aplicar formato consistente al código
```

## Manejo de Terminal y Comandos

### ⚠️ **REGLA CRÍTICA: NO EJECUTAR COMANDOS EN TERMINAL**
**NUNCA usar run_in_terminal ni comandos automáticos. En su lugar, SIEMPRE proporcionar los comandos al usuario para que los ejecute manualmente.**

### Protocolo de Comandos para el Usuario
1. **Siempre proporcionar comandos completos y específicos**
2. **Usar SOLO comandos de PowerShell**: Windows PowerShell es el shell por defecto
3. **Usar rutas absolutas**: Siempre especificar la ruta completa para evitar errores de navegación
4. **NO usar operadores de bash**: PowerShell no soporta `&&` - usar `;` o comandos separados

### Comandos PowerShell para Proporcionar al Usuario
1. **Verificación de ubicación**:
   ```powershell
   Get-Location  # Verificar directorio actual
   ```

2. **Navegación con rutas absolutas**:
   ```powershell
   Set-Location "C:\Users\ADMIN\Documents\TheBrothersBarberShop\backend"
   ```

3. **Verificación de archivos**:
   ```powershell
   Test-Path ".\package.json"  # Verificar archivos importantes
   Test-Path ".\.env"          # Verificar variables de entorno
   ```

4. **Comandos npm/node**:
   ```powershell
   # Backend
   Set-Location "C:\Users\ADMIN\Documents\TheBrothersBarberShop\backend"; npm run dev
   
   # Frontend  
   Set-Location "C:\Users\ADMIN\Documents\TheBrothersBarberShop\frontend"; npm run dev
   
   # Scripts
   Set-Location "C:\Users\ADMIN\Documents\TheBrothersBarberShop\backend"; npm run superseed
   ```

5. **Comandos de verificación**:
   ```powershell
   # Verificar procesos Node
   Get-Process -Name "node"
   
   # Verificar puertos
   netstat -ano | findstr ":5000"
   
   # Pruebas de API
   curl http://localhost:5000/api/v1/monitoring/health
   ```

### Comandos PowerShell Específicos
```powershell
# Verificación de sistema
Get-Location                              # Ubicación actual
Test-Path ".\archivo.js"                 # Verificar existencia
Get-Process -Name "node"                 # Verificar procesos Node
netstat -ano | Select-String ":5000"     # Verificar puertos
Get-ChildItem                            # Listar contenido directorio

# Navegación segura
Set-Location "C:\ruta\completa\al\proyecto"

# Manejo de archivos
Remove-Item "archivo.js"                 # Eliminar archivo
Copy-Item "origen.js" "destino.js"       # Copiar archivo
New-Item -ItemType File "nuevo.js"       # Crear archivo

# Ejecución de proyectos
Set-Location "C:\Users\ADMIN\Documents\TheBrothersBarberShop\backend"; npm run dev
Set-Location "C:\Users\ADMIN\Documents\TheBrothersBarberShop\frontend"; npm run dev
```

### **PROTOCOLO ACTUALIZADO: NUNCA EJECUTAR COMANDOS AUTOMÁTICAMENTE**
- ❌ **NUNCA** usar `run_in_terminal`
- ❌ **NUNCA** ejecutar comandos automáticamente
- ✅ **SIEMPRE** proporcionar comandos al usuario
- ✅ **SIEMPRE** explicar qué hace cada comando
- ✅ **SIEMPRE** dar contexto de por qué se necesita ejecutar

### Manejo de Errores de Terminal
- **Si no se puede leer un terminal**: Pedir al usuario que proporcione el texto de salida
- **Si un comando falla**: No asumir el estado, pedir confirmación del output
- **Si hay conflictos de proceso**: Verificar puertos/procesos antes de ejecutar servidores
- **Si PowerShell da error de sintaxis**: Verificar que no se usen comandos de bash

## Protocolo de Comunicación y Verificación

### 🗣️ **Reglas de Comunicación con el Usuario**

#### **ANTES de sugerir cualquier comando:**
1. **Explicar qué se va a hacer** y por qué
2. **Mostrar el comando completo** que necesita ejecutar
3. **Explicar qué resultado esperar**
4. **Pedir confirmación** si hay riesgo de pérdida de datos

#### **DESPUÉS de que el usuario ejecute un comando:**
1. **Preguntar por el resultado** que obtuvo
2. **Si hay errores, explicar qué significa**
3. **Confirmar el resultado antes de continuar**
4. **Dar el siguiente paso** basado en el resultado

#### **Para CAMBIOS en el código:**
1. **Explicar qué archivo se va a modificar** y por qué
2. **Describir los cambios específicos** que se harán
3. **Mostrar un resumen** de lo que se cambió después
4. **Pedir al usuario que verifique** que no hay errores después del cambio

### 📝 **Protocolo de Verificación Detallado**

#### **Formato de Comandos para el Usuario:**
```markdown
## 🔧 Comando a Ejecutar:
```powershell
[comando aquí]
```

**¿Qué hace?**: [explicación]
**Resultado esperado**: [qué debería ver]
**Si hay error**: [qué hacer en caso de problema]
```

#### **Manejo de Problemas sin Terminal:**
- **Si necesito verificar algo**: Pedir al usuario que ejecute el comando específico
- **Si hay ambigüedad**: Hacer preguntas específicas en lugar de asumir
- **Si need debugging**: Dar comandos de diagnóstico paso a paso

### 🚨 **Errores de Comunicación a Evitar**

#### **❌ NO hacer:**
- Ejecutar comandos automáticamente con run_in_terminal
- Asumir que un comando funcionó sin verificar con el usuario
- Usar comandos de bash en lugar de PowerShell
- Ejecutar múltiples comandos sin verificar el estado entre ellos
- Dar instrucciones vagas como "ejecuta el servidor"
- Continuar sin confirmar que el usuario entiende

#### **✅ SÍ hacer:**
- Dar comandos completos para que el usuario ejecute
- Explicar cada comando claramente antes de darlo
- Usar comandos PowerShell específicos
- Pedir confirmación del resultado de cada comando
- Dar instrucciones paso a paso con comandos completos
- Preguntar por la salida antes de continuar

### Debugging de Problemas sin Terminal
1. Si necesito verificar algo → Dar comando específico al usuario para que ejecute
2. Si comandos no responden → Dar comandos de diagnóstico paso a paso
3. Si rutas no se encuentran → Dar comandos con rutas absolutas completas
4. Si scripts fallan → Dar comandos para verificar package.json, dependencias y ubicación
5. Si PowerShell da errores → Dar comandos PowerShell nativos, nunca bash

## Errores Comunes y Cómo Evitarlos

### 🚫 **Error 1: Problemas de Comunicación Terminal**
**Problema observado:** Asumir que comandos funcionaron sin verificar, usar bash en lugar de PowerShell
**Solución:**
```powershell
# ❌ MAL: Usar comandos bash o asumir estado
cd backend && npm run dev  # && no funciona en PowerShell
pwd                        # Comando bash

# ✅ BIEN: Usar PowerShell nativo y verificar cada paso
Get-Location              # Verificar ubicación actual
Set-Location "C:\Users\ADMIN\Documents\TheBrothersBarberShop\backend"
Get-Location              # Confirmar cambio
npm run dev               # Ejecutar comando
```
**Regla:** Siempre usar comandos PowerShell nativos y verificar cada paso antes de continuar.

### 🚫 **Error 2: Falta de Confirmación con el Usuario**
**Problema observado:** Continuar sin verificar que el usuario entiende o que los comandos funcionaron
**Solución:**
```
❌ MAL: "Ejecutando servidor..." [sin verificar resultado]

✅ BIEN: 
"Voy a ejecutar el servidor del backend. Primero verifico la ubicación:"
[comando Get-Location]
"Ahora navego al directorio correcto:"
[comando Set-Location]
"¿Puedes confirmar que el servidor se inició correctamente?"
```
**Regla:** Siempre explicar qué se va a hacer, verificar resultados y pedir confirmación cuando sea necesario.

## Errores Comunes y Cómo Evitarlos

### 🚫 **Error 1: Importaciones Faltantes o Incorrectas**
**Problema observado:** `validateImage is not defined` en rutas
**Solución:**
```javascript
// ❌ MAL: Importar función que no existe
import { validateImage } from '../middleware/upload.js';

// ✅ BIEN: Verificar que la función exista en el archivo antes de importar
// Siempre revisar el archivo de origen para confirmar exportaciones
```
**Regla:** Antes de agregar cualquier importación, verificar que la función/variable realmente exista en el archivo de origen.

### 🚫 **Error 2: Inconsistencia en Nombres de Campos de API**
**Problema observado:** Endpoints esperando campos diferentes (`'image'` vs `'profilePicture'`)
**Solución:**
```javascript
// ❌ MAL: Usar nombres diferentes en endpoints similares
router.post('/upload-profile-picture', upload.single('profilePicture'), ...)
router.put('/:id', upload.single('image'), ...)

// ✅ BIEN: Usar nombres consistentes
router.post('/upload-profile-picture', upload.single('profilePicture'), ...)
router.put('/:id', upload.single('profilePicture'), ...)
```
**Regla:** Mantener consistencia en nombres de campos entre endpoints relacionados. Verificar endpoints existentes antes de crear nuevos.

### 🚫 **Error 3: Usar Método Incorrecto para Uploads**
**Problema observado:** Usar `api.post()` en lugar de `api.upload()` para archivos
**Solución:**
```javascript
// ❌ MAL: api.post() convierte FormData a JSON
const response = await api.post('/upload-endpoint', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

// ✅ BIEN: api.upload() maneja FormData correctamente
const response = await api.upload('/upload-endpoint', formData);
```
**Regla:** Para uploads de archivos, siempre usar `api.upload()`. Nunca establecer manualmente Content-Type para FormData.

### 🚫 **Error 4: No Verificar Estado del Servidor**
**Problema observado:** Asumir que el servidor está corriendo cuando da errores de inicio
**Solución:**
```bash
# ❌ MAL: Asumir que el servidor funciona por logs parciales
# ✅ BIEN: Verificar siempre el estado completo
netstat -ano | findstr :5000  # Verificar puerto
Get-Process -Name "node"       # Verificar procesos Node
```
**Regla:** Siempre verificar que el servidor esté realmente funcionando antes de diagnosticar errores de aplicación.

### 🚫 **Error 5: Crear Múltiples Terminales Innecesarios**
**Problema observado:** Ejecutar `npm run dev` sin navegar primero en el mismo comando crea nuevos terminales
**Solución:**
```powershell
# ❌ MAL: Esto crea un nuevo terminal
Set-Location "directorio"
npm run dev

# ✅ BIEN: Navegar y ejecutar en el MISMO comando
Set-Location "C:\Users\ADMIN\Documents\TheBrothersBarberShop\backend"; npm run dev
```
**Regla:** SIEMPRE usar punto y coma (;) para combinar navegación + ejecución en un solo comando.

### 🚫 **Error 6: Paths Relativos en Terminal**
**Problema observado:** Comandos fallando por estar en directorio incorrecto
**Solución:**
```powershell
# ❌ MAL: Asumir ubicación actual
npm run dev

# ✅ BIEN: Siempre usar rutas absolutas
Set-Location "C:\Users\ADMIN\Documents\TheBrothersBarberShop\backend"; npm run dev
```
**Regla:** Nunca ejecutar comandos sin verificar primero la ubicación actual. Usar rutas absolutas.

### 🚫 **Error 7: Middleware de Autenticación Faltante**
**Problema observado:** Endpoints sin `protect` middleware cuando lo necesitan
**Solución:**
```javascript
// ❌ MAL: Endpoint que requiere auth sin middleware
router.post('/upload-profile-picture', upload.single('file'), controller);

// ✅ BIEN: Verificar si necesita auth y agregarlo
router.post('/upload-profile-picture', protect, upload.single('file'), controller);
// O usar router.use(protect) globalmente
```
**Regla:** Para endpoints de usuario/barbero, verificar si necesitan autenticación comparando con endpoints similares.

### 🚫 **Error 8: Variables de Entorno No Cargadas**
**Problema observado:** `MONGODB_URI is not defined` por no usar dotenv correctamente
**Solución:**
```javascript
// ❌ MAL: Asumir que las variables están disponibles
const uri = process.env.MONGODB_URI;

// ✅ BIEN: Verificar carga de variables y manejar errores
import { validateEnv } from './config/index.js';
validateEnv(); // Lanza error si faltan variables requeridas
```
**Regla:** Siempre validar que las variables de entorno estén cargadas antes de usarlas.

## Protocolo de Verificación Antes de Cambios

### ✅ **Checklist Obligatorio:**
1. **Para imports:** Verificar que la función/variable existe en el archivo origen
2. **Para endpoints:** Revisar endpoints similares para mantener consistencia
3. **Para uploads:** Confirmar que se usa `api.upload()` en frontend
4. **Para rutas protegidas:** Verificar si necesita middleware de autenticación
5. **Para comandos:** Verificar ubicación actual antes de ejecutar
6. **Para config:** Validar que variables de entorno estén disponibles

### 🔍 **Comandos de Verificación Rápida:**
```powershell
# Verificar ubicación
Get-Location

# Verificar archivos importantes
Test-Path ".\package.json"
Test-Path ".\.env"

# Verificar procesos y puertos
Get-Process -Name "node" -ErrorAction SilentlyContinue
netstat -ano | Select-String ":5000"

# Verificar que el servidor responde
Invoke-WebRequest -Uri "http://localhost:5000/api/v1/monitoring/health" -UseBasicParsing
```

### 🎯 **Protocolo de Comunicación Mejorado**

#### **Ejemplo de Comunicación Correcta:**
```
🔍 "Voy a verificar la ubicación actual antes de ejecutar el servidor"
[Ejecuta: Get-Location]

📍 "Ahora navegaré al directorio del backend:"
[Ejecuta: Set-Location "C:\Users\ADMIN\Documents\TheBrothersBarberShop\backend"]

✅ "Confirmo la ubicación correcta:"
[Ejecuta: Get-Location]

🚀 "Iniciando el servidor de desarrollo:"
[Ejecuta: npm run dev]

❓ "¿Puedes confirmar que aparece el mensaje de 'Servidor iniciado' en tu consola?"
```

#### **Si no puedo leer el terminal:**
```
🚫 "No puedo leer la salida del terminal actual."
📋 "Por favor, copia y pega EXACTAMENTE el texto que aparece en tu consola para que pueda ayudarte mejor."
⏳ "Una vez que me proporciones la salida, podremos continuar con el siguiente paso."
```</content>
<parameter name="filePath">c:\Users\ADMIN\Documents\TheBrothersBarberShop\.github\copilot-instructions.md
