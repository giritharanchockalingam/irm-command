import { getConfig } from '../config';

export type AuditAction =
  | 'VIEW' | 'CREATE' | 'UPDATE' | 'DELETE'
  | 'EXPORT' | 'LOGIN' | 'LOGOUT'
  | 'AI_REQUEST' | 'AI_RESPONSE'
  | 'SEARCH' | 'DOWNLOAD' | 'ACKNOWLEDGE'
  | 'APPROVE' | 'REJECT' | 'ESCALATE'
  | 'PERMISSION_DENIED' | 'CONFIG_CHANGE' | 'DATA_EXPORT'
  | 'ROLE_CHANGE' | 'SESSION_START' | 'SESSION_END'
  | 'MFA_CHALLENGE' | 'MFA_VERIFY'
  | 'CHANGE_REQUEST' | 'CHANGE_APPROVE' | 'CHANGE_REJECT';

export type AuditEntityType =
  | 'Risk' | 'Control' | 'Vendor' | 'Issue'
  | 'LossEvent' | 'KRI' | 'RegulatoryChange'
  | 'RiskScenario' | 'MonitoringAlert' | 'User'
  | 'AIResponse' | 'Report' | 'Setting'
  | 'ChangeRequest' | 'Session' | 'Permission' | 'Config' | 'SOCControl';

export interface AuditEvent {
  id: string;
  timestamp: Date;
  userId: string;
  userEmail: string;
  tenantId: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  module: string; // 'dashboard' | 'tprm' | 'compliance' | 'workbench' | 'copilot'
  metadata: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  success: boolean;
  errorMessage?: string;
  correlationId?: string;
  beforeValue?: Record<string, unknown>;
  afterValue?: Record<string, unknown>;
  deniedReason?: string;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  source?: 'ui' | 'api' | 'system' | 'scheduled';
}

// Sink interface for future extensibility (SIEM, API, Datadog, etc.)
export interface AuditSink {
  write(event: AuditEvent): void;
  flush(): Promise<void>;
}

class InMemoryAuditSink implements AuditSink {
  private buffer: AuditEvent[] = [];
  private readonly maxBufferSize = 10000;
  private readonly storageKey = 'irm-audit-log';

  constructor() {
    // Load from localStorage on init
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) this.buffer = JSON.parse(stored);
    } catch { /* ignore parse errors */ }
  }

  write(event: AuditEvent): void {
    this.buffer.push(event);
    if (this.buffer.length > this.maxBufferSize) {
      this.buffer = this.buffer.slice(-this.maxBufferSize);
    }
    this.persist();
  }

  async flush(): Promise<void> {
    this.persist();
  }

  getEvents(): AuditEvent[] {
    return [...this.buffer];
  }

  getEventsByEntity(entityType: AuditEntityType, entityId: string): AuditEvent[] {
    return this.buffer.filter(e => e.entityType === entityType && e.entityId === entityId);
  }

  private persist(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.buffer.slice(-1000)));
    } catch { /* storage full - degrade gracefully */ }
  }
}

class ConsoleAuditSink implements AuditSink {
  write(event: AuditEvent): void {
    if (getConfig().app.environment === 'development') {
      console.debug('[AUDIT]', event.action, event.entityType, event.entityId, event.metadata);
    }
  }
  async flush(): Promise<void> {}
}

// SIEM-ready sink for SOC 2 compliance
export class SIEMReadySink implements AuditSink {
  private buffer: string[] = [];
  private readonly maxBufferSize = 5000;

  write(event: AuditEvent): void {
    const formatted = this.toSIEMFormat(event);
    this.buffer.push(formatted);
    if (this.buffer.length > this.maxBufferSize) {
      this.buffer = this.buffer.slice(-this.maxBufferSize);
    }
  }

  async flush(): Promise<void> {
    // In production, this would send to SIEM system
    // For now, just keep events in buffer
  }

  private toSIEMFormat(event: AuditEvent): string {
    const siemEvent = {
      timestamp: event.timestamp.toISOString(),
      eventId: event.id,
      severity: this.mapRiskLevelToSeverity(event.riskLevel),
      userId: event.userId,
      userEmail: event.userEmail,
      tenantId: event.tenantId,
      action: event.action,
      entityType: event.entityType,
      entityId: event.entityId,
      module: event.module,
      correlationId: event.correlationId,
      metadata: event.metadata,
      beforeValue: event.beforeValue,
      afterValue: event.afterValue,
      deniedReason: event.deniedReason,
      source: event.source,
      success: event.success,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      sessionId: event.sessionId,
      errorMessage: event.errorMessage,
    };
    return JSON.stringify(siemEvent);
  }

