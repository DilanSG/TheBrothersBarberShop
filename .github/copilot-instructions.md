# GitHub Copilot Instructions - The Brothers Barber Shop

**Essential Development Guide**: Use this file as context for all code suggestions and assistance. Consider these architectural patterns, workflows, and project-specific conventions.

## 🏗️ Project Architecture

**Full-stack barbershop management system** with React frontend (Vite + Tailwind) and Node.js/Express backend (MongoDB, JWT, Cloudinary).

### Core Structure
```
TheBrothersBarberShop/
├── backend/src/          # Express API with role-based auth
├── frontend/src/         # React SPA with Context API
├── docs/                 # Built frontend for GitHub Pages
└── dev-launcher.js       # Custom development server
```

### Development Workflow
- **Development**: `npm run dev` (launches both backend/frontend via `dev-launcher.js`)
- **Deployment Model**: 
  - Frontend: `gh-pages` branch → GitHub Pages (builds to `/docs/`)
  - Backend: `develop` branch → Render.com

## 🔧 Critical Development Patterns

### API Architecture (`backend/src/`)
- **Centralized routing**: All routes through `routes/index.js` with monitoring middleware
- **Role-based auth**: JWT with user/barber/admin roles via `middleware/auth.js`
- **Validation pattern**: Input validation with timezone awareness (Colombia/Bogota)
- **Error handling**: Centralized via `middleware/errorHandler.js` with Winston logging

### Frontend Architecture (`frontend/src/`)
- **Auth Context**: `contexts/AuthContext.jsx` handles JWT refresh every 14 minutes
- **API Service**: `services/api.js` with caching, retry logic, and offline support
- **Component Structure**: 
  - `pages/` for route components
  - `components/ui/` for reusable UI (GradientText, glassmorphism patterns)
  - `components/common/` for shared business logic

### Key Integration Points
```javascript
// API Base URLs (environment-dependent)
const API_URL = import.meta.env.VITE_API_URL;
// Assets helper for GitHub Pages deployment
import { getAssetUrl } from '../utils/assets.js';
// Authentication flow with role checking
const { user, logout } = useAuth();
```

## 🎨 Design System (Critical UI Patterns)

### Glassmorphism Classes (Always Use)
- **Inputs**: `glassmorphism-input` (focus states built-in)
- **Selects**: `glassmorphism-select` (native dropdown styling)
- **Scrollbars**: `custom-scrollbar` (on any overflow container)

### Status-Driven UI Colors
```jsx
// Appointment status colors (use consistently)
const statusStyles = {
  confirmed: 'bg-green-500/5 border-green-500/20 shadow-green-500/20',
  pending: 'bg-yellow-500/5 border-yellow-500/20 shadow-yellow-500/20',
  cancelled: 'bg-red-500/5 border-red-500/20 shadow-red-500/20',
  completed: 'bg-blue-500/5 border-blue-500/20 shadow-blue-500/20'
};
```

### Mobile-First Responsive Patterns
```jsx
// Standard container pattern
<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
// Grid collapse pattern  
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
// Typography scaling
<h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">
```

## 🔍 Environment & Configuration

### Required Environment Variables
```bash
# Backend (.env)
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret
CLOUDINARY_CLOUD_NAME=your-cloud
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret

# Frontend (.env)
VITE_API_URL=http://localhost:5000/api/v1  # Development
```

### Port Configuration
- **Backend**: `process.env.PORT || 5000` (dynamic for Render deployment)
- **Frontend**: `5173` (Vite default, configured in `vite.config.js`)

## 🚨 Critical Development Rules

### Branch Strategy
- **Frontend changes**: Work in `gh-pages` branch
- **Backend changes**: Work in `develop` branch
- **Asset paths**: Use `getAssetUrl()` helper for GitHub Pages compatibility

### Authentication Flow
- JWT stored in localStorage with auto-refresh
- Role checking: `user?.role === 'admin'` pattern
- Protected routes via AuthContext consumer pattern

### Data Validation
- **Timezone handling**: All dates in 'America/Bogota' timezone
- **Input sanitization**: express-mongo-sanitize + xss-clean in backend
- **File uploads**: Cloudinary integration with MIME type validation

## 🧪 Testing & Debugging

### Available Scripts
```bash
npm run dev              # Full development environment
npm run backend          # Backend only (port 5000)
npm run frontend         # Frontend only (port 5173)
npm run build            # Build frontend to /docs/
npm run install:all      # Install all dependencies
```

