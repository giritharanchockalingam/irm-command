#!/usr/bin/env node
/**
 * CISO-009: Build-time Environment Validation
 *
 * Runs during CI/CD to ensure environment configuration is safe before deployment.
 * Prevents production deployments with demo credentials or missing security config.
 *
 * Usage: npx tsx scripts/validate-env.ts
 * Exit code 0 = safe to deploy, 1 = blocking violations found
 */

interface ValidationRule {
  name: string;
  check: () => boolean;
  severity: 'error' | 'warning';
  message: string;
}

const env = process.env;
const targetEnv = env.VITE_ENV || 'development';
const isProduction = targetEnv === 'production' || targetEnv === 'staging';

const rules: ValidationRule[] = [
  // CISO-001: No demo auth in production
  {
    name: 'CISO-001-no-demo-auth',
    check: () => !(isProduction && env.VITE_AUTH_MODE === 'demo'),
    severity: 'error',
    message: 'Demo auth mode is forbidden in production/staging. Set VITE_AUTH_MODE=oidc',
  },
  // CISO-002: Supabase credentials required in production
  {
    name: 'CISO-002-supabase-url',
    check: () => !isProduction || !!env.VITE_SUPABASE_URL,
    severity: 'error',
    message: 'VITE_SUPABASE_URL is required in production',
  },
  {
    name: 'CISO-002-supabase-key',
    check: () => !isProduction || !!env.VITE_SUPABASE_ANON_KEY,
    severity: 'error',
    message: 'VITE_SUPABASE_ANON_KEY is required in production',
  },
  // CISO-001: OIDC configuration required in production
  {
    name: 'CISO-001-oidc-issuer',
    check: () => !isProduction || !!env.VITE_OIDC_ISSUER,
    severity: 'error',
    message: 'VITE_OIDC_ISSUER is required for production OIDC authentication',
  },
  {
    name: 'CISO-001-oidc-client-id',
    check: () => !isProduction || !!env.VITE_OIDC_CLIENT_ID,
    severity: 'error',
    message: 'VITE_OIDC_CLIENT_ID is required for production OIDC authentication',
  },
  // CISO-009: Tenant configuration
  {
    name: 'CISO-009-tenant-id',
    check: () => !isProduction || (!!env.VITE_TENANT_ID && env.VITE_TENANT_ID !== 'TNT-001'),
    severity: 'error',
    message: 'Production must have a real tenant ID (not default TNT-001)',
  },
  // CISO-007: Telemetry/SIEM endpoint in production
  {
    name: 'CISO-007-siem-endpoint',
    check: () => !isProduction || !!env.VITE_SIEM_ENDPOINT,
    severity: 'warning',
    message: 'VITE_SIEM_ENDPOINT recommended for production telemetry',
  },
  // CISO-002: No hardcoded secrets in env
  {
    name: 'CISO-002-no-service-role-key',
    check: () => !env.VITE_SUPABASE_SERVICE_ROLE_KEY,
    severity: 'error',
    message: 'service_role key must NEVER be exposed in VITE_ env vars (client-side)',
  },
  // General: Environment must be explicitly set for production
  {
    name: 'CISO-009-explicit-env',
    check: () => !isProduction || !!env.VITE_ENV,
    severity: 'error',
    message: 'VITE_ENV must be explicitly set for production builds',
  },
];

// Run validation
console.log(`\n🔒 IRM Sentinel — Build-Time Security Validation`);
console.log(`   Target environment: ${targetEnv}`);
console.log(`   Production mode: ${isProduction ? 'YES' : 'no'}\n`);

let errors = 0;
let warnings = 0;

for (const rule of rules) {
  const passed = rule.check();
  if (passed) {
    console.log(`  ✅ ${rule.name}`);
  } else if (rule.severity === 'error') {
    console.error(`  ❌ ${rule.name}: ${rule.message}`);
    errors++;
  } else {
    console.warn(`  ⚠️  ${rule.name}: ${rule.message}`);
    warnings++;
  }
}

console.log(`\n  Results: ${rules.length - errors - warnings} passed, ${errors} errors, ${warnings} warnings\n`);

if (errors > 0) {
  console.error(`❌ BUILD BLOCKED: ${errors} security violation(s) found. Fix before deploying.\n`);
  process.exit(1);
}

if (warnings > 0) {
  console.warn(`⚠️  BUILD ALLOWED with ${warnings} warning(s). Review before production.\n`);
}

console.log(`✅ Environment validation passed.\n`);
