import React, { InputHTMLAttributes, useState } from 'react';

interface GlassInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export const GlassInput: React.FC<GlassInputProps> = ({
  label,
  error,
  helperText,
  icon,
  className = '',
  id,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(!!props.value || !!props.defaultValue);

  const inputId = id || `glass-input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`w-full ${className}`}>
      <div
        className={`
          glass-input
          relative
          rounded-xl
          transition-all duration-300
          ${error ? 'border-red-500/50' : ''}
        `}
      >
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 z-10">
            {icon}
          </div>
        )}

        <input
          id={inputId}
          className={`
            w-full
            ${icon ? 'pl-12' : 'pl-4'}
            ${label ? 'pt-6 pb-2' : 'py-3'}
            pr-4
            bg-transparent
            text-gray-900 dark:text-white
            placeholder-transparent
            outline-none
            relative
            z-10
          `}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          onChange={(e) => {
            setHasValue(!!e.target.value);
            props.onChange?.(e);
          }}
          placeholder={label || props.placeholder}
          {...props}
        />

        {label && (
          <label
            htmlFor={inputId}
            className={`
              absolute
              ${icon ? 'left-12' : 'left-4'}
              transition-all
              duration-200
              pointer-events-none
              text-gray-600 dark:text-gray-400
              ${isFocused || hasValue ? 'top-1.5 text-xs' : 'top-1/2 -translate-y-1/2 text-base'}
            `}
          >
            {label}
          </label>
        )}
      </div>

      {(error || helperText) && (
        <p className={`mt-1.5 text-sm px-1 ${error ? 'text-red-500 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
};
