/**
 * SupabaseDataAccess - Implements DataAccessLayer using Supabase Postgres
 * Reads from the irm schema, maps snake_case columns to camelCase types
 */
import { supabase } from '../lib/supabase';
import type {
  Risk,
  Control,
  Vendor,
  Issue,
  LossEvent,
  KRI,
  RegulatoryChange,
  RiskScenario,
  MonitoringAlert,
  AuditEntry,
} from '../domain/types';
import type { DataAccessLayer } from './DataAccessLayer';

// ============================================================================
// Row-to-Entity Mappers (snake_case → camelCase)
// ============================================================================

function mapRisk(row: Record<string, unknown>): Risk {
  return {
    id: row.id as string,
    title: row.title as string,
    category: row.category as Risk['category'],
    description: row.description as string,
    businessUnit: row.business_unit as Risk['businessUnit'],
    impact: row.impact as Risk['impact'],
    likelihood: row.likelihood as Risk['likelihood'],
    inherentScore: row.inherent_score as number,
    residualScore: row.residual_score as number,
    owner: row.owner as string,
    status: row.status as Risk['status'],
    controlIds: (row.control_ids as string[]) || [],
    kpiIds: (row.kpi_ids as string[]) || [],
    lastAssessmentDate: new Date(row.last_assessment_date as string),
    nextReviewDate: new Date(row.next_review_date as string),
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

function mapControl(row: Record<string, unknown>): Control {
  return {
    id: row.id as string,
    title: row.title as string,
    description: row.description as string,
    framework: row.framework as Control['framework'],
    status: row.status as Control['status'],
    owner: row.owner as string,
    testDate: new Date(row.test_date as string),
    nextReviewDate: new Date(row.next_review_date as string),
    riskIds: (row.risk_ids as string[]) || [],
    effectiveness: row.effectiveness as Control['effectiveness'],
    evidence: row.evidence as string,
    controlType: row.control_type as Control['controlType'],
    testFrequency: row.test_frequency as Control['testFrequency'],
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

function mapVendor(row: Record<string, unknown>): Vendor {
  return {
    id: row.id as string,
    name: row.name as string,
    tier: row.tier as Vendor['tier'],
    category: row.category as string,
    criticality: row.criticality as Vendor['criticality'],
    dataSensitivity: row.data_sensitivity as Vendor['dataSensitivity'],
    inherentRisk: row.inherent_risk as Vendor['inherentRisk'],
    residualRisk: row.residual_risk as Vendor['residualRisk'],
    slaStatus: row.sla_status as Vendor['slaStatus'],
    contractExpiry: new Date(row.contract_expiry as string),
    regulatoryRelevance: row.regulatory_relevance as boolean,
    services: (row.services as string[]) || [],
    location: row.location as string,
    lastAssessmentDate: new Date(row.last_assessment_date as string),
    nextReviewDate: new Date(row.next_review_date as string),
    controlIds: (row.control_ids as string[]) || [],
    contractValue: row.contract_value as number | undefined,
    backupVendor: row.backup_vendor as string | undefined,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

function mapIssue(row: Record<string, unknown>): Issue {
  return {
    id: row.id as string,
    title: row.title as string,
    severity: row.severity as Issue['severity'],
    source: row.source as Issue['source'],
    status: row.status as Issue['status'],
    owner: row.owner as string,
    dueDate: new Date(row.due_date as string),
    riskIds: (row.risk_ids as string[]) || [],
    controlIds: (row.control_ids as string[]) || [],
    remediationPlan: row.remediation_plan as string,
    remediationDueDate: row.remediation_due_date
      ? new Date(row.remediation_due_date as string)
      : undefined,
    mraType: row.mra_type as Issue['mraType'],
    rootCause: row.root_cause as string | undefined,
    impactStatement: row.impact_statement as string | undefined,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
    closedAt: row.closed_at ? new Date(row.closed_at as string) : undefined,
  };
}

function mapLossEvent(row: Record<string, unknown>): LossEvent {
  return {
    id: row.id as string,
    title: row.title as string,
    category: row.category as LossEvent['category'],
    amount: Number(row.amount),
    date: new Date(row.date as string),
    businessUnit: row.business_unit as LossEvent['businessUnit'],
    riskIds: (row.risk_ids as string[]) || [],
    rootCause: row.root_cause as string,
    status: row.status as LossEvent['status'],
    description: row.description as string,
    recoveryAmount: row.recovery_amount ? Number(row.recovery_amount) : undefined,
    regulatoryReporting: row.regulatory_reporting as boolean,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

function mapKRI(row: Record<string, unknown>): KRI {
  return {
    id: row.id as string,
    name: row.name as string,
    riskCategory: row.risk_category as KRI['riskCategory'],
    currentValue: Number(row.current_value),
    threshold: Number(row.threshold),
    breachLevel: row.breach_level as KRI['breachLevel'],
    trend: row.trend as KRI['trend'],
    unit: row.unit as string,
    lastUpdated: new Date(row.last_updated as string),
    historicalValues: (row.historical_values as Array<{ value: number; date: Date }>) || [],
    owner: row.owner as string,
    updateFrequency: row.update_frequency as KRI['updateFrequency'],
    warningThreshold: row.warning_threshold ? Number(row.warning_threshold) : undefined,
    criticalThreshold: row.critical_threshold ? Number(row.critical_threshold) : undefined,
    createdAt: new Date(row.created_at as string),
  };
}

function mapRegulatoryChange(row: Record<string, unknown>): RegulatoryChange {
  return {
    id: row.id as string,
    title: row.title as string,
    source: row.source as RegulatoryChange['source'],
    effectiveDate: new Date(row.effective_date as string),
    status: row.status as RegulatoryChange['status'],
    impactLevel: row.impact_level as RegulatoryChange['impactLevel'],
    summary: row.summary as string,
    affectedFrameworks: (row.affected_frameworks as RegulatoryChange['affectedFrameworks']) || [],
    affectedControlIds: (row.affected_control_ids as string[]) || [],
    actionPlanOwner: row.action_plan_owner as string,
    actionPlanDueDate: new Date(row.action_plan_due_date as string),
    implementationNotes: row.implementation_notes as string | undefined,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

function mapRiskScenario(row: Record<string, unknown>): RiskScenario {
  return {
    id: row.id as string,
    title: row.title as string,
    businessLine: row.business_line as RiskScenario['businessLine'],
    product: row.product as string,
    geography: row.geography as string,
    riskType: row.risk_type as RiskScenario['riskType'],
    inherentRisk: row.inherent_risk as RiskScenario['inherentRisk'],
    controlStrength: row.control_strength as RiskScenario['controlStrength'],
    lossHistory: (row.loss_history as Array<{ amount: number; date: Date }>) || [],
    compositeScore: Number(row.composite_score),
    narrative: row.narrative as string,
    probability: Number(row.probability),
    potentialLoss: Number(row.potential_loss),
    mitigatingControls: (row.mitigating_controls as string[]) || [],
    owner: row.owner as string,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

function mapAuditEntry(row: Record<string, unknown>): AuditEntry {
  return {
    id: row.id as string,
    entityType: row.entity_type as AuditEntry['entityType'],
    entityId: row.entity_id as string,
    action: row.action as AuditEntry['action'],
    field: row.field as string | undefined,
    oldValue: row.old_value,
    newValue: row.new_value,
    user: row.user as string,
    timestamp: new Date(row.timestamp as string),
    ipAddress: row.ip_address as string | undefined,
    userAgent: row.user_agent as string | undefined,
  };
}

function mapMonitoringAlert(row: Record<string, unknown>): MonitoringAlert {
  return {
    id: row.id as string,
    type: row.type as MonitoringAlert['type'],
    vendorId: row.vendor_id as string | undefined,
    severity: row.severity as MonitoringAlert['severity'],
    title: row.title as string,
    description: row.description as string,
    timestamp: new Date(row.timestamp as string),
    acknowledged: row.acknowledged as boolean,
    acknowledgedBy: row.acknowledged_by as string | undefined,
    acknowledgedAt: row.acknowledged_at
      ? new Date(row.acknowledged_at as string)
      : undefined,
    aiInterpretation: row.ai_interpretation as string | undefined,
    relatedEntityId: row.related_entity_id as string | undefined,
    actionRequired: row.action_required as boolean | undefined,
  };
}

// ============================================================================
// SupabaseDataAccess Implementation
// ============================================================================

export class SupabaseDataAccess implements DataAccessLayer {

  // ===== Risk Methods =====
  getRisks(): Risk[] {
    // Sync wrapper — use cached data
    return this._cache.risks;
  }

  getRiskById(id: string): Risk | undefined {
    return this._cache.risks.find((r) => r.id === id);
  }

  getRisksByStatus(status: string): Risk[] {
    return this._cache.risks.filter((r) => r.status === status);
  }

  getRisksByCategory(category: string): Risk[] {
    return this._cache.risks.filter((r) => r.category === category);
  }

  // ===== Control Methods =====
  getControls(): Control[] {
    return this._cache.controls;
  }

  getControlById(id: string): Control | undefined {
    return this._cache.controls.find((c) => c.id === id);
  }

  getControlsByFramework(framework: string): Control[] {
    return this._cache.controls.filter((c) => c.framework === framework);
  }

  getControlsByEffectiveness(effectiveness: string): Control[] {
    return this._cache.controls.filter((c) => c.effectiveness === effectiveness);
  }

  getControlsByRisk(riskId: string): Control[] {
    return this._cache.controls.filter((c) => c.riskIds?.includes(riskId));
  }

  // ===== Vendor Methods =====
  getVendors(): Vendor[] {
    return this._cache.vendors;
  }

  getVendorById(id: string): Vendor | undefined {
    return this._cache.vendors.find((v) => v.id === id);
  }

  getVendorsByRiskRating(rating: string): Vendor[] {
    return this._cache.vendors.filter((v) => v.criticality === rating);
  }

  getVendorsByCategory(category: string): Vendor[] {
    return this._cache.vendors.filter((v) => v.category === category);
  }

  // ===== Issue Methods =====
  getIssues(): Issue[] {
    return this._cache.issues;
  }

  getIssueById(id: string): Issue | undefined {
    return this._cache.issues.find((i) => i.id === id);
  }

  getIssuesBySeverity(severity: string): Issue[] {
    return this._cache.issues.filter((i) => i.severity === severity);
  }

  getIssuesByStatus(status: string): Issue[] {
    return this._cache.issues.filter((i) => i.status === status);
  }

  // ===== Loss Event Methods =====
  getLossEvents(): LossEvent[] {
    return this._cache.lossEvents;
  }

  getLossEventsByType(type: string): LossEvent[] {
    return this._cache.lossEvents.filter((e) => e.category === type);
  }

  // ===== KRI Methods =====
  getKRIs(): KRI[] {
    return this._cache.kris;
  }

  getKRIsAboveThreshold(): KRI[] {
    return this._cache.kris.filter((k) => k.currentValue > k.threshold);
  }

  // ===== Regulatory Change Methods =====
  getRegulatoryChanges(): RegulatoryChange[] {
    return this._cache.regulatoryChanges;
  }

  getRegulatoryChangesByStatus(status: string): RegulatoryChange[] {
    return this._cache.regulatoryChanges.filter((r) => r.status === status);
  }

  // ===== Risk Scenario Methods =====
  getRiskScenarios(): RiskScenario[] {
    return this._cache.riskScenarios;
  }

  getRiskScenariosByImpact(impact: string): RiskScenario[] {
    return this._cache.riskScenarios.filter(
      (s) => s.inherentRisk >= (impact === 'High' ? 4 : impact === 'Medium' ? 3 : 1)
    );
  }

  // ===== Monitoring Alert Methods =====
  getMonitoringAlerts(): MonitoringAlert[] {
    return this._cache.monitoringAlerts;
  }

  getAlertsByVendor(vendorId: string): MonitoringAlert[] {
    return this._cache.monitoringAlerts.filter((a) => a.vendorId === vendorId);
  }

  getAlertsBySeverity(severity: string): MonitoringAlert[] {
    return this._cache.monitoringAlerts.filter((a) => a.severity === severity);
  }

  getActiveAlerts(): MonitoringAlert[] {
    return this._cache.monitoringAlerts.filter((a) => !a.acknowledged);
  }

  // ===== Audit Log Methods =====
  getAuditLog(): AuditEntry[] {
    return this._cache.auditLog;
  }

  getAuditLogByUser(userId: string): AuditEntry[] {
    return this._cache.auditLog.filter((e) => e.user === userId);
  }

  getAuditLogByResource(resourceId: string): AuditEntry[] {
    return this._cache.auditLog.filter((e) => e.entityId === resourceId);
  }

  getAuditLogByAction(action: string): AuditEntry[] {
    return this._cache.auditLog.filter((e) => e.action === action);
  }

  // ============================================================================
  // Cache & Initialization
  // ============================================================================

  private _cache = {
    risks: [] as Risk[],
    controls: [] as Control[],
    vendors: [] as Vendor[],
    issues: [] as Issue[],
    lossEvents: [] as LossEvent[],
    kris: [] as KRI[],
    regulatoryChanges: [] as RegulatoryChange[],
    riskScenarios: [] as RiskScenario[],
    monitoringAlerts: [] as MonitoringAlert[],
    auditLog: [] as AuditEntry[],
  };

  private _initialized = false;
  private _initPromise: Promise<void> | null = null;

  /**
   * Load all data from Supabase into local cache.
   * Called once at app startup. The DataAccessLayer interface is synchronous,
   * so we pre-fetch everything and serve from cache.
   */
  async initialize(): Promise<void> {
    if (this._initialized) return;
    if (this._initPromise) return this._initPromise;

    this._initPromise = this._loadAll();
    await this._initPromise;
    this._initialized = true;
  }

  get isInitialized(): boolean {
    return this._initialized;
  }

  private async _loadAll(): Promise<void> {
    // CISO-002/003 REMEDIATION: Route data access through Edge Functions in production.
    // In development/demo mode, use direct Supabase queries (demo tokens are not real JWTs
    // and Edge Functions cannot validate them).
    //
    // Production architecture:
    //   Browser → Edge Function (JWT validated, permission checked, tenant filtered) → Database
    // Development architecture:
    //   Browser → Supabase REST API (anon key, RLS still enforced at DB level) → Database

    const { getConfig } = await import('../config');
    const config = getConfig();
    const isProduction = config.app.environment === 'production' || config.app.environment === 'staging';

    let risksData: any[] = [];
    let controlsData: any[] = [];
    let vendorsData: any[] = [];
    let issuesData: any[] = [];
    let lossEventsData: any[] = [];
    let krisData: any[] = [];
    let regChangesData: any[] = [];
    let scenariosData: any[] = [];
    let alertsData: any[] = [];
    let auditData: any[] = [];

    if (isProduction) {
      // PRODUCTION: All data through Edge Functions (server-side auth, tenant isolation)
      const { fetchTable } = await import('../lib/edgeFunctions');
      [risksData, controlsData, vendorsData, issuesData, lossEventsData,
       krisData, regChangesData, scenariosData, alertsData, auditData] = await Promise.all([
        fetchTable('risks').catch(() => []),
        fetchTable('controls').catch(() => []),
        fetchTable('vendors').catch(() => []),
        fetchTable('issues').catch(() => []),
        fetchTable('loss_events').catch(() => []),
        fetchTable('kris').catch(() => []),
        fetchTable('regulatory_changes').catch(() => []),
        fetchTable('risk_scenarios').catch(() => []),
        fetchTable('monitoring_alerts').catch(() => []),
        fetchTable('audit_log').catch(() => []),
      ]);
    } else {
      // DEVELOPMENT: Direct Supabase access (demo mode compatible, RLS at DB level)
      const tables = ['risks', 'controls', 'vendors', 'issues', 'loss_events',
                       'kris', 'regulatory_changes', 'risk_scenarios', 'monitoring_alerts', 'audit_log'];
      const results = await Promise.all(
        tables.map(table =>
          supabase.from(table).select('*').then(res => res.data || []).catch(() => [])
        )
      );
      [risksData, controlsData, vendorsData, issuesData, lossEventsData,
       krisData, regChangesData, scenariosData, alertsData, auditData] = results;
    }

    this._cache.risks = (risksData as any[]).map(mapRisk);
    this._cache.controls = (controlsData as any[]).map(mapControl);
    this._cache.vendors = (vendorsData as any[]).map(mapVendor);
    this._cache.issues = (issuesData as any[]).map(mapIssue);
    this._cache.lossEvents = (lossEventsData as any[]).map(mapLossEvent);
    this._cache.kris = (krisData as any[]).map(mapKRI);
    this._cache.regulatoryChanges = (regChangesData as any[]).map(mapRegulatoryChange);
    this._cache.riskScenarios = (scenariosData as any[]).map(mapRiskScenario);
    this._cache.monitoringAlerts = (alertsData as any[]).map(mapMonitoringAlert);
    this._cache.auditLog = (auditData as any[]).map(mapAuditEntry);

    console.log(
      `[SupabaseDataAccess] Loaded: ${this._cache.risks.length} risks, ${this._cache.controls.length} controls, ` +
      `${this._cache.vendors.length} vendors, ${this._cache.issues.length} issues, ` +
      `${this._cache.lossEvents.length} loss events, ${this._cache.kris.length} KRIs, ` +
      `${this._cache.regulatoryChanges.length} reg changes, ${this._cache.riskScenarios.length} scenarios, ` +
      `${this._cache.monitoringAlerts.length} alerts, ${this._cache.auditLog.length} audit entries`
    );
  }

  /**
   * Force refresh all data from Supabase
   */
  async refresh(): Promise<void> {
    this._initialized = false;
    this._initPromise = null;
    await this.initialize();
  }
}
