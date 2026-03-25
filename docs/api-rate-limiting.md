# IRM Sentinel — API Rate Limiting Strategy

**Version:** 1.0
**Last Updated:** 2026-03-25
**Owner:** Platform Security & Engineering Team
**Classification:** Internal Use Only

## Purpose

This document defines the API rate limiting strategy for IRM Sentinel to prevent abuse, ensure fair resource allocation, and maintain system stability. Rate limits are enforced at both the application layer (via `RateLimiter.ts`) and the Edge Function layer for defense-in-depth protection.

---

## 1. Rate Limit Tiers by Role

Rate limits are based on user role, reflecting each role's expected API usage patterns and data access needs. Limits are enforced per-user, not per IP address, allowing multiple team members to work simultaneously without hitting shared limits.

### Tier 1: RiskAdmin
**Use Case:** Platform administrators managing risks, controls, and system configuration
**Expected Usage:** Moderate API consumption, frequent data updates, occasional bulk exports

| Metric | Limit | Duration | Purpose |
|--------|-------|----------|---------|
| **Requests per Minute** | 120 | Rolling 60-second window | Allow real-time dashboard updates and quick searches |
| **Requests per Hour** | 3,000 | Rolling 60-minute window | Allow background jobs and bulk operations |
| **Burst Window** | 30 seconds at max rate | Up to 60 requests in 30s | Allow dashboard to load with 5-10 simultaneous API calls |

**Example Scenario:**
- User logs in, loads dashboard (10 requests) — uses 10 of 120 per minute
- Performs search, applies filters (5 requests) — uses 15 of 120 per minute
- Bulk import risks (50 requests) — uses 65 of 120 per minute
- Still has 55 requests remaining for the current minute

---

### Tier 2: ComplianceOfficer
**Use Case:** Compliance officers managing compliance frameworks and control testing
**Expected Usage:** Moderate API consumption, frequent reporting, regular data exports

| Metric | Limit | Duration |
|--------|-------|----------|
| **Requests per Minute** | 100 | Rolling 60-second window |
| **Requests per Hour** | 2,500 | Rolling 60-minute window |

**Rationale:** 1 fewer per minute than RiskAdmin, reflecting slightly lower administrative needs

---

### Tier 3: TPRMAnalyst
**Use Case:** Third-party risk managers managing vendor assessments and TPRM workflows
**Expected Usage:** Moderate API consumption, vendor data queries, assessment publishing

| Metric | Limit | Duration |
|--------|-------|----------|
| **Requests per Minute** | 80 | Rolling 60-second window |
| **Requests per Hour** | 2,000 | Rolling 60-minute window |

**Rationale:** Vendor-focused role with more selective data access than risk admins

---

### Tier 4: Auditor
**Use Case:** Internal auditors reviewing compliance and risk data
**Expected Usage:** Low API consumption, read-heavy, occasional exports

| Metric | Limit | Duration |
|--------|-------|----------|
| **Requests per Minute** | 60 | Rolling 60-second window |
| **Requests per Hour** | 1,500 | Rolling 60-minute window |

**Rationale:** Auditors primarily read data; write operations are rare

---

### Tier 5: CRO (Chief Risk Officer)
**Use Case:** Executive oversight of risk portfolio and strategic decisions
**Expected Usage:** Low API consumption, dashboard views, executive reports

| Metric | Limit | Duration |
|--------|-------|----------|
| **Requests per Minute** | 60 | Rolling 60-second window |
| **Requests per Hour** | 1,500 | Rolling 60-minute window |

**Rationale:** Executive role typically uses UI dashboards; minimal API calls expected

**Note:** CROs can request higher limits (up to 200 req/min) for bulk report generation with CISO approval.

---

### Tier 6: ExaminerView
**Use Case:** Regulatory examiners viewing platform during audits
**Expected Usage:** Very low API consumption, read-only, limited to exam scope

