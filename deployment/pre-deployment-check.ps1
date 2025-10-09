# =====================================================
# PRE-DEPLOYMENT VERIFICATION SCRIPT (PowerShell)
# =====================================================

WWrite-Host "RECURSOS:" -ForegroundColor Cyan
Write-Host "- Checklist completo: deployment/deploy-checklist.md"
Write-Host "- Configuracion Render: deployment/render.yaml"  
Write-Host "- Variables ejemplo: backend/.env.example"-Host "THE BROTHERS BARBER SHOP - PRE-DEPLOYMENT CHECK" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

$errors = 0
$warnings = 0

function Check-Passed($message) {
    Write-Host "[OK] $message" -ForegroundColor Green
}

function Check-Failed($message) {
    Write-Host "[FAIL] $message" -ForegroundColor Red
    $script:errors++
}

function Check-Warning($message) {
    Write-Host "[WARN] $message" -ForegroundColor Yellow
    $script:warnings++
}

Write-Host ""
Write-Host "VERIFICANDO ARCHIVOS DE CONFIGURACION..." -ForegroundColor White

# Check .env.example
if (Test-Path "backend\.env.example") {
    Check-Passed ".env.example existe"
} else {
    Check-Failed ".env.example no encontrado"
}

# Check .env local
if (Test-Path "backend\.env") {
    Check-Passed ".env local existe"
    
    # Check critical variables
    $envContent = Get-Content "backend\.env" -Raw
    if ($envContent -match "MONGODB_URI=.+" -and $envContent -notmatch "MONGODB_URI=$") {
        Check-Passed "MONGODB_URI configurado"
    } else {
        Check-Failed "MONGODB_URI no configurado correctamente"
    }
    
    if ($envContent -match "JWT_SECRET=.+" -and $envContent -notmatch "JWT_SECRET=$") {
        Check-Passed "JWT_SECRET configurado"
    } else {
        Check-Failed "JWT_SECRET no configurado"
    }
} else {
    Check-Failed ".env no encontrado - copia de .env.example"
}

# Check deployment files
Write-Host ""
Write-Host "VERIFICANDO ARCHIVOS DE DEPLOYMENT..." -ForegroundColor White

if (Test-Path "deployment\render.yaml") {
    Check-Passed "render.yaml configurado"
} else {
    Check-Failed "render.yaml no encontrado"
}

if (Test-Path "deployment\start.sh") {
    Check-Passed "start.sh configurado"
} else {
    Check-Failed "start.sh no encontrado"
}

if (Test-Path "frontend\vercel.json") {
    Check-Passed "vercel.json configurado"
} else {
    Check-Failed "vercel.json no encontrado"
}

# Check package.json files
Write-Host ""
Write-Host "VERIFICANDO PACKAGE.JSON..." -ForegroundColor White

if (Test-Path "backend\package.json") {
    Check-Passed "Backend package.json existe"
    
    # Check start script
    $backendPackage = Get-Content "backend\package.json" -Raw
    if ($backendPackage -match '"start":') {
        Check-Passed "Script 'start' configurado"
    } else {
        Check-Failed "Script 'start' no encontrado en package.json"
    }
} else {
    Check-Failed "Backend package.json no encontrado"
}

if (Test-Path "frontend\package.json") {
    Check-Passed "Frontend package.json existe"
    
    # Check build script
    $frontendPackage = Get-Content "frontend\package.json" -Raw
    if ($frontendPackage -match '"build":') {
        Check-Passed "Script 'build' configurado"
    } else {
        Check-Failed "Script 'build' no encontrado en package.json"
    }
} else {
    Check-Failed "Frontend package.json no encontrado"
}

# Check git status
Write-Host ""
Write-Host "VERIFICANDO ESTADO DEL REPOSITORIO..." -ForegroundColor White

if (Test-Path ".git") {
    Check-Passed "Repositorio git inicializado"
    
    # Check .gitignore
    if ((Test-Path ".gitignore") -and ((Get-Content ".gitignore" -Raw) -match "\.env")) {
        Check-Passed ".env está en .gitignore"
    } else {
        Check-Warning ".env debería estar en .gitignore"
    }
} else {
    Check-Failed "No es un repositorio git"
}

# Test dependencies
Write-Host ""
Write-Host "VERIFICANDO DEPENDENCIAS..." -ForegroundColor White

if (Test-Path "backend\node_modules") {
    Check-Passed "Dependencias del backend instaladas"
} else {
    Check-Warning "Dependencias del backend no instaladas (ejecuta: cd backend && npm install)"
}

if (Test-Path "frontend\node_modules") {
    Check-Passed "Dependencias del frontend instaladas"
} else {
    Check-Warning "Dependencias del frontend no instaladas (ejecuta: cd frontend && npm install)"
}

# Results
Write-Host ""
Write-Host "RESUMEN DE VERIFICACION" -ForegroundColor White
Write-Host "=======================" -ForegroundColor White

if ($errors -eq 0) {
    Write-Host "TODO LISTO PARA DEPLOYMENT!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Próximos pasos:"
    Write-Host "1. Ir a render.com y crear Web Service"
    Write-Host "2. Ir a vercel.com y crear proyecto"
    Write-Host "3. Configurar variables de entorno"
    Write-Host "4. Seguir deployment\deploy-checklist.md"
} else {
    Write-Host "ERRORES ENCONTRADOS: $errors" -ForegroundColor Red
    Write-Host ""
    Write-Host "Corrige los errores antes del deployment:"
    Write-Host "- Revisa los [FAIL] mostrados arriba"
    Write-Host "- Consulta deployment/deploy-checklist.md"
}

if ($warnings -gt 0) {
    Write-Host "ADVERTENCIAS: $warnings" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "RECURSOS:" -ForegroundColor Cyan
Write-Host "- Checklist completo: deployment/deploy-checklist.md"
Write-Host "- Configuracion Render: deployment/render.yaml"  
Write-Host "- Variables ejemplo: backend/.env.example"

if ($errors -gt 0) {
    exit 1
} else {
    exit 0
}