  private mapRiskLevelToSeverity(riskLevel?: 'low' | 'medium' | 'high' | 'critical'): string {
    const severityMap: Record<string, string> = {
      low: 'INFO',
      medium: 'WARNING',
      high: 'ERROR',
      critical: 'CRITICAL',
    };
    return riskLevel ? severityMap[riskLevel] : 'INFO';
  }

  getFormattedEvents(): string[] {
    return [...this.buffer];
  }

  clearBuffer(): void {
    this.buffer = [];
  }
}

/**
 * CISO-006 REMEDIATION: Supabase-backed audit sink for immutable server-side persistence.
 * Sends audit events to Supabase audit_log table via REST API.
 * Falls back to in-memory buffer if Supabase is unavailable.
 *
 * Requires Supabase table:
 *   CREATE TABLE irm.audit_log (
 *     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *     timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 *     user_id TEXT NOT NULL,
 *     user_email TEXT NOT NULL,
 *     tenant_id TEXT NOT NULL,
 *     action TEXT NOT NULL,
 *     entity_type TEXT NOT NULL,
 *     entity_id TEXT NOT NULL,
 *     module TEXT NOT NULL,
 *     metadata JSONB,
 *     before_value JSONB,
 *     after_value JSONB,
 *     ip_address TEXT,
 *     user_agent TEXT,
 *     session_id TEXT,
 *     success BOOLEAN NOT NULL DEFAULT TRUE,
 *     error_message TEXT,
 *     correlation_id TEXT,
 *     risk_level TEXT,
 *     source TEXT,
 *     denied_reason TEXT
 *   );
 *   -- Make append-only (immutable)
 *   ALTER TABLE irm.audit_log ENABLE ROW LEVEL SECURITY;
 *   CREATE POLICY audit_insert_only ON irm.audit_log FOR INSERT WITH CHECK (true);
 *   CREATE POLICY audit_read_authenticated ON irm.audit_log FOR SELECT USING (auth.role() = 'authenticated');
 */
export class SupabaseAuditSink implements AuditSink {
  private pendingEvents: AuditEvent[] = [];
  private flushInterval: ReturnType<typeof setInterval> | null = null;
  private readonly batchSize = 50;
  private readonly flushIntervalMs = 5000;

  constructor() {
    // Auto-flush every 5 seconds
    this.flushInterval = setInterval(() => this.flush(), this.flushIntervalMs);
  }

  write(event: AuditEvent): void {
    this.pendingEvents.push(event);
    if (this.pendingEvents.length >= this.batchSize) {
      this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.pendingEvents.length === 0) return;

    const config = getConfig();
    if (!config.supabase.url || !config.supabase.anonKey) return;

    const batch = this.pendingEvents.splice(0, this.batchSize);
    const records = batch.map(event => ({
      user_id: event.userId,
      user_email: event.userEmail,
      tenant_id: event.tenantId,
      action: event.action,
      entity_type: event.entityType,
      entity_id: event.entityId,
      module: event.module,
      metadata: event.metadata,
      before_value: event.beforeValue || null,
      after_value: event.afterValue || null,
      ip_address: event.ipAddress || null,
      user_agent: event.userAgent || null,
      session_id: event.sessionId || null,
      success: event.success,
      error_message: event.errorMessage || null,
      correlation_id: event.correlationId || null,
      risk_level: event.riskLevel || null,
      source: event.source || 'ui',
      denied_reason: event.deniedReason || null,
    }));

    // CISO-006 REMEDIATION: Route through Edge Function (uses service_role key)
    // instead of direct Supabase REST with anon key
    try {
      const { writeAuditBatch } = await import('../lib/edgeFunctions');
      const edgeEvents = batch.map(event => ({
        action: event.action,
        entityType: event.entityType,
        entityId: event.entityId,
        module: event.module,
        metadata: event.metadata,
        success: event.success,
        errorMessage: event.errorMessage || undefined,
        riskLevel: event.riskLevel || undefined,
        source: event.source || 'ui',
        sessionId: event.sessionId || undefined,
        correlationId: event.correlationId || undefined,
      }));
      await writeAuditBatch(edgeEvents);
    } catch {
      // Re-queue on failure
      this.pendingEvents.unshift(...batch);
      console.warn('[AUDIT] Failed to persist audit events via Edge Function');
    }
  }

  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
  }
}

/**
 * CISO-006/007: SIEM Webhook Sink
 * Forwards audit events to the siem-forwarder Edge Function for external SIEM delivery.
 * Events are batched and scrubbed server-side before external transmission.
 */
