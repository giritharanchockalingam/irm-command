# Operations Readiness – IRM Command

Deployment, monitoring, integration, and runbook guide for operations teams.

---

## Current State

**Environment**: Single-page React app (prototype)
**Deployment**: Static CDN-friendly build
**Data**: In-memory seed data (no persistent backend)
**Logging**: Console + localStorage sinks
**Monitoring**: Health indicator component + browser console

---

## Deployment Architecture

### Current (Prototype)

```
┌─────────────────────────────────┐
│   Static Hosting (Vercel, etc)  │
├─────────────────────────────────┤
│  IRM Command SPA Bundle         │
│  (React + Vite + Zustand)       │
│  • Theme (localStorage)         │
│  • Audit logs (localStorage)    │
│  • In-memory seed data          │
└─────────────────────────────────┘
```

### Future (Production-Ready)

```
┌──────────────────────────────────────────┐
│   CDN (Vercel, CloudFront, Cloudflare)   │
├──────────────────────────────────────────┤
│  • Caching: immutable assets (30d)        │
│  • HTML: no-cache, max-age=0              │
│  • CSP headers, X-Frame-Options           │
└────────────────────┬─────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
┌───────┴──────────────────┐  ┌──┴──────────────┐
│   API Gateway            │  │  CORS Proxy     │
│  (Rate Limiting, Auth)   │  │  (Optional)     │
└───────┬──────────────────┘  └─────────────────┘
        │
    ┌───┴────────────────────────────┐
    │                                │
┌───┴─────────────────┐  ┌──────────┴──────────┐
│ Governance Service  │  │ PostgreSQL          │
│ (Policy Enforce)    │  │ (Per-Tenant Data)   │
└───┬─────────────────┘  └─────────────────────┘
    │
    └─→ Claude API (Anthropic governance)
```

---

## Logging & Telemetry Integration

### Current Sinks

- **Console**: Development logging (all events)
- **localStorage**: Session audit trail (persists in browser)

### Adding APM Integration

To integrate with Datadog, New Relic, or SigNoz:

```typescript
// In main.tsx or app initialization

import { getTelemetry } from './telemetry';

// Datadog Example
class DatadogTelemetrySink implements TelemetrySink {
  constructor(private config: { apiKey: string; service: string; environment: string }) {}

  logEvent(event: TelemetryEvent) {
    fetch('https://http-intake.logs.datadoghq.com/v1/input/{dd-api-key}', {
      method: 'POST',
      body: JSON.stringify({
        service: this.config.service,
        environment: this.config.environment,
        timestamp: event.timestamp,
        level: event.level,
        message: event.message,
        context: event.context
      })
    });
  }

  logError(error: TelemetryError) {
    // Similar: send to Datadog error tracking
  }
}

getTelemetry().addSink(new DatadogTelemetrySink({
  apiKey: process.env.VITE_DATADOG_API_KEY,
  service: 'irm-command',
  environment: process.env.VITE_ENVIRONMENT
}));
```

### Adding SIEM Integration

For Splunk, Elastic, or similar:

```typescript
// Audit Logger Sink

class SplunkAuditSink implements AuditSink {
  constructor(private config: { endpoint: string; token: string }) {}

  logEvent(event: AuditEvent) {
    fetch(this.config.endpoint, {
      method: 'POST',
      headers: { 'Authorization': `Splunk ${this.config.token}` },
      body: JSON.stringify({
        source: 'irm-command',
        sourcetype: 'audit_log',
        event: {
          timestamp: event.timestamp,
          userId: event.userId,
          tenantId: event.tenantId,
          action: event.action,
          resourceId: event.resourceId,
          resourceType: event.resourceType,
          details: event.details,
          status: event.status
        }
      })
    });
  }
}

import { getAuditLogger } from './security/AuditLogger';
getAuditLogger().addSink(new SplunkAuditSink({
  endpoint: process.env.VITE_SPLUNK_HEC_ENDPOINT,
  token: process.env.VITE_SPLUNK_HEC_TOKEN
}));
```

**Code Location**: `src/telemetry/index.ts`, `src/security/AuditLogger.ts`

---

## Authentication & Session Management

### Current (Demo Mode)

- Static `DEMO_USERS` in `src/config/index.ts`
- Email-based user lookup
- No persistent session storage

### SSO/OIDC Integration (Recommended)

Replace demo users with OIDC:

