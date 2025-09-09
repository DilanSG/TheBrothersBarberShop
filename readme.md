# 🏪 The Brothers Barber Shop

Sistema de gestión integral para barbería desarrollado con tecnologías modernas. Incluye gestión de usuarios, barberos, servicios, citas e inventario con sistema de autenticación basado en roles.

## 🚀 Características Principales

- **👥 Gestión de Usuarios**: Registro, autenticación y perfiles de usuario
- **💈 Gestión de Barberos**: Perfiles especializados con estadísticas de ventas
- **📅 Sistema de Citas**: Programación y gestión de citas con calendario
- **🛍️ Gestión de Servicios**: Catálogo completo de servicios y precios
- **📦 Control de Inventario**: Seguimiento de productos y stock
- **💰 Ventas**: Sistema completo de ventas y reportes
- **🔐 Autenticación JWT**: Sistema seguro de roles (usuario/barbero/admin)
- **📱 Responsive Design**: Interfaz adaptable a todos los dispositivos

## 🛠️ Tecnologías Utilizadas

### Backend
- **Node.js** con Express.js
- **MongoDB** con Mongoose
- **JWT** para autenticación
- **Cloudinary** para gestión de imágenes
- **Winston** para logging
- **Jest** para testing

### Frontend
- **React 18** con Hooks
- **Vite** como bundler
- **Tailwind CSS** para estilos
- **React Router** para navegación
- **Context API** para estado global

## 📋 Prerrequisitos

- Node.js (versión 16 o superior)
- npm (versión 8 o superior)
- MongoDB (local o MongoDB Atlas)
- Cuenta de Cloudinary (opcional, para uploads)

## ⚡ Instalación Rápida

### 1. Clonar el repositorio
```bash
git clone https://github.com/DilanSG/TheBrothersBarberShop.git
cd TheBrothersBarberShop
```

### 2. Instalar dependencias
```bash
# Instalar todas las dependencias (backend y frontend)
npm run install:all

# O instalar por separado
npm run install:backend
npm run install:frontend
```

### 3. Configurar variables de entorno

**Backend** - Crear `backend/.env` basado en `backend/.env.example`:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/brothers_barber_shop
JWT_SECRET=tu_jwt_secret_muy_seguro
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
```

**Frontend** - Crear `frontend/.env` basado en `frontend/.env.example`:
```env
VITE_API_URL=http://localhost:5000/api/v1
```

### 4. Ejecutar el proyecto
```bash
# Desarrollo (backend y frontend simultáneamente)
npm run dev

# Solo backend
npm run dev --prefix backend

# Solo frontend  
npm run dev --prefix frontend
```

## 📚 Scripts Disponibles

```bash
npm run dev          # Ejecutar en modo desarrollo
npm run start        # Ejecutar en producción
npm run build        # Construir para producción
npm run test         # Ejecutar tests del backend
npm run lint         # Verificar código con ESLint
npm run seed         # Poblar base de datos con datos de ejemplo
```

## 🏗️ Estructura del Proyecto

```
TheBrothersBarberShop/
├── backend/                 # Servidor Node.js/Express
│   ├── src/
│   │   ├── controllers/     # Controladores de rutas
│   │   ├── models/          # Modelos de MongoDB
│   │   ├── routes/          # Definición de rutas
│   │   ├── services/        # Lógica de negocio
│   │   ├── middleware/      # Middlewares personalizados
│   │   ├── utils/           # Utilidades y helpers
│   │   └── config/          # Configuración del servidor
│   ├── tests/               # Tests unitarios e integración
│   └── docs/                # Documentación API (Swagger)
├── frontend/                # Aplicación React
│   ├── src/
│   │   ├── components/      # Componentes reutilizables
│   │   ├── pages/           # Páginas de la aplicación
│   │   ├── contexts/        # Context providers
│   │   ├── hooks/           # Custom hooks
│   │   ├── services/        # Servicios API
│   │   └── utils/           # Utilidades
│   └── public/              # Archivos estáticos
└── docs/                    # Documentación del proyecto
```

## 🔐 Roles de Usuario

- **Usuario**: Puede agendar citas y ver su historial
- **Barbero**: Gestiona sus citas, servicios y ve estadísticas
- **Admin**: Control total del sistema, gestión de usuarios y reportes

## 🌐 API Endpoints

### Autenticación
- `POST /api/v1/auth/register` - Registro de usuario
- `POST /api/v1/auth/login` - Inicio de sesión
- `POST /api/v1/auth/logout` - Cerrar sesión

### Usuarios
- `GET /api/v1/users/profile` - Obtener perfil
- `PUT /api/v1/users/profile` - Actualizar perfil
- `POST /api/v1/users/upload-profile-picture` - Subir foto de perfil

### Citas
- `GET /api/v1/appointments` - Listar citas
- `POST /api/v1/appointments` - Crear cita
- `PUT /api/v1/appointments/:id` - Actualizar cita
- `DELETE /api/v1/appointments/:id` - Cancelar cita

### Servicios
- `GET /api/v1/services` - Listar servicios
- `POST /api/v1/services` - Crear servicio (admin)
- `PUT /api/v1/services/:id` - Actualizar servicio (admin)

## 🧪 Testing

```bash
# Ejecutar todos los tests
npm run test

# Tests con coverage
npm run test:coverage

# Tests en modo watch
npm run test:watch
```

## 🚀 Despliegue

### Frontend (GitHub Pages)
```bash
npm run build
# Los archivos se generan en docs/ para GitHub Pages
```

### Backend (Render/Railway/Heroku)
1. Configurar variables de entorno en la plataforma
2. Conectar repositorio
3. La aplicación se desplegará automáticamente

## 🔒 Contribuciones

**Este es un proyecto privado y propietario.**

❌ **NO se aceptan contribuciones externas**
❌ **NO se permiten Pull Requests**
❌ **NO se permite fork del repositorio**

Para consultas específicas o propuestas comerciales, contactar directamente al autor.

## 📝 Licencia

Este proyecto está bajo **Licencia Propietaria Privada**. 

⚠️ **IMPORTANTE**: Este software es de uso **RESTRINGIDO**
- ❌ **NO está permitido** copiar, distribuir o modificar el código
- ❌ **NO está permitido** el uso comercial
- ❌ **NO está permitido** crear trabajos derivados
- 👁️ **Solo se permite** visualización del código para fines educativos
- 📧 Para consultas de licenciamiento contactar al autor

Ver el archivo `LICENSE` para términos completos y restricciones legales.

## 👨‍💻 Autor

**DilanSG**
- GitHub: [@DilanSG](https://github.com/DilanSG)

---

� **SOFTWARE PROPIETARIO** - Todos los derechos reservados © 2025 DilanSG

⚠️ **ADVERTENCIA LEGAL**: El uso no autorizado de este software está estrictamente prohibido y puede resultar en acciones legales.

🔒 **SOFTWARE PROPIETARIO** - Todos los derechos reservados © 2025 DilanSG

⚠️ **ADVERTENCIA LEGAL**: El uso no autorizado de este software está estrictamente prohibido y puede resultar en acciones legales.