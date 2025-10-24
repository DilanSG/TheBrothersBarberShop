import React from 'react';
import { Star, User } from 'lucide-react';
import { formatDistance } from 'date-fns';
import { es } from 'date-fns/locale';

const ReviewCard = ({ review }) => {
  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <Star
        key={index}
        size={16}
        className={`${
          index < rating
            ? 'fill-yellow-400 text-yellow-400'
            : 'text-gray-600'
        }`}
      />
    ));
  };

  const formatDate = (date) => {
    return formatDistance(new Date(date), new Date(), {
      addSuffix: true,
      locale: es
    });
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors">
      {/* Header con usuario y rating */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            {review.user?.name ? (
              <span className="text-white font-semibold text-sm">
                {review.user.name.charAt(0).toUpperCase()}
              </span>
            ) : (
              <User size={20} className="text-white" />
            )}
          </div>
          <div>
            <p className="text-white font-semibold">
              {review.user?.name || 'Usuario'}
            </p>
            <p className="text-gray-400 text-sm">
              {formatDate(review.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex gap-1">
          {renderStars(review.rating)}
        </div>
      </div>

      {/* Comentario */}
      {review.comment && (
        <p className="text-gray-300 leading-relaxed">
          {review.comment}
        </p>
      )}
    </div>
  );
};

export default ReviewCard;