```typescript
// Future: src/security/OIDCSecurityContext.tsx

import { useEffect, useState } from 'react';
import { useOidc } from '@react-oidc/core'; // or similar library

export function OIDCSecurityContext({ children }) {
  const { oidcUser, logout } = useOidc();

  // Map OIDC claims to IRM Command roles
  function mapOIDCToRole(groups: string[]): Role {
    if (groups.includes('irm-admin')) return 'admin';
    if (groups.includes('irm-manager')) return 'manager';
    if (groups.includes('irm-analyst')) return 'analyst';
    return 'viewer';
  }

  const user: User = {
    id: oidcUser.sub,
    email: oidcUser.email,
    name: oidcUser.name,
    role: mapOIDCToRole(oidcUser.groups || []),
    tenantId: oidcUser.tenant_id // Custom claim
  };

  // Store token in httpOnly cookie (via API response)
  // Never in localStorage

  return (
    <SecurityProvider initialUser={user} onLogout={logout}>
      {children}
    </SecurityProvider>
  );
}
```

**Recommended Providers**:
- **Okta**: OAuth2/OIDC + SCIM
- **Azure AD**: Enterprise SSO + conditional access
- **Auth0**: Flexible OIDC + user management
- **Google Workspace**: SAML/OIDC for federated identity

**Session Storage**:
- Move from localStorage to `httpOnly` cookie (set by API)
- Refresh token rotation every 15 minutes
- Session timeout: 8 hours of inactivity

**Code Location**: `src/security/SecurityContext.tsx` (replace with OIDC provider)

---

## Data Residency & Encryption

### Current (Prototype)

- In-memory seed data
- No persistence
- No encryption

### Future: Multi-Region Deployment

```typescript
// src/config/index.ts

export const TENANT_CONFIG = {
  'acme-corp': {
    name: 'ACME Corporation',
    region: 'us-east-1',
    dataResidency: 'US',
    aiGovernanceEndpoint: 'https://governance-us.internal.acme.com',
    database: {
      host: 'postgres-us-east-1.internal.acme.com',
      port: 5432,
      sslMode: 'require'
    },
    encryption: {
      atRest: 'AES-256-GCM',
      keyRotation: '90d'
    }
  }
};

export function getTenantConfig(tenantId: string) {
  const config = TENANT_CONFIG[tenantId];
  if (!config) throw new Error(`Unknown tenant: ${tenantId}`);
  return config;
}
```

### Encryption Standards

| Layer | Standard | Implementation |
|-------|----------|-----------------|
| **In Transit** | TLS 1.3 | Enforced at API Gateway, HSTS headers |
| **At Rest** | AES-256-GCM | Database-level encryption (RDS, Azure TDE) |
| **Data Key Rotation** | 90 days | Automated via KMS (AWS KMS, Azure Key Vault) |
| **Master Key Management** | HSM or KMS | Centralized, no key material in code |

**Code Location**: `src/config/index.ts`, future: `src/data/encryption.ts`

---

## Monitoring & Alerting

### Health Check Endpoint (Future)

```typescript
// GET /api/health

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  environment: string;
  timestamp: ISO8601;
  checks: {
    api: boolean;
    database: boolean;
    cache: boolean;
    governanceService: boolean;
  };
}
```

### Monitoring Checklist

- [ ] **Uptime Monitoring**: Pingdom, UptimeRobot, or datadog synthetics (target: 99.95% SLA)
- [ ] **Error Rate Alerting**:
  - P2 alert: >1% error rate (5 min window)
  - P1 alert: >5% error rate (2 min window)
- [ ] **AI Response Latency**: <2s p95 latency SLA
- [ ] **Audit Log Retention**: 7-year retention for regulatory compliance
- [ ] **Backup & Disaster Recovery**: RTO 4 hours, RPO 1 hour
- [ ] **Cert Expiration Monitoring**: Alert 30 days before expiry
- [ ] **Dependency Vulnerability Scanning**: Automated via Snyk/Dependabot
- [ ] **Database Performance**: Query time <100ms p99, connection pool monitoring

### Alert Rules (Example: Datadog)

```yaml
# High Error Rate (P1)
monitor:
  name: "IRM Command - High Error Rate (P1)"
  type: "metric alert"
  query: "avg(last_5m):avg:trace.web.request.errors{service:irm-command} > 0.05"
  thresholds:
    critical: 0.05
    warning: 0.01
  notification_channels:
    - "pagerduty-oncall"

# AI Latency SLA Miss
monitor:
  name: "IRM Command - AI Latency SLA Miss"
  type: "metric alert"
  query: "p95(last_1m):trace.ai.generation.duration{service:irm-command} > 2000"
  thresholds:
    critical: 2000
  notification_channels:
    - "pagerduty-oncall"
```

---

## Incident Response

### Runbook: High Error Rate

**Symptom**: Error rate > 5% for 2+ minutes

