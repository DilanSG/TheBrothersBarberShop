# The Brothers Barber Shop
**Sistema Integral de Gestión para Barbería Profesional**

The Brothers Barber Shop es una solución empresarial completa desarrollada específicamente para la gestión integral de establecimientos de barbería. El sistema combina tecnologías modernas con una arquitectura robusta para ofrecer control total sobre operaciones diarias, finanzas, inventario y administración de personal.

## Visión General del Sistema

Esta plataforma proporciona una experiencia unificada que abarca desde la programación de citas hasta el análisis financiero detallado, diseñada para barberos, administradores y clientes. El sistema se distingue por su enfoque en la escalabilidad, seguridad y facilidad de uso, adaptándose a las necesidades específicas del negocio de barbería profesional.

### Características Distintivas

- **Arquitectura Clean Architecture**: Implementación de patrones de diseño avanzados para máxima mantenibilidad y escalabilidad
- **Sistema de Roles Diferenciado**: Interfaces específicas optimizadas para clientes, barberos y administradores
- **Gestión Financiera Avanzada**: Control completo de gastos recurrentes, categorización inteligente y reportes detallados
- **Punto de Venta Integrado**: Sistema POS completo con múltiples métodos de pago y control de inventario en tiempo real
- **Programación Inteligente**: Sistema de citas con validación de disponibilidad y optimización de horarios

## Stack Tecnológico

### Backend - API REST Robusta
- **Runtime**: Node.js 20+ con módulos ES6
- **Framework**: Express.js con middleware especializado
- **Arquitectura**: Clean Architecture con patrón Repository y Dependency Injection
- **Base de Datos**: MongoDB con Mongoose ODM y validaciones avanzadas
- **Autenticación**: JWT con refresh tokens diferenciados por rol y tiempos de expiración adaptativos
- **Almacenamiento**: Cloudinary para gestión profesional de imágenes
- **Logging**: Winston con rotación diaria y niveles diferenciados
- **Cache**: Redis con Node-cache para optimización de rendimiento
- **Seguridad**: Helmet, CORS, Rate Limiting, Sanitización MongoDB, XSS Protection

### Frontend - Aplicación React Moderna
- **Framework**: React 18+ con Hooks y Context API para gestión de estado
- **Build Tool**: Vite para desarrollo y producción optimizada
- **Enrutamiento**: React Router DOM v6 con rutas protegidas
- **Estilos**: Tailwind CSS con tema oscuro personalizado y componentes reutilizables
- **Iconografía**: Lucide React para consistencia visual
- **Fechas**: Date-fns con React Day Picker para manejo profesional de fechas
- **Notificaciones**: React Toastify integrado con sistema centralizado
- **Performance**: Lazy loading, code splitting y optimización de bundle

### Arquitectura del Proyecto

```
TheBrothersBarberShop/
├── backend/                           # API REST con Clean Architecture
│   ├── src/
│   │   ├── core/
│   │   │   ├── domain/               # Entidades de negocio y interfaces
│   │   │   │   ├── entities/         # Modelos MongoDB
│   │   │   │   └── repositories/     # Interfaces Repository
│   │   │   └── application/
│   │   │       ├── usecases/         # Lógica de negocio encapsulada
│   │   │       └── services/         # Servicios de aplicación
│   │   ├── infrastructure/           # Capa de infraestructura
│   │   │   ├── database/             # Implementaciones Repository
│   │   │   ├── external/             # APIs externas (Cloudinary)
│   │   │   └── cache/                # Adaptadores de cache
│   │   ├── presentation/             # Capa de presentación
│   │   │   ├── controllers/          # Controladores HTTP
│   │   │   ├── middleware/           # Middleware personalizado
│   │   │   └── routes/               # Definición de rutas API
│   │   └── shared/
│   │       ├── config/               # Configuraciones centralizadas
│   │       ├── utils/                # Utilidades comunes
│   │       └── constants/            # Constantes del sistema
│   ├── scripts/                      # Scripts de mantenimiento
│   └── docs/                         # Documentación Swagger
├── frontend/                         # Aplicación React SPA
│   └── src/
│       ├── features/                 # Funcionalidades por dominio
│       │   ├── admin/                # Panel administrativo
│       │   ├── appointments/         # Sistema de citas
│       │   ├── auth/                 # Autenticación
│       │   ├── barbers/              # Panel de barberos
│       │   └── expenses/             # Gestión de gastos
│       ├── pages/                    # Páginas principales
│       ├── layouts/                  # Layouts reutilizables
│       └── shared/
│           ├── components/           # Componentes reutilizables
│           ├── contexts/             # Context providers
│           ├── hooks/                # Custom hooks
│           ├── services/             # APIs y servicios
│           └── utils/                # Utilidades frontend
└── deployment/                      # Configuraciones de deployment
```

