import React from 'react';
import { useThemeStore } from '../../store/themeStore';

export type BadgeVariant = string;
export type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  className?: string;
}

const variantMap: Record<string, { dark: string; light: string }> = {
  success: {
    dark: 'bg-green-500/20 text-green-400 border-green-500/30',
    light: 'bg-green-100 text-green-800 border-green-300',
  },
  warning: {
    dark: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    light: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  },
  danger: {
    dark: 'bg-red-500/20 text-red-400 border-red-500/30',
    light: 'bg-red-100 text-red-800 border-red-300',
  },
  critical: {
    dark: 'bg-red-500/20 text-red-400 border-red-500/30',
    light: 'bg-red-100 text-red-800 border-red-300',
  },
  high: {
    dark: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    light: 'bg-orange-100 text-orange-800 border-orange-300',
  },
  medium: {
    dark: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    light: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  },
  low: {
    dark: 'bg-green-500/20 text-green-400 border-green-500/30',
    light: 'bg-green-100 text-green-800 border-green-300',
  },
  info: {
    dark: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    light: 'bg-cyan-100 text-cyan-800 border-cyan-300',
  },
  primary: {
    dark: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    light: 'bg-blue-100 text-blue-800 border-blue-300',
  },
  purple: {
    dark: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    light: 'bg-purple-100 text-purple-800 border-purple-300',
  },
  neutral: {
    dark: 'bg-slate-700 text-slate-200 border-slate-600',
    light: 'bg-gray-200 text-gray-800 border-gray-300',
  },
};

const sizeMap: Record<string, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base',
};

const dotVariantMap: Record<string, string> = {
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  danger: 'bg-red-500',
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-green-500',
  info: 'bg-cyan-500',
  primary: 'bg-blue-500',
  purple: 'bg-purple-500',
  neutral: 'bg-slate-500',
};

export function Badge({ children, variant = 'neutral', size = 'md', dot = false, className = '' }: BadgeProps) {
  const isDark = useThemeStore((state) => state.isDark);
  const variantColors = variantMap[variant] || variantMap.neutral;
  const colors = isDark ? variantColors.dark : variantColors.light;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-medium badge-animate ${sizeMap[size]} ${colors} ${className}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotVariantMap[variant] || dotVariantMap.neutral}`} />}
      {children}
    </span>
  );
}
