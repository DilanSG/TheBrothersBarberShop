# The Brothers Barber Shop

## Descripción General

The Brothers Barber Shop es un sistema integral de gestión para barbería desarrollado con arquitectura moderna full-stack. La aplicación proporciona una solución completa para la administración de citas, gestión de inventario, control de ventas, y administración de personal, ofreciendo interfaces diferenciadas según el rol del usuario.

## Arquitectura del Sistema

### Stack Tecnológico

**Backend**
- Node.js con Express.js y arquitectura Clean Architecture
- MongoDB con Mongoose ODM para persistencia de datos
- Autenticación JWT con refresh tokens diferenciados por rol
- Cloudinary para gestión de imágenes
- Winston para logging profesional con rotación de archivos
- Redis para caché y optimización de rendimiento

**Frontend**
- React 18 con Hooks y Context API
- Vite como build tool y servidor de desarrollo
- Tailwind CSS para diseño responsivo con tema oscuro
- React Router DOM para navegación SPA
- Lucide React para iconografía consistente

### Estructura de Carpetas

El proyecto implementa Clean Architecture en el backend y arquitectura por features en el frontend:

```
TheBrothersBarberShop/
├── backend/                    # API REST con Clean Architecture
│   ├── src/
│   │   ├── core/
│   │   │   ├── domain/         # Entidades y repositorios
│   │   │   └── application/    # Casos de uso
│   │   ├── infrastructure/     # Configuración de BD y APIs externas
│   │   ├── presentation/       # Controladores, rutas y middleware
│   │   ├── services/           # Servicios de aplicación
│   │   └── shared/            # Configuración y utilidades
│   ├── scripts/               # Scripts de datos y mantenimiento
│   └── docs/                  # Documentación Swagger
├── frontend/                  # Aplicación React
│   └── src/
│       ├── features/          # Funcionalidades por dominio
│       ├── pages/            # Páginas principales
│       ├── layouts/          # Layouts compartidos
│       └── shared/           # Componentes y servicios compartidos
└── docs/                     # Build de producción
```

## Funcionalidades Principales

### Sistema de Autenticación y Usuarios

**Gestión de Usuarios**
- Registro e inicio de sesión con validación de email
- Sistema de roles: Cliente, Barbero y Administrador
- Perfiles de usuario con información personal y foto
- Tokens JWT con tiempos de expiración diferenciados por rol
- Refresh tokens automáticos para mantener sesión activa

**Control de Acceso**
- Rutas protegidas según rol de usuario
- Middleware de autorización en todas las operaciones sensibles
- Logout seguro con invalidación de tokens

### Gestión de Servicios

**Catálogo de Servicios**
- Creación y edición de servicios con descripción, precio y duración
- Categorización por tipo: corte, afeitado, lavado, combo, otros
- Gestión de imágenes para cada servicio
- Sistema de activación/desactivación de servicios

**Administración**
- Solo administradores pueden crear y modificar servicios
- Historial de cambios en precios y descripciones
- Vista pública del catálogo para clientes

### Sistema de Citas

**Programación de Citas**
- Calendario interactivo para selección de fecha y hora
- Asignación automática o manual de barberos
- Validación de disponibilidad en tiempo real
- Confirmación automática de citas

**Estados de Citas**
- Pendiente: Cita programada
- Confirmada: Cita confirmada por el barbero
- En progreso: Servicio en ejecución
- Completada: Servicio finalizado
- Cancelada: Cita cancelada por cliente o barbero

**Gestión por Rol**
- Clientes: Crear, ver y cancelar sus propias citas
- Barberos: Ver agenda, confirmar y gestionar citas asignadas
- Administradores: Control total sobre todas las citas

### Gestión de Barberos

**Perfiles de Barberos**
- Información personal y profesional completa
- Especialidades y servicios que ofrece cada barbero
- Horarios de trabajo y disponibilidad
- Foto de perfil y galería de trabajos

**Panel de Barbero**
- Dashboard con agenda del día
- Historial de citas y servicios realizados
- Estadísticas de rendimiento personal
- Gestión de ventas y comisiones

### Sistema de Inventario

**Gestión de Productos**
- Catálogo completo de productos con código, nombre y descripción
- Control de stock con alertas de inventario bajo
- Categorización de productos por tipo
- Precios de compra y venta

**Control de Stock**
- Entradas y salidas de inventario
- Snapshots diarios automáticos del inventario
- Historial completo de movimientos
- Reportes de consumo por período

**Alertas y Notificaciones**
- Notificaciones automáticas por stock bajo
- Reportes de productos próximos a vencer
- Alertas de reposición necesaria

### Sistema de Ventas

**Punto de Venta**
- Interfaz intuitiva para registro de ventas
- Selección de productos del inventario
- Cálculo automático de totales e impuestos
- Múltiples métodos de pago

**Métodos de Pago**
- Efectivo, tarjeta, transferencia bancaria
- Registro detallado de cada transacción
- Conciliación diaria de pagos

**Reportes de Ventas**
- Ventas por día, semana, mes
- Reportes por barbero y por producto
- Análisis de rentabilidad
- Exportación de datos

### Panel de Administración

**Gestión de Usuarios**
- Lista completa de usuarios registrados
- Cambio de roles y permisos
- Activación/desactivación de cuentas
- Estadísticas de usuarios activos

**Reportes y Análisis**
- Dashboard ejecutivo con métricas clave
- Reportes financieros detallados
- Análisis de tendencias y patrones
- Exportación de reportes en múltiples formatos

