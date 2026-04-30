import React, { TextareaHTMLAttributes, useState } from 'react';

interface GlassTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const GlassTextarea: React.FC<GlassTextareaProps> = ({
  label,
  error,
  helperText,
  className = '',
  id,
  rows = 4,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(!!props.value || !!props.defaultValue);

  const textareaId = id || `glass-textarea-${Math.random().toString(36).substr(2, 9)}`;

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
        <textarea
          id={textareaId}
          rows={rows}
          className={`
            w-full
            ${label ? 'pt-6 pb-2' : 'py-3'}
            px-4
            bg-transparent
            text-gray-900 dark:text-white
            placeholder-transparent
            outline-none
            relative
            z-10
            resize-none
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
            htmlFor={textareaId}
            className={`
              absolute
              left-4
              transition-all
              duration-200
              pointer-events-none
              text-gray-600 dark:text-gray-400
              ${isFocused || hasValue ? 'top-1.5 text-xs' : 'top-3 text-base'}
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
