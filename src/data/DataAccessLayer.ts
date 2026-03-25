import {
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
import * as seedData from '../domain/seedData';
import { getIndustrySeedData, clearIndustrySeedCache, type IndustrySeedBundle } from '../domain/industrySeedData';
import { useIndustryStore } from '../store/industryStore';
import { getConfig } from '../config';
import { isSupabaseConfigured } from '../lib/supabase';
import { SupabaseDataAccess } from './SupabaseDataAccess';

/**
 * DataAccessLayer - Repository abstraction for all data reads and writes
 * Currently backed by in-memory seed data
 * Future: swap to API calls without changing consumers
 *
 * This abstraction allows:
 * - Easy switching from in-memory to API backend
 * - Centralized data filtering and pagination
 * - Consistent error handling
 * - Transaction/consistency management
 */
export interface DataAccessLayer {
  // ===== Risk Management =====
  /**
   * Get all risks, optionally filtered by tenant
   */
  getRisks(tenantId?: string): Risk[];

  /**
   * Get a specific risk by ID
   */
  getRiskById(id: string): Risk | undefined;

  /**
   * Get risks filtered by status
   */
  getRisksByStatus(status: string, tenantId?: string): Risk[];

  /**
   * Get risks by risk category
   */
  getRisksByCategory(category: string, tenantId?: string): Risk[];

  // ===== Control Management =====
  /**
   * Get all controls, optionally filtered by tenant
   */
  getControls(tenantId?: string): Control[];

  /**
   * Get a specific control by ID
   */
  getControlById(id: string): Control | undefined;

  /**
   * Get controls filtered by framework (COSO, ISO, NIST, etc.)
   */
  getControlsByFramework(framework: string, tenantId?: string): Control[];

  /**
   * Get controls by effectiveness rating
   */
  getControlsByEffectiveness(
    effectiveness: string,
    tenantId?: string
  ): Control[];

  /**
   * Get controls linked to a specific risk
   */
  getControlsByRisk(riskId: string, tenantId?: string): Control[];

  // ===== Vendor/TPRM Management =====
  /**
   * Get all vendors, optionally filtered by tenant
   */
  getVendors(tenantId?: string): Vendor[];

  /**
   * Get a specific vendor by ID
   */
  getVendorById(id: string): Vendor | undefined;

  /**
   * Get vendors filtered by risk rating
   */
  getVendorsByRiskRating(rating: string, tenantId?: string): Vendor[];

  /**
   * Get vendors filtered by category
   */
  getVendorsByCategory(category: string, tenantId?: string): Vendor[];

  // ===== Issue Management =====
  /**
   * Get all issues, optionally filtered by tenant
   */
  getIssues(tenantId?: string): Issue[];

  /**
   * Get a specific issue by ID
   */
  getIssueById(id: string): Issue | undefined;

  /**
   * Get issues by severity
   */
  getIssuesBySeverity(severity: string, tenantId?: string): Issue[];

  /**
   * Get issues by status
   */
  getIssuesByStatus(status: string, tenantId?: string): Issue[];

  // ===== Loss Events & Incidents =====
  /**
   * Get all loss events, optionally filtered by tenant
   */
  getLossEvents(tenantId?: string): LossEvent[];

  /**
   * Get loss events by type
   */
  getLossEventsByType(type: string, tenantId?: string): LossEvent[];

  // ===== Key Risk Indicators =====
  /**
   * Get all KRIs, optionally filtered by tenant
   */
  getKRIs(tenantId?: string): KRI[];

  /**
   * Get KRIs that have exceeded their threshold
   */
  getKRIsAboveThreshold(tenantId?: string): KRI[];

  // ===== Regulatory Changes =====
  /**
   * Get all regulatory changes, optionally filtered by tenant
   */
  getRegulatoryChanges(tenantId?: string): RegulatoryChange[];

  /**
   * Get regulatory changes by status
   */
  getRegulatoryChangesByStatus(
    status: string,
    tenantId?: string
  ): RegulatoryChange[];

  // ===== Risk Scenarios =====
  /**
   * Get all risk scenarios, optionally filtered by tenant
   */
  getRiskScenarios(tenantId?: string): RiskScenario[];

  /**
   * Get risk scenarios by impact level
   */
  getRiskScenariosByImpact(impact: string, tenantId?: string): RiskScenario[];

  // ===== Monitoring & Alerts =====
  /**
   * Get all monitoring alerts, optionally filtered by tenant
   */
  getMonitoringAlerts(tenantId?: string): MonitoringAlert[];

  /**
   * Get alerts for a specific vendor
   */
  getAlertsByVendor(vendorId: string, tenantId?: string): MonitoringAlert[];

  /**
   * Get alerts by severity
   */
  getAlertsBySeverity(severity: string, tenantId?: string): MonitoringAlert[];

  /**
   * Get active (unresolved) alerts
   */
  getActiveAlerts(tenantId?: string): MonitoringAlert[];

  // ===== Audit Log =====
  /**
   * Get audit log entries, optionally filtered by tenant
   */
  getAuditLog(tenantId?: string): AuditEntry[];

  /**
   * Get audit entries for a specific user
   */
  getAuditLogByUser(userId: string, tenantId?: string): AuditEntry[];

  /**
   * Get audit entries for a specific resource
   */
  getAuditLogByResource(resourceId: string, tenantId?: string): AuditEntry[];

  /**
   * Get audit entries by action type
   */
  getAuditLogByAction(action: string, tenantId?: string): AuditEntry[];
}

/**
 * InMemoryDataAccess - implements DataAccessLayer using in-memory seed data
 * Used for prototype/demo environments
 */
class InMemoryDataAccess implements DataAccessLayer {
  private tenantId: string;

  constructor() {
    this.tenantId = getConfig().tenant.id;
  }

  /**
   * Get the current industry's seed data bundle.
   * Reads the industry from the Zustand store (works outside React via getState()).
   */
  private getData(): IndustrySeedBundle {
    const industryId = useIndustryStore.getState().industryId;
    return getIndustrySeedData(industryId);
  }

  /**
   * Filter data by tenant ID if provided.
   * If items don't have a tenantId field (e.g. seed data), return all items unfiltered.
   */
  private filterByTenant<T>(
    items: T[],
    tenantId?: string
  ): T[] {
    const id = tenantId || this.tenantId;
    if (items.length === 0 || !('tenantId' in (items[0] as Record<string, unknown>))) {
      return items;
    }
    return items.filter((item) => (item as Record<string, unknown>).tenantId === id);
  }

  // ===== Risk Methods =====
  getRisks(tenantId?: string): Risk[] {
    return this.filterByTenant(this.getData().risks, tenantId);
  }

  getRiskById(id: string): Risk | undefined {
    return this.getData().risks.find((r) => r.id === id);
  }

  getRisksByStatus(status: string, tenantId?: string): Risk[] {
    return this.filterByTenant(this.getData().risks, tenantId).filter(
      (r) => r.status === status
    );
  }

  getRisksByCategory(category: string, tenantId?: string): Risk[] {
    return this.filterByTenant(this.getData().risks, tenantId).filter(
      (r) => r.category === category
    );
  }

  // ===== Control Methods =====
  getControls(tenantId?: string): Control[] {
    return this.filterByTenant(this.getData().controls, tenantId);
  }

  getControlById(id: string): Control | undefined {
    return this.getData().controls.find((c) => c.id === id);
  }

  getControlsByFramework(framework: string, tenantId?: string): Control[] {
    return this.filterByTenant(this.getData().controls, tenantId).filter(
      (c) => c.framework === framework
    );
  }

  getControlsByEffectiveness(
    effectiveness: string,
    tenantId?: string
  ): Control[] {
    return this.filterByTenant(this.getData().controls, tenantId).filter(
      (c) => c.effectiveness === effectiveness
    );
  }

  getControlsByRisk(riskId: string, tenantId?: string): Control[] {
    return this.filterByTenant(this.getData().controls, tenantId).filter((c) =>
      (c as any).linkedRiskIds?.includes(riskId)
    );
  }

  // ===== Vendor Methods =====
  getVendors(tenantId?: string): Vendor[] {
    return this.filterByTenant(this.getData().vendors, tenantId);
  }

  getVendorById(id: string): Vendor | undefined {
    return this.getData().vendors.find((v) => v.id === id);
  }

  getVendorsByRiskRating(rating: string, tenantId?: string): Vendor[] {
    return this.filterByTenant(this.getData().vendors, tenantId).filter(
      (v) => (v as any).riskRating === rating
    );
  }

  getVendorsByCategory(category: string, tenantId?: string): Vendor[] {
    return this.filterByTenant(this.getData().vendors, tenantId).filter(
      (v) => v.category === category
    );
  }

  // ===== Issue Methods =====
  getIssues(tenantId?: string): Issue[] {
    return this.filterByTenant(this.getData().issues, tenantId);
  }

  getIssueById(id: string): Issue | undefined {
    return this.getData().issues.find((i) => i.id === id);
  }

  getIssuesBySeverity(severity: string, tenantId?: string): Issue[] {
    return this.filterByTenant(this.getData().issues, tenantId).filter(
      (i) => i.severity === severity
    );
  }

  getIssuesByStatus(status: string, tenantId?: string): Issue[] {
    return this.filterByTenant(this.getData().issues, tenantId).filter(
      (i) => i.status === status
    );
  }

  // ===== Loss Event Methods =====
  getLossEvents(tenantId?: string): LossEvent[] {
    return this.filterByTenant(this.getData().lossEvents, tenantId);
  }

  getLossEventsByType(type: string, tenantId?: string): LossEvent[] {
    return this.filterByTenant(this.getData().lossEvents, tenantId).filter(
      (e) => (e as any).type === type
    );
  }

  // ===== KRI Methods =====
  getKRIs(tenantId?: string): KRI[] {
    return this.filterByTenant(this.getData().kris, tenantId);
  }

  getKRIsAboveThreshold(tenantId?: string): KRI[] {
    return this.filterByTenant(this.getData().kris, tenantId).filter(
      (k) => k.currentValue > k.threshold
    );
  }

  // ===== Regulatory Change Methods =====
  getRegulatoryChanges(tenantId?: string): RegulatoryChange[] {
    return this.filterByTenant(this.getData().regulatoryChanges, tenantId);
  }

  getRegulatoryChangesByStatus(
    status: string,
    tenantId?: string
  ): RegulatoryChange[] {
    return this.filterByTenant(this.getData().regulatoryChanges, tenantId).filter(
      (r) => r.status === status
    );
  }

  // ===== Risk Scenario Methods =====
  getRiskScenarios(tenantId?: string): RiskScenario[] {
    return this.filterByTenant(this.getData().riskScenarios, tenantId);
  }

  getRiskScenariosByImpact(impact: string, tenantId?: string): RiskScenario[] {
    return this.filterByTenant(this.getData().riskScenarios, tenantId).filter(
      (s) => s.impactLevel === impact
    );
  }

  // ===== Monitoring Alert Methods =====
  getMonitoringAlerts(tenantId?: string): MonitoringAlert[] {
    return this.filterByTenant(this.getData().monitoringAlerts, tenantId);
  }

  getAlertsByVendor(
    vendorId: string,
    tenantId?: string
  ): MonitoringAlert[] {
    return this.filterByTenant(this.getData().monitoringAlerts, tenantId).filter(
      (a) => a.vendorId === vendorId
    );
  }

  getAlertsBySeverity(severity: string, tenantId?: string): MonitoringAlert[] {
    return this.filterByTenant(this.getData().monitoringAlerts, tenantId).filter(
      (a) => a.severity === severity
    );
  }

  getActiveAlerts(tenantId?: string): MonitoringAlert[] {
    return this.filterByTenant(this.getData().monitoringAlerts, tenantId).filter(
      (a) => (a as any).resolved === false
    );
  }

  // ===== Audit Log Methods =====
  getAuditLog(tenantId?: string): AuditEntry[] {
    return this.filterByTenant(this.getData().auditLog, tenantId);
  }

  getAuditLogByUser(userId: string, tenantId?: string): AuditEntry[] {
    return this.filterByTenant(this.getData().auditLog, tenantId).filter(
      (e) => (e as any).userId === userId
    );
  }

  getAuditLogByResource(resourceId: string, tenantId?: string): AuditEntry[] {
    return this.filterByTenant(this.getData().auditLog, tenantId).filter(
      (e) => (e as any).resourceId === resourceId
    );
  }

  getAuditLogByAction(action: string, tenantId?: string): AuditEntry[] {
    return this.filterByTenant(this.getData().auditLog, tenantId).filter(
      (e) => e.action === action
    );
  }
}

/**
 * Singleton instance of DataAccessLayer
 * Ensures only one instance exists across the application
 */
let instance: DataAccessLayer | null = null;
let supabaseInstance: SupabaseDataAccess | null = null;

/**
 * Get the DataAccessLayer singleton instance.
 * In demo/prototype auth mode, always uses InMemoryDataAccess (seed data)
 * because demo tokens cannot authenticate with Supabase RLS.
 * Only uses SupabaseDataAccess in production/staging with real auth.
 */
export function getDataAccess(): DataAccessLayer {
  if (!instance) {
    const config = getConfig();
    const isDemoMode = config.auth.mode === 'demo';
    const isProductionAuth = config.app.environment === 'production' || config.app.environment === 'staging';

    if (isSupabaseConfigured() && !isDemoMode && isProductionAuth) {
      supabaseInstance = new SupabaseDataAccess();
      instance = supabaseInstance;
    } else {
      instance = new InMemoryDataAccess();
    }
  }
  return instance;
}

/**
 * Initialize the data access layer (async).
 * Must be called at app startup before rendering.
 * For InMemoryDataAccess this is a no-op.
 * For SupabaseDataAccess this fetches all data from Supabase.
 */
export async function initializeDataAccess(): Promise<void> {
  const dal = getDataAccess();
  if (supabaseInstance && !supabaseInstance.isInitialized) {
    await supabaseInstance.initialize();
  }
  return;
}

/**
 * Check if the data access layer is ready (initialized)
 */
export function isDataAccessReady(): boolean {
  if (supabaseInstance) {
    return supabaseInstance.isInitialized;
  }
  return true; // InMemory is always ready
}

/**
 * React hook to access the DataAccessLayer
 * Wraps getDataAccess() for use in components
 */
export function useDataAccess(): DataAccessLayer {
  return getDataAccess();
}

/**
 * Reset the data access instance (useful for testing)
 * Only available in non-production environments
 */
export function resetDataAccess(): void {
  if (getConfig().app.environment !== 'production') {
    instance = null;
    supabaseInstance = null;
    clearIndustrySeedCache();
  } else {
    console.warn('Cannot reset DataAccess in production');
  }
}
