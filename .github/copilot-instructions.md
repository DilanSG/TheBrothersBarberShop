# Copilot Instructions - The Brothers Barber Shop

## � **INSTRUCCIONES CRÍTICAS DE DESARROLLO**

**⚠️ SIEMPRE ASUMIR:**
- El **frontend** (React + Vite) SIEMPRE está ejecutándose en `http://localhost:5173`
- El **backend** (Node.js + Express) SIEMPRE está ejecutándose en `http://localhost:5000`
- **NUNCA** intentar iniciar, reiniciar o detener los servidores con comandos como `npm run dev`, `npm start`, etc.
- **NUNCA** usar `run_in_terminal` para comandos de servidor (`npm run frontend`, `npm run backend`, etc.)
- El usuario mantiene ambos servidores activos durante toda la sesión de desarrollo
- Si hay errores de conexión, asumir que es un problema de código, NO de servidores

**🚀 ARQUITECTURA DE DESPLIEGUE (Vercel + Render):**

**IMPORTANTE:** La aplicación usa arquitectura **separada** con dos servicios independientes:

- **Frontend (Vercel):** https://vercel.com
  - Build: `npm run build` genera carpeta `dist/`
  - Deploy automático desde GitHub rama `main`
  - Preview deployments automáticos en cada PR
  - Variables de entorno: Configurar en Vercel Dashboard
    - `VITE_API_URL` → URL del backend en Render
    - `VITE_SENTRY_DSN_FRONTEND` (opcional)
  - CDN global (Edge Network)
  - Configuración: `vercel.json` en raíz
  - Logs: Vercel Dashboard → Deployments
  
- **Backend (Render):** https://render.com
  - Tipo: Web Service (Node.js)
  - Build: `npm install` (automático)
  - Start: `npm start` → `node src/index.js`
  - Deploy automático desde GitHub rama `main`
  - Health checks: `/health` y `/api/v1/health`
  - Variables de entorno: Configurar en Render Dashboard
    - `MONGODB_URI` → MongoDB Atlas connection string
    - `JWT_SECRET`, `JWT_REFRESH_SECRET`
    - `CLOUDINARY_*` (cloud_name, api_key, api_secret)
    - `FRONTEND_URL` → URL del frontend en Vercel
    - `NODE_ENV=production`
    - `SENTRY_DSN_BACKEND` (opcional)
  - Configuración: `render.yaml` en raíz
  - Logs: Render Dashboard → Logs (persistentes)
  
- **Base de Datos (MongoDB Atlas):**
  - Cluster cloud compartido (dev + prod databases separadas)
  - Connection string diferente por ambiente
  - IP Whitelist: 0.0.0.0/0 (permitir Render IPs)
  - Backups automáticos diarios
  