### Debug Tools
- **Backend logs**: Winston logging to `backend/logs/`
- **MongoDB debug**: Debug scripts in `backend/scripts/`
- **API monitoring**: Built-in monitoring middleware on all routes

### Common Debugging Patterns
```javascript
// API service debugging
console.log('API_URL:', import.meta.env.VITE_API_URL);
// Auth debugging  
console.log('Current user:', user, 'Token:', !!token);
// Environment validation
npm run dev  # Validates all required env vars
```

---

*Focus on these patterns for immediate productivity. The system uses established conventions - follow existing patterns rather than creating new ones.*

**Selectores y Opciones:**
- Los `<select>` DEBEN usar `glassmorphism-select`
- Las opciones tienen estilos automáticos con gradientes azul-púrpura
- Campos de fecha tienen iconos personalizados con efectos hover
- Todos los dropdowns nativos están estilizados con glassmorphism

---

## 🚨 Reglas de Ramas y Workflow

1. **Identifica el tipo de cambio:**
   - 🎨 **Frontend** (UI, assets, componentes, estilos) → Rama `gh-pages`
   - 🔧 **Backend** (API, validaciones, servicios, base de datos) → Rama `develop`

2. **Cambia a la rama correcta:**
   ```bash
   # Frontend
   git checkout gh-pages
   # Backend
   cd backend && git checkout develop
   ```

3. **Workflow de commits:**
   ```bash
   # Frontend
   git add .
   git commit -m "feat: descripción del cambio"
   git push origin gh-pages
   # Backend
   cd backend
   git add .
   git commit -m "feat: descripción del cambio"
   git push origin develop
   ```

4. **Deployment:**
   - Frontend: Cambios en `gh-pages` → GitHub Pages
   - Backend: Cambios en `develop` → Render

### 🎯 Breakpoints Estándar
- **Mobile First**: Diseño base para `320px+`
- **sm**: `640px+` (móviles grandes/tablets pequeñas)
- **md**: `768px+` (tablets)
- **lg**: `1024px+` (laptops pequeñas)
- **xl**: `1280px+` (desktops)

### ✅ Checklist de Responsividad Obligatorio

**Layout y Contenedores:**
- ✅ `max-w-4xl mx-auto px-4 sm:px-6 lg:px-8` en contenedores principales
- ✅ `flex-col sm:flex-row` en navegación y headers
- ✅ `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` en grids
- ✅ `space-y-4 sm:space-y-6 lg:space-y-8` en espaciado vertical
- ✅ `gap-4 sm:gap-6 lg:gap-8` en gaps de grid/flex

**Tipografía:**
- ✅ `text-xl sm:text-2xl lg:text-3xl` en títulos principales
- ✅ `text-sm sm:text-base lg:text-lg` en contenido
- ✅ `text-xs sm:text-sm` en labels y texto secundario

**Espaciado y Padding:**
- ✅ `p-4 sm:p-6 lg:p-8` en cards y contenedores
- ✅ `px-3 py-2` en inputs (consistente en todos los tamaños)
- ✅ `mb-4 sm:mb-6 lg:mb-8` en márgenes

**Elementos Interactivos:**
- ✅ `w-full sm:w-auto` en botones según contexto
- ✅ `hidden sm:inline` para texto que se oculta en móvil
- ✅ `sm:hidden` para versiones móviles de elementos
- ✅ **Tabs responsivos**: `whitespace-nowrap` para texto completo en móvil

**Imágenes y Media:**
- ✅ `w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28` para fotos de perfil
- ✅ Iconos adaptativos: `size={14} sm:size={16} lg:size={18}`

### 🚫 Errores Comunes a Evitar
- ❌ Elementos fijos sin responsividad
- ❌ Texto que se corta en móvil (ej: "Pers", "Segu", "Prof")
- ❌ Botones demasiado pequeños para tocar
- ❌ Grids que no colapsan en móvil
- ❌ Espaciado excesivo en móvil
- ❌ Formularios difíciles de usar en móvil
- ❌ **Tabs truncados**: Usar `whitespace-nowrap` en lugar de `substring()`

### 🛠️ Comando de Verificación
Antes de considerar completo cualquier componente, verificar en:
1. **Chrome DevTools** → Responsive Design Mode
2. **Breakpoints**: 375px, 640px, 768px, 1024px, 1280px
3. **Orientaciones**: Portrait y Landscape
4. **Interacciones**: Touch, hover, focus states

