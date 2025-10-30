import React, { useState } from 'react';
import { useUI } from '../../utils/UIContext';
import { Button } from './Button';

export function Tab({ id, active, children, onClick }) {
  return (
    <button
      role="tab"
      aria-selected={active}
      aria-controls={`${id}-panel`}
      id={`${id}-tab`}
      className={`
        px-4 py-2 text-sm font-medium rounded-lg
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        ${active
          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
          : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
        }
      `}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function TabPanel({ id, active, children }) {
  if (!active) return null;

  return (
    <div
      role="tabpanel"
      id={`${id}-panel`}
      aria-labelledby={`${id}-tab`}
      className="mt-4"
    >
      {children}
    </div>
  );
}

export function Tabs({ children, selectedTab, onChange }) {
  return (
    <div role="tablist" aria-orientation="horizontal" className="flex space-x-2">
      {React.Children.map(children, (child) => {
        if (child.type === Tab) {
          return React.cloneElement(child, {
            active: child.props.id === selectedTab,
            onClick: () => onChange(child.props.id)
          });
        }
        return child;
      })}
    </div>
  );
}

export function Accordion({
  items,
  allowMultiple = false,
  className = '',
  ...props
}) {
  const [openItems, setOpenItems] = useState(new Set());

  const toggleItem = (id) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (!allowMultiple) {
          next.clear();
        }
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className={`space-y-2 ${className}`} {...props}>
      {items.map((item) => (
        <div
          key={item.id}
          className="border border-gray-200 dark:border-gray-700 rounded-lg"
        >
          <button
            className="w-full px-4 py-3 flex justify-between items-center text-left"
            onClick={() => toggleItem(item.id)}
            aria-expanded={openItems.has(item.id)}
          >
            <span className="font-medium text-gray-900 dark:text-white">
              {item.title}
            </span>
            <svg
              className={`w-5 h-5 transform transition-transform ${
                openItems.has(item.id) ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          {openItems.has(item.id) && (
            <div className="px-4 pb-3 pt-0">
              {item.content}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function Dialog({
  open,
  onClose,
  title,
  children,
  actions,
  size = 'md',
  className = '',
  ...props
}) {
  const { theme } = useUI();
  
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4'
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 dark:bg-opacity-90 transition-opacity" />
        
        <div
          className={`
            relative bg-white dark:bg-gray-800 rounded-lg shadow-xl
            w-full ${sizes[size]} p-6
            transform transition-all
            ${className}
          `}
          onClick={e => e.stopPropagation()}
          {...props}
        >
          {title && (
            <h3
              className="text-lg font-medium text-gray-900 dark:text-white mb-4"
              id="modal-title"
            >
              {title}
            </h3>
          )}

          <div className="mt-2">{children}</div>

          {actions && (
            <div className="mt-6 flex justify-end space-x-3">
              {actions}
            </div>
          )}

          <button
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            onClick={onClose}
          >
            <span className="sr-only">Close</span>
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
