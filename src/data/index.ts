/**
 * CISO-003: Authorized Data Access Factory
 *
 * Returns a DataAccessLayer wrapped with authorization checks.
 * All UI components should import from this module, NOT from SupabaseDataAccess directly.
 *
 * Architecture:
 *   UI Component → AuthorizedDataAccess (permission check) → SupabaseDataAccess (Edge Function) → DB
 */

import { SupabaseDataAccess } from './SupabaseDataAccess';
import { AuthorizedDataAccess } from './AuthorizedDataAccess';
import { getAuthClient } from '../auth/AuthClient';

let authorizedInstance: AuthorizedDataAccess | null = null;
let rawInstance: SupabaseDataAccess | null = null;

/**
 * Get the authorized data access layer.
 * This is the ONLY way UI components should access data.
 * Enforces permission checks on every operation.
 */
export function getDataAccess(): AuthorizedDataAccess {
  if (!authorizedInstance) {
    const raw = getRawDataAccess();
    const authClient = getAuthClient();
    // Pass a live claims provider — always gets current user, not a stale snapshot
    authorizedInstance = new AuthorizedDataAccess(raw, () => authClient.getUser());
  }
  return authorizedInstance;
}

/**
 * Get raw (unwrapped) data access for system-level operations.
 * Should NOT be used by UI components directly.
 * @internal
 */
export function getRawDataAccess(): SupabaseDataAccess {
  if (!rawInstance) {
    rawInstance = new SupabaseDataAccess();
  }
  return rawInstance;
}

/**
 * Reset the data access layer (e.g., on logout or user switch).
 */
export function resetDataAccess(): void {
  authorizedInstance = null;
  // Don't reset rawInstance — it holds cached data
}

/**
 * Refresh data and re-wrap with current user's permissions.
 */
export async function refreshDataAccess(): Promise<void> {
  const raw = getRawDataAccess();
  await raw.refresh();

  const authClient = getAuthClient();
  authorizedInstance = new AuthorizedDataAccess(raw, () => authClient.getUser());
}

// Re-export types
export type { DataAccessLayer } from './DataAccessLayer';
export { AuthorizedDataAccess } from './AuthorizedDataAccess';
