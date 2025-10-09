#!/bin/bash

# =====================================================
# RENDER STARTUP SCRIPT
# =====================================================
# Script optimizado para iniciar el backend en Render

echo "🚀 THE BROTHERS BARBER SHOP - RENDER STARTUP"
echo "=============================================="

# Variables de entorno
export NODE_ENV=production
export PORT=${PORT:-10000}

# Mostrar información del entorno
echo "📋 Environment Info:"
echo "   Node Version: $(node --version)"
echo "   NPM Version: $(npm --version)"
echo "   Environment: $NODE_ENV"
echo "   Port: $PORT"
echo ""

# Cambiar al directorio del backend
echo "📁 Cambiando a directorio backend..."
cd backend || {
    echo "❌ Error: No se pudo encontrar el directorio backend"
    exit 1
}

# Verificar que package.json existe
if [ ! -f "package.json" ]; then
    echo "❌ Error: No se encontró package.json en backend/"
    exit 1
fi

# Verificar variables críticas
echo "🔍 Verificando variables de entorno críticas..."
if [ -z "$MONGODB_URI" ]; then
    echo "❌ ERROR CRÍTICO: MONGODB_URI no está configurado"
    echo "   Configúralo en Render Dashboard > Environment"
    exit 1
fi

if [ -z "$JWT_SECRET" ]; then
    echo "❌ ERROR CRÍTICO: JWT_SECRET no está configurado"
    echo "   Configúralo en Render Dashboard > Environment"
    exit 1
fi

echo "✅ Variables críticas configuradas correctamente"

# Mostrar estado de la conexión (sin exponer credenciales)
echo "🔗 Database: MongoDB Atlas (configurado)"
echo "🔑 JWT: Configurado"
echo "☁️  Cloudinary: ${CLOUDINARY_CLOUD_NAME:-No configurado}"

# Verificar que las dependencias estén instaladas
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias de producción..."
    npm ci --only=production
fi

# Iniciar la aplicación
echo ""
echo "🚀 Iniciando The Brothers Barber Shop API..."
echo "=============================================="

# Ejecutar la aplicación con logging
exec npm start