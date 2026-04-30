import React, { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

interface GlassModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  footer?: ReactNode;
}

const sizeStyles = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export const GlassModal: React.FC<GlassModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  footer,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 glass-backdrop animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className={`
          glass-card
          ${sizeStyles[size]}
          w-full
          rounded-2xl
          animate-in zoom-in-95 duration-200
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 relative z-10">
            <h2 className="text-xl text-gray-900 dark:text-white">{title}</h2>
            <button
              onClick={onClose}
              className="
                p-1.5
                rounded-lg
                hover:bg-white/20
                transition-colors
                text-gray-600 dark:text-gray-400
                hover:text-gray-900 dark:hover:text-white
              "
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        <div className="px-6 py-4 relative z-10 max-h-[70vh] overflow-y-auto">
          {children}
        </div>

        {footer && (
          <div className="px-6 py-4 border-t border-white/10 relative z-10">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
