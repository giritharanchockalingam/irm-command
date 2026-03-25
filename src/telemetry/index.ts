import { getConfig } from '../config';
import { scrubObject, tagEnvironment } from './privacy'; // CISO-007

export interface TelemetryEvent {
  name: string;
  properties: Record<string, unknown>;
  timestamp: Date;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'count' | 'bytes' | 'percent';
  timestamp: Date;
}

export interface ErrorReport {
  error: Error;
  context: Record<string, unknown>;
  timestamp: Date;
  handled: boolean;
}

// Telemetry sink interface (plug in Datadog, New Relic, SigNoz, etc.)
interface TelemetrySink {
  trackEvent(event: TelemetryEvent): void;
  trackError(report: ErrorReport): void;
  trackPerformance(metric: PerformanceMetric): void;
  flush(): Promise<void>;
}

class ConsoleTelemetrySink implements TelemetrySink {
  trackEvent(event: TelemetryEvent): void {
    if (getConfig().app.environment === 'development') {
      console.debug('[TELEMETRY]', event.name, event.properties);
    }
  }

  trackError(report: ErrorReport): void {
    console.error('[ERROR]', report.error.message, report.context);
  }

  trackPerformance(metric: PerformanceMetric): void {
    if (getConfig().app.environment === 'development') {
      console.debug('[PERF]', metric.name, `${metric.value}${metric.unit}`);
    }
  }

  async flush(): Promise<void> {}
}

class InMemoryTelemetrySink implements TelemetrySink {
  private events: TelemetryEvent[] = [];
  private errors: ErrorReport[] = [];
  private metrics: PerformanceMetric[] = [];

  trackEvent(event: TelemetryEvent): void {
    this.events.push(event);
    if (this.events.length > 5000) {
      this.events = this.events.slice(-5000);
    }
  }

  trackError(report: ErrorReport): void {
    this.errors.push(report);
  }

  trackPerformance(metric: PerformanceMetric): void {
    this.metrics.push(metric);
  }

  async flush(): Promise<void> {}

  getEvents(): TelemetryEvent[] {
    return [...this.events];
  }

  getErrors(): ErrorReport[] {
    return [...this.errors];
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }
}

// Singleton telemetry client
class TelemetryClient {
  private sinks: TelemetrySink[] = [];

  constructor() {
    this.sinks.push(new ConsoleTelemetrySink());
    this.sinks.push(new InMemoryTelemetrySink());
  }

  trackEvent(name: string, properties: Record<string, unknown> = {}): void {
    if (!getConfig().features.enableTelemetry) return;
    const mergedProperties = { ...getTelemetryContext(), ...properties, requestId: getRequestId() };
    // CISO-007: Scrub PII/secrets and tag environment before emission
    const scrubbedProperties = scrubObject(mergedProperties);
    const event = tagEnvironment({ name, properties: scrubbedProperties, timestamp: new Date() });
    for (const sink of this.sinks) {
      try {
        sink.trackEvent(event);
      } catch {
        /* silently ignore sink failures */
      }
    }
  }

  trackError(error: Error, context: Record<string, unknown> = {}, handled = true): void {
    const mergedContext = { ...getTelemetryContext(), ...context, requestId: getRequestId() };
    const report = { error, context: mergedContext, timestamp: new Date(), handled };
    for (const sink of this.sinks) {
      try {
        sink.trackError(report);
      } catch {
        /* silently ignore sink failures */
      }
    }
  }

  trackPerformance(name: string, value: number, unit: 'ms' | 'count' | 'bytes' | 'percent' = 'ms'): void {
    if (!getConfig().features.enableTelemetry) return;
    const metric = { name, value, unit, timestamp: new Date() };
    for (const sink of this.sinks) {
      try {
        sink.trackPerformance(metric);
      } catch {
        /* silently ignore sink failures */
      }
    }
  }

  // Convenience: measure execution time
  async measure<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      this.trackPerformance(name, performance.now() - start);
      return result;
    } catch (error) {
      this.trackError(error as Error, { operation: name });
      throw error;
    }
  }

  addSink(sink: TelemetrySink): void {
    this.sinks.push(sink);
  }

  async flush(): Promise<void> {
    await Promise.all(this.sinks.map(s => s.flush()));
  }
}