**Steps**:
1. Check health endpoint: `GET /health`
2. Review Datadog/SIEM logs for common error type
3. If API unavailable: failover to CDN cache (return stale SPA)
4. If database down: page on-call DBA
5. Notify users if SLA at risk (broadcast banner in app)
6. Post-incident: root cause analysis within 24h

### Runbook: AI Governance Service Down

**Symptom**: AI calls failing with 503 Service Unavailable

**Steps**:
1. Check governance service health: `GET https://governance.internal/health`
2. Fallback to LocalTemplateAIClient (read-only mode)
3. Notify product team; assess impact scope (percentage of features degraded)
4. If >30 min downtime: notify customers via status page
5. Post-incident: capacity planning review

### Runbook: Database Corruption

**Symptom**: Audit log queries returning errors, data inconsistency detected

**Steps**:
1. Initiate database failover to replica
2. Halt write operations until repaired
3. Trigger backup restoration to last known good state (RPO 1h)
4. Verify data integrity checksums
5. Post-incident: RCA + backup testing improvements

**Code Location**: Future: `runbooks/` directory

---

## Backup & Disaster Recovery

### Database Backups

| Frequency | Retention | Storage | RTO/RPO |
|-----------|-----------|---------|---------|
| Hourly snapshots | 7 days | S3/Blob (cross-region) | 1 hour |
| Daily backup | 30 days | Archive storage (Glacier) | 4 hours |
| Weekly backup | 1 year | Archive + offsite | 24 hours |

### Configuration Backups

- Git history (code + IaC)
- secrets in separate sealed backup (encrypted key escrow)
- SCIM user directory exported daily

### Recovery Testing

- Quarterly DR drill: restore from 7-day backup to staging
- Annual full failover test to alternate region
- Post-incident: backup restoration test mandatory

---

## Deployment Checklist

Before production deployment:

### Pre-Deployment

- [ ] Security review approved (threat model, RBAC, audit logging)
- [ ] Load testing completed (target: 1000 concurrent users)
- [ ] APM/SIEM integration tested end-to-end
- [ ] SSO/OIDC configured and tested
- [ ] TLS certs installed (valid 12+ months)
- [ ] CDN cache headers configured
- [ ] Backup restore tested in staging
- [ ] Runbooks finalized and team trained
- [ ] On-call rotation established

### Deployment

- [ ] Blue-green deployment (zero downtime)
- [ ] Health checks green on canary (1% traffic)
- [ ] Monitor error rate & latency for 5 min
- [ ] Gradual rollout: 25% → 50% → 100%
- [ ] Status page updated with deployment window

### Post-Deployment

- [ ] Smoke tests pass (login, create risk, generate narrative, audit log)
- [ ] Alerts trigger and page on-call (test alert routing)
- [ ] Metrics baseline established (error rate, latency, usage)
- [ ] Retrospective scheduled for day-after-tomorrow

---

## Cost Optimization

### Infra Cost Levers

| Component | Optimization | Est. Savings |
|-----------|---------------|--------------|
| CDN | Compression + aggressive caching | 40% |
| Database | Shared RDS (non-prod) + read replicas | 30% |
| Compute | Serverless (Lambda/Functions) vs. containers | 50% |
| Storage | S3 lifecycle (audit logs → Glacier after 90d) | 60% |

### AI Cost Tracking

```typescript
// Future: src/telemetry/costTracking.ts

interface AICallMetrics {
  tenantId: string;
  model: 'template' | 'claude-3-sonnet' | 'claude-3-opus';
  inputTokens: number;
  outputTokens: number;
  costUSD: number;
  timestamp: ISO8601;
}

export function trackAICost(metrics: AICallMetrics) {
  const costPerMillionTokens = {
    'template': 0,
    'claude-3-sonnet': 3 + 15,  // input + output pricing
    'claude-3-opus': 15 + 75
  };

  // Log and aggregate for monthly billing
  getTelemetry().logEvent({
    type: 'ai_cost_tracked',
    tenantId: metrics.tenantId,
    costUSD: metrics.costUSD
  });
}
```

---

## Operations Support Contacts

| Tier | Escalation | Contact | SLA |
|------|-----------|---------|-----|
| L1 | Support Team | ops-team@acl-digital.com | 1h response |
| L2 | Platform Team | platform-oncall@acl-digital.com | 15 min |
| L3 | Incident Commander | ic-oncall@acl-digital.com | 5 min |
| **Vendor** | Anthropic (Claude) | support@anthropic.com | See contract |

---

## References

- Deployment Guide: `docs/deployment.md` (future)
- Architecture: `docs/architecture.md`
- Security: `docs/security.md`
- Enterprise Readiness: `docs/enterprise-readiness.md`