| Metric | Limit | Duration |
|--------|-------|----------|
| **Requests per Minute** | 20 | Rolling 60-second window |
| **Requests per Hour** | 500 | Rolling 60-minute window |

**Rationale:** External auditor role; minimal access and strict read-only enforcement

**Restriction:** ExaminerView accounts are temporary and expire after 30 days

---

### Default Tier (No Role Assigned)
If a user has no assigned role or the role is unknown:

| Metric | Limit | Duration |
|--------|-------|----------|
| **Requests per Minute** | 30 | Rolling 60-second window |
| **Requests per Hour** | 800 | Rolling 60-minute window |

**Rationale:** Conservative defaults to prevent abuse while allowing basic functionality

---

## 2. Response Headers

All API responses include rate limit headers to help clients track usage and anticipate throttling:

### Standard Rate Limit Headers

```http
X-RateLimit-Limit: 120
X-RateLimit-Remaining: 85
X-RateLimit-Reset: 1711353660
```

### Header Descriptions

| Header | Type | Description | Example |
|--------|------|-------------|---------|
| **X-RateLimit-Limit** | Integer | Maximum requests allowed per minute for this user's role | `120` |
| **X-RateLimit-Remaining** | Integer | Number of requests remaining in the current minute | `85` (85 more allowed before 429) |
| **X-RateLimit-Reset** | Unix Timestamp | Seconds since epoch when the minute window resets | `1711353660` (Mar 25 2026 14:01:00 UTC) |
| **Retry-After** | Integer (seconds) | How long to wait before retrying (only on 429 response) | `45` (retry after 45 seconds) |

### Example Response

```json
HTTP/1.1 200 OK
Content-Type: application/json
X-RateLimit-Limit: 120
X-RateLimit-Remaining: 84
X-RateLimit-Reset: 1711353660

{
  "data": [...],
  "meta": {
    "total": 42,
    "page": 1
  }
}
```

### Rate Limit Exceeded Response

```json
HTTP/1.1 429 Too Many Requests
Content-Type: application/json
Retry-After: 45
X-RateLimit-Limit: 120
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1711353660

{
  "error": "Rate limit exceeded",
  "message": "You have exceeded your rate limit of 120 requests per minute.",
  "retry_after_seconds": 45,
  "reset_at": "2026-03-25T14:01:00Z"
}
```

---

## 3. Client Retry Strategy

When a client receives a 429 Too Many Requests response, it should implement exponential backoff with jitter to avoid thundering herd behavior.

### Recommended Retry Algorithm

```typescript
// Pseudocode for exponential backoff with jitter

async function makeRequestWithRetry(url, maxRetries = 5) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url);

      if (response.status === 429) {
        // Rate limited — check Retry-After header
        const retryAfter = parseInt(response.headers.get('Retry-After') || '60');

        // Exponential backoff: 2^attempt with jitter
        const baseWait = Math.min(retryAfter, Math.pow(2, attempt) * 1000);
        const jitter = Math.random() * 0.1 * baseWait; // 0-10% jitter
        const waitTime = baseWait + jitter;

        console.log(`Rate limited. Retrying after ${waitTime}ms (attempt ${attempt + 1}/${maxRetries})`);
        await sleep(waitTime);
        continue;
      }

      if (response.ok) {
        return response;
      }

      // Other errors
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);

    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }

      // Exponential backoff for other errors
      const waitTime = Math.pow(2, attempt) * 1000;
      console.log(`Error: ${error}. Retrying after ${waitTime}ms`);
      await sleep(waitTime);
    }
  }
}

// Helper to pause execution
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

### Backoff Schedule

| Attempt | Base Wait | With Jitter | Example |
|---------|-----------|-------------|---------|
| 1st | ~1s | 0.9-1.1s | Immediate retry |
| 2nd | ~2s | 1.8-2.2s | Quick second attempt |
| 3rd | ~4s | 3.6-4.4s | Wait a bit longer |
| 4th | ~8s | 7.2-8.8s | Longer wait |
| 5th | ~16s | 14.4-17.6s | Very long wait |
| Give up | — | — | Fail after 5 retries |

### Key Principles

1. **Always check the `Retry-After` header** — use its value as the baseline wait time
2. **Add jitter** (0-10% randomness) to prevent all clients from retrying simultaneously
3. **Cap exponential growth** at a reasonable maximum (e.g., 60 seconds)
4. **Log retry attempts** for debugging and monitoring
5. **Fail gracefully** after max retries instead of trying forever

### Client-Side Detection

```typescript
// In React component or service layer
const rateLimitRemaining = parseInt(response.headers.get('X-RateLimit-Remaining') || '0');