## Funcionalidades Principales

### Sistema de Autenticación y Gestión de Usuarios

**Autenticación Robusta**
- Sistema de registro con validación de email y verificación de cuentas
- Inicio de sesión seguro con tokens JWT y refresh automático
- Gestión de sesiones con tiempos de expiración diferenciados por rol
- Logout seguro con invalidación completa de tokens

**Sistema de Roles Avanzado**
- **Cliente**: Acceso a programación de citas, historial personal y gestión de perfil
- **Barbero**: Panel especializado con agenda, ventas, estadísticas y gestión de servicios
- **Administrador**: Control total del sistema, reportes financieros y gestión de usuarios
- **Socio**: Acceso privilegiado a métricas financieras y análisis de rentabilidad

### Sistema de Citas Inteligente

**Programación Avanzada**
- Calendario interactivo con disponibilidad en tiempo real
- Validación automática de horarios y prevención de dobles reservas
- Asignación inteligente de barberos según especialidades y disponibilidad
- Sistema de confirmación automática con notificaciones por email

**Estados de Cita Optimizados**
- **Pendiente**: Cita programada esperando confirmación del barbero
- **Confirmada**: Cita verificada y confirmada por el barbero asignado
- **En Progreso**: Servicio siendo ejecutado actualmente
- **Completada**: Servicio finalizado con registro de pago
- **Cancelada**: Cita cancelada con registro de motivo y timestamps

**Gestión por Roles**
- Clientes: Programar, visualizar y cancelar citas personales
- Barberos: Gestionar agenda diaria, confirmar citas y actualizar estados
- Administradores: Supervisión completa con reasignación y reportes

### Gestión Completa de Barberos

**Perfiles Profesionales**
- Información personal y profesional detallada con fotografías
- Especialidades específicas y servicios que ofrece cada barbero
- Configuración de horarios de trabajo con disponibilidad personalizada
- Galería de trabajos realizados y portafolio digital

**Panel de Barbero Especializado**
- Dashboard personalizado con agenda del día y próximas citas
- Sistema de ventas integrado con carrito de compras y múltiples métodos de pago
- Estadísticas de rendimiento personal con métricas de productividad
- Gestión de comisiones y seguimiento de ingresos por período

### Sistema de Inventario Profesional

**Gestión de Productos Avanzada**
- Catálogo completo con códigos únicos, descripciones detalladas y categorización
- Control de stock en tiempo real con alertas automáticas de inventario bajo
- Gestión de precios de compra y venta con seguimiento de márgenes
- Sistema de códigos de barras y búsqueda inteligente

**Control de Stock Inteligente**
- Registro automático de entradas y salidas con timestamps
- Snapshots diarios del inventario con histórico completo
- Reportes de rotación de productos y análisis de consumo
- Predicción de reposición basada en patrones de uso

**Alertas y Monitoreo**
- Notificaciones automáticas por stock crítico configurable
- Alertas de productos próximos a vencer con fechas de caducidad
- Reportes de productos sin movimiento y análisis de inventario muerto
- Dashboard de métricas de inventario con indicadores clave

### Sistema de Ventas y Punto de Venta

**Punto de Venta Completo**
- Interfaz táctil optimizada para registro rápido de ventas
- Carrito de compras con capacidad multi-producto y servicios
- Cálculo automático de totales, descuentos e impuestos
- Sistema de códigos de barras para agilizar el proceso

