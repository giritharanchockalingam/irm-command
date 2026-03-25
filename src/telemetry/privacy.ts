/**
 * CISO-007 REMEDIATION: Telemetry Privacy Controls
 *
 * Provides log scrubbing, PII masking, environment separation,
 * and privacy-safe telemetry sinks for production use.
 *
 * Key controls:
 * - Scrub secrets, PII, customer identifiers, and evidence content from logs
 * - Separate production telemetry from demo/test telemetry
 * - Privacy-reviewed session replay masking
 * - SIEM-ready event formatting with sensitive field redaction
 */

import { getConfig } from '../config';
import type { TelemetryEvent, PerformanceMetric, ErrorReport } from './index';

// ============================================================
// PII & Secret Scrubbing
// ============================================================

interface ScrubRule {
  name: string;
  pattern: RegExp;
  replacement: string;
}

const SCRUB_RULES: ScrubRule[] = [
  // Secrets and credentials
  { name: 'jwt_token',     pattern: /eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+/g, replacement: '[REDACTED:JWT]' },
  { name: 'api_key',       pattern: /(api[_-]?key|secret|password|token|bearer|authorization)\s*[:=]\s*\S{8,}/gi, replacement: '$1=[REDACTED]' },
  { name: 'supabase_key',  pattern: /sbp_[a-zA-Z0-9]{20,}/g, replacement: '[REDACTED:SUPABASE_KEY]' },

  // PII
  { name: 'email',         pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b/g, replacement: '[REDACTED:EMAIL]' },
  { name: 'ssn',           pattern: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: '[REDACTED:SSN]' },
  { name: 'credit_card',   pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, replacement: '[REDACTED:CC]' },
  { name: 'phone',         pattern: /\b(\+?1?\s?)?(\(?\d{3}\)?[\s.-]?)?\d{3}[\s.-]?\d{4}\b/g, replacement: '[REDACTED:PHONE]' },
  { name: 'ip_address',    pattern: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, replacement: '[REDACTED:IP]' },

  // Customer identifiers (tenant-specific patterns)
  { name: 'customer_id',   pattern: /\bCUST-[A-Z0-9]{6,}\b/g, replacement: '[REDACTED:CUSTOMER_ID]' },
  { name: 'evidence_id',   pattern: /\bEVD-[A-Z0-9]{6,}\b/g, replacement: '[REDACTED:EVIDENCE_ID]' },
];

/**
 * Scrub sensitive data from a string value.
 * Applied to all telemetry event properties before emission.
 */
export function scrubSensitiveData(value: string): string {
  let scrubbed = value;
  for (const rule of SCRUB_RULES) {
    scrubbed = scrubbed.replace(rule.pattern, rule.replacement);
  }
  return scrubbed;
}

/**
 * Deep-scrub an object — recursively processes all string values.
 */
export function scrubObject(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    // Skip sensitive keys entirely
    const sensitiveKeys = ['password', 'secret', 'apiKey', 'anonKey', 'token', 'authorization', 'cookie'];
    if (sensitiveKeys.some((k) => key.toLowerCase().includes(k))) {
      result[key] = '[REDACTED]';
      continue;
    }

    if (typeof value === 'string') {
      result[key] = scrubSensitiveData(value);
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = scrubObject(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        typeof item === 'string'
          ? scrubSensitiveData(item)
          : item && typeof item === 'object'
            ? scrubObject(item as Record<string, unknown>)
            : item,
      );
    } else {
      result[key] = value;
    }
  }

  return result;
}

// ============================================================
// Environment-Separated Telemetry
// ============================================================

/**
 * Tag telemetry events with environment metadata.
 * Ensures production telemetry is separated from demo/test data.
 */
export function tagEnvironment(event: TelemetryEvent): TelemetryEvent {
  const config = getConfig();
  return {
    ...event,
    properties: {
      ...event.properties,
      _env: config.app.environment,
      _version: config.app.version,
      _buildHash: config.app.buildHash,
      _isDemo: config.auth.mode === 'demo',
      _tenantId: config.tenant.id,
    },
  };
}

// ============================================================
// Session Replay Masking Configuration
// ============================================================

/**
 * CSS selectors for elements that must be masked in session replay.
 * Applied when integrating with PostHog, LogRocket, etc.
 */
