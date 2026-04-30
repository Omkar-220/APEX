import React, { ReactNode } from 'react';

export type GlassBadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger';

interface GlassBadgeProps {
  children: ReactNode;
  variant?: GlassBadgeVariant;
  className?: string;
}

const variantStyles: Record<GlassBadgeVariant, string> = {
  default: 'bg-white/25 text-gray-700 dark:text-gray-300 border-white/30',
  primary: 'bg-indigo-500/30 text-indigo-100 border-indigo-400/40 shadow-indigo-500/20',
  success: 'bg-green-500/30 text-green-100 border-green-400/40 shadow-green-500/20',
  warning: 'bg-amber-500/30 text-amber-100 border-amber-400/40 shadow-amber-500/20',
  danger: 'bg-red-500/30 text-red-100 border-red-400/40 shadow-red-500/20',
};

export const GlassBadge: React.FC<GlassBadgeProps> = ({ children, variant = 'default', className = '' }) => {
  return (
    <span
      className={`
        inline-flex items-center
        px-2.5 py-1
        rounded-full
        text-xs font-medium
        backdrop-blur-md
        border
        shadow-sm
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
};