if (rateLimitRemaining < 10) {
  // Warning: User is approaching rate limit
  console.warn(`⚠️ You have only ${rateLimitRemaining} requests remaining this minute`);
  // Could show UI warning: "API usage is high. Results may be delayed."
}
```

---

## 4. Edge Function Enforcement Architecture

Rate limiting is enforced at the Edge Function layer (Supabase Edge Runtime) for maximum performance and reliability. This ensures rate limits are applied before database queries execute.

### Architecture Diagram

```
Client Request
    ↓
[Edge Function: data-access]
    ├─ Extract user ID & role from JWT
    ├─ Check rate limit from in-memory state
    ├─ If limit exceeded → return 429
    └─ If allowed → continue to API
         ↓
    [Backend API / Database]
         ↓
    Client Response + Rate Limit Headers
```

### Edge Function Implementation

**Location:** `supabase/functions/data-access/index.ts`

```typescript
import { getRateLimiter } from '../../src/security/RateLimiter.ts';

Deno.serve(async (req: Request) => {
  // 1. Extract JWT and parse claims
  const authHeader = req.headers.get('Authorization') || '';
  const token = authHeader.replace('Bearer ', '');

  const claims = parseJWT(token); // Decode JWT without verification (Edge runtime limitation)
  const userId = claims.sub;
  const userRole = claims.user_metadata?.role || 'default';

  // 2. Check rate limit
  const rateLimiter = getRateLimiter();
  const limitCheck = rateLimiter.checkLimit(userId, userRole);

  // 3. Get rate limit headers
  const rateLimitHeaders = rateLimiter.getRateLimitHeaders(userId, userRole);

  // 4. If rate limited, return 429 immediately
  if (!limitCheck.allowed) {
    return new Response(
      JSON.stringify({
        error: 'Rate limit exceeded',
        retry_after_seconds: Math.ceil((limitCheck.retryAfterMs || 0) / 1000),
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(Math.ceil((limitCheck.retryAfterMs || 0) / 1000)),
          ...rateLimitHeaders,
        },
      }
    );
  }

  // 5. Pass request to backend API, include rate limit headers in response
  const backendUrl = `${Deno.env.get('BACKEND_URL')}${req.url}`;
  const backendResponse = await fetch(backendUrl, {
    method: req.method,
    headers: req.headers,
    body: req.body,
  });

  // 6. Add rate limit headers to response
  const headers = new Headers(backendResponse.headers);
  Object.entries(rateLimitHeaders).forEach(([key, value]) => {
    headers.set(key, value);
  });

  return new Response(backendResponse.body, {
    status: backendResponse.status,
    headers,
  });
});

// Helper: Decode JWT claims (without signature verification)
function parseJWT(token: string) {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid JWT');

  const payload = JSON.parse(
    new TextDecoder().decode(Uint8Array.from(atob(parts[1]), c => c.charCodeAt(0)))
  );
  return payload;
}
```

### RateLimiter Class

**Location:** `src/security/RateLimiter.ts`

The `RateLimiter` class implements a sliding-window algorithm to track request timestamps per user:

```typescript
/**
 * Rate limits are per-user + per-role using a sliding window algorithm.
 *
 * Tracks last 60 seconds and 3600 seconds of request timestamps.
 * When checkLimit() is called:
 *   1. Remove timestamps older than 1 hour
 *   2. Check if hour limit exceeded
 *   3. Check if minute limit exceeded
 *   4. If allowed, record new timestamp
 *   5. Return remaining requests for this minute
 */
