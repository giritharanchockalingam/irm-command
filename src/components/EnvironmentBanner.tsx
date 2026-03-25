/**
 * CISO-009 REMEDIATION: Environment Banner Component
 * Displays a clear visual indicator when NOT in production.
 * Helps prevent confusion between demo/staging and production environments.
 * Hidden in production for clean user experience.
 */

import { getConfig } from '../config';

export default function EnvironmentBanner() {
  const config = getConfig();
  const env = config.app.environment;

  // Never show banner in production
  if (env === 'production') return null;

  const bannerConfig: Record<string, { bg: string; label: string; message: string }> = {
    development: {
      bg: 'bg-blue-900 border-blue-700',
      label: 'DEVELOPMENT',
      message: 'Local development environment — demo data only',
    },
    staging: {
      bg: 'bg-yellow-900 border-yellow-700',
      label: 'STAGING',
      message: 'Staging environment — do not use real customer data',
    },
    prototype: {
      bg: 'bg-orange-900 border-orange-700',
      label: 'PROTOTYPE',
      message: 'Prototype environment — not for production use. Demo auth is active.',
    },
  };

  const current = bannerConfig[env] || bannerConfig.prototype;

  return (
    <div
      className={`${current.bg} border-b px-4 py-1.5 text-center text-xs font-semibold text-white z-50`}
      role="alert"
      aria-label={`${current.label} environment indicator`}
    >
      <span className="inline-flex items-center gap-2">
        <span className="rounded bg-white/20 px-1.5 py-0.5 text-[10px] uppercase tracking-wider">
          {current.label}
        </span>
        <span className="font-normal opacity-80">{current.message}</span>
      </span>
    </div>
  );
}
