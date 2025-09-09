# GitHub Copilot - Instrucciones del Proyecto

## 🚨 REGLAS CRÍTICAS DE RAMAS

### ANTES DE HACER CUALQUIER CAMBIO:

1. **Identificar el tipo de cambio:**
   - 🎨 **Frontend** (UI, assets, componentes, estilos) → Rama `gh-pages`
   - 🔧 **Backend** (API, validaciones, servicios, base de datos) → Rama `develop`

2. **Cambiar a la rama correcta:**
   ```bash
   # Para cambios de Frontend
   git checkout gh-pages
   
   # Para cambios de Backend  
   cd backend && git checkout develop
   ```

3. **Workflow de commits:**
   ```bash
   # Frontend (gh-pages)
   git add .
   git commit -m "feat: descripción del cambio"
   git push origin gh-pages
   
   # Backend (develop) 
   cd backend
   git add .
   git commit -m "feat: descripción del cambio"
   git push origin develop
   ```

### DEPLOYMENT:
- **Frontend**: Los cambios en `gh-pages` se despliegan automáticamente en GitHub Pages
- **Backend**: Los cambios en `develop` se despliegan automáticamente en Render

---

## 📋 ESTRUCTURA DEL PROYECTO

### Frontend (React + Vite)
- **Deploy**: GitHub Pages desde rama `gh-pages`
- **Ruta**: `/frontend/`
- **Build**: `npm run build` genera archivos en `/docs/`
- **Assets**: Usar helper `getAssetUrl()` para rutas de imágenes

### Backend (Node.js + Express)
- **Deploy**: Render.com desde rama `develop` 
- **Ruta**: `/backend/`
- **Port**: Variable de entorno `PORT` (Render lo asigna automáticamente)
- **Database**: MongoDB Atlas

---

## 🔧 PROBLEMAS COMUNES Y SOLUCIONES

### 1. Assets no cargan en GitHub Pages
- **Problema**: Rutas absolutas no funcionan en subdirectorios
- **Solución**: Usar `getAssetUrl()` del helper en `/frontend/src/utils/assets.js`

### 2. Errores de timezone en citas
- **Problema**: Diferencias entre UTC y timezone local
- **Solución**: Usar `America/Bogota` consistentemente en backend

### 3. Port binding en Render
- **Problema**: El puerto debe ser dinámico
- **Solución**: Usar `process.env.PORT || 3000`

### 4. CORS en producción
- **Configuración**: El backend debe permitir el dominio del frontend de GitHub Pages

---

## 📁 ARCHIVOS CRÍTICOS

### Frontend
- `vite.config.js` - Configuración de build y base path
- `src/utils/assets.js` - Helper para rutas de assets
- `src/services/api.js` - Configuración de endpoints API

### Backend
- `src/app.js` - Configuración principal del servidor
- `src/middleware/validation.js` - Validaciones (timezone crítico)
- `src/controllers/appointmentController.js` - Lógica de citas

---

## ⚠️ NUNCA HACER:

1. **NO** commitear cambios de frontend en `develop`
2. **NO** commitear cambios de backend en `gh-pages`  
3. **NO** usar rutas absolutas para assets en frontend
4. **NO** hardcodear puertos en backend
5. **NO** ignorar la timezone en validaciones de fecha

---

## 🧪 TESTING

### Frontend
```bash
cd frontend
npm run dev    # Desarrollo local
npm run build  # Build para producción
npm run preview # Preview del build
```

### Backend  
```bash
cd backend
npm run dev     # Desarrollo con nodemon
npm start       # Producción
npm test        # Tests (si existen)
```

---

## 📞 ENDPOINTS IMPORTANTES

### API Base URL
- **Desarrollo**: `http://localhost:3000`
- **Producción**: `https://[tu-app].onrender.com`

### Frontend URL  
- **Desarrollo**: `http://localhost:5173`
- **Producción**: `https://[usuario].github.io/TheBrothersBarberShop`

---

*Última actualización: 9 de Septiembre, 2025*