**Métodos de Pago Múltiples**
- Efectivo con cálculo de cambio automático
- Tarjetas de débito y crédito con validación
- Transferencias bancarias y pagos digitales (Nequi, Daviplata)
- Registro detallado de cada transacción con trazabilidad completa

**Comisiones y Rentabilidad**
- Cálculo automático de comisiones por barbero
- Seguimiento de ventas individuales y grupales
- Análisis de rentabilidad por producto y servicio
- Reportes de performance con comparativas mensuales

### Gestión Financiera Avanzada

**Sistema de Gastos Recurrentes**
- Configuración de gastos automáticos (arriendo, servicios, nómina)
- Cinco categorías estáticas principales: arriendo, nómina, insumos, servicios, equipos
- Categorías dinámicas personalizables según necesidades del negocio
- Generación automática de instancias de gastos con programación inteligente

**Reportes Financieros Detallados**
- Dashboard ejecutivo con métricas financieras clave
- Análisis de ingresos vs gastos con proyecciones
- Reportes de flujo de caja con períodos personalizables
- Exportación de datos financieros en múltiples formatos

**Control de Costos**
- Seguimiento detallado de gastos por categoría y período
- Análisis de tendencias con alertas de desviaciones
- Presupuestos configurables con seguimiento de cumplimiento
- Reportes de rentabilidad por barbero y por servicio

### Panel de Administración Ejecutivo

**Gestión de Personal**
- Administración completa de usuarios con roles y permisos
- Control de acceso granular por funcionalidad
- Seguimiento de actividad de usuarios con logs detallados
- Sistema de activación/desactivación de cuentas

**Configuración del Sistema**
- Gestión centralizada de servicios con precios y duraciones
- Configuración de horarios de atención por barbero
- Administración de métodos de pago y comisiones
- Personalización de categorías de gastos y productos

**Análisis y Reportes**
- Reportes ejecutivos con métricas de negocio
- Análisis de tendencias y patrones de comportamiento
- Dashboard de KPIs con indicadores personalizables
- Exportación automática de reportes programados

### Sistema de Socios y Participaciones

**Gestión de Sociedad**
- Registro de socios con porcentajes de participación exactos
- Control exclusivo para administradores autorizados
- Diferenciación entre socios regulares y socio fundador
- Histórico completo de cambios en la estructura societaria

**Socio Fundador Especial**
- Un único socio fundador por sistema con privilegios especiales
- Creación exclusiva mediante scripts de seguridad autorizados
- Control total sobre configuraciones críticas del negocio
- Acceso privilegiado a todas las métricas financieras sensibles

## Seguridad y Monitoreo

### Seguridad Multicapa

**Autenticación y Autorización**
- Hash seguro de contraseñas con bcrypt y salt personalizado
- Tokens JWT con algoritmos robustos y claves de firma seguras
- Refresh tokens con expiración diferenciada por rol de usuario
- Middleware de autorización granular en rutas críticas

**Protección de API Avanzada**
- Rate limiting inteligente para prevenir ataques de fuerza bruta
- Helmet para configuración segura de headers HTTP
- CORS configurado específicamente para dominios autorizados
- Sanitización completa de datos MongoDB para prevenir inyecciones

**Validación y Sanitización**
- Express-validator para validación robusta de todos los inputs
- Sanitización automática de datos de entrada del usuario
- Validación de tipos de datos y formatos específicos
- Prevención activa de inyección de código malicioso

### Sistema de Logging Profesional

**Logging Centralizado**
- Winston como sistema principal con rotación automática diaria
- Niveles diferenciados: error, warn, info, debug con filtrado inteligente
- Logs HTTP detallados para auditoría completa de requests
- Manejo especializado de errores no capturados con stack traces

**Monitoreo de Rendimiento**
- Middleware de monitoreo en tiempo real en todas las rutas críticas
- Métricas de tiempo de respuesta con alertas automáticas
- Detección proactiva de cuellos de botella en el sistema
- Sistema de alertas por errores frecuentes con notificaciones

## Flujos de Trabajo del Sistema

