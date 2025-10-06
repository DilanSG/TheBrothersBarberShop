import React from 'react';
import { useUI } from '../../utils/UIContext';

export function Alert({
  children,
  variant = 'info',
  icon,
  onClose,
  className = '',
  ...props
}) {
  const variants = {
    info: 'bg-blue-50 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    success: 'bg-green-50 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    warning: 'bg-yellow-50 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    error: 'bg-red-50 text-red-800 dark:bg-red-900/50 dark:text-red-300'
  };

  return (
    <div
      className={`
        p-4 rounded-lg relative flex items-start
        ${variants[variant]}
        ${className}
      `}
      role="alert"
      {...props}
    >
      {icon && <span className="mr-3 flex-shrink-0">{icon}</span>}
      <div className="flex-1">{children}</div>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-3 flex-shrink-0 opacity-75 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2"
          aria-label="Close alert"
        >
          <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

export function Toast({
  message,
  variant = 'default',
  duration = 5000,
  onClose
}) {
  const { removeToast } = useUI();
  
  React.useEffect(() => {
    if (duration && duration > 0) {
      const timer = setTimeout(() => {
        onClose?.();
        removeToast();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose, removeToast]);

  const variants = {
    default: 'bg-gray-800 text-white',
    success: 'bg-green-600 text-white',
    error: 'bg-red-600 text-white',
    warning: 'bg-yellow-500 text-white'
  };

  return (
    <div
      className={`
        rounded-lg shadow-lg p-4 max-w-sm w-full
        transform transition-all duration-300 ease-in-out
        ${variants[variant]}
      `}
      role="alert"
    >
      <div className="flex items-start">
        <div className="flex-1">{message}</div>
        {onClose && (
          <button
            onClick={() => {
              onClose?.();
              removeToast();
            }}
            className="ml-3 flex-shrink-0 opacity-75 hover:opacity-100 focus:outline-none"
            aria-label="Close toast"
          >
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

export function Progress({
  value,
  max = 100,
  size = 'md',
  variant = 'default',
  label,
  showValue = false,
  className = '',
  ...props
}) {
  const percentage = Math.round((value / max) * 100);

  const sizes = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-4'
  };

  const variants = {
    default: 'bg-blue-600 dark:bg-blue-500',
    success: 'bg-green-600 dark:bg-green-500',
    warning: 'bg-yellow-500 dark:bg-yellow-400',
    error: 'bg-red-600 dark:bg-red-500'
  };

  return (
    <div className={className}>
      {(label || showValue) && (
        <div className="flex justify-between mb-1">
          {label && (
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {label}
            </span>
          )}
          {showValue && (
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {percentage}%
            </span>
          )}
        </div>
      )}
      <div
        className={`
          w-full bg-gray-200 rounded-full dark:bg-gray-700
          ${sizes[size]}
        `}
      >
        <div
          className={`
            rounded-full transition-all duration-300
            ${variants[variant]}
            ${sizes[size]}
          `}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          {...props}
        />
      </div>
    </div>
  );
}