---

## 📦 Estructura y Arquitectura del Proyecto

```
TheBrothersBarberShop/
├── backend/                 # Node.js/Express API
│   ├── src/
│   │   ├── controllers/     # Lógica de rutas
│   │   ├── models/          # Modelos MongoDB
│   │   ├── routes/          # Endpoints
│   │   ├── services/        # Lógica de negocio
│   │   ├── middleware/      # Middlewares
│   │   ├── utils/           # Helpers
│   │   └── config/          # Configuración
│   ├── tests/               # Unitarios e integración
│   └── docs/                # Swagger API
├── frontend/                # React + Vite
│   ├── src/
│   │   ├── components/      # Componentes
│   │   ├── pages/           # Páginas
│   │   ├── contexts/        # Context API
│   │   ├── hooks/           # Custom hooks
│   │   ├── services/        # API services
│   │   └── utils/           # Utilidades
│   └── public/              # Estáticos
└── docs/                    # Documentación y build frontend
```

**Backend:**
- Deploy: Render.com desde rama `develop`
- Puerto: `process.env.PORT` (dinámico)
- Base de datos: MongoDB Atlas

**Frontend:**
- Deploy: GitHub Pages desde rama `gh-pages`
- Build: `npm run build` genera archivos en `/docs/`
- Assets: Usar helper `getAssetUrl()` para rutas de imágenes

---

## 🛠️ Instalación y Configuración

1. **Clona el repositorio:**
   ```bash
   git clone https://github.com/DilanSG/TheBrothersBarberShop.git
   cd TheBrothersBarberShop
   ```
2. **Instala dependencias:**
   ```bash
   npm run install:all
   # O por separado
   npm run install:backend
   npm run install:frontend
   ```
3. **Configura variables de entorno:**
   - Backend: `backend/.env` basado en `.env.example`
   - Frontend: `frontend/.env` basado en `.env.example`
4. **Ejecuta el proyecto:**
   ```bash
   npm run dev           # Backend y frontend juntos
   npm run dev --prefix backend
   npm run dev --prefix frontend
   ```

---

## 👤 Roles de Usuario

- **Usuario:** Agenda citas, ve historial
- **Barbero:** Gestiona citas, servicios, estadísticas
- **Admin:** Control total, usuarios, reportes

---

## 🔑 Endpoints y Flujos Principales

**Autenticación:**
- `POST /api/v1/auth/register` — Registro
- `POST /api/v1/auth/login` — Login
- `POST /api/v1/auth/logout` — Logout

**Usuarios:**
- `GET /api/v1/users/profile` — Perfil
- `PUT /api/v1/users/profile` — Actualizar
- `POST /api/v1/users/upload-profile-picture` — Foto

**Citas:**
- `GET /api/v1/appointments` — Listar
- `POST /api/v1/appointments` — Crear
- `PUT /api/v1/appointments/:id` — Actualizar
- `DELETE /api/v1/appointments/:id` — Cancelar

**Servicios:**
- `GET /api/v1/services` — Listar
- `POST /api/v1/services` — Crear (admin)
- `PUT /api/v1/services/:id` — Actualizar (admin)

---

## 🧪 Testing y Calidad

**Frontend:**
```bash
cd frontend
npm run dev    # Desarrollo local
npm run build  # Build producción
npm run preview # Preview build
```
**Backend:**
```bash
cd backend
npm run dev     # Desarrollo (nodemon)
npm start       # Producción
npm test        # Tests
```
**Testing recomendado:**
- @testing-library/react, @testing-library/jest-dom, jest, cypress

---

## 📈 Plan de Mejoras y Prioridades Futuras

### 🔮 Próximas Mejoras Sugeridas
1. Notificaciones automáticas al cliente por cambios de estado
2. Recordatorios antes de citas confirmadas
3. Rating/Review después de citas completadas
4. Reprogramación fácil de citas canceladas
5. Dashboard de métricas por barbero

### Inmediato (Esta semana)
- Configurar base de datos MongoDB en el .env
- Implementar Redis caching para consultas frecuentes
- Añadir tests para componentes críticos
- Configurar Sentry para error tracking en producción

### Corto plazo (2 semanas)
- PWA implementation completa
- Real-time notifications con WebSockets
- Advanced analytics implementation
- Performance optimization con bundle analysis

