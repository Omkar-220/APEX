import React, { ReactNode, useState } from 'react';

interface GlassTooltipProps {
  content: string;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const positionStyles = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
};

export const GlassTooltip: React.FC<GlassTooltipProps> = ({ content, children, position = 'top' }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
      >
        {children}
      </div>

      {isVisible && (
        <div
          className={`
            absolute
            ${positionStyles[position]}
            z-50
            px-3 py-2
            rounded-lg
            backdrop-blur-xl
            bg-gray-900/80
            dark:bg-black/80
            border border-white/20
            shadow-xl
            text-sm text-white
            whitespace-nowrap
            pointer-events-none
            animate-in fade-in duration-200
          `}
        >
          <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
          <span className="relative z-10">{content}</span>
        </div>
      )}
    </div>
  );
};