- **CI/CD (GitHub Actions):**
  - Workflow: `.github/workflows/ci-cd.yml`
  - Pipeline: Lint → Test → Build Frontend → Build Backend → Deploy
  - Deploy a Vercel: Automático via webhook
  - Deploy a Render: Automático via GitHub integration
  - Secrets necesarios en GitHub:
    - `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
    - Render no necesita secrets (usa GitHub App)

**⚠️ REGLAS IMPORTANTES:**
- **Backend optimizado para Render:** Scripts de MongoDB, rate limiting, health checks
- **Frontend optimizado para Vercel:** Vite build, variables VITE_*, Edge ready
- **CORS configurado:** Backend acepta requests desde URL de Vercel
- **Variables de entorno:** NUNCA hardcodear URLs, siempre usar process.env / import.meta.env

**�🗑️ MANTENIMIENTO DEL CÓDIGO:**
- **NUNCA** crear archivos .backup, .old, .temp - usar git para el control de versiones
- **SIEMPRE** usar el logger centralizado (`logger.info/error/warn`) en lugar de `console.log`
- Los logs se rotan automáticamente (30 días), no acumular archivos de logs manualmente
- **Plan de mejoras activo** en `PLAN_MEJORAS.md` - consultar antes de cambios importantes

## �📋 Contexto del Proyecto

**The Brothers Barber Shop** es un sistema de gestión integral para barbería desarrollado con arquitectura moderna full-stack.

### Stack Tecnológico

#### Backend
- **Runtime:** Node.js (18+) con ES Modules
- **Framework:** Express.js
- **Arquitectura:** Clean Architecture (Domain-Driven Design)
- **Base de datos:** MongoDB con Mongoose ODM
- **Autenticación:** JWT con refresh tokens diferenciados por rol
- **Validación:** Express-validator
- **Documentación:** Swagger/OpenAPI
- **Logging:** Winston con rotación diaria
- **Cache:** Redis + Node-cache
- **Uploads:** Cloudinary integration
- **Seguridad:** Helmet, Rate limiting, XSS protection, MongoDB sanitize

#### Frontend
- **Framework:** React 18+ con Hooks
- **Build Tool:** Vite
- **Routing:** React Router DOM v6
- **Styling:** Tailwind CSS (tema oscuro customizado)
- **Iconos:** Lucide React
- **Fechas:** Date-fns, React Day Picker
- **Notificaciones:** React Toastify
- **Gestión de Estado:** Context API + Local State

#### Deployment & Infraestructura
- **Frontend Hosting:** Vercel
  - Deploy automático desde GitHub (rama `main`)
  - Preview deployments en PRs
  - Edge Network global (CDN)
  - Serverless Functions (si se necesitan)
  - Analytics integrado (Vercel Analytics)
  
- **Backend Hosting:** Render
  - Web Service (Node.js runtime)
  - Auto-deploy desde GitHub (rama `main`)
  - Health checks automáticos
  - Environment variables seguras
  - Logs persistentes
  
- **Base de Datos:** MongoDB Atlas
  - Cluster cloud (M0 Sandbox o superior)
  - Backups automáticos diarios
  - Monitoring integrado
  - IP Whitelisting para seguridad
  
- **CI/CD:** GitHub Actions
  - Workflow principal: `.github/workflows/ci-cd.yml`
  - Tests automáticos: `.github/workflows/test.yml`
  - Dependabot: `.github/dependabot.yml`
  - Deploy automático a Vercel + Render
  
- **Monitoreo & Logs:**
  - Sentry (error tracking - por configurar)
  - Vercel Analytics (métricas frontend - por configurar)
  - Winston (logging backend - configurado)
  - Render Logs (logs backend en producción)

### Estructura de Carpetas

#### Backend (Clean Architecture)
```
backend/
├── src/
│   ├── core/
│   │   ├── domain/
│   │   │   ├── entities/          # Modelos de Mongoose
│   │   │   └── repositories/      # Interfaces de repositorios
│   │   └── application/
│   │       └── usecases/          # Lógica de negocio
│   ├── infrastructure/
│   │   ├── database/              # Configuración MongoDB
│   │   └── external/              # APIs externas
│   ├── presentation/
│   │   ├── controllers/           # Controladores HTTP
│   │   ├── middleware/            # Middleware personalizado
│   │   └── routes/                # Definición de rutas
│   ├── services/                  # Servicios de aplicación
│   └── shared/
│       ├── config/                # Configuraciones
│       └── utils/                 # Utilidades comunes
├── scripts/                       # Scripts de datos y mantenimiento
└── uploads/temp/                  # Archivos temporales
```

#### Frontend (Feature-based)
```
frontend/
├── src/
│   ├── features/                  # Características por dominio
│   ├── pages/                     # Páginas principales
│   ├── layouts/                   # Layouts compartidos
│   └── shared/
│       ├── components/            # Componentes reutilizables
│       ├── contexts/              # Context providers
│       ├── hooks/                 # Custom hooks
│       ├── services/              # APIs y servicios
│       └── utils/                 # Utilidades
└── public/                        # Assets estáticos
```

### Dependencias Principales

#### Backend
- `express` - Framework web
- `mongoose` - ODM para MongoDB
- `jsonwebtoken` - Autenticación JWT
- `bcryptjs` - Hash de contraseñas
- `helmet` + `cors` - Seguridad
- `winston` - Logging profesional
- `express-validator` - Validación robusta
- `cloudinary` - Gestión de imágenes
- `ioredis` - Cliente Redis

#### Frontend
- `react` + `react-dom` - UI framework
- `react-router-dom` - Enrutamiento SPA
- `tailwindcss` - Styling utility-first
- `lucide-react` - Iconografía consistente
- `react-toastify` - Sistema de notificaciones
- `date-fns` - Manejo de fechas

## 🎨 Reglas de Estilo y Convenciones

### Nomenclatura

#### Backend
- **Archivos:** camelCase para archivos JS (`userController.js`, `authService.js`)
- **Variables/Funciones:** camelCase (`getUserById`, `isValidEmail`)
- **Clases:** PascalCase (`AppError`, `UserService`)
- **Constantes:** SCREAMING_SNAKE_CASE (`JWT_SECRET`, `MAX_FILE_SIZE`)
- **Entidades:** PascalCase singular (`User`, `Appointment`, `Service`)

#### Frontend
- **Componentes:** PascalCase (`UserProfile.jsx`, `AppointmentCard.jsx`)
- **Hooks:** camelCase con prefijo `use` (`useAuth`, `useLocalStorage`)
- **Archivos utilitarios:** camelCase (`dateUtils.js`, `apiClient.js`)
- **Constantes:** SCREAMING_SNAKE_CASE en archivos de configuración

### Estructura de Archivos

#### Controladores (Backend)
```javascript
// Patrón estándar para controladores
import { asyncHandler } from "../middleware/index.js";
import ServiceClass from "../../core/application/usecases/serviceClass.js";
import { logger } from "../../shared/utils/logger.js";
import { AppError } from "../../shared/utils/errors.js";

