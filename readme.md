# 💈 The Brothers Barber Shop

<div align="center">

**Sistema Integral de Gestión para Barbería Profesional**

<!-- Status Badges -->
![Status](https://img.shields.io/badge/Status-Producción-success)
![Version](https://img.shields.io/badge/Version-2.0.0-blue)
![License](https://img.shields.io/badge/License-Proprietary-red)

<!-- CI/CD Badges -->
[![CI/CD Pipeline](https://github.com/DilanSG/TheBrothersBarberShop/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/DilanSG/TheBrothersBarberShop/actions/workflows/ci-cd.yml)
[![Tests](https://github.com/DilanSG/TheBrothersBarberShop/actions/workflows/test.yml/badge.svg)](https://github.com/DilanSG/TheBrothersBarberShop/actions/workflows/test.yml)
[![codecov](https://codecov.io/gh/DilanSG/TheBrothersBarberShop/branch/main/graph/badge.svg)](https://codecov.io/gh/DilanSG/TheBrothersBarberShop)

<!-- Tech Stack Badges -->
![Node](https://img.shields.io/badge/Node.js-20%2B-green)
![React](https://img.shields.io/badge/React-18%2B-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-6%2B-green)

<!-- Security Badge -->
![Security](https://img.shields.io/badge/Security-100%25-brightgreen)
[![Dependabot](https://img.shields.io/badge/Dependabot-enabled-blue)](https://github.com/DilanSG/TheBrothersBarberShop/network/updates)

*Plataforma empresarial completa para gestión moderna de establecimientos de barbería*

[🚀 Demo](#demo) • [📖 Docs](#documentación) • [💼 Features](#características-principales) • [🛠️ Setup](#instalación)

</div>

---

## 📋 Tabla de Contenidos

- [Visión General](#-visión-general)
- [Características Principales](#-características-principales)
- [Stack Tecnológico](#-stack-tecnológico)
- [Arquitectura](#-arquitectura)
- [Instalación](#-instalación-y-desarrollo)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Scripts Disponibles](#-scripts-disponibles)
- [Estado del Proyecto](#-estado-del-proyecto)
- [Contribución](#-contribución)
- [Licencia](#-licencia)

---

## 🎯 Visión General

**The Brothers Barber Shop** es una solución empresarial integral desarrollada con arquitectura **Clean Architecture** y tecnologías modernas para gestionar todos los aspectos de un establecimiento de barbería profesional.

### ✨ Propuesta de Valor

- 💰 **ROI Comprobado** - Optimización de ingresos con control detallado de gastos
- ⚡ **Eficiencia Operativa** - Automatización de procesos y flujos de trabajo
- 📊 **Inteligencia de Negocio** - Reportes avanzados y métricas clave
- 🔒 **Seguridad Empresarial** - 100% seguro, 0 vulnerabilidades críticas
- 📱 **Experiencia Omnicanal** - Interfaces optimizadas por rol de usuario

---

## 🌟 Características Principales

### 💼 Sistema de Roles Jerárquico

| Rol | Permisos | Características |
|-----|----------|----------------|
| **Socio Fundador** | Control total | Dashboard ejecutivo, distribución de ganancias automática |
| **Administrador** | Gestión completa | Reportes financieros, control de personal, configuración |
| **Barbero** | Operacional | Agenda personal, ventas, comisiones |
| **Cliente** | Autoservicio | Reservas, historial, pagos |

### 📈 Analítica Financiera Avanzada

- ✅ **Dashboard Ejecutivo** - Métricas en tiempo real con visualizaciones
- ✅ **Gastos Inteligentes** - Sistema de gastos únicos y recurrentes con proyecciones
- ✅ **Distribución de Ganancias** - Cálculo automático para múltiples socios
- ✅ **Reportes Predictivos** - Proyecciones basadas en patrones históricos
- ✅ **Control de ROI** - Análisis de retorno de inversión por categoría

### 🛒 Punto de Venta (POS) Profesional

#### 💳 Sistema de Pagos Múltiples
- Efectivo, Transferencias, Nequi, Daviplata, Tarjetas
- Conciliación automática en tiempo real
- Reportes de caja y cierre diario
- Trazabilidad completa de transacciones

#### 📦 Inventario Inteligente
- Control de stock en tiempo real con alertas
- Gestión completa de proveedores
- Movimientos automáticos por ventas
- Snapshots diarios con exportación Excel
- Valorización automática de inventario

### 📅 Sistema de Citas Avanzado

- 🗓️ **Programación Inteligente** - Disponibilidad dinámica por barbero
- 📧 **Recordatorios Automáticos** - Emails programados con templates profesionales
- 🔄 **Reagendamiento Flexible** - Cambios sin restricciones
- ⏰ **Lista de Espera** - Optimización de ocupación
- 📊 **Métricas de Servicio** - Puntualidad y satisfacción

---

## 🚀 Stack Tecnológico

### Backend - API REST Empresarial

```javascript
// Stack Principal
Node.js 20+              → Runtime moderno con ES Modules
Express.js 4.x           → Framework web robusto
MongoDB 6+               → Base de datos NoSQL
Mongoose 8.x             → ODM con validaciones avanzadas

// Arquitectura
Clean Architecture       → Separación de responsabilidades
Repository Pattern       → Abstracción de persistencia
Dependency Injection     → Inversión de dependencias

// Seguridad (100% - 0 vulnerabilidades)
JWT + Refresh Tokens     → Autenticación diferenciada por rol
Helmet                   → Headers de seguridad
CORS Configurado         → Orígenes permitidos
Rate Limiting            → Protección DDoS
MongoDB Sanitize         → Prevención NoSQL injection
XSS Clean                → Protección XSS

// Performance
node-cache               → Cache en memoria (Smart TTL)
Winston                  → Logging con rotación (30 días)
Compression              → Respuestas comprimidas

// Utilities
ExcelJS 4.x              → Exports profesionales
Nodemailer               → Emails transaccionales
Node-cron                → Tareas programadas
Cloudinary               → Gestión de imágenes
```

### Frontend - Aplicación React Moderna

```javascript
// Framework
React 18+                → UI con Hooks y Context API
Vite 5.x                 → Build tool ultra-rápido
React Router DOM v6      → Enrutamiento SPA

// Styling
Tailwind CSS 3.x         → Utility-first CSS
Lucide React             → Iconografía consistente
Tema Oscuro Customizado  → Diseño profesional

// Libraries
Date-fns                 → Manejo de fechas
React Day Picker         → Selector de fechas
React Toastify           → Sistema de notificaciones
@vercel/speed-insights   → Monitoreo de performance

// Optimizations
Lazy Loading             → Carga diferida de componentes
Code Splitting           → División automática del bundle
Tree Shaking             → Eliminación de código no usado
```

---

## 🏗️ Arquitectura

### Backend - Clean Architecture

```
backend/src/
├── core/                          # CORE DEL SISTEMA
│   ├── domain/                    # Capa de Dominio
│   │   ├── entities/              # Modelos de Mongoose (12 entities)
│   │   └── repositories/          # Interfaces Repository
│   └── application/               # Capa de Aplicación
│       ├── usecases/              # Lógica de negocio (15 UseCases)
│       └── services/              # Servicios de dominio
│
├── infrastructure/                # INFRAESTRUCTURA
│   ├── database/                  # Implementaciones Repository
│   ├── external/                  # APIs externas (Cloudinary)
│   └── cache/                     # Adaptadores de cache
│
├── presentation/                  # PRESENTACIÓN
│   ├── controllers/               # Controladores HTTP (12)
│   ├── middleware/                # Middleware personalizado (9)
│   └── routes/                    # Definición de rutas
│
├── services/                      # SERVICIOS DE INFRAESTRUCTURA
│   ├── emailService.js            # Templates y envío de emails
│   ├── cronJobService.js          # Tareas programadas
│   └── refundService.js           # Lógica de reembolsos
│
└── shared/                        # COMPARTIDO
    ├── config/                    # Configuraciones centralizadas
    ├── utils/                     # Utilidades comunes (logger, errors)
    ├── constants/                 # Constantes del sistema
    ├── container/                 # DI Container
    └── recurring-expenses/        # Módulo unificado de gastos recurrentes
```

### Frontend - Feature-based Architecture

```
frontend/src/
├── features/                      # CARACTERÍSTICAS POR DOMINIO
│   ├── admin/                     # Panel administrativo
│   ├── appointments/              # Sistema de citas
│   ├── auth/                      # Autenticación
│   ├── barbers/                   # Panel de barberos
│   └── expenses/                  # Gestión de gastos
│
├── pages/                         # PÁGINAS PRINCIPALES
├── layouts/                       # LAYOUTS COMPARTIDOS
│
└── shared/                        # COMPARTIDO
    ├── components/                # Componentes reutilizables
    ├── contexts/                  # Context providers (AuthContext)
    ├── hooks/                     # Custom hooks (useAuth, useLocalStorage)
    ├── services/                  # APIs y servicios
    └── utils/                     # Utilidades
```

### Patrón de Barrel Exports

```javascript
// backend/src/barrel.js - Exports centralizados
export { logger, AppError, asyncHandler } from './shared/utils/...'
export { User, Barber, Sale, ... } from './core/domain/entities/...'
export { config } from './shared/config/...'

// Uso optimizado
import { logger, User, AppError } from '../../../barrel.js'  // Clean!
// vs
import { logger } from '../../../shared/utils/logger.js'     // Profundo
import User from '../../../core/domain/entities/User.js'     // Verboso
```

---
## 📁 Estructura del Proyecto

```
TheBrothersBarberShop/
├── 📂 backend/                    # API REST
│   ├── 📂 src/
│   │   ├── 📂 core/              # Domain + Application (Clean Architecture)
│   │   ├── 📂 infrastructure/    # Database + External services
│   │   ├── 📂 presentation/      # Controllers + Routes + Middleware
│   │   ├── 📂 services/          # Infrastructure services (email, cron)
│   │   ├── 📂 shared/            # Config + Utils + Constants
│   │   ├── 📂 logs/              # Winston logs (rotación 30 días)
│   │   └── 📄 barrel.js          # Barrel exports centralizados
│   ├── 📂 scripts/               # Scripts de datos y mantenimiento
│   ├── 📂 docs/                  # Swagger + guías
│   ├── 📂 backups/               # Backups automáticos MongoDB
│   ├── 📄 package.json
│   └── 📄 .env.example
│
├── 📂 frontend/                   # Aplicación React
│   ├── 📂 src/
│   │   ├── 📂 features/          # Características por dominio
│   │   ├── 📂 pages/             # Páginas principales
│   │   ├── 📂 layouts/           # Layouts compartidos
│   │   ├── 📂 shared/            # Componentes + Hooks + Services
│   │   ├── 📄 barrel.js          # Barrel exports frontend
│   │   ├── 📄 main.jsx
│   │   └── 📄 app.jsx
│   ├── 📂 public/                # Assets estáticos
│   ├── 📄 package.json
│   ├── 📄 vite.config.js
│   ├── 📄 tailwind.config.js
│   └── 📄 .env.example
│
├── 📂 scripts/                    # Scripts de raíz
│   ├── 📄 install-all.js         # Instalar backend + frontend
│   └── 📄 setup-env.js           # Setup de .env
│
├── 📄 README.md                  # Este archivo
├── 📄 dev-launcher.js            # Launcher de desarrollo
├── 📄 package.json               # Scripts de raíz
└── 📄 .gitignore
```
### API Documentation

Swagger disponible en: `https://thebrothersbarbershop.onrender.com/api/docs`

---

## 📞 Soporte y Contacto


### 👨‍💻 Desarrollador

- **GitHub**: [@DilanSG](https://github.com/DilanSG)
- **Proyecto**: [The Brothers Barber Shop](https://github.com/DilanSG/TheBrothersBarberShop)

---

## 📄 Licencia

**© 2024-2025 The Brothers Barber Shop - Todos los derechos reservados**

Este proyecto es **software propietario** desarrollado para uso empresarial. La distribución, modificación o uso comercial sin autorización expresa está prohibida.

### Términos de Uso

- ✅ **Uso Autorizado**: Clientes y socios autorizados
- ❌ **Redistribución**: Prohibida sin permiso expreso
- ❌ **Modificación Comercial**: Solo mediante canales oficiales
- ✅ **Soporte**: Incluido para usuarios autorizados

---

<div align="center">

**🚀 The Brothers Barber Shop**  
*Transformando la gestión de barberías profesionales*

Desarrollado por [DilanSG](https://github.com/DilanSG)

[![GitHub](https://img.shields.io/badge/GitHub-DilanSG-black?logo=github)](https://github.com/DilanSG)
[![Status](https://img.shields.io/badge/Status-Producción-success)](https://github.com/DilanSG/TheBrothersBarberShop)
[![Security](https://img.shields.io/badge/Security-100%25-brightgreen)](https://github.com/DilanSG/TheBrothersBarberShop)

**[⬆ Volver arriba](#-the-brothers-barber-shop)**

</div>
