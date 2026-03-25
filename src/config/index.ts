// Centralized typed configuration module
// Feature flags, environment detection, app metadata
// All config in one place - no window globals

export interface AppConfig {
  app: {
    name: string;
    version: string;
    buildHash: string;
    environment: 'development' | 'staging' | 'production' | 'prototype';
  };
  features: {
    enableGovernedAI: boolean;
    enableMultiTenant: boolean;
    enableAuditLog: boolean;
    enableTelemetry: boolean;
    enableRBAC: boolean;
    enableSSO: boolean;
  };
  security: {
    sessionTimeoutMs: number;
    maxLoginAttempts: number;
    csrfProtection: boolean;
    contentSecurityPolicy: string;
  };
  ai: {
    provider: 'local' | 'claude-governed';
    maxTokensPerRequest: number;
    rateLimitPerMinute: number;
  };
  tenant: {
    id: string;
    name: string;
    region: string;
  };
  supabase: {
    url: string;
    anonKey: string;
    schema: string;
  };
  auth: {
    mode: 'demo' | 'supabase';
  };
}

// CISO-009 REMEDIATION: Environment-aware configuration
// Environment is determined by VITE_ENV variable, NOT hardcoded
const resolvedEnvironment = (
  import.meta.env?.VITE_ENV as AppConfig['app']['environment']
) || 'development';

// CISO-009: Production enforcement — block unsafe defaults
const isProductionEnv = resolvedEnvironment === 'production' || resolvedEnvironment === 'staging';

const config: AppConfig = {
  app: {
    name: 'IRM Sentinel',
    version: import.meta.env?.VITE_APP_VERSION || '1.0.0',
    buildHash: import.meta.env?.VITE_BUILD_HASH || 'dev-' + new Date().toISOString().split('T')[0],
    environment: resolvedEnvironment,
  },
  features: {
    enableGovernedAI: true,
    enableMultiTenant: isProductionEnv, // CISO-009: Multi-tenant required in prod
    enableAuditLog: true,
    enableTelemetry: isProductionEnv, // CISO-007: Telemetry enabled in prod/staging
    enableRBAC: true,
    enableSSO: isProductionEnv, // CISO-001: SSO required in prod
  },
  security: {
    sessionTimeoutMs: isProductionEnv
      ? 30 * 60 * 1000   // CISO-001: 30 min idle timeout in production
      : 24 * 60 * 60 * 1000, // 24 hours for development
    maxLoginAttempts: 5,
    csrfProtection: true,
    // CISO-004: Strict CSP — no unsafe-inline for scripts, self-hosted fonts only
    contentSecurityPolicy: "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://*.supabase.co; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests; report-uri /api/csp-report; report-to csp-violations",
  },
  ai: {
    provider: 'claude-governed',
    maxTokensPerRequest: 2000,
    rateLimitPerMinute: 30,
  },
  tenant: {
    id: import.meta.env?.VITE_TENANT_ID || 'TNT-001',
    name: import.meta.env?.VITE_TENANT_NAME || 'Default Development Tenant',
    region: import.meta.env?.VITE_TENANT_REGION || 'us-east-1',
  },
  supabase: {
    url: import.meta.env?.VITE_SUPABASE_URL || '',
    anonKey: import.meta.env?.VITE_SUPABASE_ANON_KEY || '',
    schema: import.meta.env?.VITE_SUPABASE_SCHEMA || 'irm',
  },
  auth: {
    // CISO-001: Force non-demo auth in production/staging
    mode: isProductionEnv
      ? 'supabase'
      : ((import.meta.env?.VITE_AUTH_MODE as 'demo' | 'supabase') || 'demo'),
  },
};

// CISO-009: Runtime validation — fail loudly if production has unsafe config
if (isProductionEnv) {
  if (config.auth.mode === 'demo') {
    throw new Error(
      '[SECURITY VIOLATION] Demo auth mode is forbidden in production/staging. ' +
      'Set VITE_AUTH_MODE=supabase or VITE_AUTH_MODE=oidc.'
    );
  }
  if (!config.supabase.url || !config.supabase.anonKey) {
    console.error(
      '[SECURITY] Supabase credentials not configured for production. ' +
      'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.'
    );
  }
}

/**
 * Get the immutable app configuration.
 * Returns a frozen copy to prevent runtime mutations.
 */
export function getConfig(): Readonly<AppConfig> {
  return Object.freeze(config);
}

/**
 * Check if a feature flag is enabled.
 * @param flag - The feature flag key to check
 * @returns true if the feature is enabled, false otherwise
 */
export function isFeatureEnabled(
  flag: keyof AppConfig['features']
): boolean {
  return config.features[flag];
}

/**
 * Get the current environment
 */
export function getEnvironment(): AppConfig['app']['environment'] {
  return config.app.environment;
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return config.app.environment === 'production';
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return config.app.environment === 'development';
}

/**
 * Check if running in prototype mode
 */
export function isPrototype(): boolean {
  return config.app.environment === 'prototype';
}

/**
 * Update specific config values (mainly for testing/overrides)
 * Does not modify the frozen returned config, only internal state
 */
export function updateConfig(overrides: Partial<AppConfig>): void {
  if (isProduction()) {
    console.warn('Config updates are disabled in production');
    return;
  }

  // Shallow merge for each top-level key
  Object.keys(overrides).forEach((key) => {
    const typedKey = key as keyof AppConfig;
    if (typeof config[typedKey] === 'object' && config[typedKey] !== null) {
      Object.assign(
        config[typedKey],
        (overrides[typedKey] as any) || {}
      );
    } else {
      (config as any)[typedKey] = (overrides as any)[typedKey];
    }
  });
}
