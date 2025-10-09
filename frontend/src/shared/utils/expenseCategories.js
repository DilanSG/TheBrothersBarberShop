/**
 * Sistema de categorías de gastos optimizado para el frontend
 * - 5 categorías estáticas obligatorias sin emojis
 * - Categorías dinámicas desde API
 * - Sistema limpio y optimizado
 */

/**
 * Categorías estáticas del sistema (nunca cambian)
 */
export const STATIC_EXPENSE_CATEGORIES = [
  {
    value: 'arriendo',
    label: 'Arriendo',
    isStatic: true,
    description: 'Arriendo del local comercial'
  },
  {
    value: 'nomina',
    label: 'Nómina',
    isStatic: true,
    description: 'Salarios y pagos a empleados'
  },
  {
    value: 'insumos',
    label: 'Insumos',
    isStatic: true,
    description: 'Productos y materiales para servicios'
  },
  {
    value: 'servicios',
    label: 'Servicios',
    isStatic: true,
    description: 'Servicios públicos y externos'
  },
  {
    value: 'equipos',
    label: 'Equipos',
    isStatic: true,
    description: 'Herramientas y equipos de trabajo'
  }
];

/**
 * Obtener etiqueta de una categoría (estática o dinámica)
 * @param {string} categoryValue - Valor de la categoría
 * @returns {string} Etiqueta de la categoría
 */
export const getCategoryLabel = (categoryValue) => {
  if (!categoryValue || typeof categoryValue !== 'string') {
    return 'Sin Categoría';
  }
  
  // Buscar en categorías estáticas primero
  const staticCategory = STATIC_EXPENSE_CATEGORIES.find(cat => cat.value === categoryValue);
  if (staticCategory) {
    return staticCategory.label;
  }
  
  // Para categorías dinámicas, capitalizar primera letra
  return categoryValue.charAt(0).toUpperCase() + categoryValue.slice(1);
};

/**
 * Verificar si una categoría es estática
 * @param {string} categoryValue - Valor de la categoría
 * @returns {boolean} True si es estática
 */
export const isStaticCategory = (categoryValue) => {
  return STATIC_EXPENSE_CATEGORIES.some(cat => cat.value === categoryValue);
};

/**
 * Obtener todas las categorías estáticas formateadas
 * @returns {Array} Array de categorías estáticas
 */
export const getStaticCategories = () => {
  return STATIC_EXPENSE_CATEGORIES.map(cat => ({
    value: cat.value,
    label: cat.label,
    isStatic: true,
    total: 0,
    count: 0
  }));
};

/**
 * Procesar categorías desde la API y combinar con estáticas
 * @param {Array} apiCategories - Categorías desde la API
 * @returns {Array} Array combinado de categorías
 */
export const processApiCategories = (apiCategories = []) => {
  const staticCategories = getStaticCategories();
  
  // Procesar categorías de la API
  const processedApiCategories = apiCategories
    .filter(cat => cat && cat.category) // Filtrar categorías válidas
    .map(cat => ({
      value: cat.category || cat.value,
      label: cat.label || getCategoryLabel(cat.category || cat.value),
      isStatic: isStaticCategory(cat.category || cat.value),
      total: cat.total || 0,
      count: cat.count || 0
    }));
  
  // Combinar y eliminar duplicados (priorizar datos de API)
  const combinedCategories = [...staticCategories];
  
  processedApiCategories.forEach(apiCat => {
    const existingIndex = combinedCategories.findIndex(cat => cat.value === apiCat.value);
    if (existingIndex >= 0) {
      // Actualizar categoría existente con datos de API
      combinedCategories[existingIndex] = {
        ...combinedCategories[existingIndex],
        total: apiCat.total,
        count: apiCat.count
      };
    } else {
      // Agregar nueva categoría dinámica
      combinedCategories.push(apiCat);
    }
  });
  
  return combinedCategories;
};

/**
 * Obtener categorías fallback cuando la API falla
 * @returns {Array} Array de categorías estáticas
 */
export const getFallbackCategories = () => {
  return getStaticCategories();
};