### Mediano plazo (1 mes)
- CI/CD pipeline con GitHub Actions
- Automated testing con Cypress
- Security auditing automatizado
- Load balancing para producción

### Alta prioridad (1-2 semanas)
- Configuración de tests y tests críticos (AuthContext, API, formularios, validaciones)
- Error logging y analytics

### Media prioridad (2-3 semanas)
- Redis implementation (cacheo inteligente)
- Sistema de notificaciones y modo offline (PWA)
- Índices de MongoDB para optimización

### UX y features avanzadas (3-4 semanas)
- Service Worker, push notifications, app-like features
- Real-time updates (WebSockets)
- Advanced search y filtros

---

## 📊 Métricas de Éxito y Seguimiento

**Performance:**
- Bundle size, lazy loading, TTI, FCP, API response times
**Security:**
- XSS, SQL injection, CSP, login attempts, actividad sospechosa
**Developer Experience:**
- Hot reload, error logging, performance metrics
**Business:**
- Conversion rate, engagement, error rates, page abandonment

---

## 📝 Buenas Prácticas y Problemas Comunes

1. **NO** commitear frontend en `develop` ni backend en `gh-pages`
2. **NO** usar rutas absolutas para assets en frontend (usa `getAssetUrl()`)
3. **NO** hardcodear puertos en backend (usa `process.env.PORT`)
4. **NO** ignorar timezone en validaciones de fecha (usa `America/Bogota`)
5. **CORS:** Backend debe permitir dominio del frontend en producción

---

## 📁 Archivos Críticos y Referencias

**Frontend:**
- `vite.config.js` — Build y base path
- `src/utils/assets.js` — Helper assets
- `src/services/api.js` — Endpoints API

**Backend:**
- `src/app.js` — Config principal
- `src/middleware/validation.js` — Validaciones (timezone)
- `src/controllers/appointmentController.js` — Lógica de citas

---

## 🛡️ Seguridad y Validaciones

- Variables de entorno validadas en backend
- Middleware de seguridad: helmet, express-mongo-sanitize, xss-clean, compression
- Validación de uploads: tipos MIME y escaneo básico

---

## 🧩 Comandos Útiles

```bash
# Backend - Seguridad y dependencias
cd backend
npm install helmet express-mongo-sanitize xss-clean compression redis

# Frontend - Testing y performance
cd frontend
npm install --save-dev @testing-library/react @testing-library/jest-dom jest-environment-jsdom cypress

# Producción (PWA)
npm install --save-dev workbox-webpack-plugin
```

---

## 🌐 URLs Importantes

- **API Base URL**
  - Desarrollo: `http://localhost:3000`
  - Producción: `https://[tu-app].onrender.com`
- **Frontend URL**
  - Desarrollo: `http://localhost:5173`
  - Producción: `https://[usuario].github.io/TheBrothersBarberShop`

---

## 🎨 Guía de Estilos y Diseño Unificado

### Principios de Diseño
The Brothers Barber Shop utiliza un sistema de diseño coherente basado en:
- **Glassmorphism**: Elementos semitransparentes con `backdrop-blur-sm`
- **Gradientes sutiles**: Principalmente azul-rojo para elementos activos
- **Sombras azules**: `shadow-xl shadow-blue-500/20` para profundidad
- **Consistencia visual**: Mismos patrones en toda la aplicación

### 🔧 Contenedores Principales

**Contenedor de página:**
```jsx
<PageContainer>
  <div className="bg-transparent border border-white/10 rounded-2xl backdrop-blur-sm shadow-2xl shadow-blue-500/20">
    {/* Contenido */}
  </div>
</PageContainer>
```

**Contenedores de secciones/tabs:**
```jsx
<div className="group relative px-4 py-4 transition-colors backdrop-blur-sm border-b border-white/5 overflow-hidden rounded-lg">
  {/* Efecto de brillo en hover */}
  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-lg"></div>
  <div className="relative p-2">
    {/* Contenido */}
  </div>
</div>
```

### � Selectores y Dropdowns Nativos

**Select nativo con glassmorphism:**
```jsx
<select className="glassmorphism-select">
  <option value="">Seleccionar opción</option>
  <option value="1">Opción Normal</option>
  <option value="2" disabled>Opción Deshabilitada</option>
</select>
```

