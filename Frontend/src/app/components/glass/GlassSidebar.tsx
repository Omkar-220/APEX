import React, { ReactNode } from 'react';

interface GlassSidebarProps {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export const GlassSidebar: React.FC<GlassSidebarProps> = ({ children, header, footer, className = '' }) => {
  return (
    <aside
      className={`
        w-64
        h-screen
        backdrop-blur-2xl
        bg-white/10
        dark:bg-black/10
        border-r border-white/20
        shadow-2xl
        flex flex-col
        ${className}
      `}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

      {header && (
        <div className="p-6 border-b border-white/10 relative z-10">
          {header}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 relative z-10">
        {children}
      </div>

      {footer && (
        <div className="p-6 border-t border-white/10 relative z-10">
          {footer}
        </div>
      )}
    </aside>
  );
};