// @desc    Descripción de la función
// @route   HTTP_METHOD /api/route
// @access  Público/Privado/Admin
export const functionName = asyncHandler(async (req, res) => {
  // Lógica del controlador
  logger.info('Mensaje descriptivo');
  
  res.status(200).json({
    success: true,
    message: 'Mensaje de éxito',
    data: result
  });
});
```

#### Componentes (Frontend)
```jsx
// Patrón para componentes funcionales
import React, { useState, useEffect } from 'react';
import { serviceName } from '../shared/services/api';

const ComponentName = ({ prop1, prop2, ...otherProps }) => {
  const [state, setState] = useState(initialValue);
  
  useEffect(() => {
    // Efectos
  }, [dependencies]);

  const handleEvent = async () => {
    try {
      // Lógica del evento
    } catch (error) {
      console.error('Error en ComponentName:', error);
    }
  };

  return (
    <div className="tailwind-classes">
      {/* JSX content */}
    </div>
  );
};

export default ComponentName;
```

### Estilo de CSS/Tailwind
- **Tema:** Oscuro por defecto con colores personalizados
- **Colores primarios:** `primary: '#3B82F6'`, `secondary: '#1F2937'`
- **Espaciado:** Consistente usando escala de Tailwind
- **Componentes:** Uso de componentes reutilizables en `shared/components/ui/`
- **Responsividad:** Mobile-first approach

## ✅ Buenas Prácticas Implementadas

### Backend

1. **Clean Architecture:** Separación clara de capas (Domain, Application, Infrastructure, Presentation)
2. **Error Handling:** Manejo centralizado con `AppError` y middleware global
3. **Logging:** Sistema robusto con Winston y rotación de archivos
4. **Validación:** Comprehensive con express-validator y middlewares personalizados
5. **Seguridad:** Múltiples capas (Helmet, CORS, Rate limiting, Sanitización)
6. **Autenticación:** JWT con refresh tokens y tiempos diferenciados por rol
7. **Configuración:** Centralizada con validación de variables de entorno
8. **Testing:** Estructura preparada para Jest (unit + integration)

### Frontend

1. **Arquitectura por Features:** Organización modular y escalable
2. **Context API:** Gestión de estado global limpia (AuthContext)
3. **Custom Hooks:** Reutilización de lógica (`useAuth`, `useLocalStorage`)
4. **Error Boundaries:** Manejo robusto de errores en componentes
5. **Lazy Loading:** Componentes cargados bajo demanda
6. **PWA Ready:** Service Workers y manifest configurados
7. **Responsive Design:** Mobile-first con Tailwind
8. **Performance:** Optimización con Vite y chunking inteligente

## ❌ Errores Comunes a Evitar

### Backend

1. **No usar asyncHandler:** Siempre envolver controllers asíncronos
   ```javascript
   // ❌ Incorrecto
   export const getUser = async (req, res) => { ... }
   
   // ✅ Correcto (asyncHandler importado desde shared/utils/errors.js)
   export const getUser = asyncHandler(async (req, res) => { ... });
   ```

2. **Logs inconsistentes:** Usar siempre el logger de Winston
   ```javascript
   // ❌ Incorrecto
   console.log('User created');
   
   // ✅ Correcto
   logger.info(`Usuario creado: ${user.email}`);
   ```

3. **Imports incorrectos:** El asyncHandler se exporta desde middleware/index.js
   ```javascript
   // ✅ Correcto
   import { asyncHandler } from "../middleware/index.js";
   ```

4. **Validación manual:** Usar express-validator y middlewares existentes
5. **Errores genéricos:** Usar CommonErrors predefinidos cuando sea posible
6. **No sanitizar inputs:** Aplicar validación y sanitización apropiada
7. **Crear archivos duplicados:** Verificar antes si existe `RecurringExpenseCalculator`, `CacheService`, etc.
8. **Console.log en producción:** Usar SIEMPRE `logger.info/error/warn` del sistema centralizado

### Frontend

1. **Context provider sin memo:** Optimizar renders con React.memo cuando necesario
2. **Estados no inicializados:** Siempre definir estados iniciales apropiados
3. **Efectos sin cleanup:** Limpiar suscripciones y timers en useEffect
4. **Clases Tailwind inline largas:** Crear componentes reutilizables
5. **No manejar loading states:** Implementar estados de carga apropiados
6. **Rutas sin protección:** Usar ProtectedRoute para rutas que requieren autenticación
7. **Context sin providers:** AuthContext, InventoryContext y PaymentMethodsContext ya están configurados
8. **Console.log directos:** Usar `logger` del sistema centralizado en `shared/utils/logger`
9. **Imports profundos:** Evitar `../../../shared/` - usar barrel exports cuando estén disponibles

## 📝 Ejemplos de Tareas Comunes

### Crear Nueva Entidad (Backend)

1. **Crear modelo en `core/domain/entities/`:**
   ```javascript
   // NewEntity.js (seguir patrón de User.js, Appointment.js, etc.)
   import mongoose from 'mongoose';
   
   const newEntitySchema = new mongoose.Schema({
     // Schema definition
   }, {
     timestamps: true,
     collection: 'newentities'
   });
   
   export default mongoose.model('NewEntity', newEntitySchema);
   ```

2. **Crear repositorio en `core/domain/repositories/`**
3. **Implementar use cases en `core/application/usecases/`**
4. **Crear controller en `presentation/controllers/`**
5. **Definir rutas en `presentation/routes/`**
6. **Agregar validaciones en `presentation/middleware/validation.js`**
7. **Exportar el modelo en `core/domain/entities/index.js`**

### Crear Nuevo Componente (Frontend)

1. **Crear componente en estructura apropiada:**
   ```jsx
   // components/feature/ComponentName.jsx
   import React from 'react';
   
   const ComponentName = ({ props }) => {
     return (
       <div className="component-classes">
         {/* Content */}
       </div>
     );
   };
   
   export default ComponentName;
   ```

2. **Exportar en index.js correspondiente**
3. **Crear stories si es componente UI reutilizable**
4. **Agregar PropTypes o TypeScript si se usa**

### Crear Nueva Ruta API

1. **Definir en `presentation/routes/entityRoutes.js`:**
   ```javascript
   import express from 'express';
   import { validateAuth, validateRole } from '../middleware/auth.js';
   import { validateEntity } from '../middleware/validation.js';
   import * as entityController from '../controllers/entityController.js';
   
   const router = express.Router();
   
   router.post('/', validateAuth, validateEntity, entityController.create);
   router.get('/:id', validateAuth, entityController.getById);
   
   export default router;
   ```

2. **Registrar en `routes/index.js`**
3. **Implementar controller correspondiente**
4. **Documentar en Swagger**

### Crear Hook Personalizado

```javascript
// hooks/useEntityData.js
import { useState, useEffect } from 'react';
import { entityService } from '../services/api';