**Características automáticas de .glassmorphism-select:**
- Flecha personalizada SVG (ChevronDown)
- Opciones con gradientes azul-púrpura automáticos
- Estados hover/focus/checked estilizados
- Color-scheme dark para campos de fecha
- Iconos de calendario personalizados con efectos hover

**Estilos aplicados automáticamente a las opciones:**
- Fondo: `background-color: #1f2937` con gradiente azul-púrpura
- Hover: Gradiente más intenso y color azul claro
- Checked: Fondo azul intenso con texto blanco y font-weight bold
- Disabled: Fondo gris con texto desaturado y opacidad reducida

### �📝 Inputs y Campos de Formulario

**Input estándar (usar clase glassmorphism-input):**
```jsx
<input
  className="glassmorphism-input"
  placeholder="Texto de ejemplo"
/>
```

**Textarea estándar (usar clase glassmorphism-textarea):**
```jsx
<textarea
  className="glassmorphism-textarea"
  rows={3}
/>
```

**Selector personalizado (usar clase glassmorphism-select):**
```jsx
<select className="glassmorphism-select">
  <option value="">Seleccionar opción</option>
  <option value="1">Opción 1</option>
</select>
```

**Campo de fecha con estilos mejorados:**
```jsx
<input
  type="date"
  className="glassmorphism-input"
  value={selectedDate}
  onChange={(e) => setSelectedDate(e.target.value)}
/>
```

**Dropdown button personalizado (para casos especiales):**
```jsx
<button className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm backdrop-blur-sm placeholder-gray-400 focus:border-blue-500/50 hover:border-blue-500/50 transition-all duration-300 text-left flex items-center justify-between shadow-xl shadow-blue-500/20">
  <span>{selectedValue || placeholder}</span>
  <ChevronDown size={16} />
</button>
```

### 🏷️ Tabs/Navegación por Pestañas

**Contenedor de tabs:**
```jsx
<div className="bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm shadow-lg p-1 flex flex-col sm:flex-row gap-1 w-full max-w-xs sm:max-w-lg">
  {/* Tabs individuales */}
</div>
```

**Tab individual responsivo:**
```jsx
// Mostrar texto completo en todos los tamaños con whitespace-nowrap
{[
  { id: 'personal', label: 'Personal', icon: User },
  { id: 'security', label: 'Seguridad', icon: Lock },
  { id: 'preferences', label: 'Preferencias', icon: Bell }
].map(({ id, label, icon: Icon }) => (
  <button
    className={`group relative px-3 py-2.5 rounded-xl border cursor-pointer transition-all duration-300 hover:scale-105 overflow-hidden backdrop-blur-sm flex-1 flex items-center justify-center gap-1.5 ${
      activeTab === id
        ? 'border-blue-500/50 bg-blue-500/10 shadow-xl shadow-blue-500/20'
        : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
    }`}
  >
    <Icon size={14} className={`transition-all duration-300 ${
      activeTab === id ? 'text-blue-300' : 'text-white'
    }`} />
    <span className={`font-medium text-xs sm:text-xs whitespace-nowrap ${
      activeTab === id ? 'text-blue-300' : 'text-white'
    }`}>{label}</span>
  </button>
))}
```

### 🃏 Cards y Elementos Seleccionables

**Card estándar (servicios, elementos de lista):**
```jsx
<div className={`group relative p-4 rounded-xl border cursor-pointer transition-all duration-300 hover:scale-105 overflow-hidden backdrop-blur-sm ${
  isSelected
    ? 'border-blue-500/50 bg-blue-500/10 shadow-xl shadow-blue-500/20'
    : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
}`}>
  {/* Contenido de la card */}
</div>
```

**Cards de citas (appointment cards):**
```jsx
<div className={`group relative backdrop-blur-sm border rounded-lg p-4 transition-all duration-300 overflow-hidden hover:scale-[1.002] hover:-translate-y-0.5 cursor-pointer ml-1 mr-1 ${
  status === 'confirmed' ? 'border-green-500/30 bg-green-500/5 shadow-sm shadow-green-500/20' :
  status === 'pending' ? 'border-yellow-500/30 bg-yellow-500/5 shadow-sm shadow-yellow-500/20' :
  status === 'cancelled' ? 'border-red-500/30 bg-red-500/5 shadow-sm shadow-red-500/20' :
  'border-blue-500/30 bg-blue-500/5 shadow-sm shadow-blue-500/20'
}`}>
  {/* Efecto de brillo */}
  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-lg"></div>
  
  <div className="relative">
    {/* Contenido de la cita */}
  </div>
</div>
```

