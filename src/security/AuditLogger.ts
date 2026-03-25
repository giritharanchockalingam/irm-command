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