**Configuración del Sistema**
- Gestión de servicios y precios
- Configuración de horarios de atención
- Administración de barberos y sus horarios
- Configuración de métodos de pago

### Sistema de Socios

**Gestión de Socios**
- Registro de socios con porcentajes de participación
- Control exclusivo para administradores
- Diferenciación entre socios regulares y fundador
- Histórico de cambios en la sociedad

**Socio Fundador**
- Un único socio fundador por sistema
- Creación exclusiva mediante scripts autorizados
- Control total sobre la configuración del negocio
- Acceso a todas las métricas financieras

### Monitoreo y Logs

**Sistema de Logging**
- Logs detallados con Winston y rotación diaria
- Diferentes niveles: error, warn, info, debug
- Logs HTTP para auditoría de requests
- Manejo de errores no capturados

**Monitoreo de Rendimiento**
- Middleware de monitoreo en todas las rutas
- Métricas de tiempo de respuesta
- Detección de cuellos de botella
- Alertas por errores frecuentes

## Seguridad Implementada

### Autenticación y Autorización
- Hash seguro de contraseñas con bcrypt
- Tokens JWT con expiración automática
- Refresh tokens para sesiones prolongadas
- Middleware de autorización en rutas sensibles

### Protección de API
- Rate limiting para prevenir abuso
- Helmet para headers de seguridad
- CORS configurado para dominios permitidos
- Sanitización de datos MongoDB

### Validación de Datos
- Express-validator para validación robusta
- Sanitización de inputs del usuario
- Validación de tipos y formatos
- Prevención de inyección de código

## Scripts de Mantenimiento

El sistema incluye múltiples scripts para mantenimiento y gestión de datos:

**Scripts de Datos**
- `seed.js`: Datos iniciales del sistema
- `seed-test-data.js`: Datos de prueba para desarrollo
- `despoblarDB.js`: Limpieza completa de la base de datos

**Scripts de Socios**
- `inicializar-socio-fundador.js`: Creación interactiva de socio fundador
- `fundador-rapido.js`: Creación rápida de socio fundador

**Scripts de Mantenimiento**
- `purgarCitasVencidas.js`: Limpieza automática de citas antiguas
- `normalize-payment-methods.js`: Normalización de métodos de pago
- `test-cron-jobs.js`: Verificación de tareas programadas

## Configuración del Sistema

### Variables de Entorno Requeridas

```env
# Base de datos
MONGODB_URI=mongodb://localhost:27017/barbershop

# JWT Configuration
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=6h
JWT_REFRESH_EXPIRES_IN=30d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Application
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
```

### Configuración de Rate Limiting
- Requests generales: 100 por 15 minutos
- Endpoints de autenticación: 5 intentos por 15 minutos
- API completa: 1000 requests por hora

## Flujo de Trabajo del Usuario

### Para Clientes
1. Registro en la plataforma con email válido
2. Navegación por servicios disponibles
3. Selección de barbero y horario disponible
4. Confirmación de cita vía email
5. Seguimiento del estado de la cita

### Para Barberos
1. Acceso a dashboard personalizado
2. Visualización de agenda diaria
3. Confirmación de citas asignadas
4. Registro de servicios completados
5. Acceso a estadísticas personales
6. Acceso e sistema de conteo en inventario

### Para Administradores
1. Dashboard ejecutivo completo
2. Gestión de usuarios y roles
3. Configuración de servicios y precios
4. Supervisión de inventario y ventas
5. Generación de reportes financieros

## Tecnologías de Desarrollo

### Backend Dependencies
- `express`: Framework web minimalista
- `mongoose`: ODM para MongoDB
- `jsonwebtoken`: Autenticación JWT
- `bcryptjs`: Hash de contraseñas
- `helmet`: Middleware de seguridad
- `winston`: Sistema de logging
- `cloudinary`: Gestión de imágenes en la nube

### Frontend Dependencies
- `react`: Librería de interfaces de usuario
- `react-router-dom`: Enrutamiento para SPA
- `tailwindcss`: Framework de CSS utility-first
- `lucide-react`: Librería de iconos
- `date-fns`: Manipulación de fechas
- `react-toastify`: Sistema de notificaciones

## Documentación API

La API está completamente documentada con Swagger/OpenAPI 3.0, incluyendo:
- Descripción detallada de todos los endpoints
- Esquemas de datos de request y response
- Códigos de estado HTTP y manejo de errores
- Ejemplos de uso para cada operación
- Documentación de autenticación y autorización

## Derechos Reservados

Este sistema es propiedad privada de The Brothers Barber Shop. Todos los derechos están reservados. El código fuente, la documentación, el diseño de la base de datos, la arquitectura del software y todos los componentes relacionados son confidenciales y están protegidos por derechos de autor.

**Restricciones de uso:**
- Prohibida la reproducción, distribución o modificación sin autorización expresa
- El acceso al código fuente está limitado a personal autorizado
- No se permite el uso comercial o la redistribución de ninguna parte del sistema
- Todas las marcas comerciales y nombres mencionados son propiedad de sus respectivos dueños

**Contacto legal:** Para consultas sobre licencias o uso autorizado, contactar a la administración de The Brothers Barber Shop.(Dilan Steven Acuña, garaydilan2002@gmail.com)

---

**Versión:** 1.0.0  
**Última actualización:** Septiembre 2025  
**Desarrollado para:** The Brothers Barber Shop  
**Arquitectura:** Full-Stack JavaScript (Node.js + React)