/**
 * Sistema de categorías de gastos optimizado
 * - 5 categorías estáticas obligatorias
 * - Categorías dinámicas desde archivo JSON (sin las estáticas)
 * - Sin emojis para mejor compatibilidad
 */

/**
 * Categorías estáticas del sistema (nunca cambian)
 * Estas son las categorías principales de cualquier barbería
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
 * Obtener todas las categorías estáticas
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
 * Obtener etiqueta de una categoría estática
 * @param {string} categoryValue - Valor de la categoría
 * @returns {string} Etiqueta de la categoría
 */
export const getStaticCategoryLabel = (categoryValue) => {
  const category = STATIC_EXPENSE_CATEGORIES.find(cat => cat.value === categoryValue);
  return category ? category.label : categoryValue;
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
 * Obtener todas las categorías disponibles (estáticas + dinámicas)
 * @param {Array} dynamicCategories - Categorías dinámicas del JSON
 * @returns {Array} Array combinado de categorías
 */
export const getAllCategories = (dynamicCategories = []) => {
  const staticCategories = getStaticCategories();
  
  // Filtrar categorías dinámicas que no sean estáticas
  const filteredDynamicCategories = dynamicCategories
    .filter(cat => !isStaticCategory(cat))
    .map(cat => ({
      value: cat,
      label: cat.charAt(0).toUpperCase() + cat.slice(1),
      isStatic: false,
      total: 0,
      count: 0
    }));

  return [...staticCategories, ...filteredDynamicCategories];
};

/**
 * Normalizar una categoría para uso consistente
 * @param {string} categoryValue - Valor de la categoría
 * @returns {Object} Objeto de categoría normalizado
 */
export const normalizeCategory = (categoryValue) => {
  if (isStaticCategory(categoryValue)) {
    const staticCat = STATIC_EXPENSE_CATEGORIES.find(cat => cat.value === categoryValue);
    return {
      value: staticCat.value,
      label: staticCat.label,
      isStatic: true
    };
  }

  return {
    value: categoryValue,
    label: categoryValue.charAt(0).toUpperCase() + categoryValue.slice(1),
    isStatic: false
  };
};