### Experiencia del Cliente
1. **Registro**: Creación de cuenta con verificación de email obligatoria
2. **Exploración**: Navegación por catálogo de servicios con precios actualizados
3. **Programación**: Selección intuitiva de barbero, fecha y horario disponible
4. **Confirmación**: Validación automática de disponibilidad y confirmación por email
5. **Seguimiento**: Monitoreo en tiempo real del estado de la cita
6. **Finalización**: Confirmación de servicio completado y registro de satisfacción

### Panel del Barbero
1. **Dashboard Personalizado**: Vista consolidada de agenda diaria y métricas personales
2. **Gestión de Citas**: Confirmación, actualización de estados y gestión de horarios
3. **Punto de Venta**: Registro de ventas con carrito multi-producto y servicios
4. **Control de Inventario**: Seguimiento de stock y alertas de productos críticos
5. **Estadísticas**: Análisis de rendimiento personal y seguimiento de comisiones
6. **Reportes**: Generación de reportes de ventas y análisis de productividad

### Administración Ejecutiva
1. **Dashboard Ejecutivo**: Métricas consolidadas de todo el negocio
2. **Gestión de Personal**: Administración de usuarios, roles y permisos
3. **Control Financiero**: Supervisión de gastos, ingresos y rentabilidad
4. **Configuración**: Personalización de servicios, precios y métodos de pago
5. **Reportes Avanzados**: Generación de análisis financieros y operativos
6. **Toma de Decisiones**: Acceso a métricas clave para decisiones estratégicas

## Scripts de Gestión y Mantenimiento

### Scripts de Datos
- **seed.js**: Inicialización completa del sistema con datos base
- **master-population.js**: Población completa para ambiente de desarrollo
- **fundador-rapido.js**: Creación ágil de socio fundador con configuración básica
- **despoblarDB.js**: Limpieza controlada de base de datos con confirmaciones

### Scripts de Mantenimiento
- **check-data.js**: Verificación integral de consistencia de datos
- **optimize-database.js**: Optimización automática de índices y consultas
- **backup-system.js**: Sistema automatizado de respaldos con rotación
- **health-monitor.js**: Monitoreo continuo de salud del sistema

### Scripts Financieros
- **process-recurring-expenses.js**: Procesamiento automático de gastos recurrentes
- **financial-summary.js**: Generación de resúmenes financieros periódicos
- **commission-calculator.js**: Cálculo preciso de comisiones por barbero

## Configuración Técnica

### Variables de Entorno Esenciales

```env
# Configuración de Base de Datos
MONGODB_URI=mongodb://localhost:27017/barbershop
MONGODB_URI_TEST=mongodb://localhost:27017/barbershop_test

# Configuración JWT
JWT_SECRET=clave-secreta-ultra-segura-256-bits
JWT_EXPIRES_IN=6h
JWT_REFRESH_EXPIRES_IN=30d

# Configuración Cloudinary
CLOUDINARY_CLOUD_NAME=nombre-de-tu-nube
CLOUDINARY_API_KEY=tu-api-key
CLOUDINARY_API_SECRET=tu-api-secret

# Configuración de Aplicación
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://tu-dominio-frontend.com

# Configuración de Seguridad
CORS_ORIGIN=https://tu-dominio.com,https://www.tu-dominio.com
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
```

### Rate Limiting Configurado
- **Requests Generales**: 100 solicitudes por ventana de 15 minutos
- **Endpoints de Autenticación**: 5 intentos por 15 minutos máximo
- **API Completa**: 1000 requests por hora con reset automático
- **Uploads de Archivos**: 10 uploads por hora con validación de tamaño

### Optimizaciones de Rendimiento
- **Cache Redis**: Implementado para consultas frecuentes con TTL inteligente
- **Compresión**: Gzip habilitado para todas las respuestas del servidor
- **Índices MongoDB**: Optimizados para consultas críticas y búsquedas
- **Lazy Loading**: Componentes React cargados bajo demanda
- **Code Splitting**: Bundle dividido por rutas para carga optimizada

## Tecnologías y Dependencias

