/**
 * CISO-002/003 REMEDIATION: Per-user and per-role rate limiting
 *
 * Enforces request velocity limits at the application layer.
 * Works in conjunction with Edge Function rate limiting for defense-in-depth.
 *
 * Uses sliding window algorithm to track request timestamps within the last
 * 60 seconds (minute limit) and 3600 seconds (hour limit).
 */

// Rate limit tiers by role
const RATE_LIMITS: Record<string, { requestsPerMinute: number; requestsPerHour: number }> = {
  RiskAdmin: { requestsPerMinute: 120, requestsPerHour: 3000 },
  CRO: { requestsPerMinute: 60, requestsPerHour: 1500 },
  ComplianceOfficer: { requestsPerMinute: 60, requestsPerHour: 1500 },
  TPRMAnalyst: { requestsPerMinute: 40, requestsPerHour: 1000 },
  Auditor: { requestsPerMinute: 30, requestsPerHour: 800 },
  ExaminerView: { requestsPerMinute: 20, requestsPerHour: 500 },
  default: { requestsPerMinute: 30, requestsPerHour: 800 },
};

// Sliding window rate limiter with per-user tracking
export class RateLimiter {
  private windows: Map<string, { timestamps: number[] }> = new Map();
  private cleanupInterval: NodeJS.Timer | null = null;

  constructor() {
    // Periodic cleanup of old windows (every 5 minutes)
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Check if a request is allowed under the rate limit for the given user and role.
   * Returns allowed flag, retry-after time (if limited), and remaining requests in current minute.
   */
  checkLimit(userId: string, role: string): { allowed: boolean; retryAfterMs?: number; remaining: number } {
    const now = Date.now();
    const key = `${userId}:${role}`;
    const limits = RATE_LIMITS[role] || RATE_LIMITS.default;

    // Get or create window
    let window = this.windows.get(key);
    if (!window) {
      window = { timestamps: [] };
      this.windows.set(key, window);
    }

    // Remove timestamps older than 1 hour
    const oneHourAgo = now - 3600000;
    window.timestamps = window.timestamps.filter((ts) => ts > oneHourAgo);

    // Check hour limit
    const lastHour = window.timestamps.filter((ts) => ts > now - 3600000);
    if (lastHour.length >= limits.requestsPerHour) {
      const oldestInWindow = Math.min(...lastHour);
      const retryAfterMs = oldestInWindow + 3600000 - now;
      return {
        allowed: false,
        retryAfterMs: Math.max(1000, retryAfterMs),
        remaining: 0,
      };
    }

    // Check minute limit
    const lastMinute = window.timestamps.filter((ts) => ts > now - 60000);
    if (lastMinute.length >= limits.requestsPerMinute) {
      const oldestInWindow = Math.min(...lastMinute);
      const retryAfterMs = oldestInWindow + 60000 - now;
      return {
        allowed: false,
        retryAfterMs: Math.max(1000, retryAfterMs),
        remaining: 0,
      };
    }

    // Request is allowed — record timestamp
    window.timestamps.push(now);

    // Return remaining requests in current minute
    const remaining = limits.requestsPerMinute - lastMinute.length - 1;

    return {
      allowed: true,
      remaining: Math.max(0, remaining),
    };
  }

  /**
   * Get standard rate limit headers for HTTP response.
   */
  getRateLimitHeaders(userId: string, role: string): Record<string, string> {
    const now = Date.now();
    const key = `${userId}:${role}`;
    const limits = RATE_LIMITS[role] || RATE_LIMITS.default;

    const window = this.windows.get(key);
    if (!window) {
      return {
        'X-RateLimit-Limit': `${limits.requestsPerMinute}`,
        'X-RateLimit-Remaining': `${limits.requestsPerMinute}`,
        'X-RateLimit-Reset': `${Math.floor((now + 60000) / 1000)}`,
      };
    }

    const lastMinute = window.timestamps.filter((ts) => ts > now - 60000);
    const remaining = Math.max(0, limits.requestsPerMinute - lastMinute.length);
    const resetAt = lastMinute.length > 0 ? Math.min(...lastMinute) + 60000 : now + 60000;

    return {
      'X-RateLimit-Limit': `${limits.requestsPerMinute}`,
      'X-RateLimit-Remaining': `${remaining}`,
      'X-RateLimit-Reset': `${Math.floor(resetAt / 1000)}`,
    };
  }

  /**
   * Reset rate limit window for a specific user.
   */
  reset(userId: string): void {
    // Remove all windows for this user (across all roles)
    const keysToDelete: string[] = [];
    for (const key of this.windows.keys()) {
      if (key.startsWith(`${userId}:`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach((key) => this.windows.delete(key));
  }

  /**
   * Internal cleanup — remove old windows that haven't been accessed.
   */
  private cleanup(): void {
    const now = Date.now();
    const oneHourAgo = now - 3600000;

    const keysToDelete: string[] = [];
    for (const [key, window] of this.windows.entries()) {
      const hasRecentTimestamps = window.timestamps.some((ts) => ts > oneHourAgo);
      if (!hasRecentTimestamps) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.windows.delete(key));
  }

  /**
   * Shutdown cleanup interval.
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Singleton instance
let rateLimiterInstance: RateLimiter | null = null;

/**
 * Get or create the singleton RateLimiter instance.
 */
export function getRateLimiter(): RateLimiter {
  if (!rateLimiterInstance) {
    rateLimiterInstance = new RateLimiter();
  }
  return rateLimiterInstance;
}

/**
 * Shutdown the rate limiter (useful for cleanup in tests).
 */
export function shutdownRateLimiter(): void {
  if (rateLimiterInstance) {
    rateLimiterInstance.destroy();
    rateLimiterInstance = null;
  }
}
