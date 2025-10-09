Write-Host "THE BROTHERS BARBER SHOP - PRE-DEPLOYMENT CHECK" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

$errors = 0

Write-Host ""
Write-Host "VERIFICANDO ARCHIVOS DE CONFIGURACION..." -ForegroundColor White

if (Test-Path "backend\.env.example") {
    Write-Host "[OK] .env.example existe" -ForegroundColor Green
} else {
    Write-Host "[FAIL] .env.example no encontrado" -ForegroundColor Red
    $errors++
}

if (Test-Path "backend\.env") {
    Write-Host "[OK] .env local existe" -ForegroundColor Green
} else {
    Write-Host "[FAIL] .env no encontrado - copia de .env.example" -ForegroundColor Red
    $errors++
}

Write-Host ""
Write-Host "VERIFICANDO ARCHIVOS DE DEPLOYMENT..." -ForegroundColor White

if (Test-Path "deployment\render.yaml") {
    Write-Host "[OK] render.yaml configurado" -ForegroundColor Green
} else {
    Write-Host "[FAIL] render.yaml no encontrado" -ForegroundColor Red
    $errors++
}

if (Test-Path "frontend\vercel.json") {
    Write-Host "[OK] vercel.json configurado" -ForegroundColor Green
} else {
    Write-Host "[FAIL] vercel.json no encontrado" -ForegroundColor Red
    $errors++
}

Write-Host ""
Write-Host "VERIFICANDO PACKAGE.JSON..." -ForegroundColor White

if (Test-Path "backend\package.json") {
    Write-Host "[OK] Backend package.json existe" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Backend package.json no encontrado" -ForegroundColor Red
    $errors++
}

if (Test-Path "frontend\package.json") {
    Write-Host "[OK] Frontend package.json existe" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Frontend package.json no encontrado" -ForegroundColor Red
    $errors++
}

Write-Host ""
Write-Host "RESUMEN DE VERIFICACION" -ForegroundColor White
Write-Host "=======================" -ForegroundColor White

if ($errors -eq 0) {
    Write-Host "TODO LISTO PARA DEPLOYMENT!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Proximos pasos:"
    Write-Host "1. Ir a render.com y crear Web Service"
    Write-Host "2. Ir a vercel.com y crear proyecto"  
    Write-Host "3. Configurar variables de entorno"
} else {
    Write-Host "ERRORES ENCONTRADOS: $errors" -ForegroundColor Red
}

Write-Host ""
Write-Host "RECURSOS:" -ForegroundColor Cyan
Write-Host "- Checklist: deployment/deploy-checklist.md"
Write-Host "- Config Render: deployment/render.yaml"