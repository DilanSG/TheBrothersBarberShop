# 📋 DEPLOYMENT CHECKLIST - THE BROTHERS BARBER SHOP

## ✅ PRE-DEPLOYMENT (Completar antes del deploy)

### **1. Environment Setup**
- [x] ✅ `.env.example` creado y documentado
- [ ] ❌ Verificar variables locales funcionando
- [ ] ❌ Generar JWT_SECRET seguro para producción
- [ ] ❌ Verificar MongoDB Atlas connection string

### **2. Repository Preparation**
- [ ] ❌ Commit todos los cambios a `main` branch
- [ ] ❌ Verificar que .env está en .gitignore
- [ ] ❌ Tag version para deployment: `v1.0.0`
- [ ] ❌ Push final a GitHub

---

## 🚀 RENDER DEPLOYMENT (Backend)

### **3. Render Account Setup**
- [ ] ❌ Crear cuenta en [render.com](https://render.com)
- [ ] ❌ Conectar cuenta GitHub
- [ ] ❌ Autorizar acceso al repositorio

### **4. Create Web Service**
- [ ] ❌ **New** → **Web Service**
- [ ] ❌ Seleccionar repositorio: `TheBrothersBarberShop`
- [ ] ❌ Name: `barbershop-api`
- [ ] ❌ Region: `Oregon` (o más cercano)
- [ ] ❌ Branch: `main`
- [ ] ❌ Root Directory: `backend`
- [ ] ❌ Runtime: `Node`
- [ ] ❌ Build Command: `npm ci --only=production`
- [ ] ❌ Start Command: `npm start`
- [ ] ❌ Plan: `Starter ($0/mes por 90 días)`

### **5. Environment Variables (CRÍTICO)**
```
NODE_ENV=production
MONGODB_URI=mongodb+srv://tu_usuario:tu_password@cluster.mongodb.net/database
JWT_SECRET=[generar con: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"]
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key  
CLOUDINARY_API_SECRET=tu_secret
FRONTEND_URL=https://tu-proyecto.vercel.app
ALLOWED_ORIGINS=https://tu-proyecto.vercel.app
```

### **6. Deploy & Test**
- [ ] ❌ Click **Create Web Service**
- [ ] ❌ Esperar deploy (5-10 minutos)
- [ ] ❌ Verificar logs: sin errores
- [ ] ❌ Test health endpoint: `https://tu-api.onrender.com/health`
- [ ] ❌ Copiar URL del servicio para Vercel

---

## ⚡ VERCEL DEPLOYMENT (Frontend)

### **7. Vercel Account Setup**
- [ ] ❌ Crear cuenta en [vercel.com](https://vercel.com)
- [ ] ❌ Conectar cuenta GitHub
- [ ] ❌ Instalar Vercel CLI: `npm i -g vercel`

### **8. Deploy Frontend**
- [ ] ❌ **Add New Project**
- [ ] ❌ Import repositorio: `TheBrothersBarberShop`
- [ ] ❌ Framework: `Vite`
- [ ] ❌ Root Directory: `frontend`
- [ ] ❌ Build Command: `npm run build`
- [ ] ❌ Output Directory: `dist`

### **9. Environment Variables Vercel**
```
VITE_API_URL=https://barbershop-api.onrender.com
VITE_APP_NAME=The Brothers Barber Shop
VITE_APP_VERSION=1.0.0
```

### **10. Deploy & Test**
- [ ] ❌ Click **Deploy**
- [ ] ❌ Esperar build (2-3 minutos)
- [ ] ❌ Verificar frontend carga correctamente
- [ ] ❌ Test login/registrar usuario
- [ ] ❌ Verificar comunicación frontend ↔ backend

---

## 🔧 POST-DEPLOYMENT

### **11. Update Configuration**
- [ ] ❌ Actualizar `FRONTEND_URL` en Render con URL de Vercel
- [ ] ❌ Actualizar `ALLOWED_ORIGINS` en Render
- [ ] ❌ Redeploy backend con nuevas variables

### **12. Domain Setup (Opcional)**
- [ ] ❌ Configurar dominio personalizado en Vercel
- [ ] ❌ Configurar subdomain API en Render
- [ ] ❌ Actualizar URLs en variables de entorno

### **13. Monitoring Setup**
- [ ] ❌ Configurar UptimeRobot para monitoring
- [ ] ❌ Setup Sentry para error tracking
- [ ] ❌ Configurar alertas de Render/Vercel

---

## 🧪 TESTING & VALIDATION

### **14. Functional Testing**
- [ ] ❌ **Registration**: Crear nueva cuenta
- [ ] ❌ **Login**: Iniciar sesión
- [ ] ❌ **Dashboard**: Navegar dashboard
- [ ] ❌ **CRUD Operations**: Crear/editar/eliminar datos
- [ ] ❌ **File Upload**: Subir imagen (Cloudinary)
- [ ] ❌ **API Endpoints**: Test rutas principales
- [ ] ❌ **Mobile**: Test responsive design

### **15. Performance Testing**
- [ ] ❌ **Load Time**: < 3 segundos initial load
- [ ] ❌ **API Response**: < 500ms promedio
- [ ] ❌ **Health Check**: Responde correctamente
- [ ] ❌ **Error Handling**: Manejo correcto de errores

### **16. Security Validation**
- [ ] ❌ **HTTPS**: Certificados SSL funcionando
- [ ] ❌ **CORS**: Headers configurados correctamente
- [ ] ❌ **JWT**: Tokens funcionando correctamente
- [ ] ❌ **Environment**: No secrets expuestos

---

## 🎉 GO-LIVE CHECKLIST

### **17. Final Steps**
- [ ] ❌ **Documentation**: README con URLs production
- [ ] ❌ **Backup**: Verificar backups automáticos MongoDB
- [ ] ❌ **Monitoring**: Alertas configuradas
- [ ] ❌ **Team Access**: Accesos configurados
- [ ] ❌ **Launch**: 🚀 SISTEMA EN PRODUCCIÓN

---

## 📞 TROUBLESHOOTING

### **Common Issues & Solutions**

**Backend no inicia:**
- Verificar MONGODB_URI en Render
- Revisar logs de Render
- Verificar JWT_SECRET configurado

**Frontend no conecta:**
- Verificar VITE_API_URL apunta a Render
- Verificar CORS en backend
- Check network tab en browser

**Build failures:**
- Verificar dependencias en package.json
- Check build logs
- Verificar Node version compatibility

### **Support Resources**
- Render Docs: https://render.com/docs
- Vercel Docs: https://vercel.com/docs
- MongoDB Atlas: https://docs.atlas.mongodb.com

---

**📅 Checklist creado:** 8 de Octubre, 2025  
**🎯 Objetivo:** Deployment completo en 3-4 horas  
**⏱️ Tiempo estimado por sección:** 
- Pre-deployment: 30min
- Render setup: 1h
- Vercel setup: 30min  
- Testing: 1h
- Go-live: 30min