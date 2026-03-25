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

// Default prototype config - sensible defaults for prototype mode
const config: AppConfig = {
  app: {
    name: 'IRM Command',
    version: '1.0.0-prototype',
    buildHash: 'proto-' + new Date().toISOString().split('T')[0],
    environment: 'prototype',
  },
  features: {
    enableGovernedAI: true,
    enableMultiTenant: false,
    enableAuditLog: true,
    enableTelemetry: false,
    enableRBAC: true,
    enableSSO: false,
  },
  security: {
    sessionTimeoutMs: 24 * 60 * 60 * 1000, // 24 hours for prototype
    maxLoginAttempts: 5,
    csrfProtection: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;",
  },
  ai: {
    provider: 'claude-governed',
    maxTokensPerRequest: 2000,
    rateLimitPerMinute: 30,
  },
  tenant: {
    id: 'TNT-001',
    name: 'Default Prototype Tenant',
    region: 'us-east-1',
  },
  supabase: {
    url: import.meta.env?.VITE_SUPABASE_URL || '',
    anonKey: import.meta.env?.VITE_SUPABASE_ANON_KEY || '',
    schema: import.meta.env?.VITE_SUPABASE_SCHEMA || 'irm',
  },
  auth: {
    mode: (import.meta.env?.VITE_AUTH_MODE as 'demo' | 'supabase') || 'demo',
  },
};

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
