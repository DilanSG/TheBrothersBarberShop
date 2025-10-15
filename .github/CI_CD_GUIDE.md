# 🚀 CI/CD Pipeline Guide - The Brothers Barber Shop

## 📋 Resumen

Pipeline automatizado completo usando **GitHub Actions** (100% gratuito) para testing, building y deployment continuo.

---

## 🏗️ Arquitectura del Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│                    TRIGGER (Push/PR)                        │
└────────────────────┬────────────────────────────────────────┘

                     │
         ┌───────────┴──────────┐
         │                      │
    ┌────▼────┐           ┌────▼────┐
    │  Lint   │           │Security │
    │ Backend │           │  Audit  │
    │Frontend │           │         │
    └────┬────┘           └─────────┘
         │
    ┌────▼────┐
    │  Test   │ ◄── Jest + Coverage
    │ Backend │
    └────┬────┘
         │
    ┌────┴─────┬──────────┐
    │          │          │
┌───▼───┐  ┌──▼───┐  ┌───▼────┐
│ Build │  │Build │  │Upload  │
│Backend│  │Front │  │Coverage│
└───┬───┘  └──┬───┘  └────────┘
    │         │
    └────┬────┘
         │
    ┌────▼────────┐
    │   Deploy    │
    │  to Vercel  │
    │ (Production)│
    └─────────────┘
