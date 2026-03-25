# IRM Sentinel — Incident Response Runbook

**Version:** 1.0
**Last Updated:** 2026-03-25
**Owner:** Security Operations Center (SOC) Team
**Classification:** Internal Use Only

## Purpose

This runbook provides step-by-step procedures for the SOC team to respond to, contain, and recover from security incidents affecting the IRM Sentinel platform. It covers detection, classification, escalation, evidence collection, containment, and post-incident review activities.

---

## 1. Severity Classification & Response SLAs

All security incidents are classified into severity tiers that determine response time, escalation path, and recovery priorities.

| **Tier** | **Severity** | **Description** | **Response SLA** | **Resolution Target** | **Examples** |
|----------|--------------|-----------------|------------------|-----------------------|--------------|
| **P1** | Critical | Active exploitation, data breach in progress, platform unavailable | 15 minutes | 4 hours | Ransomware attack, mass data exfiltration, unauthorized access to sensitive data, RCE |
| **P2** | High | Confirmed vulnerability, privilege escalation, significant compromise | 1 hour | 8 hours | Unauthorized admin access, token theft, injection attacks, mass account compromise |
| **P3** | Medium | Suspicious activity, potential unauthorized access, policy violation | 4 hours | 24 hours | Brute force attempts (failed), unusual data access patterns, unauthorized API calls |
| **P4** | Low | Security warnings, informational findings, proactive notifications | 24 hours | 7 days | Rate limit violations, config drift, security policy violations, failed login attempts |

---

## 2. Escalation Path

All incidents follow a defined escalation chain based on severity:

### P1 (Critical) Escalation
1. **Immediate:** Alert on-call SOC analyst
2. **+5 min:** Notify Security Lead (if different from on-call)
3. **+10 min:** Notify CISO
4. **+15 min:** Notify Legal/Executive (General Counsel, CEO)
5. **+30 min:** Engage external incident response team (if needed)

### P2 (High) Escalation
1. **Immediate:** Alert Security Lead
2. **+30 min:** Notify CISO
3. **+1 hour:** Notify Legal (if data exposure suspected)

### P3 (Medium) Escalation
1. **Immediate:** SOC analyst investigation
2. **+2 hours:** Security Lead review
3. **+4 hours:** CISO notification (if escalated)

### P4 (Low) Escalation
1. **Within 24 hours:** SOC analyst review
2. **Daily briefing:** Summarize in security standup

**Escalation Contacts:**
- On-Call SOC: Page via PagerDuty
- Security Lead: security-lead@irmcommand.io
- CISO: ciso@irmcommand.io
- Legal: legal@irmcommand.io

---

## 3. Detection Procedures

### 3.1 Audit Log Query - Failed Authentication

**Location:** `irm.audit_log` table in Supabase
**Query Type:** Real-time monitoring and manual investigation

```sql
-- Detect multiple failed login attempts within 5 minutes
SELECT
  user_id, user_email, tenant_id,
  COUNT(*) as failed_attempts,
  MIN(timestamp) as first_attempt,
  MAX(timestamp) as last_attempt,
  STRING_AGG(DISTINCT ip_address, ', ') as ip_addresses
FROM irm.audit_log
WHERE action = 'LOGIN'
  AND success = false
  AND timestamp > NOW() - INTERVAL '5 minutes'
GROUP BY user_id, user_email, tenant_id
HAVING COUNT(*) >= 5;
```

**Threshold Alert:** ≥5 failed login attempts in 5 minutes = P3 incident
**Action:** Lock account temporarily, investigate IP source

### 3.2 Audit Log Query - Unauthorized Data Access

**Query Type:** Behavioral analysis

```sql
-- Detect attempts to access data outside user's role permissions
SELECT
  user_id, user_email, action,
  entity_type, COUNT(*) as attempt_count,
  timestamp, denied_reason
FROM irm.audit_log
WHERE success = false
  AND action IN ('VIEW', 'EXPORT', 'DOWNLOAD')
  AND denied_reason LIKE 'Permission denied%'
  AND timestamp > NOW() - INTERVAL '5 minutes'
GROUP BY user_id, user_email, action, entity_type, denied_reason, timestamp
HAVING COUNT(*) >= 3;
```

**Threshold Alert:** ≥3 unauthorized access attempts in 5 minutes = P2 incident
**Action:** Review user's recent activity, check for session compromise

### 3.3 SecurityAlertMonitor Thresholds

The application continuously monitors for security anomalies using in-memory alert tracking:

**Failed Login Threshold (P3 Alert)**
- Metric: `failed_logins` per user
- Threshold: ≥5 failed attempts within 5 minutes
- Action: Temporarily lock account, notify user via email
- Recovery: Manual unlock after 15 minutes or by admin

**Unauthorized API Calls Threshold (P2 Alert)**
- Metric: `unauthorized_actions` per user
- Threshold: ≥3 unauthorized API calls within 5 minutes
- Action: Invalidate session, force re-authentication
- Recovery: User can re-authenticate after investigation

**Rate Limit Violations (P4 Alert)**
- Metric: Requests exceeding role-based limits
- Threshold: ≥10 violations per minute across all users
- Action: Log anomaly, alert security team
- Recovery: Automatic (limits reset each minute)

### 3.4 SIEM Alert Patterns

The application forwards audit events to the SIEM via the `siem-forwarder` Edge Function. Monitor the following patterns in your SIEM:

**Pattern 1: Brute Force Attack**
- Signal: Multiple failed AUTH attempts from same IP
- Timeline: 30+ attempts within 1 minute
- Response: Block IP at firewall, notify SOC

**Pattern 2: Privilege Escalation**
- Signal: USER_ROLE_CHANGE to higher privilege followed by sensitive actions
- Timeline: Role change → DATA_EXPORT within 5 minutes
- Response: Audit role change approval, review data accessed

**Pattern 3: Data Exfiltration**
- Signal: Large EXPORT or DOWNLOAD actions, unusual volume
- Timeline: 10+ exports per user within 10 minutes
- Response: Revoke API tokens, investigate intent

**Pattern 4: Lateral Movement**
- Signal: Same user token used from multiple IPs in different regions
- Timeline: IP1 (US) → IP2 (China) within 5 minutes (impossible travel)
- Response: Invalidate session, force logout

---

## 4. Containment Steps

When an incident is confirmed, execute containment steps immediately to prevent escalation or further compromise:

### 4.1 Token Revocation

**Procedure:** Revoke all active sessions for the compromised user

```sql
-- Step 1: Identify active sessions
SELECT session_id, user_id, created_at
FROM irm.user_sessions
WHERE user_id = 'COMPROMISED_USER_ID'
  AND expires_at > NOW();

-- Step 2: Mark sessions as revoked (delete or update status)
UPDATE irm.user_sessions
SET is_revoked = true, revoked_at = NOW()
WHERE user_id = 'COMPROMISED_USER_ID'
  AND is_revoked = false;

-- Step 3: Audit the revocation
INSERT INTO irm.audit_log
  (user_id, action, entity_type, entity_id, success, metadata)
VALUES
  ('SECURITY_SYSTEM', 'SESSION_REVOKE', 'Session', 'COMPROMISED_USER_ID', true,
   '{"reason": "Incident response", "revoked_count": 5}');
```

**Timeline:** Execute within 5 minutes of incident confirmation

### 4.2 Session Invalidation

**Procedure:** Force logout of all active user sessions

- **In-Browser:** Sessions stored in browser localStorage are invalidated when the user's JWT token expires
- **Backend:** All API calls using revoked session_id are rejected with 401 Unauthorized
- **Notification:** User receives email: "Your session has been terminated for security reasons. Please log in again."

**Verification Query:**
```sql
-- Verify no active sessions remain
SELECT COUNT(*) as active_sessions
FROM irm.user_sessions
WHERE user_id = 'COMPROMISED_USER_ID'
  AND is_revoked = false
  AND expires_at > NOW();
-- Should return: 0
```

### 4.3 IP Address Blocking

**Procedure:** Block suspicious IP addresses at the firewall/WAF level

**Edge Function Deployment:** Update `supabase/functions/data-access/index.ts`

```typescript
// Add IP blocking logic
const blockedIPs = new Set([
  '203.0.113.42',  // Attacker's IP from incident
  '198.51.100.99', // Second IP if applicable
]);

if (blockedIPs.has(requestIP)) {
  return new Response(
    JSON.stringify({ error: 'Access denied' }),
    { status: 403 }
  );
}
```

**Timeline:** Deploy within 15 minutes (P1) or 1 hour (P2)

**Verification:** Test blocked IP should receive 403 Forbidden

### 4.4 Feature Flag Disabling

**Procedure:** Disable risky features to prevent exploitation

**Example:** If a vulnerability is found in the AI Copilot feature:

```typescript
// In src/config/featureFlags.ts
export const FEATURE_FLAGS = {
  copilot_enabled: false, // DISABLED during P1 incident
  data_export_enabled: true,
  api_access_enabled: true,
};
```

