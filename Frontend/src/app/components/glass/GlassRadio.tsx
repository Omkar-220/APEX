import React, { InputHTMLAttributes } from 'react';

interface GlassRadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export const GlassRadio: React.FC<GlassRadioProps> = ({ label, className = '', id, ...props }) => {
  const radioId = id || `glass-radio-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <label htmlFor={radioId} className="relative inline-block cursor-pointer">
        <input type="radio" id={radioId} className="sr-only peer" {...props} />

        <div
          className="
            w-5 h-5
            rounded-full
            backdrop-blur-md
            bg-white/20
            border border-white/30
            transition-all duration-300
            peer-checked:border-indigo-400/50
            peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-500/50 peer-focus-visible:ring-offset-2
            peer-disabled:opacity-50 peer-disabled:cursor-not-allowed
            shadow-md
            flex items-center justify-center
          "
        >
          <div
            className="
              w-2.5 h-2.5
              rounded-full
              bg-gradient-to-br from-indigo-500 to-purple-500
              opacity-0
              scale-0
              transition-all duration-200
              peer-checked:opacity-100 peer-checked:scale-100
              shadow-lg shadow-indigo-500/50
            "
          />
        </div>
      </label>

      {label && (
        <label htmlFor={radioId} className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none">
          {label}
        </label>
      )}
    </div>
  );
};
