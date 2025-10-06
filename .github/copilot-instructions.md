# Copilot Instructions - The Brothers Barber Shop

## � **INSTRUCCIONES CRÍTICAS DE DESARROLLO**

**⚠️ SIEMPRE ASUMIR:**
- El **frontend** (React + Vite) SIEMPRE está ejecutándose en `http://localhost:5173`
- El **backend** (Node.js + Express) SIEMPRE está ejecutándose en `http://localhost:5000`
- **NUNCA** intentar iniciar, reiniciar o detener los servidores con comandos como `npm run dev`, `npm start`, etc.
- **NUNCA** usar `run_in_terminal` para comandos de servidor (`npm run frontend`, `npm run backend`, etc.)
- El usuario mantiene ambos servidores activos durante toda la sesión de desarrollo
- Si hay errores de conexión, asumir que es un problema de código, NO de servidores

**🗑️ MANTENIMIENTO DEL CÓDIGO:**
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

### ⏳ En Progreso
- **Consolidación de utilidades de gastos recurrentes:** Eliminar duplicación entre frontend/backend
- **Unificación de configuraciones:** Centralizar CORS, JWT y validaciones
- **Optimización de imports:** Implementar barrel exports para rutas profundas

### 🎯 Plan Completo
- Consultar `PLAN_MEJORAS.md` en la raíz del proyecto para detalles completos
- **Fase 1:** Limpieza crítica (completada)
- **Fase 2:** Refactoring de duplicación (en progreso)
- **Fase 3:** Optimización de arquitectura (planificada)

### 🚨 REGLAS DURANTE LAS MEJORAS
- **NO duplicar código** - verificar si ya existe una implementación similar
- **Consultar antes de crear nuevos servicios de cache** - hay múltiples implementaciones
- **Usar rutas de import consistentes** - evitar `../../../shared/utils/`
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

Este documento debe mantenerse actualizado con cada cambio significativo en la arquitectura o convenciones del proyecto.