let instance: TelemetryClient | null = null;
export function getTelemetry(): TelemetryClient {
  if (!instance) instance = new TelemetryClient();
  return instance;
}

// ============================================================================
// REQUEST ID SUPPORT
// ============================================================================

let currentRequestId = '';

export function generateRequestId(): string {
  // UUID v4-like format using crypto or simple generation
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}-${Math.random().toString(36).substring(2, 11)}`;
}

export function setRequestId(id: string): void {
  currentRequestId = id;
}

export function getRequestId(): string {
  return currentRequestId || '';
}

// ============================================================================
// TELEMETRY CONTEXT (tenant, user, session)
// ============================================================================

interface TelemetryContextType {
  userId?: string;
  tenantId?: string;
  sessionId?: string;
}

let telemetryContext: TelemetryContextType = {};

export function setTelemetryContext(ctx: TelemetryContextType): void {
  telemetryContext = { ...ctx };
}

export function getTelemetryContext(): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  if (telemetryContext.userId) result.userId = telemetryContext.userId;
  if (telemetryContext.tenantId) result.tenantId = telemetryContext.tenantId;
  if (telemetryContext.sessionId) result.sessionId = telemetryContext.sessionId;
  return result;
}

// ============================================================================
// SECURITY METRICS
// ============================================================================

export class SecurityMetrics {
  trackLoginSuccess(userId: string, tenantId: string): void {
    getTelemetry().trackEvent('auth.login.success', {
      userId,
      tenantId,
    });
  }

  trackLoginFailure(email: string, reason: string): void {
    getTelemetry().trackEvent('auth.login.failure', {
      email,
      reason,
    });
  }

  trackPermissionDenied(userId: string, permission: string, module: string): void {
    getTelemetry().trackEvent('permission.denied', {
      userId,
      permission,
      module,
    });
  }

  trackMFAChallenge(userId: string, method: string): void {
    getTelemetry().trackEvent('auth.mfa.challenge', {
      userId,
      method,
    });
  }

  trackDataExport(userId: string, entityType: string, recordCount: number): void {
    getTelemetry().trackEvent('data.export', {
      userId,
      entityType,
      recordCount,
    });
  }

  trackAIGovernanceCall(userId: string, method: string, durationMs: number, tenantId: string): void {
    getTelemetry().trackEvent('ai.governance.call', {
      userId,
      method,
      durationMs,
      tenantId,
    });
  }

  trackSessionStart(userId: string, tenantId: string): void {
    getTelemetry().trackEvent('session.start', {
      userId,
      tenantId,
    });
  }

  trackSessionEnd(userId: string, durationMs: number): void {
    getTelemetry().trackEvent('session.end', {
      userId,
      durationMs,
    });
  }
}

let securityMetricsInstance: SecurityMetrics | null = null;

export function getSecurityMetrics(): SecurityMetrics {
  if (!securityMetricsInstance) {
    securityMetricsInstance = new SecurityMetrics();
  }
  return securityMetricsInstance;
}

// ============================================================================
// PERFORMANCE TRACKER
// ============================================================================

export const PerformanceTracker = {
  measureRender(componentName: string) {
    const marks: Record<string, number> = {};

    return {
      start: () => {
        marks.startTime = performance.now();
      },
      end: () => {
        if (marks.startTime !== undefined) {
          const duration = performance.now() - marks.startTime;
          getTelemetry().trackPerformance(`render.${componentName}`, duration, 'ms');
        }
      },
    };
  },

  measureAPICall: async <T,>(endpoint: string, fn: () => Promise<T>): Promise<T> => {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      getTelemetry().trackPerformance(`api.call.${endpoint}`, duration, 'ms');
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      getTelemetry().trackPerformance(`api.call.${endpoint}`, duration, 'ms');
      getTelemetry().trackError(error as Error, { endpoint });
      throw error;
    }
  },
};
