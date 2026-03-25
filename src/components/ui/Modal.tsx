import React from 'react';
import { X } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
};

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  className = '',
  size = 'md',
}: ModalProps) {
  const isDark = useThemeStore((state) => state.isDark);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative ${sizeMap[size]} w-full mx-4 ${
          isDark ? 'bg-navy-800 border-slate-700' : 'bg-white border-gray-200'
        } border rounded-lg shadow-xl z-50 animate-in fade-in zoom-in ${className}`}
      >
        {/* Header */}
        {title && (
          <div
            className={`flex items-center justify-between p-6 ${
              isDark ? 'border-slate-700' : 'border-gray-200'
            } border-b`}
          >
            <h2 className="text-lg font-semibold">{title}</h2>
            <button
              onClick={onClose}
              className={`p-1 rounded-lg transition-colors ${
                isDark ? 'hover:bg-navy-700' : 'hover:bg-gray-100'
              }`}
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-6">{children}</div>

        {/* Footer */}
        {footer && (
          <div
            className={`flex items-center justify-end gap-3 p-6 ${
              isDark ? 'border-slate-700' : 'border-gray-200'
            } border-t`}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
