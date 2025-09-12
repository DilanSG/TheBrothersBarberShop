# The Brothers Barber Shop - Setup Guide

## 🚀 Configuración Inicial del Proyecto

### 📋 Prerrequisitos

- **Node.js** (v16 o superior)
- **npm** o **yarn**
- **Git**
- **MongoDB Atlas** (cuenta gratuita)
- **Cloudinary** (para gestión de imágenes)

### 🛠️ Instalación

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/DilanSG/TheBrothersBarberShop.git
   cd TheBrothersBarberShop
   ```

2. **Instalar dependencias:**
   ```bash
   # Instalar todas las dependencias (frontend + backend)
   npm run install:all
   
   # O instalar por separado:
   npm run install:backend
   npm run install:frontend
   ```

### ⚙️ Configuración de Variables de Entorno

#### Backend (`backend/.env`)
```env
# Base de datos
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/barbershop
DATABASE_NAME=barbershop

# JWT
JWT_SECRET=tu_jwt_secret_muy_seguro
JWT_EXPIRE=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=tu_cloudinary_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret

# Email (opcional)
EMAIL_FROM=noreply@barbershop.com
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=tu_app_password

# Redis (opcional)
REDIS_URL=redis://localhost:6379

# Puerto
PORT=5000
NODE_ENV=development
```

#### Frontend (`frontend/.env`)
```env
# API URL
VITE_API_URL=http://localhost:5000/api/v1

# Cloudinary (para frontend)
VITE_CLOUDINARY_CLOUD_NAME=tu_cloudinary_name
```

### 🚀 Ejecución

#### Desarrollo
```bash
# Ejecutar backend y frontend simultaneamente
npm run dev

# O ejecutar por separado:
npm run dev --prefix backend
npm run dev --prefix frontend
```

#### Producción
```bash
# Backend
cd backend
npm start

# Frontend (build)
cd frontend
npm run build
```

### 🌐 URLs de Desarrollo

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api/v1
- **Swagger Docs**: http://localhost:5000/api-docs

### 📊 Base de Datos

El proyecto utiliza **MongoDB** con las siguientes colecciones:
- `users` - Usuarios del sistema
- `appointments` - Citas
- `services` - Servicios disponibles
- `barbers` - Información de barberos
- `inventory` - Inventario de productos
- `sales` - Registro de ventas

### 🔧 Scripts Disponibles

```bash
# Instalación
npm run install:all        # Instalar todas las dependencias
npm run install:backend    # Solo backend
npm run install:frontend   # Solo frontend

# Desarrollo
npm run dev                # Ejecutar todo en desarrollo
npm run dev:backend        # Solo backend
npm run dev:frontend       # Solo frontend

# Testing
npm run test               # Ejecutar tests
npm run test:backend       # Tests del backend
npm run test:frontend      # Tests del frontend

# Build
npm run build              # Build completo
npm run build:frontend     # Build solo frontend
```

### 🚨 Workflow de Git

**IMPORTANTE**: Seguir estas reglas de branching:

#### Frontend (UI, components, styles)
```bash
git checkout gh-pages
# Hacer cambios...
git add .
git commit -m "feat: descripción del cambio"
git push origin gh-pages
```

#### Backend (API, database, services)
```bash
cd backend
git checkout develop
# Hacer cambios...
git add .
git commit -m "feat: descripción del cambio"
git push origin develop
```

### 📦 Deployment

#### Frontend (GitHub Pages)
- Se deploya automáticamente desde la rama `gh-pages`
- Los archivos de build van en `/docs/`

#### Backend (Render)
- Se deploya automáticamente desde la rama `develop`
- Configurar variables de entorno en Render

### 🐛 Troubleshooting

#### Problemas Comunes

1. **Error de dependencias**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Puerto ocupado**:
   - Frontend: Cambiar puerto en `vite.config.js`
   - Backend: Cambiar `PORT` en `.env`

3. **Base de datos no conecta**:
   - Verificar `MONGODB_URI` en `.env`
   - Whitelist IP en MongoDB Atlas

4. **Imágenes no cargan**:
   - Verificar configuración de Cloudinary
   - Revisar permisos de upload

### 📞 Soporte

Para problemas o dudas:
1. Revisar la documentación en `/docs/`
2. Verificar logs en `/backend/logs/`
3. Consultar issues en GitHub

---

*Última actualización: 11 de Septiembre, 2025*