```

---

## 📁 Workflows Configurados

### 1️⃣ **CI/CD Principal** (`.github/workflows/ci-cd.yml`)

**Triggers:**
- Push a `main` o `develop`
- Pull Requests a `main` o `develop`

**Jobs:**

| Job | Descripción | Runs On | Duration |
|-----|-------------|---------|----------|
| **Lint** | ESLint backend + frontend | `ubuntu-latest` | ~1 min |
| **Test** | Jest unit tests + coverage | `ubuntu-latest` | ~2 min |
| **Build Backend** | Validar estructura | `ubuntu-latest` | ~30 sec |
| **Build Frontend** | Vite build + artifact | `ubuntu-latest` | ~2 min |
| **Deploy Production** | Vercel (solo main) | `ubuntu-latest` | ~1 min |
| **Deploy Preview** | Vercel preview (PRs) | `ubuntu-latest` | ~1 min |
| **Security** | npm audit | `ubuntu-latest` | ~30 sec |

**Total Pipeline Time:** ~7-9 minutos

---

### 2️⃣ **Tests Específicos** (`.github/workflows/test.yml`)

**Triggers:**
- Push a `main` o `develop` (solo si cambia `/backend`)
- Pull Requests (solo si cambia `/backend`)
- Manual dispatch

**Strategy Matrix:**
```yaml
node-version: [18.x, 20.x]
```

**Features:**
- ✅ Tests en múltiples versiones de Node.js
- ✅ Coverage report (solo Node 18)
- ✅ Upload coverage to Codecov
- ✅ Artifacts de coverage (7 días retención)

---

### 3️⃣ **Dependabot** (`.github/dependabot.yml`)

**Automatización:**
- 🔄 Updates semanales (Lunes 9:00 AM)
- 📦 Backend + Frontend + GitHub Actions
- 🏷️ Labels automáticos (`dependencies`, `backend`, `frontend`)
- 👥 Auto-assign reviewers
- 📝 Commit messages con prefijos semánticos

**Límites:**
- Backend: 5 PRs abiertos max
- Frontend: 5 PRs abiertos max
- GitHub Actions: 1 PR/mes

---

## 🔐 Secrets Requeridos

Configure estos secrets en **GitHub Repository Settings → Secrets and variables → Actions**:

### Vercel Deployment

```bash
VERCEL_TOKEN           # Token de tu cuenta Vercel
VERCEL_ORG_ID          # ID de tu organización Vercel
VERCEL_PROJECT_ID      # ID del proyecto Vercel
```

### Opcional (Coverage)

```bash
CODECOV_TOKEN          # Token de Codecov (opcional)
```

---

## 📊 Badges en README.md

Ya agregados al README principal:

```markdown
[![CI/CD Pipeline](https://github.com/DilanSG/TheBrothersBarberShop/actions/workflows/ci-cd.yml/badge.svg)](...)
[![Tests](https://github.com/DilanSG/TheBrothersBarberShop/actions/workflows/test.yml/badge.svg)](...)
[![codecov](https://codecov.io/gh/DilanSG/TheBrothersBarberShop/branch/main/graph/badge.svg)](...)
[![Dependabot](https://img.shields.io/badge/Dependabot-enabled-blue)](...)
```

---

## 🚦 Quality Gates

### ✅ Para Deploy a Producción

**Condiciones que DEBEN cumplirse:**

1. ✅ Branch: `main`
2. ✅ Event: `push` (no PRs)
3. ✅ Lint: Passed
4. ✅ Tests: Passed
5. ✅ Build Backend: Passed
6. ✅ Build Frontend: Passed

**Si alguno falla:** ❌ Deploy bloqueado

---

## 🎯 Cómo Usar

### Deploy a Producción

```bash
# 1. Hacer cambios en tu rama
git checkout -b feature/nueva-funcionalidad

# 2. Commit y push
git add .
git commit -m "feat: nueva funcionalidad"
git push origin feature/nueva-funcionalidad

# 3. Crear Pull Request en GitHub
# - Pipeline ejecuta: Lint → Test → Build → Deploy Preview
# - Review code + tests passing

# 4. Merge a main
# - Pipeline ejecuta todo + Deploy Production
# - Vercel actualiza automáticamente
```

### Ver Preview de PR

1. Crea un Pull Request
2. Espera a que termine el workflow `deploy-preview`
3. El bot comentará con la URL del preview:

```
## 🔍 Preview Deployment Ready!

✅ Your preview is available at:
**https://thebrothersbarbers-abc123.vercel.app**

---
*Deployed from commit: abc1234*
```

### Ejecutar Tests Manualmente

```bash
# Desde GitHub Actions UI
# Actions → Tests → Run workflow → Run workflow
```

---

## 📈 Monitoreo y Logs

### GitHub Actions

- **URL**: `https://github.com/DilanSG/TheBrothersBarberShop/actions`
- **Logs**: Disponibles por workflow run (90 días retención)
- **Artifacts**: Coverage reports (7 días retención)

### Vercel Dashboard

- **URL**: `https://vercel.com/dashboard`
- **Features**:
  - Deployment history
  - Build logs
  - Analytics
  - Error tracking

### Codecov

- **URL**: `https://codecov.io/gh/DilanSG/TheBrothersBarberShop`
- **Métricas**:
  - Coverage trends
  - File-by-file coverage
  - Diff coverage en PRs

---

## 🛠️ Configurar Vercel (Primera Vez)

### 1. Crear Proyecto en Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Link proyecto
cd frontend
vercel link
```

### 2. Obtener Secrets

```bash
# Ver tokens y IDs
vercel env ls
cat .vercel/project.json

# Copiar:
# - VERCEL_ORG_ID
# - VERCEL_PROJECT_ID
```

### 3. Generar Token

1. Ve a https://vercel.com/account/tokens
2. Create Token
3. Copia el token
4. Guárdalo como `VERCEL_TOKEN` en GitHub Secrets

---

## 🔧 Solución de Problemas

### ❌ Tests Failing

**Problema:** Tests fallan en CI pero pasan local

**Solución:**
```bash
# Ejecutar con las mismas variables de entorno
NODE_ENV=test npm test
```

### ❌ Vercel Deploy Failing

**Problema:** "Project not found"

**Solución:**
1. Verifica `VERCEL_PROJECT_ID` en secrets
2. Re-link proyecto: `vercel link`
3. Actualiza secret con nuevo ID

### ❌ Coverage Upload Failing

**Problema:** Codecov rechaza el upload

**Solución:**
- Es opcional (`continue-on-error: true`)
- Verifica `CODECOV_TOKEN` si quieres habilitarlo
- Sin token, Codecov funciona pero con limitaciones

---

## 📊 Métricas de Pipeline

### Performance

- **Tiempo Total**: 7-9 minutos
- **Jobs Paralelos**: Lint + Security (simultáneos)
- **Cache Habilitado**: npm dependencies (reduce 30-40%)

### Costos

- **GitHub Actions**: ✅ FREE (2000 min/mes public repos)
- **Vercel**: ✅ FREE (100 GB bandwidth/mes)
- **Codecov**: ✅ FREE (public repos)

**Total Mensual**: **$0.00** 💰

---

## 🎓 Best Practices Implementadas

✅ **Jobs Modulares** - Fácil debugging
✅ **Caching Inteligente** - Builds rápidos
✅ **Parallel Execution** - Optimización de tiempo
✅ **Continue on Error** - Pipeline resiliente
✅ **Semantic Commits** - Dependabot + changelog
✅ **Quality Gates** - Deploy solo si pasa todo
✅ **Preview Deployments** - Review antes de producción
✅ **Matrix Strategy** - Tests en múltiples versiones Node

---

## 📝 Próximos Pasos

### Opcional - Mejoras Futuras

- [ ] **Lighthouse CI** - Performance monitoring
- [ ] **Sentry Integration** - Error tracking en producción
- [ ] **Slack Notifications** - Alertas de deploy
- [ ] **E2E Tests** - Playwright/Cypress
- [ ] **Docker Builds** - Containerización
- [ ] **Staging Environment** - Ambiente de pre-producción

---

**Última actualización**: Octubre 14, 2025  
**Mantenedor**: DilanSG  
**Status**: ✅ Production Ready