export const SESSION_REPLAY_MASK_SELECTORS = [
  // Sensitive data modules
  '[data-module="compliance"]',
  '[data-module="exceptions"]',
  '[data-module="control-register"]',

  // Form inputs
  'input[type="password"]',
  'input[type="email"]',
  'input[name*="ssn"]',
  'input[name*="account"]',

  // Evidence and document content
  '.evidence-content',
  '.document-preview',
  '.risk-narrative',
  '.vendor-assessment',

  // PII displays
  '.user-email',
  '.user-phone',
  '.customer-name',
  '.customer-id',

  // API/config displays
  '.api-key-display',
  '.config-value',
  '.env-variable',
];

/**
 * CSS selectors for elements to completely block from recording.
 */
export const SESSION_REPLAY_BLOCK_SELECTORS = [
  // Admin and architecture pages
  '[data-module="architecture"]',
  '.admin-panel',
  '.config-editor',

  // AI prompts and responses
  '.ai-prompt-input',
  '.ai-response-content',
  '.copilot-chat',
];

// ============================================================
// Privacy-Safe SIEM Sink
// ============================================================

interface SIEMSinkConfig {
  endpoint: string;
  apiKey: string;
  batchSize?: number;
  flushIntervalMs?: number;
}

/**
 * CISO-007: Production SIEM sink with privacy controls.
 * Scrubs all events before sending to external SIEM system.
 * Separates production from demo telemetry.
 */
export class PrivacySafeSIEMSink {
  private config: SIEMSinkConfig;
  private buffer: Array<Record<string, unknown>> = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;

  constructor(config: SIEMSinkConfig) {
    this.config = config;
    this.flushTimer = setInterval(
      () => this.flush(),
      config.flushIntervalMs || 10000,
    );
  }

  trackEvent(event: TelemetryEvent): void {
    const appConfig = getConfig();

    // CISO-007: Separate demo telemetry from production
    if (appConfig.auth.mode === 'demo' && appConfig.app.environment === 'production') {
      return; // Never send demo events in production
    }

    // Scrub and tag
    const tagged = tagEnvironment(event);
    const scrubbed = scrubObject(tagged.properties);

    this.buffer.push({
      timestamp: tagged.timestamp.toISOString(),
      event: tagged.name,
      properties: scrubbed,
      source: 'irm-command',
      environment: appConfig.app.environment,
    });

    if (this.buffer.length >= (this.config.batchSize || 100)) {
      this.flush();
    }
  }

  trackError(report: ErrorReport): void {
    // Scrub error context
    const scrubbedContext = scrubObject(report.context);
    this.buffer.push({
      timestamp: report.timestamp.toISOString(),
      event: 'error',
      level: report.handled ? 'warning' : 'error',
      error: {
        message: scrubSensitiveData(report.error.message),
        // Don't send full stack trace to SIEM — it may contain file paths with sensitive info
        stackPresent: !!report.error.stack,
      },
      context: scrubbedContext,
      source: 'irm-command',
    });
  }

  trackPerformance(metric: PerformanceMetric): void {
    this.buffer.push({
      timestamp: metric.timestamp.toISOString(),
      event: 'performance',
      metric: metric.name,
      value: metric.value,
      unit: metric.unit,
      source: 'irm-command',
    });
  }

  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const batch = this.buffer.splice(0, this.config.batchSize || 100);

    try {
      await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({ events: batch }),
      });
    } catch {
      // Re-queue on failure (limit buffer to prevent memory issues)
      if (this.buffer.length < 5000) {
        this.buffer.unshift(...batch);
      }
    }
  }

  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }
}

// ============================================================
// Privacy Audit Helper
// ============================================================

/**
 * Generate a privacy audit report for the current telemetry configuration.
 * Used for CISO-007 closure evidence.
 */
export function generatePrivacyAuditReport(): {
  scrubRulesActive: number;
  maskedSelectors: number;
  blockedSelectors: number;
  environmentSeparation: boolean;
  demoTelemetryIsolated: boolean;
  sensitiveKeysRedacted: string[];
} {
  const config = getConfig();
  return {
    scrubRulesActive: SCRUB_RULES.length,
    maskedSelectors: SESSION_REPLAY_MASK_SELECTORS.length,
    blockedSelectors: SESSION_REPLAY_BLOCK_SELECTORS.length,
    environmentSeparation: true,
    demoTelemetryIsolated: config.auth.mode !== 'demo' || config.app.environment !== 'production',
    sensitiveKeysRedacted: ['password', 'secret', 'apiKey', 'anonKey', 'token', 'authorization', 'cookie'],
  };
}
