import React from 'react';
import { useUI } from '../../utils/UIContext';

export function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer,
  size = 'md',
  closeOnOutsideClick = true,
  showCloseButton = true
}) {
  const { theme } = useUI();

  if (!isOpen) return null;

  const handleOutsideClick = (e) => {
    if (closeOnOutsideClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4'
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
      onClick={handleOutsideClick}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" aria-hidden="true" />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div className={`relative transform rounded-xl bg-white dark:bg-gray-800 text-left shadow-xl transition-all sm:my-8 w-full ${sizes[size]}`}>
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3 sm:px-6">
              <div className="flex items-center justify-between">
                {title && (
                  <h3 className="text-lg font-semibold leading-6 text-gray-900 dark:text-white">
                    {title}
                  </h3>
                )}
                {showCloseButton && (
                  <button
                    type="button"
                    className="rounded-lg p-1 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    onClick={onClose}
                  >
                    <span className="sr-only">Cerrar</span>
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Content */}
          <div className="px-4 py-3 sm:px-6">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 sm:px-6">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