export const useEntityData = (entityId) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await entityService.getById(entityId);
        setData(result.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (entityId) {
      fetchData();
    }
  }, [entityId]);

  return { data, loading, error, refetch: fetchData };
};
```

## 🔄 Patrones de Desarrollo Específicos

### Gestión de Datos con Scripts
- Usar `master-population.js` para población completa de datos de prueba
- Scripts de diagnóstico (`check-data.js`, `diagnoseRecurringExpenses.js`) para debugging
- Scripts de migración para cambios de schema
- Siempre usar `fundador-rapido.js` para crear datos de desarrollo rápidamente

### AuthContext y Roles
- AuthContext maneja refresh automático de tokens diferenciado por rol
- Roles disponibles: `admin`, `barber`, `client`, `socio`
- Verificar permisos usando `validateAuth` y `validateRole` middlewares
- Token refresh intervals configurados por rol en el contexto

### Feature-based Architecture (Frontend)
- Cada feature es independiente con sus propios componentes, hooks y servicios
- Componentes compartidos en `shared/components/ui/`
- Hooks compartidos como `useAuth`, `useLocalStorage` en `shared/hooks/`
- Routing específico por feature (ej: `AppointmentRouter.jsx`)

## 🚀 MEJORAS EN PROGRESO (Octubre 2025)

### ✅ Completadas
- **Eliminación de archivos obsoletos:** `Expense.backup.js`, `package-old.json`, `vite.config.simple.js`
- **Configuración de logs mejorada:** Rotación automática de 30 días
- **Migración de logging:** Scripts críticos migrados de `console.log` a `logger`

### ✅ Completadas en Octubre 2025
- **Consolidación de utilidades de gastos recurrentes:** Módulo unificado en `shared/recurring-expenses/`
- **Eliminación de código duplicado:** 1,353 líneas removidas (RecurringExpenseCalculator, RecurrenceCalculator, RecurringExpenseHelper)
- **Barrel exports:** Implementados en `backend/src/barrel.js` y `frontend/src/barrel.js` para imports optimizados
- **Optimización de imports:** 13 archivos refactorizados para usar rutas centralizadas

### 🎯 Plan Completo
- Consultar `PLAN_MEJORAS.md` en la raíz del proyecto para detalles completos
- **Fase 1:** Limpieza crítica (completada)
- **Fase 2:** Refactoring de duplicación (en progreso)
- **Fase 3:** Optimización de arquitectura (planificada)

### 🚨 REGLAS TRAS LAS MEJORAS (Octubre 2025)
- **USAR el módulo unificado de gastos recurrentes** - `shared/recurring-expenses/` en lugar de implementaciones duplicadas
- **USAR barrel exports** - `import { logger, AppError } from '../barrel.js'` en lugar de rutas profundas
- **NO recrear RecurringExpenseCalculator** - usar `calculator` del módulo unificado
- **USAR aliases de Vite** - `@shared`, `@utils`, `@components` configurados
- **Seguir el patrón de asyncHandler** - importar desde `middleware/index.js`

## 🔧 Scripts y Comandos

### Desarrollo
```bash
npm run dev                 # Launcher con menú interactivo (dev-launcher.js)
npm run backend            # Solo backend en puerto 5000
npm run frontend           # Solo frontend en puerto 5173
npm run install:all        # Instalar todas las dependencias
npm run build              # Build de producción del frontend
```

### Gestión de Datos (Scripts especializados en backend/scripts/)
```bash
node backend/scripts/master-population.js     # Script maestro de población completa
node backend/scripts/fundador-rapido.js       # Crear socio fundador rápidamente
node backend/scripts/inicializar-socio-fundador.js  # Inicializar datos de socio
node backend/scripts/check-data.js            # Verificar integridad de datos
node backend/scripts/clean-transactions.js    # Limpiar transacciones corruptas
```

### Herramientas de Mejora
```bash
node scripts/migrate-logging.js               # Migrar console.log a logger centralizado
# Consultar PLAN_MEJORAS.md para más herramientas de refactoring
```

### Testing y Calidad
```bash
npm run test               # Tests backend
npm run test:coverage      # Coverage report
npm run lint               # Linting backend y frontend
```

## 🛡️ Seguridad y Configuración

### Variables de Entorno Requeridas
```env
# Base de datos
MONGODB_URI=mongodb://...

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=6h
JWT_REFRESH_EXPIRES_IN=30d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud
CLOUDINARY_API_KEY=your-key  
CLOUDINARY_API_SECRET=your-secret

