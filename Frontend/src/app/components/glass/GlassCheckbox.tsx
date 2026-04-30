import React, { InputHTMLAttributes } from 'react';
import { Check } from 'lucide-react';

interface GlassCheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export const GlassCheckbox: React.FC<GlassCheckboxProps> = ({ label, className = '', id, ...props }) => {
  const checkboxId = id || `glass-checkbox-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <label htmlFor={checkboxId} className="relative inline-block cursor-pointer">
        <input type="checkbox" id={checkboxId} className="sr-only peer" {...props} />

        <div
          className="
            w-5 h-5
            rounded-lg
            backdrop-blur-md
            bg-white/20
            border border-white/30
            transition-all duration-300
            peer-checked:bg-gradient-to-br peer-checked:from-indigo-500/60 peer-checked:to-purple-500/60
            peer-checked:border-indigo-400/50
            peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-500/50 peer-focus-visible:ring-offset-2
            peer-disabled:opacity-50 peer-disabled:cursor-not-allowed
            shadow-md
            flex items-center justify-center
          "
        >
          <Check
            className="
              w-3.5 h-3.5
              text-white
              opacity-0
              scale-0
              transition-all duration-200
              peer-checked:opacity-100 peer-checked:scale-100
            "
            strokeWidth={3}
          />
        </div>
      </label>

      {label && (
        <label htmlFor={checkboxId} className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none">
          {label}
        </label>
      )}
    </div>
  );
};
