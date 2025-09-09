# Copilot Design System Instructions for The Brothers Barber Shop

## Paleta de Colores Estricta (Solo Rojo, Blanco, Azul)

### Colores Principales
- **Rojo:** `#DC2626` (red-600), `#EF4444` (red-500), `#F87171` (red-400)
- **Blanco:** `#FFFFFF`, `#F9FAFB` (gray-50)
- **Azul:** `#2563EB` (blue-600), `#3B82F6` (blue-500), `#60A5FA` (blue-400)

### Colores de Soporte (Solo para fondos y estructura)
- **Negro/Gris Oscuro:** `#111827` (gray-900), `#1F2937` (gray-800) - Solo para fondos oscuros
- **Gris Transparente:** `gray-800/50`, `gray-700/50` - Solo para elementos con backdrop-blur

### Gradientes Oficiales
- **Principal:** `from-red-600 to-blue-600`
- **Invertido:** `from-blue-600 to-red-600` 
- **Sutil:** `from-blue-600 to-purple-600` (purple solo en gradientes)
- **Fondo:** `bg-gradient-to-br from-gray-900 via-blue-900/20 to-red-900/20`

## Fondos de Página (Patrón Oficial)

### Fondo Principal para Todas las Páginas
```jsx
// Fondo base usado en Home, Barbers, Inventory
<div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-red-900/20">
  <div className="absolute inset-0 bg-black/20"></div>
  <div className="relative z-10">
    {/* Contenido de la página */}
  </div>
</div>
```

### Container Principal
```jsx
// Contenedor usado en todas las páginas principales
<div className="container mx-auto px-6 py-8">
  {/* Contenido */}
</div>
```

## Componentes Base

### Botones
```jsx
// Botón Principal (Gradiente)
<button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500/50">
  <Icon className="h-5 w-5" />
  Texto del Botón
</button>

// Botón Secundario (Transparente)
<button className="px-6 py-3 bg-gray-800/50 hover:bg-gray-700/50 text-white border border-gray-700/50 rounded-lg font-medium transition-all duration-200 backdrop-blur-sm">
  Texto del Botón
</button>

// Botón de Peligro
<button className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all duration-200">
  Eliminar
</button>
```

### Cards (Patrón Oficial)
```jsx
// Card Principal con backdrop-blur (Usado en Barbers, Inventory)
<div className="bg-gray-800/50 backdrop-blur-md border border-gray-700/50 rounded-xl p-6 shadow-xl">
  <h3 className="text-lg font-semibold text-white mb-4">Título</h3>
  {/* Contenido */}
</div>

// Card de Estadística (Home)
<div className="bg-gradient-to-br from-blue-600/20 to-red-600/20 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
  <div className="flex items-center justify-between">
    <div>
      <h3 className="text-lg font-semibold text-white">Título</h3>
      <p className="text-3xl font-bold text-white">Número</p>
    </div>
    <div className="p-3 bg-blue-600/20 rounded-lg">
      <Icon className="h-8 w-8 text-blue-400" />
    </div>
  </div>
</div>
```

### Inputs y Forms
```jsx
// Input Estándar (con backdrop-blur)
<input 
  type="text"
  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm"
  placeholder="Placeholder"
/>

// Input con Icono
<div className="relative">
  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
  <input
    type="text"
    className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm"
    placeholder="Buscar..."
  />
</div>
```

### Badges/Etiquetas (Solo Colores Permitidos)
```jsx
// Estado Disponible (Azul)
<span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-600/20 text-blue-400 border border-blue-500/30">
  Disponible
</span>

// Estado Ocupado (Rojo)
<span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-600/20 text-red-400 border border-red-500/30">
  Ocupado
</span>

// Estado Activo (Blanco)
<span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/20 text-white border border-white/30">
  Activo
</span>
```

### Modales y Overlays
```jsx
// Modal con backdrop-blur
<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
  <div 
    className="absolute inset-0 bg-black/70 backdrop-blur-sm"
    onClick={() => setShowModal(false)}
  ></div>
  <div className="relative bg-gray-800/90 backdrop-blur-md border border-gray-700/50 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
    <h3 className="text-xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
      Título del Modal
    </h3>
    {/* Contenido */}
  </div>
</div>
```

## Tipografía

### Títulos con Gradiente (Patrón Oficial)
```jsx
// H1 Principal con Gradiente
<h1 className="text-4xl md:text-6xl font-bold mb-8 bg-gradient-to-r from-red-400 via-blue-400 to-red-400 bg-clip-text text-transparent text-center">
  The Brothers Barber Shop
</h1>

// H2 Sección con Gradiente
<h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-red-400 bg-clip-text text-transparent">
  Título de Sección
</h2>

// H3 Card con Gradiente
<h3 className="text-xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
  Subtítulo
</h3>
```

