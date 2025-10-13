# The Brothers Barber Shop# The Brothers Barber Shop

**Sistema Integral de Gestión para Barbería Profesional****Sistema Integral de Gestión para Barbería Profesional**



<div align="center">The Brothers Barber Shop es una solución empresarial completa desarrollada específicamente para la gestión integral de establecimientos de barbería. El sistema combina tecnologías modernas con una arquitectura robusta para ofrecer control total sobre operaciones diarias, finanzas, inventario y administración de personal.



![Status](https://img.shields.io/badge/Status-En%20Producción-success)## Visión General del Sistema

![Version](https://img.shields.io/badge/Version-1.0.0-blue)

![Node](https://img.shields.io/badge/Node.js-20%2B-green)Esta plataforma proporciona una experiencia unificada que abarca desde la programación de citas hasta el análisis financiero detallado, diseñada para barberos, administradores y clientes. El sistema se distingue por su enfoque en la escalabilidad, seguridad y facilidad de uso, adaptándose a las necesidades específicas del negocio de barbería profesional.

![React](https://img.shields.io/badge/React-18%2B-blue)

![MongoDB](https://img.shields.io/badge/MongoDB-6%2B-green)### Características Distintivas

![License](https://img.shields.io/badge/License-Proprietary-red)

- **Arquitectura Clean Architecture**: Implementación de patrones de diseño avanzados para máxima mantenibilidad y escalabilidad

*Gestión empresarial completa para establecimientos de barbería modernos*- **Sistema de Roles Diferenciado**: Interfaces específicas optimizadas para clientes, barberos y administradores

- **Gestión Financiera Avanzada**: Control completo de gastos recurrentes, categorización inteligente y reportes detallados

[🚀 Demo Live](#) • [📖 Documentación](#características-principales) • [💼 Casos de Uso](#casos-de-uso-por-tipo-de-usuario) • [🛠️ Instalación](#instalación-y-desarrollo)- **Punto de Venta Integrado**: Sistema POS completo con múltiples métodos de pago y control de inventario en tiempo real

- **Programación Inteligente**: Sistema de citas con validación de disponibilidad y optimización de horarios

</div>

## Stack Tecnológico

---

### Backend - API REST Robusta

## 🎯 Visión General- **Runtime**: Node.js 20+ con módulos ES6

- **Framework**: Express.js con middleware especializado

**The Brothers Barber Shop** es una plataforma empresarial integral diseñada específicamente para la gestión completa de establecimientos de barbería profesionales. Combina tecnologías modernas con una arquitectura robusta para ofrecer control total sobre operaciones, finanzas, inventario y administración de personal.- **Arquitectura**: Clean Architecture con patrón Repository y Dependency Injection

- **Base de Datos**: MongoDB con Mongoose ODM y validaciones avanzadas

### 🌟 Propuesta de Valor- **Autenticación**: JWT con refresh tokens diferenciados por rol y tiempos de expiración adaptativos

- **Almacenamiento**: Cloudinary para gestión profesional de imágenes

- **💰 ROI Comprobado**: Optimización de ingresos y control de gastos con análisis predictivo- **Logging**: Winston con rotación diaria y niveles diferenciados

- **⚡ Eficiencia Operativa**: Automatización de procesos repetitivos y optimización de flujos de trabajo- **Cache**: Redis con Node-cache para optimización de rendimiento

- **📊 Inteligencia de Negocio**: Reportes avanzados y métricas clave para toma de decisiones- **Seguridad**: Helmet, CORS, Rate Limiting, Sanitización MongoDB, XSS Protection

- **🔒 Seguridad Empresarial**: Protección de datos y cumplimiento de estándares internacionales

- **📱 Experiencia Omnicanal**: Interfaz unificada para todos los stakeholders del negocio### Frontend - Aplicación React Moderna

- **Framework**: React 18+ con Hooks y Context API para gestión de estado

---- **Build Tool**: Vite para desarrollo y producción optimizada

- **Enrutamiento**: React Router DOM v6 con rutas protegidas

## 🚀 Características Principales- **Estilos**: Tailwind CSS con tema oscuro personalizado y componentes reutilizables

- **Iconografía**: Lucide React para consistencia visual

### 💼 Gestión Empresarial Integral- **Fechas**: Date-fns con React Day Picker para manejo profesional de fechas

- **Notificaciones**: React Toastify integrado con sistema centralizado

#### 🏢 **Sistema de Roles Jerárquico**- **Performance**: Lazy loading, code splitting y optimización de bundle

- **Socio Fundador**: Control total con distribución de ganancias automática

- **Administradores**: Gestión completa de operaciones y reportes### Arquitectura del Proyecto

- **Barberos**: Herramientas especializadas para su trabajo diario

- **Clientes**: Experiencia de usuario optimizada para autoservicio```

TheBrothersBarberShop/

#### 📈 **Analítica Financiera Avanzada**├── backend/                           # API REST con Clean Architecture

- **Dashboard Ejecutivo**: Métricas clave en tiempo real con visualizaciones interactivas│   ├── src/

- **Gestión de Gastos**: Sistema completo de gastos únicos y recurrentes con categorización inteligente│   │   ├── core/

- **Distribución de Ganancias**: Cálculo automático para socios con diferentes porcentajes de participación│   │   │   ├── domain/               # Entidades de negocio y interfaces

- **Reportes Predictivos**: Proyecciones financieras basadas en patrones históricos│   │   │   │   ├── entities/         # Modelos MongoDB

- **Control de ROI**: Análisis detallado de retorno de inversión por categoría│   │   │   │   └── repositories/     # Interfaces Repository

│   │   │   └── application/

### 🛒 Punto de Venta (POS) Profesional│   │   │       ├── usecases/         # Lógica de negocio encapsulada

│   │   │       └── services/         # Servicios de aplicación

#### 💳 **Sistema de Pagos Unificado**│   │   ├── infrastructure/           # Capa de infraestructura

- **Métodos Múltiples**: Efectivo, transferencias, Nequi, Daviplata, tarjetas│   │   │   ├── database/             # Implementaciones Repository

- **Conciliación Automática**: Seguimiento en tiempo real de todos los métodos de pago│   │   │   ├── external/             # APIs externas (Cloudinary)

- **Reportes de Caja**: Cierre diario automático con detalle de transacciones│   │   │   └── cache/                # Adaptadores de cache

- **Integración Bancaria**: Preparado para conexión con APIs bancarias│   │   ├── presentation/             # Capa de presentación

│   │   │   ├── controllers/          # Controladores HTTP

#### 📦 **Inventario Inteligente**│   │   │   ├── middleware/           # Middleware personalizado

- **Control de Stock**: Seguimiento en tiempo real con alertas de stock mínimo│   │   │   └── routes/               # Definición de rutas API

- **Gestión de Proveedores**: Registro completo de productos y proveedores│   │   └── shared/

- **Movimientos Automáticos**: Registro automático de entradas y salidas por ventas│   │       ├── config/               # Configuraciones centralizadas

- **Valorización de Inventario**: Cálculo automático de valor del inventario│   │       ├── utils/                # Utilidades comunes

- **Reportes de Rotación**: Análisis de productos más y menos vendidos│   │       └── constants/            # Constantes del sistema

│   ├── scripts/                      # Scripts de mantenimiento

### 📅 Sistema de Citas Avanzado│   └── docs/                         # Documentación Swagger

├── frontend/                         # Aplicación React SPA

#### 🗓️ **Programación Inteligente**│   └── src/

- **Disponibilidad Dinámica**: Gestión automática de horarios por barbero│       ├── features/                 # Funcionalidades por dominio

- **Confirmación Múltiple**: Sistema de recordatorios automáticos│       │   ├── admin/                # Panel administrativo

- **Reagendamiento**: Flexibilidad total para cambios de horario│       │   ├── appointments/         # Sistema de citas

- **Lista de Espera**: Optimización de ocupación con notificaciones automáticas│       │   ├── auth/                 # Autenticación

- **Métricas de Servicio**: Análisis de puntualidad y satisfacción│       │   ├── barbers/              # Panel de barberos

│       │   └── expenses/             # Gestión de gastos

#### 👨‍💼 **Gestión de Barberos**│       ├── pages/                    # Páginas principales

- **Perfiles Profesionales**: Información completa, especialidades y portafolio│       ├── layouts/                  # Layouts reutilizables

- **Control de Horarios**: Gestión flexible de disponibilidad y descansos│       └── shared/

- **Comisiones**: Cálculo automático de comisiones por servicios│           ├── components/           # Componentes reutilizables

- **Métricas de Performance**: Estadísticas detalladas de productividad│           ├── contexts/             # Context providers

- **Sistema de Reviews**: Retroalimentación de clientes integrada│           ├── hooks/                # Custom hooks

│           ├── services/             # APIs y servicios

---│           └── utils/                # Utilidades frontend

└── deployment/                      # Configuraciones de deployment

## 🏗️ Arquitectura Técnica```



### 🔧 Stack Tecnológico## Funcionalidades Principales



#### **Backend - API REST Empresarial**### Sistema de Autenticación y Gestión de Usuarios

```typescript

🟢 Node.js 20+ con ES Modules**Autenticación Robusta**

🟢 Express.js con middlewares especializados- Sistema de registro con validación de email y verificación de cuentas

🟢 MongoDB 6+ con Mongoose ODM avanzado- Inicio de sesión seguro con tokens JWT y refresh automático

🟢 JWT con refresh tokens diferenciados por rol- Gestión de sesiones con tiempos de expiración diferenciados por rol

🟢 Redis para caché de alto rendimiento- Logout seguro con invalidación completa de tokens

🟢 Cloudinary para gestión profesional de imágenes

🟢 Winston con logging estructurado y rotación**Sistema de Roles Avanzado**

🟢 Clean Architecture con Repository Pattern- **Cliente**: Acceso a programación de citas, historial personal y gestión de perfil

```- **Barbero**: Panel especializado con agenda, ventas, estadísticas y gestión de servicios

- **Administrador**: Control total del sistema, reportes financieros y gestión de usuarios

#### **Frontend - Aplicación React Moderna**- **Socio**: Acceso privilegiado a métricas financieras y análisis de rentabilidad

```typescript

⚛️ React 18+ con Hooks y Context API### Sistema de Citas Inteligente

⚡ Vite para desarrollo y build optimizado

🎨 Tailwind CSS con tema oscuro personalizado**Programación Avanzada**

🛣️ React Router DOM v6 con rutas protegidas- Calendario interactivo con disponibilidad en tiempo real

📱 Responsive design mobile-first- Validación automática de horarios y prevención de dobles reservas

🔔 Sistema de notificaciones integrado- Asignación inteligente de barberos según especialidades y disponibilidad

📊 Componentes de visualización de datos- Sistema de confirmación automática con notificaciones por email

🚀 Code splitting y lazy loading automático

```**Estados de Cita Optimizados**

- **Pendiente**: Cita programada esperando confirmación del barbero

### 🏛️ Arquitectura del Sistema- **Confirmada**: Cita verificada y confirmada por el barbero asignado

- **En Progreso**: Servicio siendo ejecutado actualmente

#### **Clean Architecture Implementation**- **Completada**: Servicio finalizado con registro de pago

```- **Cancelada**: Cita cancelada con registro de motivo y timestamps

📁 backend/src/

├── 🏛️ core/**Gestión por Roles**

│   ├── 📋 domain/           # Entidades de negocio y reglas- Clientes: Programar, visualizar y cancelar citas personales

│   │   ├── entities/        # Modelos MongoDB optimizados- Barberos: Gestionar agenda diaria, confirmar citas y actualizar estados

│   │   └── repositories/    # Interfaces Repository Pattern- Administradores: Supervisión completa con reasignación y reportes

│   └── 💼 application/      # Casos de uso y lógica de negocio

│       └── usecases/        # Implementación de casos de uso### Gestión Completa de Barberos

├── 🔌 infrastructure/       # Adaptadores externos

│   ├── database/            # Implementaciones Repository**Perfiles Profesionales**

│   └── external/            # APIs terceros (Cloudinary, etc.)- Información personal y profesional detallada con fotografías

├── 🌐 presentation/         # Capa de presentación- Especialidades específicas y servicios que ofrece cada barbero

│   ├── controllers/         # Controladores HTTP- Configuración de horarios de trabajo con disponibilidad personalizada

│   ├── routes/              # Definición de endpoints- Galería de trabajos realizados y portafolio digital

│   └── middleware/          # Validaciones y seguridad

└── 🔧 shared/               # Utilidades compartidas**Panel de Barbero Especializado**

    ├── config/              # Configuraciones del sistema- Dashboard personalizado con agenda del día y próximas citas

    └── utils/               # Herramientas y helpers- Sistema de ventas integrado con carrito de compras y múltiples métodos de pago

```- Estadísticas de rendimiento personal con métricas de productividad

- Gestión de comisiones y seguimiento de ingresos por período

#### **Frontend Architecture**

```### Sistema de Inventario Profesional

📁 frontend/src/

├── 🎯 features/             # Características por dominio**Gestión de Productos Avanzada**

│   ├── admin/               # Módulos de administración- Catálogo completo con códigos únicos, descripciones detalladas y categorización

│   ├── barbers/             # Herramientas para barberos- Control de stock en tiempo real con alertas automáticas de inventario bajo

│   ├── appointments/        # Sistema de citas- Gestión de precios de compra y venta con seguimiento de márgenes

│   └── auth/                # Autenticación y autorización- Sistema de códigos de barras y búsqueda inteligente

├── 📄 pages/                # Páginas principales

├── 🏗️ layouts/             # Layouts compartidos**Control de Stock Inteligente**

└── 🔧 shared/               # Componentes y servicios compartidos- Registro automático de entradas y salidas con timestamps

    ├── components/          # Componentes reutilizables- Snapshots diarios del inventario con histórico completo

    ├── contexts/            # Context providers- Reportes de rotación de productos y análisis de consumo

    ├── hooks/               # Custom hooks- Predicción de reposición basada en patrones de uso

    ├── services/            # APIs y servicios

    └── utils/               # Utilidades frontend**Alertas y Monitoreo**

```- Notificaciones automáticas por stock crítico configurable

- Alertas de productos próximos a vencer con fechas de caducidad

---- Reportes de productos sin movimiento y análisis de inventario muerto

- Dashboard de métricas de inventario con indicadores clave

## 👥 Casos de Uso por Tipo de Usuario

### Sistema de Ventas y Punto de Venta

### 🏆 **Socio Fundador**

**Control Empresarial Total****Punto de Venta Completo**

- Interfaz táctil optimizada para registro rápido de ventas

- **💰 Gestión Financiera Completa**- Carrito de compras con capacidad multi-producto y servicios

  - Visualización de ganancias totales y distribución automática de porcentajes- Cálculo automático de totales, descuentos e impuestos

  - Control de todos los gastos (únicos y recurrentes) con categorización avanzada- Sistema de códigos de barras para agilizar el proceso

  - Reportes ejecutivos con métricas clave y proyecciones financieras

  - Análisis de ROI y rentabilidad por línea de negocio**Métodos de Pago Múltiples**

- Efectivo con cálculo de cambio automático

- **👥 Administración de Socios**- Tarjetas de débito y crédito con validación

  - Asignación de subrol de socio a administradores existentes- Transferencias bancarias y pagos digitales (Nequi, Daviplata)

  - Configuración flexible de porcentajes de participación- Registro detallado de cada transacción con trazabilidad completa

  - Gestión de distribución automática de ganancias

  - Control de permisos y accesos por socio**Comisiones y Rentabilidad**

- Cálculo automático de comisiones por barbero

- **📊 Business Intelligence**- Seguimiento de ventas individuales y grupales

  - Dashboard ejecutivo con KPIs en tiempo real- Análisis de rentabilidad por producto y servicio

  - Análisis predictivo basado en patrones históricos- Reportes de performance con comparativas mensuales

  - Reportes comparativos por períodos y tendencias

  - Métricas de performance del negocio### Gestión Financiera Avanzada



### 🏢 **Administradores****Sistema de Gastos Recurrentes**

**Gestión Operativa Avanzada**- Configuración de gastos automáticos (arriendo, servicios, nómina)

- Cinco categorías estáticas principales: arriendo, nómina, insumos, servicios, equipos

- **👨‍💼 Gestión de Personal**- Categorías dinámicas personalizables según necesidades del negocio

  - Administración completa de barberos (alta, baja, modificación)- Generación automática de instancias de gastos con programación inteligente

  - Control de horarios, disponibilidad y descansos

  - Gestión de comisiones y pagos a barberos**Reportes Financieros Detallados**

  - Análisis de productividad individual- Dashboard ejecutivo con métricas financieras clave

- Análisis de ingresos vs gastos con proyecciones

- **📦 Control de Inventario**- Reportes de flujo de caja con períodos personalizables

  - Gestión completa de productos y stock- Exportación de datos financieros en múltiples formatos

  - Control de proveedores y órdenes de compra

  - Alertas automáticas de stock mínimo**Control de Costos**

  - Reportes de rotación y valorización- Seguimiento detallado de gastos por categoría y período

- Análisis de tendencias con alertas de desviaciones

- **💼 Operaciones Diarias**- Presupuestos configurables con seguimiento de cumplimiento

  - Supervisión de citas y agenda general- Reportes de rentabilidad por barbero y por servicio

  - Control de ventas y facturación

  - Gestión de métodos de pago y conciliación### Panel de Administración Ejecutivo

  - Reportes operativos detallados

**Gestión de Personal**

### ✂️ **Barberos**- Administración completa de usuarios con roles y permisos

**Herramientas Profesionales Especializadas**- Control de acceso granular por funcionalidad

- Seguimiento de actividad de usuarios con logs detallados

- **📅 Gestión de Agenda Personal**- Sistema de activación/desactivación de cuentas

  - Visualización de citas programadas por día/semana/mes

  - Gestión de disponibilidad y horarios personales**Configuración del Sistema**

  - Sistema de notificaciones para citas próximas- Gestión centralizada de servicios con precios y duraciones

  - Herramientas de reagendamiento flexible- Configuración de horarios de atención por barbero

- Administración de métodos de pago y comisiones

- **💰 Control de Ventas Personales**- Personalización de categorías de gastos y productos

  - Registro de servicios realizados (cortes, walk-ins)

  - Venta de productos con control automático de inventario**Análisis y Reportes**

  - Seguimiento de comisiones ganadas- Reportes ejecutivos con métricas de negocio

  - Estadísticas de performance personal- Análisis de tendencias y patrones de comportamiento

- Dashboard de KPIs con indicadores personalizables

- **👤 Gestión de Clientes**- Exportación automática de reportes programados

  - Historial completo de servicios por cliente

  - Preferencias y notas de servicio### Sistema de Socios y Participaciones

  - Seguimiento de satisfacción y reviews

  - Base de datos personal de clientes frecuentes**Gestión de Sociedad**

- Registro de socios con porcentajes de participación exactos

### 🙋‍♂️ **Clientes**- Control exclusivo para administradores autorizados

**Experiencia de Usuario Optimizada**- Diferenciación entre socios regulares y socio fundador

- Histórico completo de cambios en la estructura societaria

- **📱 Autoservicio Completo**

  - Programación de citas online con selección de barbero**Socio Fundador Especial**

  - Visualización de disponibilidad en tiempo real- Un único socio fundador por sistema con privilegios especiales

  - Confirmación y recordatorios automáticos- Creación exclusiva mediante scripts de seguridad autorizados

  - Sistema de reagendamiento flexible- Control total sobre configuraciones críticas del negocio

- Acceso privilegiado a todas las métricas financieras sensibles

- **👤 Perfil Personal**

  - Historial completo de servicios recibidos## Seguridad y Monitoreo

  - Gestión de preferencias personales

  - Sistema de favoritos (barberos preferidos)### Seguridad Multicapa

  - Configuración de notificaciones

**Autenticación y Autorización**

- **⭐ Feedback y Reviews**- Hash seguro de contraseñas con bcrypt y salt personalizado

  - Sistema integrado de calificaciones- Tokens JWT con algoritmos robustos y claves de firma seguras

  - Reviews detalladas por servicio- Refresh tokens con expiración diferenciada por rol de usuario

  - Feedback constructivo para mejora continua- Middleware de autorización granular en rutas críticas

  - Programa de fidelización (preparado)

**Protección de API Avanzada**

---- Rate limiting inteligente para prevenir ataques de fuerza bruta

- Helmet para configuración segura de headers HTTP

## 📊 Métricas y Analítica- CORS configurado específicamente para dominios autorizados

- Sanitización completa de datos MongoDB para prevenir inyecciones

### 📈 **Dashboard Financiero**

- **Ingresos por Período**: Análisis detallado con comparativas históricas**Validación y Sanitización**

- **Métodos de Pago**: Distribución y preferencias de clientes- Express-validator para validación robusta de todos los inputs

- **Gastos Categorizados**: Control granular con alertas presupuestarias- Sanitización automática de datos de entrada del usuario

- **ROI por Servicio**: Rentabilidad individual de cada línea de negocio- Validación de tipos de datos y formatos específicos

- **Proyecciones**: Estimaciones basadas en tendencias y estacionalidad- Prevención activa de inyección de código malicioso



### 🎯 **KPIs Operativos**### Sistema de Logging Profesional

- **Ocupación por Barbero**: Eficiencia y optimización de recursos

- **Tiempo Promedio de Servicio**: Métricas de productividad**Logging Centralizado**

- **Satisfacción del Cliente**: NPS y ratings promedio- Winston como sistema principal con rotación automática diaria

- **Rotación de Inventario**: Productos más y menos rentables- Niveles diferenciados: error, warn, info, debug con filtrado inteligente

- **Puntualidad**: Métricas de cumplimiento de horarios- Logs HTTP detallados para auditoría completa de requests

- Manejo especializado de errores no capturados con stack traces

### 💡 **Inteligencia de Negocio**

- **Análisis de Tendencias**: Identificación de patrones estacionales**Monitoreo de Rendimiento**

- **Segmentación de Clientes**: Perfiles y comportamientos- Middleware de monitoreo en tiempo real en todas las rutas críticas

- **Optimización de Precios**: Sugerencias basadas en demanda- Métricas de tiempo de respuesta con alertas automáticas

- **Predicción de Demanda**: Planificación de recursos y stock- Detección proactiva de cuellos de botella en el sistema

- **Análisis Competitivo**: Benchmarking y posicionamiento- Sistema de alertas por errores frecuentes con notificaciones



---## Flujos de Trabajo del Sistema



## 🛡️ Seguridad y Cumplimiento### Experiencia del Cliente

1. **Registro**: Creación de cuenta con verificación de email obligatoria

### 🔐 **Seguridad de Datos**2. **Exploración**: Navegación por catálogo de servicios con precios actualizados

- **Encriptación End-to-End**: Protección de datos sensibles en tránsito y reposo3. **Programación**: Selección intuitiva de barbero, fecha y horario disponible

- **Autenticación Multifactor**: Preparado para implementación 2FA4. **Confirmación**: Validación automática de disponibilidad y confirmación por email

- **Control de Acceso Granular**: Permisos específicos por rol y funcionalidad5. **Seguimiento**: Monitoreo en tiempo real del estado de la cita

- **Auditoría Completa**: Logs detallados de todas las operaciones críticas6. **Finalización**: Confirmación de servicio completado y registro de satisfacción

- **Backup Automático**: Respaldos incrementales con retención configurable

### Panel del Barbero

### ⚖️ **Cumplimiento Regulatorio**1. **Dashboard Personalizado**: Vista consolidada de agenda diaria y métricas personales

- **GDPR Ready**: Estructura preparada para cumplimiento europeo2. **Gestión de Citas**: Confirmación, actualización de estados y gestión de horarios

- **Ley de Datos Personales**: Compatible con regulaciones colombianas3. **Punto de Venta**: Registro de ventas con carrito multi-producto y servicios

- **Facturación Electrónica**: Preparado para integración DIAN4. **Control de Inventario**: Seguimiento de stock y alertas de productos críticos

- **Reportes Contables**: Estructuras compatibles con sistemas contables5. **Estadísticas**: Análisis de rendimiento personal y seguimiento de comisiones

6. **Reportes**: Generación de reportes de ventas y análisis de productividad

### 🛠️ **Monitoreo y Mantenimiento**

- **Health Checks**: Monitoreo automático de sistema y base de datos### Administración Ejecutiva

- **Logging Estructurado**: Winston con rotación automática y niveles1. **Dashboard Ejecutivo**: Métricas consolidadas de todo el negocio

- **Error Tracking**: Captura y análisis de errores en producción2. **Gestión de Personal**: Administración de usuarios, roles y permisos

- **Performance Monitoring**: Métricas de rendimiento y optimización3. **Control Financiero**: Supervisión de gastos, ingresos y rentabilidad

- **Backup y Recovery**: Estrategias de contingencia y recuperación4. **Configuración**: Personalización de servicios, precios y métodos de pago

5. **Reportes Avanzados**: Generación de análisis financieros y operativos

---6. **Toma de Decisiones**: Acceso a métricas clave para decisiones estratégicas



## 🌐 Deployment y Infraestructura## Scripts de Gestión y Mantenimiento



### ☁️ **Arquitectura Cloud-Native**### Scripts de Datos

```yaml- **seed.js**: Inicialización completa del sistema con datos base

🌍 Frontend: Vercel (CDN Global)- **master-population.js**: Población completa para ambiente de desarrollo

🚀 Backend: Render.com (Auto-scaling)- **fundador-rapido.js**: Creación ágil de socio fundador con configuración básica

🗄️ Database: MongoDB Atlas (Cluster dedicado)- **despoblarDB.js**: Limpieza controlada de base de datos con confirmaciones

📸 Storage: Cloudinary (Optimización automática)

⚡ Cache: Redis Cloud (Alta disponibilidad)### Scripts de Mantenimiento

🔍 Monitoring: Integrado con herramientas nativas- **check-data.js**: Verificación integral de consistencia de datos

```- **optimize-database.js**: Optimización automática de índices y consultas

- **backup-system.js**: Sistema automatizado de respaldos con rotación

### 🚀 **DevOps y CI/CD**- **health-monitor.js**: Monitoreo continuo de salud del sistema

- **Deployment Automático**: Push-to-deploy con validaciones automáticas

- **Environments**: Desarrollo, staging y producción separados### Scripts Financieros

- **Health Monitoring**: Monitoreo continuo de servicios críticos- **process-recurring-expenses.js**: Procesamiento automático de gastos recurrentes

- **Rollback Automático**: Reversión automática en caso de errores- **financial-summary.js**: Generación de resúmenes financieros periódicos

- **Scaling**: Auto-escalado basado en demanda- **commission-calculator.js**: Cálculo preciso de comisiones por barbero



---## Configuración Técnica



## 💻 Instalación y Desarrollo### Variables de Entorno Esenciales



### ⚡ **Inicio Rápido**```env

# Configuración de Base de Datos

```bashMONGODB_URI=mongodb://localhost:27017/barbershop

# 1. Clonar el repositorioMONGODB_URI_TEST=mongodb://localhost:27017/barbershop_test

git clone https://github.com/DilanSG/TheBrothersBarberShop.git

cd TheBrothersBarberShop# Configuración JWT

JWT_SECRET=clave-secreta-ultra-segura-256-bits

# 2. Instalación completa automáticaJWT_EXPIRES_IN=6h

npm run install:allJWT_REFRESH_EXPIRES_IN=30d



# 3. Configuración de entorno# Configuración Cloudinary

npm run setup:devCLOUDINARY_CLOUD_NAME=nombre-de-tu-nube

CLOUDINARY_API_KEY=tu-api-key

# 4. Inicialización con datos de pruebaCLOUDINARY_API_SECRET=tu-api-secret

cd backend && node scripts/master-population.js

# Configuración de Aplicación

# 5. Lanzar desarrolloPORT=5000

npm run devNODE_ENV=production

```FRONTEND_URL=https://tu-dominio-frontend.com



### 🌐 **URLs de Desarrollo**# Configuración de Seguridad

- **Frontend**: `http://localhost:5173`CORS_ORIGIN=https://tu-dominio.com,https://www.tu-dominio.com

- **Backend API**: `http://localhost:5000/api/v1`RATE_LIMIT_WINDOW=15

- **Documentación**: `http://localhost:5000/api-docs`RATE_LIMIT_MAX_REQUESTS=100

```

### 🔧 **Scripts Disponibles**

### Rate Limiting Configurado

#### **Desarrollo**- **Requests Generales**: 100 solicitudes por ventana de 15 minutos

```bash- **Endpoints de Autenticación**: 5 intentos por 15 minutos máximo

npm run dev              # Launcher completo con menú interactivo- **API Completa**: 1000 requests por hora con reset automático

npm run dev:frontend     # Solo frontend (Vite)- **Uploads de Archivos**: 10 uploads por hora con validación de tamaño

npm run dev:backend      # Solo backend (Express)

```### Optimizaciones de Rendimiento

- **Cache Redis**: Implementado para consultas frecuentes con TTL inteligente

#### **Configuración**- **Compresión**: Gzip habilitado para todas las respuestas del servidor

```bash- **Índices MongoDB**: Optimizados para consultas críticas y búsquedas

npm run setup:dev        # Entorno desarrollo- **Lazy Loading**: Componentes React cargados bajo demanda

npm run setup:prod       # Entorno producción- **Code Splitting**: Bundle dividido por rutas para carga optimizada

npm run setup:network    # Desarrollo en red local

```## Tecnologías y Dependencias



#### **Datos y Mantenimiento**### Dependencias Backend Principales

```bash- **express**: Framework web minimalista y robusto v4.18+

npm run diagnose         # Diagnóstico completo del sistema- **mongoose**: ODM para MongoDB con validaciones v7.5+

npm run fix:frontend     # Reparar dependencias frontend- **jsonwebtoken**: Implementación completa de JWT v9.0+

node backend/scripts/fundador-rapido.js    # Crear socio fundador- **bcryptjs**: Hash seguro de contraseñas v2.4+

```- **helmet**: Middleware de seguridad HTTP v7.0+

- **winston**: Sistema de logging profesional v3.10+

#### **Producción**- **cloudinary**: Gestión de imágenes en la nube v1.40+

```bash- **express-validator**: Validación robusta de datos v7.0+

npm run build           # Build optimizado para producción- **cors**: Control de acceso de origen cruzado v2.8+

npm start              # Inicio en modo producción

```### Dependencias Frontend Principales

- **react**: Librería de interfaz de usuario v18.2+

---- **react-router-dom**: Enrutamiento para SPA v6.15+

- **tailwindcss**: Framework CSS utility-first v3.3+

## 📦 Gestión de Dependencias- **lucide-react**: Librería de iconos moderna v0.280+

- **date-fns**: Manipulación avanzada de fechas v2.30+

### 🔧 **Backend Core**- **react-toastify**: Sistema de notificaciones v9.1+

```json- **vite**: Build tool optimizado v4.4+

{

  "express": "^4.18.2",           // Framework web robusto## Documentación API Completa

  "mongoose": "^7.5.0",          // ODM MongoDB optimizado

  "jsonwebtoken": "^9.0.2",      // Autenticación JWT### OpenAPI/Swagger Integrado

  "bcryptjs": "^2.4.3",          // Hash de contraseñasLa API está completamente documentada con especificación OpenAPI 3.0:

  "helmet": "^7.0.0",            // Seguridad HTTP

  "winston": "^3.10.0",          // Logging profesional- **Descripción Detallada**: Todos los endpoints con parámetros y respuestas

  "ioredis": "^5.3.2",           // Cliente Redis optimizado- **Esquemas de Datos**: Modelos completos de request y response

  "cloudinary": "^1.41.0"       // Gestión de imágenes- **Códigos de Estado**: Documentación de todos los códigos HTTP utilizados

}- **Autenticación**: Flujos de autenticación y autorización detallados

```- **Ejemplos Prácticos**: Casos de uso reales para cada operación

- **Testing Integrado**: Interfaz interactiva para pruebas de API

### ⚛️ **Frontend Core**

```json### Endpoints Principales

{- **Autenticación**: `/api/auth/*` - Login, registro, refresh tokens

  "react": "^18.2.0",            // UI framework moderno- **Usuarios**: `/api/users/*` - Gestión de perfiles y roles

  "react-router-dom": "^6.15.0", // Enrutamiento SPA- **Citas**: `/api/appointments/*` - Sistema completo de citas

  "tailwindcss": "^3.3.0",      // Utility-first CSS- **Servicios**: `/api/services/*` - Catálogo de servicios

  "lucide-react": "^0.280.0",   // Iconografía consistente- **Inventario**: `/api/inventory/*` - Gestión de productos y stock

  "date-fns": "^2.30.0",        // Manejo de fechas- **Ventas**: `/api/sales/*` - Punto de venta y reportes

  "react-toastify": "^9.1.3"    // Sistema de notificaciones- **Gastos**: `/api/expenses/*` - Sistema financiero avanzado

}- **Barberos**: `/api/barbers/*` - Gestión de barberos y horarios

```

## Propiedad Intelectual

---

**AVISO LEGAL IMPORTANTE**

## 📚 Documentación Técnica

Este sistema es propiedad intelectual exclusiva y confidencial de **The Brothers Barber Shop**. Todos los derechos están estrictamente reservados. El código fuente, la documentación técnica, el diseño de la base de datos, la arquitectura del software, los algoritmos implementados y todos los componentes relacionados están protegidos por derechos de autor y constituyen secretos comerciales.

### 🔗 **APIs y Endpoints**

- **Swagger/OpenAPI**: Documentación interactiva completa### Restricciones Estrictas de Uso

- **Postman Collection**: Colección actualizada para testing

- **WebSocket Events**: Documentación de eventos en tiempo real- **Prohibición Absoluta**: Queda estrictamente prohibida la reproducción, distribución, modificación, ingeniería inversa o cualquier forma de copia sin autorización expresa y por escrito

- **Acceso Controlado**: El acceso al código fuente está limitado exclusivamente a personal técnico autorizado con acuerdos de confidencialidad firmados

### 📖 **Guías de Desarrollo**- **Uso Comercial Restringido**: No se permite el uso comercial, redistribución, sublicenciamiento o creación de obras derivadas bajo ninguna circunstancia

- **Setup Guide**: Configuración completa del entorno- **Confidencialidad**: Toda la información técnica, algoritmos y metodologías son estrictamente confidenciales y están sujetas a acuerdos de no divulgación

- **Architecture Guide**: Patrones y estructuras implementadas

- **API Reference**: Documentación detallada de todos los endpoints### Marcas y Derechos

- **Component Library**: Guía de componentes reutilizables

Todas las marcas comerciales, nombres comerciales, logotipos y denominaciones mencionadas son propiedad de sus respectivos propietarios y se utilizan únicamente con fines identificativos.

### 🧪 **Testing y QA**

```bash**Contacto Legal y Licencias**: Para consultas sobre licencias comerciales, uso autorizado o colaboraciones técnicas, contactar exclusivamente a la administración legal de The Brothers Barber Shop.

npm test                # Test suite completo backend

npm run test:frontend   # Tests frontend (cuando estén configurados)**Desarrollador Principal**: Dilan Steven Acuña  

npm run test:coverage   # Reporte de cobertura**Contacto Técnico**: garaydilan2002@gmail.com  

npm run lint            # Linting backend y frontend**Licencia**: Propietaria - Todos los Derechos Reservados

```

---

---

**Versión del Sistema**: 1.0.0  

## 🤝 Contribución y Desarrollo**Última Actualización Técnica**: Octubre 2025  

**Arquitectura**: Full-Stack JavaScript Empresarial (Node.js + React)  

### 🔄 **Workflow de Desarrollo****Estado de Desarrollo**: Producción Estable  

1. **Fork** del repositorio principal**Nivel de Seguridad**: Empresarial con Validaciones Múltiples
2. **Feature branch** desde `main`
3. **Desarrollo** siguiendo convenciones establecidas
4. **Testing** completo de funcionalidades
5. **Pull Request** con descripción detallada

### 📋 **Convenciones**
- **Commits**: Conventional Commits specification
- **Code Style**: ESLint + Prettier configurado
- **Naming**: camelCase (JS), PascalCase (Components), kebab-case (files)
- **Architecture**: Clean Architecture + Repository Pattern

### 🐛 **Reporting de Issues**
- **Bug Reports**: Template estructurado con reproducción
- **Feature Requests**: Casos de uso y justificación
- **Security Issues**: Canal privado para vulnerabilidades

---

## 📊 Métricas del Proyecto

### 📈 **Estadísticas de Desarrollo**
- **Líneas de Código**: ~50,000+ líneas (Backend + Frontend)
- **Test Coverage**: En implementación progresiva
- **Performance**: <100ms respuesta API promedio
- **Uptime**: 99.9% disponibilidad objetivo

### 🏆 **Hitos Alcanzados**
- ✅ **Arquitectura Clean**: Implementación completa
- ✅ **Sistema de Roles**: Funcionalidad completa
- ✅ **POS Integration**: Sistema operativo
- ✅ **Financial Analytics**: Dashboard avanzado
- ✅ **Appointment System**: Gestión completa
- ✅ **Inventory Management**: Control total

---

## 📞 Soporte y Contacto

### 🔧 **Soporte Técnico**
- **Issues**: [GitHub Issues](https://github.com/DilanSG/TheBrothersBarberShop/issues)
- **Documentación**: Wiki del proyecto
- **FAQ**: Preguntas frecuentes actualizadas

### 👨‍💻 **Desarrollador Principal**
- **Nombre**: DilanSG
- **GitHub**: [@DilanSG](https://github.com/DilanSG)
- **Proyecto**: [The Brothers Barber Shop](https://github.com/DilanSG/TheBrothersBarberShop)

---

## 📄 Licencia y Términos

**© 2024 The Brothers Barber Shop - Todos los derechos reservados**

Este proyecto es **software propietario** desarrollado específicamente para uso empresarial en establecimientos de barbería. La distribución, modificación o uso comercial sin autorización expresa está prohibida.

### 📋 **Términos de Uso**
- ✅ **Uso Autorizado**: Clientes y socios autorizados
- ❌ **Redistribución**: Prohibida sin permiso expreso
- ❌ **Modificación**: Solo mediante canales oficiales
- ✅ **Soporte**: Incluido para usuarios autorizados

---

<div align="center">

**🚀 The Brothers Barber Shop - Transformando la gestión de barberías profesionales**

*Desarrollado con ❤️ por DilanSG*

[![GitHub](https://img.shields.io/badge/GitHub-DilanSG-black?logo=github)](https://github.com/DilanSG)
[![Status](https://img.shields.io/badge/Status-En%20Producción-success)](https://github.com/DilanSG/TheBrothersBarberShop)

</div>