# Email (solo producción)
EMAIL_USER=your-email
EMAIL_PASSWORD=your-password
EMAIL_FROM=noreply@example.com

# URLs
FRONTEND_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Rate Limiting
- General: 100 requests/15min
- Auth: 5 attempts/15min  
- API: 1000 requests/hour

---

## 🎯 DECISIONES ARQUITECTÓNICAS IMPORTANTES (Octubre 2025)

### ✅ Cache Strategy - SOLO node-cache (Redis ELIMINADO)
**Decisión**: El sistema usa **exclusivamente node-cache** (in-memory)
- ❌ **NO usar Redis** - Completamente removido del proyecto
- ✅ **reportsCacheService.js** - Smart TTL (300s-14400s según antigüedad datos)
- ✅ **Cache hits/misses** - Tracking automático de estadísticas
- ✅ **Invalidación granular** - Por barbero, tipo de reporte o completa

**Razón**: Simplificar arquitectura, eliminar dependencias externas, performance suficiente para escala actual.

### ✅ Patrón Services vs UseCases - DEFINIDO
**Estructura establecida tras consolidación de 15 archivos duplicados**:

```javascript
// services/ - Servicios de INFRAESTRUCTURA
backend/src/services/
├── emailService.js         // Templates HTML + envío SMTP
├── cronJobService.js       // Tareas programadas (cron)
└── refundService.js        // Lógica de reembolsos

// usecases/ - Lógica de NEGOCIO (Clean Architecture)
backend/src/core/application/usecases/
├── AuthUseCases.js         // Autenticación y autorización
├── SaleUseCases.js         // Ventas y transacciones
├── InventoryUseCases.js    // Control de inventario
└── [otros dominios]        // Casos de uso por dominio
```