### Texto Estándar
```jsx
// Texto Principal
<p className="text-white leading-relaxed">
  Texto principal del contenido.
</p>

// Texto Secundario
<p className="text-gray-300 text-sm">
  Texto secundario o descripción.
</p>

// Texto de Descripción
<p className="text-gray-400 leading-relaxed">
  Descripción detallada.
</p>
```

## Iconografía

### Librería y Tamaños
- **Librería:** `lucide-react` exclusivamente
- **Tamaños:** `h-4 w-4`, `h-5 w-5`, `h-6 w-6`, `h-8 w-8`
- **Colores:** Solo azul (`text-blue-400`), rojo (`text-red-400`), blanco (`text-white`)

### Iconos Oficiales del Sistema
```jsx
import { 
  User, 
  Calendar, 
  Scissors, 
  Package, 
  DollarSign,
  Clock,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Save,
  Camera,
  ArrowLeft,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
```

## Navegación y Layout

### Tabs (Patrón de UserProfileEdit)
```jsx
// Tab Container
<div className="flex space-x-1 bg-gray-800/50 p-1 rounded-lg mb-6 backdrop-blur-sm">
  {tabs.map((tab) => (
    <button
      key={tab.id}
      onClick={() => setActiveTab(tab.id)}
      className={`flex-1 py-3 px-4 rounded-md font-medium transition-all duration-200 ${
        activeTab === tab.id
          ? 'bg-blue-600 text-white shadow-lg'
          : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
      }`}
    >
      <tab.icon className="h-5 w-5 mx-auto mb-1" />
      {tab.label}
    </button>
  ))}
</div>
```

### Secciones de Contenido
```jsx
// Sección con Título y Descripción
<div className="mb-8">
  <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-red-400 bg-clip-text text-transparent">
    Título de Sección
  </h2>
  <p className="text-gray-400">
    Descripción de la sección
  </p>
</div>
```

## Estados y Feedback

### Loading States
```jsx
// Spinner con gradiente
<div className="flex items-center justify-center py-12">
  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
</div>

// Skeleton Card
<div className="bg-gray-800/50 backdrop-blur-md border border-gray-700/50 rounded-xl p-6 animate-pulse">
  <div className="h-4 bg-gray-700 rounded w-3/4 mb-4"></div>
  <div className="h-3 bg-gray-700 rounded w-1/2"></div>
</div>
```

### Alertas (Solo Colores Permitidos)
```jsx
// Éxito (Azul - no verde)
<div className="bg-blue-600/20 border border-blue-500/30 text-blue-400 px-4 py-3 rounded-lg backdrop-blur-sm">
  Operación exitosa
</div>

// Error (Rojo)
<div className="bg-red-600/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg backdrop-blur-sm">
  Error en la operación
</div>

// Información (Blanco)
<div className="bg-white/10 border border-white/30 text-white px-4 py-3 rounded-lg backdrop-blur-sm">
  Información importante
</div>
```

## Responsive Design

### Grid Patterns
```jsx
// Grid de Cards (Barbers, Inventory)
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

// Grid de Estadísticas (Home)
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

// Layout de Formulario
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
```

## Animaciones y Transiciones

### Transiciones Estándar
- **Duración:** `transition-all duration-200`
- **Hover:** `hover:scale-105` para botones, `hover:bg-gray-700/50` para elementos interactivos
- **Focus:** `focus:outline-none focus:ring-2 focus:ring-blue-500/50`

### Efectos Visuales
```jsx
// Backdrop Blur (Usado en todos los elementos)
className="backdrop-blur-sm" // Para elementos sutiles
className="backdrop-blur-md" // Para cards y modales

// Sombras
className="shadow-xl" // Para cards principales
className="shadow-lg" // Para botones activos
```

## Reglas Estrictas

### ❌ Colores PROHIBIDOS
- Verde (green) - Usar azul para éxito
- Amarillo (yellow) - Usar blanco para advertencias  
- Púrpura (purple) - Solo en gradientes combinado con azul
- Cualquier otro color no especificado

### ✅ Colores PERMITIDOS
- Rojo: `red-400`, `red-500`, `red-600`, `red-700`
- Azul: `blue-400`, `blue-500`, `blue-600`, `blue-700`
- Blanco: `white`, `gray-50`
- Gris: Solo para fondos (`gray-800`, `gray-900`) y transparencias

### Patrón de Consistencia
1. **Todos los fondos de página** deben usar el gradiente oficial
2. **Todos los cards** deben tener `backdrop-blur-md` y bordes semi-transparentes
3. **Todos los títulos importantes** deben usar gradientes de texto
4. **Todos los botones principales** deben usar gradientes azul-púrpura
5. **Todos los inputs** deben tener `backdrop-blur-sm`

### Implementación
- Usar `backdrop-blur-sm` o `backdrop-blur-md` en TODOS los elementos sobre el fondo
- Usar transparencias (`/50`, `/20`) para crear profundidad
- Mantener consistencia en espaciado (`gap-6`, `p-6`, `mb-6`)
- Aplicar `transition-all duration-200` a elementos interactivos
