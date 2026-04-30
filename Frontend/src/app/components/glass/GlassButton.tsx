import React, { ButtonHTMLAttributes, ReactNode } from 'react';

export type GlassButtonVariant = 'primary' | 'secondary' | 'ghost' | 'success' | 'danger';
export type GlassButtonSize = 'sm' | 'md' | 'lg';

interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: GlassButtonVariant;
  size?: GlassButtonSize;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  children: ReactNode;
}

const variantStyles: Record<GlassButtonVariant, string> = {
  primary: 'bg-gradient-to-br from-indigo-500/35 to-purple-600/25 text-white shadow-lg shadow-indigo-500/20',
  secondary: 'bg-white/15 text-gray-900 dark:text-white shadow-md',
  ghost: 'bg-white/5 text-gray-700 dark:text-gray-300 border-white/10',
  success: 'bg-gradient-to-br from-green-500/35 to-emerald-600/25 text-white shadow-lg shadow-green-500/20',
  danger: 'bg-gradient-to-br from-red-500/35 to-rose-600/25 text-white shadow-lg shadow-red-500/20',
};

const sizeStyles: Record<GlassButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-base',
  lg: 'px-6 py-3.5 text-lg',
};

export const GlassButton: React.FC<GlassButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  fullWidth = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  return (
    <button
      className={`
        glass-button
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${fullWidth ? 'w-full' : ''}
        rounded-xl
        font-medium
        inline-flex items-center justify-center gap-2
        ${className}
      `}
      disabled={disabled}
      {...props}
    >
      {icon && iconPosition === 'left' && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
      {icon && iconPosition === 'right' && <span className="flex-shrink-0">{icon}</span>}
    </button>
  );
};