export class SIEMWebhookSink implements AuditSink {
  private pendingEvents: AuditEvent[] = [];
  private flushInterval: ReturnType<typeof setInterval> | null = null;
  private readonly batchSize = 25;
  private readonly flushIntervalMs = 10000; // 10 seconds

  constructor() {
    this.flushInterval = setInterval(() => this.flush(), this.flushIntervalMs);
  }

  write(event: AuditEvent): void {
    this.pendingEvents.push(event);
    if (this.pendingEvents.length >= this.batchSize) {
      this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.pendingEvents.length === 0) return;

    const config = getConfig();
    if (!config.supabase.url) return;

    const batch = this.pendingEvents.splice(0, this.batchSize);

    try {
      const { getAuthClient } = await import('../auth/AuthClient').then(m => m);
      const authClient = getAuthClient();
      const token = await authClient.getAccessToken();

      await fetch(`${config.supabase.url}/functions/v1/siem-forwarder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`,
          'apikey': config.supabase.anonKey,
        },
        body: JSON.stringify({
          events: batch.map(e => ({
            timestamp: e.timestamp.toISOString(),
            userId: e.userId,
            tenantId: e.tenantId,
            action: e.action,
            entityType: e.entityType,
            entityId: e.entityId,
            module: e.module,
            metadata: e.metadata,
            success: e.success,
            riskLevel: e.riskLevel,
            source: e.source,
            ipAddress: e.ipAddress,
            sessionId: e.sessionId,
          })),
        }),
      });
    } catch {
      // Re-queue on failure
      if (this.pendingEvents.length < 1000) {
        this.pendingEvents.unshift(...batch);
      }
      console.warn('[SIEM] Failed to forward audit events');
    }
  }

  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
  }
}

// AuditLogger singleton
class AuditLoggerImpl {
  private sinks: AuditSink[] = [];
  private inMemorySink: InMemoryAuditSink;
  private siemSink: SIEMReadySink;

  constructor() {
    this.inMemorySink = new InMemoryAuditSink();
    this.siemSink = new SIEMReadySink();
    this.sinks.push(this.inMemorySink);
    this.sinks.push(new ConsoleAuditSink());
    this.sinks.push(this.siemSink);

    // CISO-006: Add Supabase-backed sink for server-side persistence
    const config = getConfig();
    if (config.supabase.url && config.supabase.anonKey) {
      this.sinks.push(new SupabaseAuditSink());
    }

    // CISO-006/007: Add SIEM webhook sink for production telemetry forwarding
    if (config.app.environment === 'production' || config.app.environment === 'staging') {
      this.sinks.push(new SIEMWebhookSink());
    }
  }

  log(params: Omit<AuditEvent, 'id' | 'timestamp'>): void {
    const event: AuditEvent = {
      ...params,
      id: `AUD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };
    for (const sink of this.sinks) {
      try {
        sink.write(event);
      } catch {
        /* never let audit fail the app */
      }
    }
  }

  logDenied(params: Omit<AuditEvent, 'id' | 'timestamp' | 'action' | 'success'> & { deniedReason: string }): void {
    this.log({
      ...params,
      action: 'PERMISSION_DENIED',
      success: false,
    });
  }

  logChange(params: Omit<AuditEvent, 'id' | 'timestamp' | 'action'> & {
    beforeValue: Record<string, unknown>;
    afterValue: Record<string, unknown>;
  }): void {
    this.log({
      ...params,
      action: 'UPDATE',
    });
  }

  logConfigChange(params: Omit<AuditEvent, 'id' | 'timestamp' | 'action' | 'entityType'> & {
    beforeValue: Record<string, unknown>;
    afterValue: Record<string, unknown>;
  }): void {
    this.log({
      ...params,
      action: 'CONFIG_CHANGE',
      entityType: 'Config',
    });
  }

  getEvents(): AuditEvent[] {
    return this.inMemorySink.getEvents();
  }

  getEventsByEntity(type: AuditEntityType, id: string): AuditEvent[] {
    return this.inMemorySink.getEventsByEntity(type, id);
  }

  getEventsByTenant(tenantId: string): AuditEvent[] {
    return this.getEvents().filter(e => e.tenantId === tenantId);
  }

  getEventsByUser(userId: string): AuditEvent[] {
    return this.getEvents().filter(e => e.userId === userId);
  }

  addSink(sink: AuditSink): void {
    this.sinks.push(sink);
  }

  async flush(): Promise<void> {
    await Promise.all(this.sinks.map(s => s.flush()));
  }
}

let instance: AuditLoggerImpl | null = null;
export function getAuditLogger(): AuditLoggerImpl {
  if (!instance) instance = new AuditLoggerImpl();
  return instance;
}
