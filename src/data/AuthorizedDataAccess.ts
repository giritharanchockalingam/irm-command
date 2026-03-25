/**
 * CISO-003 REMEDIATION: Authorized Data Access Wrapper
 *
 * Wraps the DataAccessLayer with authorization checks.
 * Every data operation is validated against the user's permissions
 * and tenant before being executed.
 *
 * This ensures that even if UI guards are bypassed (e.g., direct URL access),
 * data operations are still enforced server-side style at the data layer.
 */

import type { DataAccessLayer } from './DataAccessLayer';
import type { JWTClaims } from '../auth/AuthClient';
import {
  authorizeDataOperation,
  validateToken,
  type DataOperation,
} from '../security/AuthorizationMiddleware';
import { getAuditLogger } from '../security/AuditLogger';

export class AuthorizedDataAccess {
  private inner: DataAccessLayer;
  private getClaims: () => JWTClaims | null;

  constructor(dataAccess: DataAccessLayer, claimsProvider: () => JWTClaims | null) {
    this.inner = dataAccess;
    this.getClaims = claimsProvider;
  }

  /**
   * Gate any data operation through the authorization middleware.
   * Throws if unauthorized.
   */
  private authorize(operation: DataOperation, entityType: string, entityId?: string): void {
    const claims = this.getClaims();

    // Step 1: Validate token
    const validation = validateToken(claims);
    if (!validation.valid || !validation.claims) {
      getAuditLogger().log({
        userId: 'anonymous',
        userEmail: 'unknown',
        tenantId: 'unknown',
        action: 'DATA_ACCESS_DENIED',
        entityType,
        entityId: entityId || 'N/A',
        module: 'data-access',
        metadata: { operation, reason: validation.error },
        success: false,
        errorMessage: `Token validation failed: ${validation.error}`,
        riskLevel: 'high',
        source: 'system',
      });
      throw new AuthorizationError(`Authentication required: ${validation.error}`);
    }

    // Step 2: Authorize operation
    const result = authorizeDataOperation({
      claims: validation.claims,
      operation,
      entityType,
      entityId,
      targetTenantId: validation.claims.tenant_id,
    });

    if (!result.allowed) {
      throw new AuthorizationError(result.reason);
    }
  }

  // ============================================================
  // Read Operations
  // ============================================================

  getRisks() {
    this.authorize('read', 'risk');
    return this.inner.getRisks();
  }

  getRisk(id: string) {
    this.authorize('read', 'risk', id);
    return this.inner.getRisks().find((r: any) => r.id === id);
  }

  getControls() {
    this.authorize('read', 'control');
    return this.inner.getControls();
  }

  getVendors() {
    this.authorize('read', 'vendor');
    return this.inner.getVendors();
  }

  getIssues() {
    this.authorize('read', 'issue');
    return this.inner.getIssues();
  }

  getLossEvents() {
    this.authorize('read', 'risk');
    return this.inner.getLossEvents();
  }

  getKRIs() {
    this.authorize('read', 'risk');
    return this.inner.getKRIs();
  }

  getRegulatoryChanges() {
    this.authorize('read', 'compliance');
    return this.inner.getRegulatoryChanges();
  }

  getRiskScenarios() {
    this.authorize('read', 'risk');
    return this.inner.getRiskScenarios();
  }

  getMonitoringAlerts() {
    this.authorize('read', 'risk');
    return this.inner.getMonitoringAlerts();
  }

  getAuditLog() {
    this.authorize('read', 'audit');
    return this.inner.getAuditLog();
  }

  // ============================================================
  // Write Operations (via Edge Functions — CISO-002/003)
  // ============================================================

  async createRisk(data: any) {
    this.authorize('create', 'risk');
    const { createRow } = await import('../lib/edgeFunctions');
    const result = await createRow('risks', data);
    getAuditLogger().log({
      userId: this.getClaims()?.sub || 'unknown',
      userEmail: this.getClaims()?.email || 'unknown',
      tenantId: this.getClaims()?.tenant_id || 'unknown',
      action: 'CREATE',
      entityType: 'Risk',
      entityId: result?.id || 'new',
      module: 'data-access',
      metadata: { fields: Object.keys(data) },
      success: true,
      riskLevel: 'medium',
      source: 'ui',
    });
    return result;
  }

  async updateRisk(id: string, data: any) {
    this.authorize('update', 'risk', id);
    const { updateRow } = await import('../lib/edgeFunctions');
    const result = await updateRow('risks', id, data);
    getAuditLogger().log({
      userId: this.getClaims()?.sub || 'unknown',
      userEmail: this.getClaims()?.email || 'unknown',
      tenantId: this.getClaims()?.tenant_id || 'unknown',
      action: 'UPDATE',
      entityType: 'Risk',
      entityId: id,
      module: 'data-access',
      metadata: { fields: Object.keys(data) },
      success: true,
      riskLevel: 'medium',
      source: 'ui',
    });
    return result;
  }

  async deleteRisk(id: string) {
    this.authorize('delete', 'risk', id);
    const { deleteRow } = await import('../lib/edgeFunctions');
    await deleteRow('risks', id);
    getAuditLogger().log({
      userId: this.getClaims()?.sub || 'unknown',
      userEmail: this.getClaims()?.email || 'unknown',
      tenantId: this.getClaims()?.tenant_id || 'unknown',
      action: 'DELETE',
      entityType: 'Risk',
      entityId: id,
      module: 'data-access',
      metadata: {},
      success: true,
      riskLevel: 'high',
      source: 'ui',
    });
  }

  // ============================================================
  // Export Operations
  // ============================================================

  exportAuditLog(format: 'csv' | 'json') {
    this.authorize('export', 'audit');
    const log = this.inner.getAuditLog();
    getAuditLogger().log({
      userId: this.getClaims()?.sub || 'unknown',
      userEmail: this.getClaims()?.email || 'unknown',
      tenantId: this.getClaims()?.tenant_id || 'unknown',
      action: 'DATA_EXPORT',
      entityType: 'audit_log',
      entityId: 'bulk-export',
      module: 'data-access',
      metadata: { format, recordCount: log.length },
      success: true,
      riskLevel: 'medium',
      source: 'ui',
    });
    return log;
  }
}

/**
 * Custom error for authorization failures.
 * UI components can catch this to show appropriate access-denied messages.
 */
export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}