**Regla**: 
- `services/` → Integraciones externas, infraestructura, NO lógica de negocio
- `usecases/` → Reglas de negocio, orquestación de entidades, dominio

### ✅ Barrel Exports Pattern
**Implementado en backend y frontend para imports limpios**:

```javascript
// backend/src/barrel.js
export { logger, AppError, asyncHandler } from './shared/utils/...'
export { User, Barber, Sale } from './core/domain/entities/...'

// Uso correcto
import { logger, User, AppError } from '../../../barrel.js'  // ✅ CORRECTO

// Evitar
import { logger } from '../../../shared/utils/logger.js'     // ❌ EVITAR (profundo)
```

**Excepción**: NO usar barrel en módulos que el barrel exporta (evita circulares)
- `reportsCacheService.js` → Import directo de logger (no desde barrel)

### ✅ Logging Strategy
**SIEMPRE usar el logger centralizado de Winston**:

```javascript
// ❌ NUNCA
console.log('User created')
console.error('Error:', error)

// ✅ SIEMPRE
logger.info('Usuario creado', { userId, email })
logger.error('Error en operación', { error: error.message, stack: error.stack })
logger.warn('Stock bajo', { productId, quantity })
```

**Rotación automática**: 30 días, no acumular logs manualmente

### ✅ Índices de Mongoose - Evitar Duplicados
**Regla establecida tras eliminar 3 índices duplicados**:

```javascript
// ❌ INCORRECTO - Duplicado
const schema = new Schema({
  email: { type: String, unique: true }  // Crea índice automáticamente
})
schema.index({ email: 1 })  // ❌ DUPLICADO - No necesario

// ✅ CORRECTO
const schema = new Schema({
  email: { type: String, unique: true }  // Suficiente
})
// NO agregar schema.index({ email: 1 })

// ✅ CORRECTO - Índice compuesto cubre prefijo
schema.index({ user: 1, date: 1 })  // Sirve para queries por 'user' solo
// NO necesitas: schema.index({ user: 1 })
```

**Comentar cuando NO se agrega índice**: Explicar por qué no hay índice adicional

### ✅ Seguridad - Actualizado Octubre 2025
**Estado actual: 100% seguro - 0 vulnerabilidades críticas**