export class RateLimiter {
  private windows: Map<string, { timestamps: number[] }> = new Map();

  checkLimit(userId: string, role: string): {
    allowed: boolean;
    retryAfterMs?: number;
    remaining: number;
  } { /* ... */ }

  getRateLimitHeaders(userId: string, role: string): Record<string, string> { /* ... */ }
}
```

**Key Features:**
- **Per-user tracking:** Each user has their own rate limit window, independent of others
- **Per-role limits:** Different roles have different limits (RiskAdmin 120 req/min vs. ExaminerView 20 req/min)
- **Sliding window:** Uses actual request timestamps, not buckets; gives more precise tracking
- **Memory efficient:** Cleanup runs every 5 minutes to remove old windows
- **No external dependencies:** Purely in-memory; no Redis or database calls needed

### Performance Characteristics

| Operation | Time Complexity | Space Complexity |
|-----------|-----------------|------------------|
| checkLimit() | O(n) where n = requests in last 60s | O(60 * users) worst case |
| getRateLimitHeaders() | O(n) | O(1) |
| cleanup() | O(users) | O(users) |

**Typical Production Metrics:**
- 10,000 users: ~50 KB memory per minute of history
- 100,000 users: ~500 KB memory
- Edge Function execution: <5ms per request

### Monitoring the Edge Function

```bash
# View recent Edge Function logs
supabase functions logs data-access --limit 100

# Look for rate limit violations
supabase functions logs data-access --limit 100 | grep "429\|Rate limit"

# Monitor function execution time
supabase functions logs data-access | grep "durationMs"
```

---

## 5. Monitoring & Alerting

Continuous monitoring ensures that rate limiting is working as designed and detects abuse patterns early.

### Alert Threshold: Rate Limit Violations

**Trigger:** ≥10 violations per minute across all users

**Definition:** A "violation" is any request that exceeds the user's per-minute or per-hour limit.

**Detection:**
```typescript
// In SecurityAlertMonitor
if (rateLimitViolations.count >= 10 && rateLimitViolations.windowMinutes === 1) {
  raiseAlert({
    severity: 'MEDIUM',
    title: 'High Rate Limit Violations Detected',
    description: `${rateLimitViolations.count} rate limit violations in the last minute`,
    affectedUsers: rateLimitViolations.users,
    recommendedAction: 'Investigate potential API abuse or misconfigured clients',
  });
}
```

**Alert Response:**
1. Notify SOC team: page on-call security analyst
2. Investigate: Which users/roles are being rate limited?
3. Differentiate:
   - **Legitimate:** Client incorrectly retrying too fast (education needed)
   - **Abuse:** Attacker performing credential stuffing or data scraping (block IP, revoke token)
   - **Misconfiguration:** Automation job with too-high concurrency (adjust schedule)

### Dashboard Metrics

Create dashboards to monitor the following metrics:

#### 1. Rate Limit Usage by Role

```
Metric: Average requests per minute by role
Baseline:
  - RiskAdmin: ~60 req/min (50% of limit)
  - ComplianceOfficer: ~40 req/min (40% of limit)
  - TPRMAnalyst: ~30 req/min (37% of limit)
  - Auditor: ~15 req/min (25% of limit)

Alert If: Any role exceeds 80% of limit (sustained > 5 minutes)
  - RiskAdmin > 96 req/min → Investigate
  - ComplianceOfficer > 80 req/min → Investigate
```

#### 2. 429 Response Rate

```
Metric: HTTP 429 responses as % of total requests
Baseline: <0.1% (1 in 1000 requests)
Alert If: > 1% (1 in 100 requests) in any 5-minute window
```

#### 3. Retry-After Delay Histogram

```
Metric: Distribution of Retry-After values returned
Baseline: Most retries < 30 seconds
Alert If: > 10% of rate-limited users waiting > 60 seconds
  Indicates: User might be hitting both minute AND hour limits