**Deployment:** Update feature flag, redeploy Edge Functions
**Timeline:** 5-10 minutes
**User Communication:** Show banner: "Copilot feature is temporarily offline for maintenance."

---

## 5. Evidence Collection

Preserve all evidence for forensic analysis and regulatory reporting. Evidence must be collected in a tamper-proof manner.

### 5.1 Audit Log Export

**Location:** `irm.audit_log` table
**Procedure:**

```sql
-- Export audit logs for a specific incident
COPY (
  SELECT * FROM irm.audit_log
  WHERE timestamp BETWEEN '2026-03-25 10:00:00'::timestamptz
                     AND '2026-03-25 11:00:00'::timestamptz
    AND (
      user_id IN ('COMPROMISED_USER_ID', 'ATTACKER_IP_SOURCE')
      OR entity_id IN ('SENSITIVE_RESOURCE_ID')
    )
  ORDER BY timestamp ASC
) TO STDOUT CSV HEADER;
```

**Output:** Save to `incident-20260325-001-audit-log.csv`
**Integrity:** Store copy in write-protected S3 bucket with versioning enabled
**Retention:** Retain for 7 years per SOX compliance

### 5.2 Telemetry Snapshots

**Location:** SecurityContext and RateLimiter in-memory state
**Procedure:**

```typescript
// Capture current security state
const securitySnapshot = {
  timestamp: new Date().toISOString(),
  incident_id: 'INC-20260325-001',
  rateLimiter_windows: getRateLimiter().windows, // Internal state
  activeAlerts: getSecurityContext().alerts,
  sessionCount: userSessionManager.getActiveSessions(),
  failedLoginAttempts: failedLoginTracker.getAll(),
};

// Export as JSON
console.log(JSON.stringify(securitySnapshot, null, 2));
```

**Output:** Save to `incident-20260325-001-telemetry.json`
**Preservation:** Email to security-team@irmcommand.io and upload to evidence bucket

### 5.3 Browser Artifacts & Network Logs

**For User Machine Forensics:**
1. Browser history (URL bar, search history)
2. Browser cache and cookies
3. Local storage (`irm-audit-log` key)
4. Network requests (DevTools → Network tab)

**For Server Forensics:**
1. HTTP request logs (from Edge Function logs)
2. Database query logs (from Supabase audit)
3. Error logs from application
4. Email server logs (if relevant)

**Procedure:**
```bash
# Export Edge Function logs
supabase functions logs data-access --limit 100 > incident-logs.txt

# Export application errors from Supabase
curl -X GET "https://api.supabase.co/v1/projects/{PROJECT_ID}/logs" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  > incident-api-logs.json
```

---

## 6. Recovery Steps

Recovery restores normal operations while preventing re-infection.

### 6.1 User Re-authentication

**Procedure:** Force user to set a new password and verify identity

```sql
-- Mark user's password as expired
UPDATE irm.users
SET password_reset_required = true,
    password_reset_token = gen_random_uuid(),
    password_reset_expires_at = NOW() + INTERVAL '24 hours'
WHERE id = 'COMPROMISED_USER_ID';
```

**User Notification:**
1. Email: "Security Alert: Your account requires re-authentication"
2. Link: "Reset your password" (expires in 24 hours)
3. MFA: Re-authenticate with second factor

### 6.2 Password Resets

**Procedure:** Reset password for all affected users

```sql
-- For multiple affected users
UPDATE irm.users
SET password_reset_required = true,
    password_reset_token = encode(gen_random_bytes(32), 'hex'),
    password_reset_expires_at = NOW() + INTERVAL '24 hours'
WHERE tenant_id = 'AFFECTED_TENANT_ID'
  AND id = ANY(ARRAY['USER1', 'USER2', 'USER3']);
```

**Notification:** Batch email notification
**Timeline:** Within 1 hour of incident containment
**Enforcement:** Users cannot access system until password reset

### 6.3 Control Re-testing

**Procedure:** Verify that security controls are functioning correctly post-incident

**Checklist:**
- [ ] Session timeout is working (30 min of inactivity)
- [ ] Rate limiter is enforcing limits per role
- [ ] RLS policies are enforced (test cross-tenant access = denied)
- [ ] Audit logging captures all sensitive operations
- [ ] Failed login threshold alerts (test with 6 failed attempts)
- [ ] Unauthorized access alerts (test with denied permission)
- [ ] SIEM forwarding is active (check siem-forwarder function logs)