### Dependencias Backend Principales
- **express**: Framework web minimalista y robusto v4.18+
- **mongoose**: ODM para MongoDB con validaciones v7.5+
- **jsonwebtoken**: Implementación completa de JWT v9.0+
- **bcryptjs**: Hash seguro de contraseñas v2.4+
- **helmet**: Middleware de seguridad HTTP v7.0+
- **winston**: Sistema de logging profesional v3.10+
- **cloudinary**: Gestión de imágenes en la nube v1.40+
- **express-validator**: Validación robusta de datos v7.0+
- **cors**: Control de acceso de origen cruzado v2.8+

### Dependencias Frontend Principales
- **react**: Librería de interfaz de usuario v18.2+
- **react-router-dom**: Enrutamiento para SPA v6.15+
- **tailwindcss**: Framework CSS utility-first v3.3+
- **lucide-react**: Librería de iconos moderna v0.280+
- **date-fns**: Manipulación avanzada de fechas v2.30+
- **react-toastify**: Sistema de notificaciones v9.1+
- **vite**: Build tool optimizado v4.4+

## Documentación API Completa

### OpenAPI/Swagger Integrado
La API está completamente documentada con especificación OpenAPI 3.0:

- **Descripción Detallada**: Todos los endpoints con parámetros y respuestas
- **Esquemas de Datos**: Modelos completos de request y response
- **Códigos de Estado**: Documentación de todos los códigos HTTP utilizados
- **Autenticación**: Flujos de autenticación y autorización detallados
- **Ejemplos Prácticos**: Casos de uso reales para cada operación
- **Testing Integrado**: Interfaz interactiva para pruebas de API

### Endpoints Principales
- **Autenticación**: `/api/auth/*` - Login, registro, refresh tokens
- **Usuarios**: `/api/users/*` - Gestión de perfiles y roles
- **Citas**: `/api/appointments/*` - Sistema completo de citas
- **Servicios**: `/api/services/*` - Catálogo de servicios
- **Inventario**: `/api/inventory/*` - Gestión de productos y stock
- **Ventas**: `/api/sales/*` - Punto de venta y reportes
- **Gastos**: `/api/expenses/*` - Sistema financiero avanzado
- **Barberos**: `/api/barbers/*` - Gestión de barberos y horarios

## Propiedad Intelectual

**AVISO LEGAL IMPORTANTE**

Este sistema es propiedad intelectual exclusiva y confidencial de **The Brothers Barber Shop**. Todos los derechos están estrictamente reservados. El código fuente, la documentación técnica, el diseño de la base de datos, la arquitectura del software, los algoritmos implementados y todos los componentes relacionados están protegidos por derechos de autor y constituyen secretos comerciales.

### Restricciones Estrictas de Uso

- **Prohibición Absoluta**: Queda estrictamente prohibida la reproducción, distribución, modificación, ingeniería inversa o cualquier forma de copia sin autorización expresa y por escrito
- **Acceso Controlado**: El acceso al código fuente está limitado exclusivamente a personal técnico autorizado con acuerdos de confidencialidad firmados
- **Uso Comercial Restringido**: No se permite el uso comercial, redistribución, sublicenciamiento o creación de obras derivadas bajo ninguna circunstancia
- **Confidencialidad**: Toda la información técnica, algoritmos y metodologías son estrictamente confidenciales y están sujetas a acuerdos de no divulgación

### Marcas y Derechos

Todas las marcas comerciales, nombres comerciales, logotipos y denominaciones mencionadas son propiedad de sus respectivos propietarios y se utilizan únicamente con fines identificativos.

**Contacto Legal y Licencias**: Para consultas sobre licencias comerciales, uso autorizado o colaboraciones técnicas, contactar exclusivamente a la administración legal de The Brothers Barber Shop.

**Desarrollador Principal**: Dilan Steven Acuña  
**Contacto Técnico**: garaydilan2002@gmail.com  
**Licencia**: Propietaria - Todos los Derechos Reservados

---

**Versión del Sistema**: 1.0.0  
**Última Actualización Técnica**: Octubre 2025  
**Arquitectura**: Full-Stack JavaScript Empresarial (Node.js + React)  
**Estado de Desarrollo**: Producción Estable  
**Nivel de Seguridad**: Empresarial con Validaciones Múltiples