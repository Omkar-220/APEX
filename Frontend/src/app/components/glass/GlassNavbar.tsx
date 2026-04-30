import React, { ReactNode } from 'react';

interface GlassNavbarProps {
  logo?: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export const GlassNavbar: React.FC<GlassNavbarProps> = ({ logo, children, actions, className = '' }) => {
  return (
    <nav
      className={`
        sticky top-0 z-40
        backdrop-blur-2xl
        bg-white/10
        dark:bg-black/10
        border-b border-white/20
        shadow-lg
        ${className}
      `}
    >
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-8 relative z-10">
            {logo && <div className="flex-shrink-0">{logo}</div>}

            {children && (
              <div className="flex-1 flex items-center justify-center gap-6">
                {children}
              </div>
            )}

            {actions && <div className="flex items-center gap-4">{actions}</div>}
          </div>
        </div>
      </div>
    </nav>
  );
};