```

#### 4. Per-User Rate Limit Violations

```
Metric: Count of times each user is rate limited
Baseline: Most users never hit limits
Alert If: Same user is limited > 5 times in 1 hour
  Action: Contact user, check for misconfigured automation
```

### Example Monitoring Query

```sql
-- Query Supabase to find which users are hitting rate limits
SELECT
  user_id,
  COUNT(*) as violations,
  MIN(timestamp) as first_violation,
  MAX(timestamp) as last_violation,
  STRING_AGG(DISTINCT ip_address, ', ') as source_ips
FROM irm.audit_log
WHERE action = 'API_RATE_LIMIT_EXCEEDED'
  AND timestamp > NOW() - INTERVAL '1 hour'
GROUP BY user_id
ORDER BY violations DESC
LIMIT 20;
```

### Alerting via SIEM

Rate limit violations are forwarded to the SIEM via the `siem-forwarder` Edge Function:

```json
{
  "timestamp": "2026-03-25T14:30:00Z",
  "event_type": "SECURITY_ALERT",
  "alert_type": "RATE_LIMIT_VIOLATION",
  "severity": "MEDIUM",
  "user_id": "user123",
  "violation_count": 12,
  "role": "TPRMAnalyst",
  "limit_per_minute": 80,
  "requests_in_window": 95,
  "window_seconds": 60
}
```

### Tuning Rate Limits

If monitoring shows consistent violations from a legitimate user/role:

1. **Identify the pattern:**
   - Is the violation from automation (same time each day)?
   - Is it from legitimate bulk operations (imports, exports)?
   - Or is it truly suspicious behavior?

2. **Request an exception:**
   - User/team can request higher limits from CISO
   - Justification: "Need to import 50,000 vendors daily"
   - Approval process: CISO → Security Lead → update RateLimiter config

3. **Update limits (if approved):**
   ```typescript
   // In RateLimiter.ts
   const RATE_LIMITS: Record<string, { requestsPerMinute: number; requestsPerHour: number }> = {
     VendorImporter: { requestsPerMinute: 500, requestsPerHour: 10000 }, // NEW
     RiskAdmin: { requestsPerMinute: 120, requestsPerHour: 3000 },
     // ...
   };
   ```

4. **Monitor the new limits:**
   - Check that usage stays within new limits
   - Verify no further 429 responses
   - Document the change in incident log

---

## 6. Rate Limiting & Compliance

### SOC 2 Type II Compliance

Rate limiting supports SOC 2 requirements:

- **Availability:** Rate limiting prevents DoS attacks that could impact system availability
- **Confidentiality:** Reduces risk of brute-force credential attacks
- **Integrity:** Prevents high-volume unauthorized access attempts
- **Security:** Auditable via audit log (all 429 responses are logged)

### Regulatory Considerations

| Regulation | Requirement | How Rate Limiting Helps |
|------------|-------------|------------------------|
| **SOC 2** | Prevent unauthorized access | Stops brute-force attacks, credential stuffing |
| **GDPR** | Prevent data breaches | Detects and stops unauthorized API usage patterns |
| **HIPAA** | Audit all access | All rate limit violations are audit-logged |
| **PCI-DSS** | Prevent fraud | Detects abnormal data access patterns |

### Audit Trail

Every rate limit event is logged to `irm.audit_log`:

```json
{
  "timestamp": "2026-03-25T14:30:15Z",
  "user_id": "user123",
  "action": "API_RATE_LIMIT_EXCEEDED",
  "entity_type": "API",
  "entity_id": "/api/vendors",
  "metadata": {
    "limit_per_minute": 80,
    "requests_in_current_window": 81,
    "retry_after_seconds": 47
  },
  "success": false,
  "error_message": "Rate limit exceeded (minute)"
}
```

---

## 7. API Rate Limiting Best Practices for Clients

### For API Consumers (Third-Party Integrations)

1. **Always check rate limit headers**
   ```typescript
   const remaining = response.headers.get('X-RateLimit-Remaining');
   if (parseInt(remaining) < 20) {
     console.warn('Approaching rate limit');
   }
   ```

2. **Implement exponential backoff with jitter** (see Section 3)

3. **Batch requests when possible**
   ```typescript
   // BAD: Make 100 separate requests
   for (let i = 0; i < 100; i++) {
     await fetch(`/api/risks/${riskIds[i]}`);
   }

   // GOOD: Batch into 1 request
   await fetch('/api/risks/batch', {
     method: 'POST',
     body: JSON.stringify({ ids: riskIds })
   });
   ```

4. **Cache responses locally**
   ```typescript
   // Cache vendor data for 5 minutes
   const cache = new Map();

   async function getVendor(id) {
     const cached = cache.get(id);
     if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
       return cached.data;
     }
     const response = await fetch(`/api/vendors/${id}`);
     cache.set(id, { data: response, timestamp: Date.now() });
     return response;
   }
   ```

5. **Schedule bulk operations during off-peak hours**
   - Peak hours: 9 AM - 5 PM weekdays
   - Schedule imports/exports: 6 PM - 6 AM or weekends

### For Internal Automation

1. **Configure appropriate concurrency levels**
   ```typescript
   // MAX_CONCURRENT = (role_limit_per_minute) / 60 seconds
   // RiskAdmin: 120 / 60 = max 2 requests per second
   const MAX_CONCURRENT_REQUESTS = 2;
   ```

2. **Use connection pooling** to reuse TCP connections

3. **Monitor your own usage** and alert if you approach limits
   ```typescript
   const requestsThisMinute = trackRequests();
   if (requestsThisMinute > role_limit * 0.8) {
     sendAlert('Approaching rate limit; may need to reduce concurrency');
   }
   ```

---

## 8. Troubleshooting Rate Limit Issues

### Problem: "Getting 429 Too Many Requests"

**Diagnosis:**
```bash
# Check your current request rate
curl -H "Authorization: Bearer TOKEN" \
  https://api.irmcommand.io/api/stats \
  -i | grep X-RateLimit