**Test Commands:**
```bash
# Test 1: Verify rate limiter
curl -X GET "https://api.irmcommand.io/users" \
  -H "Authorization: Bearer TOKEN" \
  --repeat 150 \
  # Should return 429 Too Many Requests after 120 requests

# Test 2: Verify RLS (cross-tenant access should fail)
curl -X GET "https://api.irmcommand.io/risks?tenant_id=OTHER_TENANT" \
  -H "Authorization: Bearer TOKEN" \
  # Should return 403 Forbidden

# Test 3: Verify SIEM forwarding
curl -X GET "https://project.supabase.co/functions/v1/siem-forwarder" \
  -H "Authorization: Bearer FUNCTION_SECRET" \
  # Should return recent forwarded events
```

---

## 7. Communication Templates

### 7.1 Internal Security Notification

**To:** Security team, CISO, department leads
**Subject:** [INCIDENT] Security Incident Detected - IRM Sentinel

**Template:**

```
SECURITY INCIDENT ALERT
Incident ID: INC-20260325-001
Severity: P2 (High)
Detected: 2026-03-25 10:15 UTC

SUMMARY:
Unauthorized API calls detected from user@example.com attempting to access
vendor data outside their role permissions (TPRMAnalyst trying to access
RiskAdmin controls).

TIMELINE:
10:15 - SecurityAlertMonitor detected 4 unauthorized access attempts
10:17 - Alert escalated to Security Lead
10:20 - Incident investigation began
10:25 - User session invalidated, account locked

ACTIONS TAKEN:
- User's active sessions revoked
- Account locked pending investigation
- Audit logs exported for forensics
- IP address 203.0.113.42 flagged for monitoring

NEXT STEPS:
- Security Lead to contact user and verify account access
- Review user's activity log for past 7 days
- Confirm whether credentials were compromised or intentional access

STATUS: Contained
ESTIMATED RESOLUTION: 4 hours
CONTACT: security-lead@irmcommand.io
```

### 7.2 Regulatory Notification (if data breach suspected)

**To:** Legal, CISO, Compliance Officer
**Subject:** [REGULATORY] Potential Data Breach - Notification Requirements

**Template:**

```
REGULATORY BREACH NOTIFICATION

Incident ID: INC-20260325-001
Potential Breach Scope: Customer vendor data (sensitive information)
Affected Records: ~250 records

NOTIFICATION REQUIREMENTS:
Under GDPR/CCPA, we must notify affected parties within 72 hours if:
[ ] Confidentiality was breached (unauthorized access = YES)
[ ] Integrity was compromised (data modified = UNKNOWN)
[ ] Personal data was exfiltrated (UNKNOWN - investigation ongoing)

RECOMMENDED ACTIONS:
1. Complete forensic investigation (estimate: 24 hours)
2. Determine if personal data was actually accessed/copied
3. If confirmed breach: Notify affected customers within 72 hours
4. If not confirmed: Send "No Further Action" after 48 hours of investigation

LEGAL REVIEW NEEDED:
- Determine notification timeline (72-hour deadline vs. immediate)
- Draft customer notification letter
- Prepare for regulatory requests from state attorneys general

NEXT MEETING: 2026-03-26 09:00 UTC
ATTENDEES: CISO, Legal, Compliance, Security Lead
```

### 7.3 Customer Notification (if breach confirmed)

**To:** Affected customers via email + support portal
**Subject:** Security Incident Notification - IRM Sentinel

**Template:**

```
Dear Customer,

We are writing to inform you of a security incident that may have affected
your data in the IRM Sentinel platform.

WHAT HAPPENED:
On March 25, 2026 at 10:15 UTC, we detected unauthorized access to vendor
assessment data. An authenticated user attempted to access information outside
their assigned role. We immediately revoked their access and conducted a
forensic investigation.

WHAT DATA WAS AFFECTED:
- Vendor names and risk ratings
- Compliance scores (aggregated, not individual responses)
- NOT affected: Customer authentication credentials, payment information,
  personal data beyond vendor names

WHAT WE'RE DOING:
1. Full forensic investigation (in progress)
2. Enhanced monitoring of this user's activities
3. Additional security controls (completed)
4. Review of access control procedures (in progress)

WHAT YOU SHOULD DO:
1. Change your IRM Sentinel password (recommended)
2. Review vendor assessment data for any unauthorized modifications
3. Contact us if you have questions: security@irmcommand.io

TIMELINE:
- March 25, 10:15 UTC: Incident detected and contained
- March 25, 11:00 UTC: Investigation began
- March 26, 10:00 UTC: Full forensic report completed
- March 26, 15:00 UTC: Results shared with affected customers

We take security seriously and apologize for this incident. We are committed
to transparency and continuous improvement.

Sincerely,
IRM Sentinel Security Team
```

