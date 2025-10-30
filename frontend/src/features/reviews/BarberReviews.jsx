import { useState, useEffect } from 'react';
import { Star, TrendingUp } from 'lucide-react';
import ReviewCard from './ReviewCard';
import { reviewService } from '@services/api';
import { logger } from '@utils/logger';
import { toast } from 'react-toastify';

const BarberReviews = ({ barberId }) => {
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });

  useEffect(() => {
    if (barberId) {
      loadReviews();
      loadStats();
    }
  }, [barberId, pagination.page]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const response = await reviewService.getBarberReviews(barberId, {
        page: pagination.page,
        limit: 10,
        status: 'approved'
      });

      setReviews(response.data || []);
      if (response.pagination) {
        setPagination(response.pagination);
      }
      
      logger.info(`✅ Reviews cargadas: ${response.data?.length || 0}`);
    } catch (error) {
      logger.error('❌ Error cargando reviews:', error);
      toast.error('Error al cargar las reseñas');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await reviewService.getBarberStats(barberId);
      setStats(response.data || null);
      logger.info('✅ Stats de reviews cargadas', response.data);
    } catch (error) {
      logger.error('❌ Error cargando stats:', error);
    }
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <Star
        key={index}
        size={20}
        className={`${
          index < Math.floor(rating)
            ? 'fill-yellow-400 text-yellow-400'
            : 'text-gray-600'
        }`}
      />
    ));
  };

  if (loading && pagination.page === 1) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-400">Cargando reseñas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Card */}
      {stats && stats.count > 0 && (
        <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white text-2xl font-bold mb-2">
                Calificación general
              </h3>
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  {renderStars(stats.averageRating)}
                </div>
                <span className="text-2xl font-bold text-yellow-400">
                  {stats.averageRating.toFixed(1)}
                </span>
                <span className="text-gray-400">
                  ({stats.count} {stats.count === 1 ? 'reseña' : 'reseñas'})
                </span>
              </div>
            </div>
            <div className="text-center">
              <TrendingUp size={48} className="text-yellow-400 mb-2" />
              <p className="text-gray-400 text-sm">Excelente servicio</p>
            </div>
          </div>

          {/* Rating Distribution */}
          {stats.distribution && (
            <div className="mt-6 space-y-2">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = stats.distribution[stars] || 0;
                const percentage = stats.count > 0 ? (count / stats.count) * 100 : 0;
                
                return (
                  <div key={stars} className="flex items-center gap-3">
                    <span className="text-white text-sm w-16">
                      {stars} {stars === 1 ? 'estrella' : 'estrellas'}
                    </span>
                    <div className="flex-1 bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-gray-400 text-sm w-12 text-right">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
          <Star size={48} className="text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">
            Aún no hay reseñas para este barbero
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {reviews.map((review) => (
              <ReviewCard key={review._id} review={review} />
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page === 1}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <span className="px-4 py-2 text-white">
                Página {pagination.page} de {pagination.pages}
              </span>
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={pagination.page === pagination.pages}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BarberReviews;
