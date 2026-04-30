import React, { SelectHTMLAttributes, useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface GlassSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: { value: string; label: string }[];
}

export const GlassSelect: React.FC<GlassSelectProps> = ({
  label,
  error,
  helperText,
  options,
  className = '',
  id,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(!!props.value || !!props.defaultValue);

  const selectId = id || `glass-select-${Math.random().toString(36).substr(2, 9)}`;

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
        <select
          id={selectId}
          className={`
            w-full
            ${label ? 'pt-6 pb-2' : 'py-3'}
            pl-4
            pr-10
            bg-transparent
            text-gray-900 dark:text-white
            outline-none
            relative
            z-10
            appearance-none
            cursor-pointer
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
          {...props}
        >
          <option value="" disabled hidden>
            {label || 'Select...'}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value} className="bg-gray-800 text-white">
              {option.label}
            </option>
          ))}
        </select>

        {label && (
          <label
            htmlFor={selectId}
            className={`
              absolute
              left-4
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

        <ChevronDown
          className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 pointer-events-none z-10"
        />
      </div>

      {(error || helperText) && (
        <p className={`mt-1.5 text-sm px-1 ${error ? 'text-red-500 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
};
