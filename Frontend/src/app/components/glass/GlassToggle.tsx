import React, { InputHTMLAttributes } from 'react';

interface GlassToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export const GlassToggle: React.FC<GlassToggleProps> = ({ label, className = '', id, ...props }) => {
  const toggleId = id || `glass-toggle-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <label htmlFor={toggleId} className="relative inline-block w-12 h-6 cursor-pointer">
        <input type="checkbox" id={toggleId} className="sr-only peer" {...props} />

        <div
          className="
            w-full h-full
            rounded-full
            backdrop-blur-md
            bg-white/20
            border border-white/30
            transition-all duration-300
            peer-checked:bg-gradient-to-r peer-checked:from-indigo-500/50 peer-checked:to-purple-500/50
            peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-500/50 peer-focus-visible:ring-offset-2
            peer-disabled:opacity-50 peer-disabled:cursor-not-allowed
            shadow-inner
          "
        />

        <div
          className="
            absolute
            top-0.5 left-0.5
            w-5 h-5
            rounded-full
            backdrop-blur-lg
            bg-white/90
            dark:bg-gray-800/90
            border border-white/50
            shadow-lg
            transition-all duration-300
            peer-checked:translate-x-6
            peer-checked:bg-white
            peer-disabled:opacity-50
          "
        >
          <div className="absolute inset-0.5 rounded-full bg-gradient-to-br from-white/40 to-transparent" />
        </div>
      </label>

      {label && (
        <label htmlFor={toggleId} className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none">
          {label}
        </label>
      )}
    </div>
  );
};
