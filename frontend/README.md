# 💈 The Brothers Barber Shop - Frontend

## 📋 Descripción
Frontend moderno para el sistema de gestión de barbería The Brothers Barber Shop, construido con React y tecnologías modernas.

## 🚀 Tecnologías
- **React 18** - Framework principal
- **React Router** - Navegación SPA
- **Tailwind CSS** - Estilos y responsividad
- **Vite** - Build tool y dev server
- **Lucide React** - Iconografía moderna

## 📁 Estructura del Proyecto
```
src/
├── components/           # Componentes reutilizables
│   ├── auth/            # Autenticación y protección de rutas
│   ├── inventory/       # Gestión de inventario
│   ├── layout/          # Layouts y navegación
│   ├── notifications/   # Sistema de notificaciones
│   ├── ui/              # Componentes UI básicos
│   └── user/            # Componentes específicos de usuario
├── contexts/            # React Contexts (Auth, Notifications, etc.)
├── pages/               # Páginas organizadas por rol
│   ├── admin/           # Panel administrativo
│   ├── auth/            # Login/Registro
│   ├── barber/          # Panel de barbero
│   └── appointment/     # Sistema de citas
├── services/            # Servicios de API
├── utils/               # Utilidades y helpers
└── assets/              # Recursos estáticos
```

## 🛠️ Instalación y Configuración

### Prerrequisitos
- Node.js 18+
- npm o yarn

### Instalación
```bash
cd frontend
npm install
```

### Variables de Entorno
Crear archivo `.env` basado en `.env.example`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_ENV=development
```

## 🚀 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Servidor de desarrollo (port 5173)

# Producción
npm run build        # Build optimizado para producción
npm run preview      # Preview del build de producción

# Análisis
npm run analyze      # Análisis del bundle
```

## 📱 Características
- ✅ **Totalmente Responsivo** - Optimizado para móvil, tablet y desktop
- ✅ **PWA Ready** - Preparado para Progressive Web App
- ✅ **Lazy Loading** - Carga dinámica de componentes
- ✅ **Optimización de Bundle** - Chunks optimizados y tree-shaking
- ✅ **Sistema de Roles** - Admin, Barbero, Usuario
- ✅ **Notificaciones** - Sistema de alertas integrado
- ✅ **Gestión de Estado** - Context API para estado global

## 🔧 Optimizaciones Implementadas

### Performance
- **Code Splitting** automático por rutas
- **Lazy Loading** de componentes pesados
- **Optimización de imágenes** y assets
- **Minificación** y compresión en producción

### UX/UI
- **Responsive Design** con Tailwind CSS
- **Loading States** para mejor feedback
- **Error Boundaries** para manejo de errores
- **Accessibility** básica implementada

## 🧹 Estructura de Archivos Limpia
- ❌ Sin archivos duplicados o de respaldo
- ✅ Exports centralizados en archivos `index.js`
- ✅ Importaciones organizadas y optimizadas
- ✅ Separación clara por funcionalidad

## 🔄 Estado del Proyecto
- [x] Configuración base
- [x] Sistema de autenticación
- [x] Páginas principales implementadas
- [x] Responsividad móvil completa
- [x] Sistema de notificaciones
- [x] Gestión de inventario
- [x] Panel administrativo
- [x] Optimización de performance
- [x] Cleanup de código

## 📞 Soporte
Para reportar bugs o solicitar features, crear un issue en el repositorio.

---
Desarrollado con ❤️ para The Brothers Barber Shop
