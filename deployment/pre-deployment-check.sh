#!/bin/bash

# =====================================================
# PRE-DEPLOYMENT VERIFICATION SCRIPT
# =====================================================
# Verifica que todo esté listo para deployment

echo "🔍 THE BROTHERS BARBER SHOP - PRE-DEPLOYMENT CHECK"
echo "=================================================="

# Colors para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

errors=0
warnings=0

check_passed() {
    echo -e "${GREEN}✅ $1${NC}"
}

check_failed() {
    echo -e "${RED}❌ $1${NC}"
    ((errors++))
}

check_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    ((warnings++))
}

echo ""
echo "📋 VERIFICANDO ARCHIVOS DE CONFIGURACIÓN..."

# Check .env.example
if [ -f "backend/.env.example" ]; then
    check_passed ".env.example existe"
else
    check_failed ".env.example no encontrado"
fi

# Check .env local
if [ -f "backend/.env" ]; then
    check_passed ".env local existe"
    
    # Check critical variables
    if grep -q "MONGODB_URI=" backend/.env && [ "$(grep MONGODB_URI= backend/.env | cut -d'=' -f2)" != "" ]; then
        check_passed "MONGODB_URI configurado"
    else
        check_failed "MONGODB_URI no configurado correctamente"
    fi
    
    if grep -q "JWT_SECRET=" backend/.env && [ "$(grep JWT_SECRET= backend/.env | cut -d'=' -f2)" != "" ]; then
        check_passed "JWT_SECRET configurado"
    else
        check_failed "JWT_SECRET no configurado"
    fi
else
    check_failed ".env no encontrado - copia de .env.example"
fi

# Check deployment files
echo ""
echo "🚀 VERIFICANDO ARCHIVOS DE DEPLOYMENT..."

if [ -f "deployment/render.yaml" ]; then
    check_passed "render.yaml configurado"
else
    check_failed "render.yaml no encontrado"
fi

if [ -f "deployment/start.sh" ]; then
    check_passed "start.sh configurado"
else
    check_failed "start.sh no encontrado"
fi

if [ -f "frontend/vercel.json" ]; then
    check_passed "vercel.json configurado"
else
    check_failed "vercel.json no encontrado"
fi

# Check package.json files
echo ""
echo "📦 VERIFICANDO PACKAGE.JSON..."

if [ -f "backend/package.json" ]; then
    check_passed "Backend package.json existe"
    
    # Check start script
    if grep -q '"start":' backend/package.json; then
        check_passed "Script 'start' configurado"
    else
        check_failed "Script 'start' no encontrado en package.json"
    fi
else
    check_failed "Backend package.json no encontrado"
fi

if [ -f "frontend/package.json" ]; then
    check_passed "Frontend package.json existe"
    
    # Check build script
    if grep -q '"build":' frontend/package.json; then
        check_passed "Script 'build' configurado"
    else
        check_failed "Script 'build' no encontrado en package.json"
    fi
else
    check_failed "Frontend package.json no encontrado"
fi

# Check git status
echo ""
echo "📂 VERIFICANDO ESTADO DEL REPOSITORIO..."

if [ -d ".git" ]; then
    check_passed "Repositorio git inicializado"
    
    # Check if there are uncommitted changes
    if [ -n "$(git status --porcelain)" ]; then
        check_warning "Tienes cambios sin commit"
        echo "      Ejecuta: git add . && git commit -m 'Ready for deployment'"
    else
        check_passed "No hay cambios pendientes"
    fi
    
    # Check .gitignore
    if [ -f ".gitignore" ] && grep -q ".env" .gitignore; then
        check_passed ".env está en .gitignore"
    else
        check_warning ".env debería estar en .gitignore"
    fi
else
    check_failed "No es un repositorio git"
fi

# Test local backend
echo ""
echo "🔧 VERIFICANDO FUNCIONALIDAD LOCAL..."

if [ -d "backend/node_modules" ]; then
    check_passed "Dependencias del backend instaladas"
else
    check_warning "Dependencias del backend no instaladas (npm install)"
fi

if [ -d "frontend/node_modules" ]; then
    check_passed "Dependencias del frontend instaladas"
else
    check_warning "Dependencias del frontend no instaladas (npm install)"
fi

# Results
echo ""
echo "📊 RESUMEN DE VERIFICACIÓN"
echo "=========================="

if [ $errors -eq 0 ]; then
    echo -e "${GREEN}🎉 TODO LISTO PARA DEPLOYMENT!${NC}"
    echo ""
    echo "📋 Próximos pasos:"
    echo "1. Ir a render.com y crear Web Service"
    echo "2. Ir a vercel.com y crear proyecto"
    echo "3. Configurar variables de entorno"
    echo "4. Seguir deployment/deploy-checklist.md"
else
    echo -e "${RED}❌ ERRORES ENCONTRADOS: $errors${NC}"
    echo ""
    echo "🔧 Corrige los errores antes del deployment:"
    echo "- Revisa los ❌ mostrados arriba"
    echo "- Consulta deployment/deploy-checklist.md"
fi

if [ $warnings -gt 0 ]; then
    echo -e "${YELLOW}⚠️  ADVERTENCIAS: $warnings${NC}"
fi

echo ""
echo "📚 RECURSOS:"
echo "- Checklist completo: deployment/deploy-checklist.md"
echo "- Configuración Render: deployment/render.yaml"  
echo "- Variables ejemplo: backend/.env.example"

exit $errors