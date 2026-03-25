import React from 'react';
import { useThemeStore } from '../../store/themeStore';

export type SeverityType = 'critical' | 'high' | 'medium' | 'low' | 'info';

interface CardProps {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  severity?: SeverityType;
  className?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}

const severityColorMap = {
  critical: 'border-l-red-500 bg-red-500/10',
  high: 'border-l-orange-500 bg-orange-500/10',
  medium: 'border-l-yellow-500 bg-yellow-500/10',
  low: 'border-l-blue-500 bg-blue-500/10',
  info: 'border-l-cyan-500 bg-cyan-500/10',
};

export function Card({
  title,
  subtitle,
  icon,
  severity,
  className = '',
  children,
  action,
}: CardProps) {
  const isDark = useThemeStore((state) => state.isDark);

  return (
    <div
      className={`card-base ${
        isDark
          ? 'bg-navy-800 border-slate-700 hover:border-slate-600'
          : 'bg-white border-gray-200 hover:border-gray-300'
      } p-6 ${severity && severityColorMap[severity]} ${className}`}
    >
      {/* Header */}
      {(title || icon || action) && (
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3">
            {icon && <div className="text-cyan-500 flex-shrink-0">{icon}</div>}
            <div className="flex-1">
              {title && <h3 className="text-lg font-semibold">{title}</h3>}
              {subtitle && (
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{subtitle}</p>
              )}
            </div>
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}

      {/* Content */}
      <div className={title || subtitle ? '' : ''}>{children}</div>
    </div>
  );
}
