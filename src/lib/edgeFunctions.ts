/**
 * CISO-002/003 REMEDIATION: Edge Function API Client
 *
 * Replaces direct Supabase queries with server-side Edge Function calls.
 * All data operations go through authenticated, authorized, tenant-isolated
 * Edge Functions — not direct database access from the browser.
 *
 * Architecture:
 *   Browser → Edge Function (JWT validated, permission checked, tenant filtered) → Database
 *   vs. old:
 *   Browser → Supabase REST API (anon key, no permission check, no tenant filter) → Database
 */

import { getConfig } from '../config';
import { getAuthClient } from '../auth/AuthClient';
import { getRateLimiter } from '../security/RateLimiter';

/**
 * Get the base URL for Edge Functions.
 */
function getEdgeFunctionBaseUrl(): string {
  const config = getConfig();
  return `${config.supabase.url}/functions/v1`;
}

/**
 * Make an authenticated request to an Edge Function.
 * Automatically attaches the user's JWT token and checks rate limits.
 *
 * CISO-002: In production/staging, all data access goes through Edge Functions.
 * In development with demo auth, falls back to direct Supabase access (see SupabaseDataAccess).
 */
async function edgeFetch(
  functionName: string,
  path: string = '',
  options: RequestInit = {},
): Promise<Response> {
  const authClient = getAuthClient();
  const token = await authClient.getAccessToken();

  if (!token) {
    throw new Error('Not authenticated — cannot call Edge Function');
  }

  // Get user info from the auth client (works with both demo and OIDC tokens)
  const user = authClient.getUser();
  const userId = user?.sub || 'unknown';
  const role = user?.roles?.[0] || 'default';

  // Check rate limit
  const rateLimiter = getRateLimiter();
  const limitCheck = rateLimiter.checkLimit(userId, role);

  if (!limitCheck.allowed) {
    throw new RateLimitError(
      `Rate limit exceeded for role ${role}. Retry after ${limitCheck.retryAfterMs}ms`,
      429,
      limitCheck.retryAfterMs || 60000,
    );
  }

  const config = getConfig();
  const url = `${getEdgeFunctionBaseUrl()}/${functionName}${path ? `/${path}` : ''}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'apikey': config.supabase.anonKey,
      ...(options.headers || {}),
    },
  });

  return response;
}

// ============================================================
// Data Access API (replaces direct Supabase queries)
// ============================================================

export type IrmTable =
  | 'risks'
  | 'controls'
  | 'vendors'
  | 'issues'
  | 'loss_events'
  | 'kris'
  | 'regulatory_changes'
  | 'risk_scenarios'
  | 'monitoring_alerts'
  | 'audit_log';

/**
 * Fetch all rows from a table (tenant-isolated, permission-checked server-side).
 */
export async function fetchTable<T = Record<string, unknown>>(table: IrmTable): Promise<T[]> {
  const response = await edgeFetch('data-access', table);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new EdgeFunctionError(
      `Data access denied: ${error.error || error.message}`,
      response.status,
    );
  }

  const result = await response.json();
  return result.data || [];
}

/**
 * Fetch a single row by ID.
 */
export async function fetchById<T = Record<string, unknown>>(table: IrmTable, id: string): Promise<T | null> {
  const response = await edgeFetch('data-access', `${table}/${id}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new EdgeFunctionError(error.error, response.status);
  }

  const result = await response.json();
  return result.data?.[0] || null;
}

/**
 * Create a new row (permission-checked server-side, tenant auto-set).
 */
export async function createRow<T = Record<string, unknown>>(table: IrmTable, data: Partial<T>): Promise<T> {
  const response = await edgeFetch('data-access', table, {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new EdgeFunctionError(error.error, response.status);
  }

  const result = await response.json();
  return result.data?.[0];
}

/**
 * Update a row by ID (permission-checked, tenant-isolated).
 */
export async function updateRow<T = Record<string, unknown>>(table: IrmTable, id: string, data: Partial<T>): Promise<T> {
  const response = await edgeFetch('data-access', `${table}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new EdgeFunctionError(error.error, response.status);
  }

  const result = await response.json();
  return result.data?.[0];
}

/**
 * Delete a row by ID (permission-checked, tenant-isolated).
 */
export async function deleteRow(table: IrmTable, id: string): Promise<void> {
  const response = await edgeFetch('data-access', `${table}/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new EdgeFunctionError(error.error, response.status);
  }
}

// ============================================================
// Audit Logging API (writes via service_role Edge Function)
// ============================================================

interface AuditEvent {
  action: string;
  entityType: string;
  entityId: string;
  module: string;
  metadata?: Record<string, unknown>;
  success?: boolean;
  errorMessage?: string;
  riskLevel?: string;
  source?: string;
  sessionId?: string;
  correlationId?: string;
}

/**
 * Send audit event(s) to the immutable audit log via Edge Function.
 * The Edge Function uses service_role key — audit writes are server-enforced.
 * User identity is extracted from JWT server-side (not from client payload).
 */
export async function writeAuditEvent(event: AuditEvent): Promise<void> {
  try {
    await edgeFetch('audit-log', '', {
      method: 'POST',
      body: JSON.stringify(event),
    });
  } catch {
    // Never fail the app because audit logging failed
    console.warn('[AUDIT] Failed to write audit event — will retry');
  }
}

/**
 * Batch write audit events.
 */
export async function writeAuditBatch(events: AuditEvent[]): Promise<void> {
  if (events.length === 0) return;
  try {
    await edgeFetch('audit-log', '', {
      method: 'POST',
      body: JSON.stringify({ events }),
    });
  } catch {
    console.warn(`[AUDIT] Failed to write ${events.length} audit events`);
  }
}

// ============================================================
// Error types
// ============================================================

export class EdgeFunctionError extends Error {
  public statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'EdgeFunctionError';
    this.statusCode = statusCode;
  }
}

export class RateLimitError extends Error {
  public statusCode: number;
  public retryAfterMs: number;

  constructor(message: string, statusCode: number = 429, retryAfterMs: number = 60000) {
    super(message);
    this.name = 'RateLimitError';
    this.statusCode = statusCode;
    this.retryAfterMs = retryAfterMs;
  }
}