- ✅ **ExcelJS 4.x** (reemplazó xlsx - vulnerabilidad HIGH resuelta)
- ✅ **Mongoose 8.19.1** (última versión segura)
- ✅ **Nodemailer 7.0.9** (vulnerabilidad resuelta)
- ✅ **npm overrides** configurado para validator
- ✅ **12 paquetes actualizados** en total

**Auditar periódicamente**: `npm audit` cada sprint

### ✅ Error Handling Pattern
**Usar asyncHandler para TODOS los controllers**:

```javascript
import { asyncHandler } from "../middleware/index.js";  // ✅ Import correcto

// ✅ CORRECTO
export const createUser = asyncHandler(async (req, res) => {
  // Lógica async - errores capturados automáticamente
})

// ❌ INCORRECTO
export const createUser = async (req, res) => {
  // Sin asyncHandler - errores no capturados
}
```

**logger.system() NO EXISTE**: Usar `logger.info()` en su lugar

### ✅ Estructura de Gastos Recurrentes
**Módulo unificado consolidado**:

```javascript
// ✅ USAR
import { calculator } from 'backend/src/shared/recurring-expenses/'

// ❌ NO RECREAR
// RecurringExpenseCalculator (eliminado - 450 líneas)
// RecurrenceCalculator (eliminado - 380 líneas)
// RecurringExpenseHelper (eliminado - 523 líneas)
```

**Total consolidado**: 1,353 líneas eliminadas

### ✅ Frontend Path Aliases (Octubre 14, 2025)
**SIEMPRE usar aliases en lugar de imports profundos**:

```javascript
// ❌ INCORRECTO - Rutas profundas
import { useAuth } from '../../shared/contexts/AuthContext';
import { api } from '../../../shared/services/api';
import Button from '../../shared/components/ui/button';

// ✅ CORRECTO - Aliases configurados
import { useAuth } from '@contexts/AuthContext';
import { api } from '@services/api';
import Button from '@components/ui/button';
```

**Aliases disponibles** (vite.config.js):
- `@` → `/src` (raíz del proyecto)
- `@shared` → `/src/shared` (módulos compartidos)
- `@utils` → `/src/shared/utils` (utilidades)
- `@components` → `/src/shared/components` (componentes UI)
- `@hooks` → `/src/shared/hooks` (custom hooks)
- `@services` → `/src/shared/services` (servicios API)
- `@contexts` → `/src/shared/contexts` (context providers)

**Migración completada**:
- 202 imports migrados automáticamente
- 36 archivos actualizados en frontend/src
- Script disponible: `scripts/migrate-frontend-aliases.js`
- Guía completa: `frontend/ALIASES_GUIDE.md`

**Regla**: Rutas relativas (`./`, `../`) solo para imports dentro del mismo feature. Aliases para todo lo shared.

---

## 📊 MÉTRICAS DE CALIDAD (Actualizado Octubre 14, 2025)

### Código Eliminado/Consolidado
- **Archivos duplicados**: 15 archivos (4,182 líneas)
- **Scripts NPM corregidos**: 12 scripts
- **console.log migrados**: 170+ statements (44 iniciales + 104 automatizados + 22 manuales)
- **Imports optimizados**: 245 archivos refactorizados
  - Backend: 43 archivos (barrel exports)
  - Frontend: 202 imports migrados a aliases (36 archivos)
- **Total limpiado**: ~6,828 líneas

### Seguridad
- ✅ **Vulnerabilidades críticas**: 0 (100% seguro)
- ✅ **Warnings Mongoose**: 0
- ✅ **Índices duplicados**: 0 (3 eliminados)
- ✅ **Dependencies**: 12 actualizadas

### Arquitectura
- ✅ **Clean Architecture**: Implementada completamente
- ✅ **Barrel exports**: Backend + Frontend
- ✅ **Path Aliases**: Frontend (Vite) - 7 aliases configurados
- ✅ **Repository Pattern**: 100% de entities
- ✅ **Logging centralizado**: Winston (44 + 104 + 22 = 170 migrados)

---

Este documento debe mantenerse actualizado con cada cambio significativo en la arquitectura o convenciones del proyecto.

**Última actualización**: Octubre 14, 2025