import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, ArrowLeft, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { reviewService } from '@services/api';

const CreateReview = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [eligibility, setEligibility] = useState(null);
  const [existingReview, setExistingReview] = useState(null);

  useEffect(() => {
    checkEligibility();
  }, [appointmentId]);

  const checkEligibility = async () => {
    try {
      const response = await reviewService.checkEligibility(appointmentId);
      setEligibility(response.data);
      
      // Si ya tiene reseña, cargarla
      if (response.data.hasReview) {
        setExistingReview(response.data.review);
        setRating(response.data.review.rating);
      }
      
      setLoading(false);
    } catch (error) {
      toast.error('Error al verificar elegibilidad');
      navigate('/appointment');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rating === 0) {
      toast.warning('Selecciona una calificación');
      return;
    }

    try {
      setSubmitting(true);
      
      await reviewService.create({
        appointmentId,
        barberId: eligibility.appointment.barber._id || eligibility.appointment.barber,
        rating,
        comment: ''
      });

      toast.success('¡Gracias por tu calificación!');
      navigate('/appointment');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al enviar');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-gray-400">Cargando...</div>
      </div>
    );
  }

  const barberName = eligibility?.appointment?.barber?.user?.name || 
                     eligibility?.appointment?.barber?.name || 
                     'Barbero';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto pt-20">
        {/* Back Button */}
        <button
          onClick={() => navigate('/appointment')}
          className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Volver a mis citas</span>
        </button>

        {/* Card Principal con Glassmorphism */}
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-gray-700/50 p-6">
            <div className="flex items-center gap-3 mb-2">
              {existingReview ? (
                <CheckCircle className="text-green-400" size={32} />
              ) : (
                <Star className="text-yellow-400" size={32} />
              )}
              <h1 className="text-2xl font-bold text-white">
                {existingReview ? 'Tu Reseña' : 'Califica tu Experiencia'}
              </h1>
            </div>
            <p className="text-gray-400">
              Servicio con <span className="text-blue-400 font-medium">{barberName}</span>
            </p>
          </div>

          {/* Contenido */}
          <div className="p-8">
            {existingReview ? (
              // MODO: Ver reseña existente
              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-gray-300 mb-4">Ya has calificado este servicio</p>
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={48}
                        className={
                          star <= rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-600'
                        }
                      />
                    ))}
                  </div>
                  <p className="text-gray-400 mt-4">
                    {rating === 5 && '⭐⭐⭐⭐⭐ ¡Excelente!'}
                    {rating === 4 && '⭐⭐⭐⭐ Muy bueno'}
                    {rating === 3 && '⭐⭐⭐ Bueno'}
                    {rating === 2 && '⭐⭐ Regular'}
                    {rating === 1 && '⭐ Necesita mejorar'}
                  </p>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <p className="text-blue-300 text-sm text-center">
                    Gracias por ayudarnos a mantener la calidad del servicio
                  </p>
                </div>
              </div>
            ) : (
              // MODO: Crear nueva reseña
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="text-center">
                  <p className="text-gray-300 mb-6 text-lg">¿Cómo calificarías tu experiencia?</p>
                  
                  {/* Rating Stars */}
                  <div className="flex justify-center gap-3 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="transition-transform hover:scale-110 focus:outline-none"
                      >
                        <Star
                          size={48}
                          className={
                            star <= (hoverRating || rating)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-600'
                          }
                        />
                      </button>
                    ))}
                  </div>

                  {rating > 0 && (
                    <p className="text-gray-400 text-sm animate-fade-in">
                      {rating === 5 && '⭐⭐⭐⭐⭐ ¡Excelente!'}
                      {rating === 4 && '⭐⭐⭐⭐ Muy bueno'}
                      {rating === 3 && '⭐⭐⭐ Bueno'}
                      {rating === 2 && '⭐⭐ Regular'}
                      {rating === 1 && '⭐ Necesita mejorar'}
                    </p>
                  )}
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <p className="text-blue-300 text-sm text-center">
                    Tu calificación nos ayuda a mantener la calidad del servicio
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting || rating === 0}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-900/50"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      Enviando...
                    </span>
                  ) : (
                    'Enviar Calificación'
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateReview;