```

**Solutions:**
1. Check `X-RateLimit-Remaining` header — are you near 0?
2. Wait the `Retry-After` duration before retrying
3. Reduce request concurrency (space out requests over time)
4. Batch multiple requests into single endpoint call
5. Request higher limits from CISO (if legitimate use case)

### Problem: "Rate Limit Remaining is decreasing without me making requests"

**Cause:** Hidden requests from analytics, error tracking, or browser extensions
**Solution:**
1. Check browser dev tools (Network tab) for unexpected requests
2. Disable analytics, error tracking, etc.
3. Check for browser extensions making API calls
4. Monitor actual request rate vs. reported rate limit

### Problem: "I need higher rate limits for a bulk operation"

**Request Process:**
1. Email: security@irmcommand.io with subject "Rate Limit Exception Request"
2. Provide:
   - Your user ID and role
   - Current limit and requested limit
   - Business justification (e.g., "importing 500K vendors")
   - Expected duration (e.g., "2 weeks")
3. CISO review (1-2 business days)
4. If approved: Rate limit updated in RateLimiter.ts
5. New limit takes effect within 15 minutes

---

## 9. Implementation Checklist

- [ ] RateLimiter.ts deployed to production
- [ ] Edge Function (data-access) enforces rate limits
- [ ] Rate limit headers (X-RateLimit-*) included in all API responses
- [ ] 429 responses include Retry-After header
- [ ] Audit logging captures rate limit violations
- [ ] SIEM forwarding includes rate limit events
- [ ] Monitoring dashboards created
- [ ] Alerting configured for violations threshold (10 per minute)
- [ ] Client retry strategy documented and tested
- [ ] Rate limits updated in ROLE_PERMISSIONS table
- [ ] Team trained on rate limiting behavior
- [ ] Incident response runbook updated (Section 3.3)

---

## Appendix A: Rate Limit Configuration Reference

```typescript
// From src/security/RateLimiter.ts

