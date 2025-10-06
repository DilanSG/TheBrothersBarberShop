import React from 'react';
import { useUI } from '../../utils/UIContext';
import { input, colors, effects } from './styles';

export function Input({
  label,
  error,
  icon,
  className = '',
  containerClassName = '',
  required,
  ...props
}) {
  const { theme } = useUI();

  const baseInputStyles = `
    ${input.base}
    ${error ? 'border-red-500' : ''}
    ${icon ? 'pl-10' : ''}
  `;

  return (
    <div className={`${containerClassName}`}>
      {label && (
        <label className={input.label}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className={input.group.base}>
        <div className={input.group.glow} />
        {icon && (
          <div className={input.icon.wrapper}>
            {React.cloneElement(icon, {
              className: input.icon.base
            })}
          </div>
        )}
        <input
          className={`${baseInputStyles} ${className}`}
          {...props}
        />
      </div>
      {error && (
        <div className="relative group mt-2">
          <div className={`absolute -inset-1 bg-gradient-to-r ${colors.gradient.error} ${effects.blur.glow} opacity-75`}></div>
          <p className={`relative ${colors.text.error} text-sm p-2 rounded-lg border ${colors.border.error} bg-[#2a1515]/80 ${effects.blur.background}`}>
            {error}
          </p>
        </div>
      )}
    </div>
  );
}

export function Select({
  label,
  error,
  options = [],
  placeholder,
  containerClassName = '',
  required,
  ...props
}) {
  return (
    <div className={containerClassName}>
      {label && (
        <label className={input.label}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className={input.group.base}>
        <div className={input.group.glow} />
        <select
          className={input.base}
          {...props}
        >
          {placeholder && (
            <option value="" className="bg-[#151a35]">{placeholder}</option>
          )}
          {options.map(option => (
            <option key={option.value} value={option.value} className="bg-[#151a35]">
              {option.label}
            </option>
          ))}
        </select>
      </div>
      {error && (
        <div className="relative group mt-2">
          <div className={`absolute -inset-1 bg-gradient-to-r ${colors.gradient.error} ${effects.blur.glow} opacity-75`}></div>
          <p className={`relative ${colors.text.error} text-sm p-2 rounded-lg border ${colors.border.error} bg-[#2a1515]/80 ${effects.blur.background}`}>
            {error}
          </p>
        </div>
      )}
    </div>
  );
}

export function Textarea({
  label,
  error,
  containerClassName = '',
  required,
  ...props
}) {
  return (
    <div className={containerClassName}>
      {label && (
        <label className={input.label}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className={input.group.base}>
        <div className={input.group.glow} />
        <textarea
          className={input.base}
          {...props}
        />
      </div>
      {error && (
        <div className="relative group mt-2">
          <div className={`absolute -inset-1 bg-gradient-to-r ${colors.gradient.error} ${effects.blur.glow} opacity-75`}></div>
          <p className={`relative ${colors.text.error} text-sm p-2 rounded-lg border ${colors.border.error} bg-[#2a1515]/80 ${effects.blur.background}`}>
            {error}
          </p>
        </div>
      )}
    </div>
  );
}
