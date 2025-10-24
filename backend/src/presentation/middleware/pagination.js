/**
 * 📄 Pagination Middleware
 * Middleware genérico para paginar respuestas de API
 * 
 * @usage
 * router.get('/api/sales', pagination(), async (req, res) => {
 *   const sales = await Sale.find(query)
 *     .limit(req.pagination.limit)
 *     .skip(req.pagination.skip)
 *     .sort({ date: -1 });
 *   
 *   res.paginated(sales, totalCount);
 * });
 */

import { logger } from '../../shared/utils/logger.js';

// Configuración por defecto
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const MIN_LIMIT = 1;

/**
 * Middleware de paginación
 * 
 * @param {Object} options - Opciones de configuración
 * @param {number} options.defaultLimit - Límite por defecto (default: 20)
 * @param {number} options.maxLimit - Límite máximo permitido (default: 100)
 * @returns {Function} Express middleware
 * 
 * @example
 * // Usar valores por defecto (20 items, max 100)
 * router.get('/users', pagination(), controller.getUsers);
 * 
 * @example
 * // Configuración personalizada
 * router.get('/products', pagination({ defaultLimit: 50, maxLimit: 200 }), controller.getProducts);
 */
export const pagination = (options = {}) => {
  const defaultLimit = options.defaultLimit || DEFAULT_LIMIT;
  const maxLimit = options.maxLimit || MAX_LIMIT;

  return (req, res, next) => {
    try {
      // Parsear parámetros de query
      const page = Math.max(1, parseInt(req.query.page) || 1);
      let limit = parseInt(req.query.limit) || defaultLimit;

      // Validar y ajustar límite
      if (limit < MIN_LIMIT) {
        limit = defaultLimit;
        logger.warn(`Límite inválido (${req.query.limit}), usando default: ${defaultLimit}`);
      }
      
      if (limit > maxLimit) {
        limit = maxLimit;
        logger.warn(`Límite excedido (${req.query.limit}), usando máximo: ${maxLimit}`);
      }

      // Calcular skip
      const skip = (page - 1) * limit;

      // Agregar datos de paginación al request
      req.pagination = {
        page,
        limit,
        skip,
        defaultLimit,
        maxLimit
      };

      // Agregar método helper para respuesta paginada
      res.paginated = (data, total) => {
        const totalPages = Math.ceil(total / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        return res.status(200).json({
          success: true,
          data,
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNextPage,
            hasPrevPage,
            nextPage: hasNextPage ? page + 1 : null,
            prevPage: hasPrevPage ? page - 1 : null
          }
        });
      };

      next();
    } catch (error) {
      logger.error('Error en middleware de paginación:', error);
      next(error);
    }
  };
};

/**
 * Aplicar paginación a una query de Mongoose
 * 
 * @param {Query} query - Query de Mongoose
 * @param {Object} paginationData - Datos de paginación del request
 * @returns {Query} Query modificada con limit y skip
 * 
 * @example
 * const query = Sale.find({ barber: barberId });
 * const paginatedQuery = applyPagination(query, req.pagination);
 * const sales = await paginatedQuery.exec();
 */
export const applyPagination = (query, paginationData) => {
  if (!paginationData) {
    throw new Error('paginationData is required. Use pagination() middleware first.');
  }

  return query
    .limit(paginationData.limit)
    .skip(paginationData.skip);
};

/**
 * Obtener metadatos de paginación sin ejecutar la query
 * 
 * @param {Model} model - Modelo de Mongoose
 * @param {Object} filter - Filtros de búsqueda
 * @param {Object} paginationData - Datos de paginación del request
 * @returns {Promise<Object>} Metadatos de paginación
 * 
 * @example
 * const meta = await getPaginationMeta(Sale, { barber: barberId }, req.pagination);
 * console.log(meta); // { page: 1, limit: 20, total: 150, totalPages: 8, ... }
 */
export const getPaginationMeta = async (model, filter, paginationData) => {
  const total = await model.countDocuments(filter);
  const { page, limit } = paginationData;
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage,
    hasPrevPage,
    nextPage: hasNextPage ? page + 1 : null,
    prevPage: hasPrevPage ? page - 1 : null
  };
};

/**
 * Helper para crear respuesta paginada manual
 * 
 * @param {Array} data - Datos a retornar
 * @param {number} total - Total de documentos
 * @param {Object} paginationData - Datos de paginación del request
 * @returns {Object} Respuesta formateada
 * 
 * @example
 * const response = createPaginatedResponse(sales, totalSales, req.pagination);
 * res.status(200).json(response);
 */
export const createPaginatedResponse = (data, total, paginationData) => {
  const { page, limit } = paginationData;
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage,
      hasPrevPage,
      nextPage: hasNextPage ? page + 1 : null,
      prevPage: hasPrevPage ? page - 1 : null
    }
  };
};

/**
 * Constantes de configuración exportadas
 */
export const PAGINATION_CONFIG = {
  DEFAULT_LIMIT,
  MAX_LIMIT,
  MIN_LIMIT
};

export default pagination;