**Colores por estado de citas:**
- **Confirmada (Verde)**: `bg-green-500/5`, `border-green-500/30`, `shadow-green-500/20`
- **Pendiente (Amarillo)**: `bg-yellow-500/5`, `border-yellow-500/30`, `shadow-yellow-500/20`
- **Cancelada (Rojo)**: `bg-red-500/5`, `border-red-500/30`, `shadow-red-500/20`
- **Completada (Azul)**: `bg-blue-500/5`, `border-blue-500/30`, `shadow-blue-500/20`

**Status badges para citas:**
```jsx
<div className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
  status === 'confirmed' ? 'bg-green-500/20 text-green-300 border-green-500/40' :
  status === 'pending' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' :
  status === 'cancelled' ? 'bg-red-500/20 text-red-300 border-red-500/40' :
  'bg-blue-500/20 text-blue-300 border-blue-500/40'
}`}>
  {statusText}
</div>
```

**Card de día/horario:**
```jsx
<div className="group relative px-4 py-4 transition-colors backdrop-blur-sm border border-white/10 rounded-lg shadow-lg hover:shadow-xl overflow-hidden">
  {/* Efecto de brillo */}
  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-lg"></div>
  <div className="relative flex flex-col md:flex-row md:items-center gap-3">
    {/* Contenido */}
  </div>
</div>
```

### 🔘 Botones

**Botón primario (GradientButton):**
```jsx
<GradientButton
  variant="primary"
  size="md"
  className="shadow-xl shadow-blue-500/20"
>
  <div className="flex items-center gap-2">
    <Icon size={18} />
    <span>Texto del botón</span>
  </div>
</GradientButton>
```

**Botón secundario:**
```jsx
<button className="group relative p-2 bg-gradient-to-r from-blue-600/20 to-red-600/20 rounded-lg border border-blue-500/30 hover:border-red-500/40 transition-all duration-300 backdrop-blur-sm hover:bg-gradient-to-r hover:from-blue-600/30 hover:to-red-600/30 transform hover:scale-110 shadow-xl shadow-blue-500/20">
  <Icon size={16} className="text-blue-400 group-hover:text-red-400 transition-colors duration-300" />
</button>
```

**Botón de advertencia/especial:**
```jsx
<button className="px-4 py-2 bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border border-yellow-500/50 rounded-lg text-yellow-400 hover:from-yellow-600/30 hover:to-orange-600/30 transition-all duration-300 text-sm font-medium shadow-xl shadow-blue-500/20">
  Texto del botón
</button>
```

### 🏠 Modales

**Modal estándar con glassmorphism:**
```jsx
<div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
  <div className="relative w-full max-w-md mx-auto">
    <div className="relative bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-2xl">
      <div className="relative z-10">
        {/* Contenido del modal */}
      </div>
    </div>
  </div>
</div>
```

**Modal con tema por estado (citas):**
```jsx
<div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
  <div className="relative w-full max-w-md mx-auto">
    <div className={`relative backdrop-blur-md border rounded-2xl p-6 shadow-2xl ${
      type === 'info' ? 'bg-blue-500/5 border-blue-500/20 shadow-blue-500/20' :
      type === 'success' ? 'bg-green-500/5 border-green-500/20 shadow-green-500/20' :
      type === 'warning' ? 'bg-yellow-500/5 border-yellow-500/20 shadow-yellow-500/20' :
      type === 'error' ? 'bg-red-500/5 border-red-500/20 shadow-red-500/20' :
      'bg-white/10 border-white/20'
    }`}>
      <div className="relative z-10">
        {/* Contenido del modal */}
      </div>
    </div>
  </div>
</div>
```

### ✨ Efectos y Animaciones

**Efecto de brillo (para contenedores):**
```jsx
<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-lg"></div>
```

**Hover scale:**
```jsx
className="transition-all duration-300 hover:scale-105"
```

**Transición de colores:**
```jsx
className="transition-colors duration-300"
```

**Scrollbar glassmorphism (aplicar a cualquier contenedor con scroll):**
```jsx
<div className="custom-scrollbar overflow-y-auto max-h-64">
  {/* Contenido con scroll */}