---

## 8. Post-Incident Review (PIR) Checklist

Complete within 48 hours of incident resolution.

### 8.1 PIR Meeting

**Attendees:** CISO, Security Lead, SOC analyst, Engineering Lead, Product
**Duration:** 1 hour
**Agenda:**

- [ ] Confirm incident timeline (detection → resolution)
- [ ] Review root cause(s)
- [ ] Discuss what went well (detection, response, communication)
- [ ] Identify what could be improved
- [ ] Document lessons learned
- [ ] Assign follow-up actions with owners and due dates

### 8.2 Root Cause Analysis

**Questions to Answer:**

1. **How did the attacker/compromised user access sensitive data?**
   - Was there a vulnerability in the permission model?
   - Was there a misconfiguration in RLS policies?
   - Did RBAC controls fail to prevent the action?

2. **Why wasn't this detected earlier?**
   - Did audit logging miss this action?
   - Did alert thresholds fail to trigger?
   - Was SIEM forwarding working correctly?

3. **Was the response effective?**
   - Did token revocation succeed in 5 minutes?
   - Did session invalidation prevent further access?
   - Were we able to preserve evidence?

### 8.3 Action Items Template

| Action | Root Cause | Owner | Due Date | Priority |
|--------|-----------|-------|----------|----------|
| Lower failed login threshold from 5 to 3 attempts | Attacks not detected early enough | Security Lead | 2026-04-01 | P1 |
| Add real-time alert for role-change + sensitive action | Privilege escalation not detected | SOC | 2026-04-02 | P1 |
| Test RLS policies quarterly | Configuration drift possible | Engineering | 2026-04-15 | P2 |
| Document password reset procedure | Time wasted searching docs | Documentation | 2026-03-29 | P3 |

### 8.4 Metrics to Capture

- **Detection Time:** Time from incident start to first alert (target: <5 minutes)
- **Response Time:** Time from alert to first action taken (target: <15 minutes P1, <1 hour P2)
- **Resolution Time:** Time from containment to full recovery (target: <4 hours P1, <8 hours P2)
- **Data Affected:** Number of records, users, tenants
- **Escalation Path:** Which teams were involved, when notified
- **Cost Impact:** Incident response hours, external consultants, notifications

### 8.5 Document Retention

All incident documents must be retained for 7 years:

- [ ] Incident ticket/tracking number documented
- [ ] Audit log export archived (write-protected S3)
- [ ] Telemetry snapshot archived
- [ ] Forensic report completed
- [ ] PIR meeting notes documented
- [ ] Action items tracked to completion
- [ ] Customer notifications preserved

---

## Appendix A: Quick Reference - Key Tables

### irm.audit_log
**Used for:** Detecting unauthorized access, tracking user actions
**Key columns:** `timestamp`, `user_id`, `action`, `entity_type`, `success`, `denied_reason`
**Query:** [See Section 3.1-3.2]

### irm.user_sessions
**Used for:** Session invalidation during incidents
**Key columns:** `session_id`, `user_id`, `is_revoked`, `expires_at`
**Operations:** Mark as `is_revoked = true`

### irm.users
**Used for:** Password resets, account lockouts
**Key columns:** `id`, `email`, `password_reset_required`, `is_locked`
**Operations:** Set `password_reset_required = true`

---

## Appendix B: Escalation Contact List

```
On-Call SOC:        PagerDuty (page-oncall-soc@irmcommand.io)
Security Lead:      John Doe (john.doe@irmcommand.io, +1-555-0123)
CISO:               Jane Smith (jane.smith@irmcommand.io, +1-555-0124)
Legal/General Counsel: Bob Johnson (bob.johnson@irmcommand.io, +1-555-0125)
CEO (for P1):       CEO@irmcommand.io (via CISO)
External IR Firm:   [Incident Response Company] (emergency: +1-800-XXX-XXXX)
```

---

## Appendix C: Incident Response Drills

Conduct quarterly drills to test incident response procedures:

**Drill 1 (Q1):** Simulated failed login threshold breach
**Drill 2 (Q2):** Simulated unauthorized access attempt
**Drill 3 (Q3):** Simulated data exfiltration
**Drill 4 (Q4):** Simulated privilege escalation

**Success Criteria:**
- All escalations happen within defined SLAs
- Evidence is collected correctly
- Recovery steps execute without errors
- PIR is completed on time

---

**Document History:**
- v1.0 (2026-03-25): Initial runbook created