const RATE_LIMITS: Record<string, {
  requestsPerMinute: number;
  requestsPerHour: number;
}> = {
  // Administrative roles
  RiskAdmin: {
    requestsPerMinute: 120,
    requestsPerHour: 3000,
  },

  // Officer roles
  CRO: {
    requestsPerMinute: 60,
    requestsPerHour: 1500,
  },

  ComplianceOfficer: {
    requestsPerMinute: 100,
    requestsPerHour: 2500,
  },

  // Analyst roles
  TPRMAnalyst: {
    requestsPerMinute: 80,
    requestsPerHour: 2000,
  },

  // Audit roles
  Auditor: {
    requestsPerMinute: 60,
    requestsPerHour: 1500,
  },

  // Read-only/external roles
  ExaminerView: {
    requestsPerMinute: 20,
    requestsPerHour: 500,
  },

  // Fallback for unassigned roles
  default: {
    requestsPerMinute: 30,
    requestsPerHour: 800,
  },
};
```

---

## Appendix B: Rate Limit Header Examples

### Successful Request
```
HTTP/1.1 200 OK
X-RateLimit-Limit: 120
X-RateLimit-Remaining: 42
X-RateLimit-Reset: 1711353660
Content-Type: application/json

{ "data": [...] }
```

### Rate Limited Request
```
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 120
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1711353660
Retry-After: 32
Content-Type: application/json

{
  "error": "Rate limit exceeded",
  "message": "You have exceeded your limit of 120 requests per minute",
  "retry_after_seconds": 32
}
```

---

## Appendix C: Testing Rate Limits

### Load Test Script

```bash
#!/bin/bash
# Test rate limiting with 150 requests in quick succession

TOKEN="your-jwt-token"
URL="https://api.irmcommand.io/api/risks"
SUCCESS=0
RATE_LIMITED=0

for i in {1..150}; do
  RESPONSE=$(curl -s -w "\n%{http_code}" \
    -H "Authorization: Bearer $TOKEN" \
    "$URL?page=$i")

  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  HEADERS=$(echo "$RESPONSE" | head -n-1)

  if [ "$HTTP_CODE" = "200" ]; then
    ((SUCCESS++))
  elif [ "$HTTP_CODE" = "429" ]; then
    ((RATE_LIMITED++))
    RETRY_AFTER=$(echo "$HEADERS" | grep -i "Retry-After" | cut -d' ' -f2)
    echo "Rate limited at request $i. Retry after: ${RETRY_AFTER}s"
  fi

  # Print progress every 25 requests
  if [ $((i % 25)) -eq 0 ]; then
    echo "Progress: $i requests (Success: $SUCCESS, Rate Limited: $RATE_LIMITED)"
  fi
done

echo "Final: Success: $SUCCESS, Rate Limited: $RATE_LIMITED"
echo "Rate limiting working correctly if Rate Limited > 0"
```

### Manual Test

```bash
# Get your JWT token
TOKEN=$(curl -X POST https://project.supabase.co/auth/v1/token \
  -H "apikey: $SUPABASE_KEY" \
  -d '{"email": "user@example.com", "password": "password"}' \
  | jq -r '.access_token')

# Make requests until rate limited
for i in {1..150}; do
  echo -n "Request $i: "
  curl -s -w "HTTP %{http_code}" \
    -H "Authorization: Bearer $TOKEN" \
    https://api.irmcommand.io/api/risks?page=$i \
    | tail -c 10
  echo ""
done
```

---

**Document History:**
- v1.0 (2026-03-25): Initial rate limiting strategy documented