</div>
```

### 🎨 Colores y Transparencias

**Fondos:**
- Principal: `bg-white/5`
- Seleccionado/Activo: `bg-blue-500/10`
- Hover: `bg-white/10`

**Bordes:**
- Normal: `border-white/10`
- Hover: `border-white/40` 
- Activo: `border-blue-500/50`
- Focus: `focus:border-blue-500/50`

**Texto:**
- Principal: `text-white`
- Secundario: `text-gray-300`
- Placeholder: `placeholder-gray-400`
- Activo: `text-blue-300`
- Descripción activa: `text-blue-200`

**Sombras:**
- Estándar: `shadow-xl shadow-blue-500/20`
- Cards: `shadow-lg`
- Hover elevado: `hover:shadow-xl`

### 📏 Espaciado y Dimensiones Responsivas

**Padding interno responsivo:**
- Contenedores: `p-4 sm:p-6 lg:p-8`
- Inputs: `px-3 py-2` (consistente en todos los tamaños)
- Buttons: `px-3 py-2.5` (small), `px-4 py-2` (medium)

**Gaps y márgenes responsivos:**
- Entre elementos: `gap-2 sm:gap-4 lg:gap-6`
- Márgenes: `mb-4 sm:mb-6 lg:mb-8`
- Espaciado vertical: `space-y-4 sm:space-y-6 lg:space-y-8`

**Redondeado:**
- Estándar: `rounded-lg`
- Cards: `rounded-xl`
- Contenedores principales: `rounded-2xl`

**Tamaños de iconos responsivos:**
- Pequeños: `size={14}` en móvil, `size={16}` en desktop
- Medianos: `size={16}` en móvil, `size={18}` en desktop
- Grandes: `size={18}` en móvil, `size={20}` en desktop

**Tipografía responsiva:**
- Títulos: `text-xl sm:text-2xl lg:text-3xl`
- Subtítulos: `text-lg sm:text-xl lg:text-2xl`
- Contenido: `text-sm sm:text-base lg:text-lg`
- Labels: `text-xs sm:text-sm`

### 🔧 Reglas de Aplicación de Estilos

**Al reorganizar estilos de una página:**

1. **Contenedores principales** → Aplicar glassmorphism con sombra azul
2. **Responsividad** → Verificar todos los breakpoints (sm, md, lg, xl)
3. **Tabs/pestañas** → Usar el patrón de card seleccionable responsivo
4. **Inputs** → Agregar sombra azul y focus azul
5. **Botones** → Agregar sombra azul a todos los tipos
6. **Cards** → Aplicar patrón hover:scale-105 y efectos
7. **Efectos de brillo** → Intensidad `via-white/[2.5%]` 
8. **Z-index** → Resolver superposiciones de dropdowns
9. **Consistencia** → Mismo patrón visual en toda la página
10. **Mobile First** → Verificar que funcione en 375px primero

**Herramientas de verificación obligatorias:**
- ✅ Todos los elementos interactivos deben tener `shadow-xl shadow-blue-500/20`
- ✅ Efectos hover consistentes en toda la página
- ✅ Transparencias y blur uniformes
- ✅ Transiciones suaves (duration-300)
- ✅ **Responsividad móvil completa** (375px, 640px, 768px, 1024px)
- ✅ Grids que colapsan correctamente
- ✅ Texto legible en móvil
- ✅ Botones tocables fácilmente
- ✅ Headers y navegación adaptativa

**Comando de reorganización:**
Cuando el usuario solicite "reorganizar estilos", "aplicar el diseño estándar" o "hacer responsivo", aplicar automáticamente todos estos patrones a la página actual:

1. **Layout responsivo**: Contenedores con `max-w-4xl mx-auto px-4 sm:px-6 lg:px-8`
2. **Grids adaptativos**: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
3. **Flexbox responsivo**: `flex-col sm:flex-row`
4. **Espaciado escalable**: `gap-4 sm:gap-6 lg:gap-8`
5. **Tipografía adaptativa**: `text-sm sm:text-base lg:text-lg`
6. **Iconos escalables**: `size={14}` a `size={18}` según breakpoint
7. **Padding responsive**: `p-4 sm:p-6 lg:p-8`
8. **Navegación adaptativa**: Pestañas que colapsan en móvil
9. **Botones táctiles**: Tamaño mínimo 44px para móvil
10. **Overflow seguro**: `break-words` en texto largo

**Verificación final obligatoria:**
- 🔍 Chrome DevTools → Responsive Design Mode
- 📱 Prueba en 375px (iPhone SE), 768px (iPad), 1024px (Desktop)
- 👆 Todos los elementos interactivos son fáciles de tocar
- 📝 Todo el texto es legible sin zoom
- 🎯 Navegación funciona en todos los tamaños

---

*Última actualización: 10 de Septiembre, 2025*

## 🚨 REGLAS ADICIONALES CRÍTICAS (Septiembre 2025)

### 🎯 REGLA: LAYOUT Y ESPACIADO PERFECTO

**Espaciado de página obligatorio:**
- **USAR SOLO**: El espaciado natural de PageContainer (`pt-10 sm:pt-12`)
- **NO agregar**: `pt-24 sm:pt-28 lg:pt-32` adicional en contenedores internos
- Grid responsivo: `grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8`
- Espaciado interno: `p-6 lg:p-8` en cards principales

**Estructura de página estándar:**
```jsx
<PageContainer>
  <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6 space-y-8">
    {/* Contenido - SIN padding-top adicional */}
  </div>
