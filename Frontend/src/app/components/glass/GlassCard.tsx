import React, { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

const paddingStyles = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  header,
  footer,
  className = '',
  padding = 'md',
  hover = false,
}) => {
  return (
    <div
      className={`
        glass-card
        rounded-2xl
        ${hover ? 'transition-transform duration-300 hover:scale-[1.02] hover:shadow-2xl' : ''}
        ${className}
      `}
    >
      {header && (
        <div className="px-6 py-4 border-b border-white/10 relative z-10">
          {header}
        </div>
      )}

      <div className={`relative z-10 ${paddingStyles[padding]}`}>
        {children}
      </div>

      {footer && (
        <div className="px-6 py-4 border-t border-white/10 relative z-10">
          {footer}
        </div>
      )}
    </div>
  );
};
