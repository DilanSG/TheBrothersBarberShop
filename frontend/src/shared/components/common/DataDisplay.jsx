import React from 'react';
import { useUI } from '../../utils/UIContext';
import { colors, effects, layout } from './styles';

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  ...props
}) {
  const { theme } = useUI();

  const variants = {
    default: 'from-gray-600/50 to-gray-700/50 text-gray-200',
    primary: 'from-blue-600/50 to-blue-700/50 text-blue-200',
    success: 'from-green-600/50 to-green-700/50 text-green-200',
    warning: 'from-yellow-600/50 to-yellow-700/50 text-yellow-200',
    danger: 'from-red-600/50 to-red-700/50 text-red-200'
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-sm',
    lg: 'px-3 py-1 text-base'
  };

  return (
    <div className="relative inline-block group">
      <div className={`absolute -inset-1 bg-gradient-to-r ${variants[variant]} ${effects.blur.glow} opacity-75`}></div>
      <span
        className={`
          relative inline-flex items-center font-medium ${layout.rounded.full}
          px-3 py-1 bg-[#151a35]/80 ${effects.blur.background} border border-white/10
          ${sizes[size]}
          ${className}
        `}
        {...props}
      >
        {children}
      </span>
    </div>
  );
}

export function Card({
  children,
  variant = 'default',
  className = '',
  ...props
}) {
  const variants = {
    default: 'from-red-600/20 via-blue-600/20 to-red-600/20',
    primary: 'from-blue-600/20 via-blue-400/20 to-blue-600/20',
    success: 'from-green-600/20 via-green-400/20 to-green-600/20',
    warning: 'from-yellow-600/20 via-yellow-400/20 to-yellow-600/20',
    danger: 'from-red-600/20 via-red-400/20 to-red-600/20'
  };

  return (
    <div className="relative group">
      <div className={`absolute inset-0 bg-gradient-to-r ${variants[variant]} ${layout.rounded.xl} ${effects.blur.glow} transform scale-105`}></div>
      <div
        className={`
          ${layout.container.base}
          ${layout.container.glass}
          ${layout.rounded.xl}
          p-6
          ${className}
        `}
        {...props}
      >
        {children}
      </div>
    </div>
  );
}

export function Avatar({
  src,
  alt,
  size = 'md',
  className = '',
  fallback,
  ...props
}) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const [imageError, setImageError] = React.useState(false);

  const handleError = () => {
    setImageError(true);
  };

  const getFallback = () => {
    if (typeof fallback === 'string') {
      return fallback.slice(0, 2).toUpperCase();
    }
    return 'NA';
  };

  if (imageError || !src) {
    return (
      <div className="relative group inline-block">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-blue-400/20 to-blue-600/20 rounded-full blur-xl transform group-hover:scale-110 transition-transform duration-500"></div>
        <div
          className={`
            relative inline-flex items-center justify-center
            rounded-full bg-[#151a35]/80 backdrop-blur-xl
            border border-blue-500/30 text-blue-300 font-medium
            ${sizes[size]}
            ${className}
          `}
          {...props}
        >
          {getFallback()}
        </div>
      </div>
    );
  }

  return (
    <div className="relative group inline-block">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-blue-400/20 to-blue-600/20 rounded-full blur-xl transform group-hover:scale-110 transition-transform duration-500"></div>
      <img
        src={src}
        alt={alt}
        onError={handleError}
        className={`
          relative rounded-full object-cover border border-blue-500/30
          transform group-hover:scale-105 transition-transform duration-500
          ${sizes[size]}
          ${className}
        `}
        style={{ filter: 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.5))' }}
        {...props}
      />
    </div>
  );
}

export function Spinner({
  size = 'md',
  className = '',
  ...props
}) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className="relative group inline-block">
      <svg
        className={`
          ${effects.animation.spin} text-blue-500
          ${sizes[size]}
          ${className}
        `}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        {...props}
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-blue-300/20 blur-xl animate-pulse"></div>
    </div>
  );
}