</PageContainer>
```

**REGLA CRÍTICA: NO duplicar fondos de PageContainer:**
- PageContainer YA incluye todos los fondos de puntos necesarios
- NO agregar fondos adicionales en páginas individuales
- Esto evita duplicación y mejora el rendimiento

### 🗂️ REGLA: TABS SEPARADOS DEL TÍTULO

**Estructura obligatoria para secciones con tabs:**
```jsx
{/* Título centrado */}
<div className="text-center mb-6">
  <div className="flex items-center justify-center gap-3 mb-2">
    <div className="p-3 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-xl border border-purple-500/20 shadow-xl shadow-blue-500/20">
      <Icon className="w-6 h-6 text-purple-400" />
    </div>
    <GradientText className="text-xl lg:text-2xl font-bold">
      Título de Sección
    </GradientText>
  </div>
</div>

{/* Tabs responsivos centrados */}
<div className="flex justify-center mb-6">
  <div className="bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm shadow-lg p-1 flex gap-1">
    {/* Tabs individuales */}
  </div>
</div>
```

### 🎨 REGLA: EFECTOS VISUALES OBLIGATORIOS

**Efecto de brillo en contenedores:**
```jsx
<div className="group relative">
  {/* Efecto de brillo */}
  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-2xl"></div>
  <div className="relative">
    {/* Contenido */}
  </div>
</div>
```

**Sombras azules obligatorias:**
- Todos los elementos interactivos: `shadow-xl shadow-blue-500/20`
- Cards principales: `shadow-2xl shadow-blue-500/20`
- Botones y enlaces: `shadow-lg shadow-blue-500/20`

### 📱 REGLA: RESPONSIVIDAD AVANZADA

**Iconos adaptativos:**
- Pequeños: `w-4 h-4 sm:w-5 sm:h-5`
- Medianos: `w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8`
- Grandes: `w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12`

**Padding y márgenes escalables:**
- Cards: `p-4 sm:p-6 lg:p-8`
- Espaciado vertical: `space-y-4 sm:space-y-6 lg:space-y-8`
- Gaps: `gap-4 sm:gap-6 lg:gap-8`

### 🔧 COMANDO DE APLICACIÓN AUTOMÁTICA

**Cuando el usuario solicite "aplicar diseño estándar" o "reorganizar estilos":**

1. ✅ Aplicar `GradientText` a todos los títulos principales
2. ✅ Agregar íconos glassmorphism a secciones principales
3. ✅ Separar títulos de tabs en renglones diferentes
4. ✅ Aplicar z-index dinámico a listas de cards
5. ✅ Agregar efectos de brillo a contenedores
6. ✅ Verificar responsividad en todos los breakpoints
7. ✅ Aplicar sombras azules a elementos interactivos
8. ✅ Usar modales unificados con colores temáticos
9. ✅ Bloquear scroll del body en modales
10. ✅ Verificar glassmorphism en inputs/selects

**Verificación final obligatoria:**
- 📱 Móvil (375px): Layout, navegación, touch targets
- 💻 Desktop (1280px): Espaciado, grids, hover effects
- 🎨 Consistencia: Colores, sombras, efectos
- ⚡ Performance: Transiciones, animaciones

---

*Última actualización: 10 de Septiembre, 2025 - Versión UserAppointment completada*
