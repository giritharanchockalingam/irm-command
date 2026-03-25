# SOC 2 Trust Services Criteria Mapping

**IRM Sentinel** - Enterprise GRC SaaS Platform
**Document Version**: 1.0
**Last Updated**: 2026-03-24
**Status**: Active

## Executive Summary

This document maps IRM Sentinel's architecture and operational controls to the AICPA SOC 2 Trust Services Criteria (CC: Common Criteria, A: Availability, C: Confidentiality). The platform is designed to achieve SOC 2 Type II certification within 18 months of general availability.

---

## 1. In-Scope Components

| Component | Layer | Tech Stack | Certification Scope |
|-----------|-------|-----------|-------------------|
| Web UI | Frontend | React 18 + TypeScript + Vite | Full |
| API Gateway | Infrastructure | AWS ALB / GCP LB | Full |
| REST API | Application | Node.js 18+ LTS | Full |
| PostgreSQL Database | Data | RDS / Cloud SQL | Full |
| Redis Cache | Data | ElastiCache / Memorystore | Full |
| S3 / GCS | Storage | AWS S3 / GCP Cloud Storage | Full |
| AI Governance Client | Service Integration | OpenAI API + local fallback | Partial (AI inputs/outputs audit only) |
| Kubernetes | Orchestration | EKS / GKE | Infrastructure support |
| SIEM Integration | Monitoring | Datadog / Splunk sink | Operational |

---

## 2. Security (CC: Common Criteria)

### CC6: Logical and Physical Access Controls

**What's Implemented:**
- **RBAC Model**: 6 roles (System Admin, Auditor, Risk Officer, Compliance Manager, Vendor Manager, Viewer)
- **29 Permissions**: Fine-grained access to resources (settings:write, users:admin, controls:edit, risks:export, etc.)
- **Role Hierarchy**: Inherited permissions with least-privilege default
- **Tenant Isolation**: Multi-tenant SaaS with `tenantId` as authorization boundary
- **Session Management**: JWT-based sessions with 1-hour expiry, refresh token rotation, secure HttpOnly cookies
- **MFA Enforcement**: Required for all users; enforced at IdP (Okta/Entra) level; step-up MFA for high-risk actions (admin:settings, data:export)

**TypeScript RBAC Definition:**
```typescript
interface RoleDefinition {
  id: 'admin' | 'auditor' | 'risk_officer' | 'compliance_mgr' | 'vendor_mgr' | 'viewer';
  permissions: Set<PermissionKey>;
  mfaRequired: boolean;
  stepUpMFAActions: PermissionKey[];
}

const ROLES: Record<string, RoleDefinition> = {
  admin: {
    id: 'admin',
    permissions: new Set(['*']),
    mfaRequired: true,
    stepUpMFAActions: ['admin:settings', 'admin:users', 'data:export', 'audit:delete']
  },
  // ... 5 more roles
};

interface AccessToken {
  sub: string; // user ID
  tenantId: string;
  roles: string[];
  permissions: string[];
  iat: number;
  exp: number;
  iss: 'irm-command';
}
```

**What's Stubbed:**
- Hardware security module (HSM) key storage (placeholder: AWS KMS)
- Physical access controls (managed by data center provider, SLAs documented)

**What's Planned:**
- Attribute-based access control (ABAC) for risk-level-based access (Q3 2026)
- Just-in-time (JIT) privileged access (Q4 2026)

---

### CC7: System Operations & Change Management

**What's Implemented:**
- **Audit Logging**: All privileged operations logged with user, action, resource, timestamp, IP, user agent
- **SIEM Integration**: Audit events streamed to Datadog / Splunk in real-time
- **Log Retention**: 90 days hot storage, 7 years cold archive (S3 Glacier)
- **CSP Headers**: Strict Content-Security-Policy, X-Frame-Options: DENY
- **Secrets Management**: AWS Secrets Manager / GCP Secret Manager for API keys, DB credentials
- **Version Control**: Git with signed commits, branch protection rules (require PR review + status checks)

**Audit Event Schema:**
```typescript
interface AuditLogEntry {
  id: string;
  tenantId: string;
  timestamp: ISO8601;
  userId: string;
  userEmail: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'export' | 'admin:settings';
  resource: string; // e.g., 'controls:123', 'users:456'
  resourceType: 'control' | 'risk' | 'user' | 'tenant' | 'ai_request';
  status: 'success' | 'failure';
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  changes?: { before: any; after: any }; // For updates
}
```

**What's Stubbed:**
- Immutable audit log storage (planned via WORM-bucket or append-only DB)

**What's Planned:**
- Automated alerting on suspicious audit patterns (Q2 2026)
- Real-time compliance violation detection (Q3 2026)

---

### CC8: Change Management

**What's Implemented:**
- **CI/CD Pipeline**: Automated gates (lint → typecheck → unit tests → SAST → build → deploy)
- **Code Review**: 2 reviewers for security-sensitive changes; 1 for standard
- **Deployment Records**: Automated capture of commit SHA, deployer, environment, timestamp
- **Rollback Procedures**: Instant rollback via GitOps (ArgoCD / Flux)
- **Configuration Management**: Infrastructure-as-Code (Terraform / CloudFormation)

**What's Planned:**
- Formal change advisory board (CAB) process (Q2 2026)
- Pre-change impact analysis automation (Q3 2026)

---

## 3. Availability (A1: System Availability)

**What's Implemented:**
- **Health Checks**: Liveness & readiness probes on all pods; Kubernetes automatically restarts unhealthy instances
- **Auto-Scaling**: Horizontal Pod Autoscaler (HPA) based on CPU >70%, request rate >1000 rps, p95 latency >200ms
- **Circuit Breakers**: Timeout-based failover for AI governance service (fail-open to local risk templates)
- **Load Balancing**: AWS ALB / GCP Cloud LB distributes traffic across API instances
- **Database Failover**: Multi-AZ RDS/Cloud SQL with automatic promotion
- **Cache Redundancy**: Redis with master-replica replication
- **Monitoring**: Prometheus + Grafana dashboards; PagerDuty alerting on SLO violations

**Disaster Recovery Target:**
- **RTO (Recovery Time Objective)**: 4 hours
- **RPO (Recovery Point Objective)**: 1 hour
- **Strategy**: Active-passive failover; daily incremental backups; automated backup testing

**What's Planned:**
- Active-active multi-region replication (Q4 2026)
- Chaos engineering program (Q2 2026)

---

## 4. Confidentiality (C1: Information Protection)

**What's Implemented:**

#### Data Classification
```
Public: Marketing materials, public documentation
Internal: Release notes, internal wiki
Confidential: Tenant control data, risk assessments
Restricted: Personally identifiable information (PII), audit reports with tenant names
```

- **Tenant Isolation**: Logical isolation via `tenantId` prefix on all resources; network isolation via VPC
- **Encryption at Rest**:
  - Database: AES-256 via AWS RDS encryption
  - Storage: S3 server-side encryption (SSE-S3 or SSE-KMS)
  - Backups: Encrypted snapshots in Glacier
- **Encryption in Transit**: TLS 1.3 for all APIs and database connections; mutual TLS for service-to-service
- **Field-Level Masking**: PII (email, phone, SSN fragments) masked in logs and exports for non-admin users

**PII Masking Implementation:**
```typescript
function maskPII(value: string, fieldType: 'email' | 'phone' | 'ssn'): string {
  if (fieldType === 'email') return value.replace(/(.{2})[^@]*(@.*)/, '$1****$2');
  if (fieldType === 'phone') return value.replace(/(\d{3})\d{3}(\d{4})/, '$1***$2');
  if (fieldType === 'ssn') return value.replace(/\d{5}(\d{4})/, '*****$1');
  return '***';
}
```

- **Key Rotation**: Automatic annual key rotation; 90-day enforcement for compromised keys
- **Data Residency**: Tenant data stored in customer-specified region (US, EU, APAC)

**What's Stubbed:**
- End-to-end encryption with customer-managed keys (CMK); currently AWS/GCP managed

**What's Planned:**
- Customer-managed key encryption with bring-your-own-key (BYOK) (Q3 2026)
- Homomorphic encryption for sensitive analytics (R&D phase)

---

## 5. Control Register

| Control ID | Trust Service | Description | Status | Evidence | Frequency |
|-----------|---------------|-----------|--------|----------|-----------|
| CC6.1 | Security | RBAC with 6 roles, 29 permissions | Implemented | Role definitions in codebase | Continuous |
| CC6.2 | Security | MFA enforcement (all users) | Implemented | IdP policy audit logs | Monthly |
| CC6.3 | Security | Session management (1h expiry) | Implemented | JWT implementation + tests | Per deploy |
| CC6.4 | Security | Tenant isolation via tenantId | Implemented | Query interceptors + schema enforcement | Per deploy |
| CC7.1 | Security | Audit logging (all privileged ops) | Implemented | Audit log schema + SIEM ingestion | Continuous |
| CC7.2 | Security | SIEM real-time integration | Implemented | Datadog ingestion dashboard | Daily |
| CC7.3 | Security | CSP headers + security headers | Implemented | Security header tests | Per deploy |
| CC7.4 | Security | Secrets management (AWS KMS/GCP) | Implemented | Secrets rotation logs | Quarterly |
| CC8.1 | Security | CI/CD change gates | Implemented | Pipeline configuration + logs | Per deployment |
| CC8.2 | Security | Code review (2 reviewers for security) | Implemented | GitHub branch protection rules | Per PR |
| A1.1 | Availability | Health checks & auto-restart | Implemented | HPA metrics + incident logs | Continuous |
| A1.2 | Availability | Auto-scaling (HPA config) | Implemented | HPA tuning log + scaling events | Weekly |
| A1.3 | Availability | Circuit breakers (AI service) | Implemented | Fallback template usage metrics | Monthly |
| C1.1 | Confidentiality | Encryption at rest (AES-256) | Implemented | RDS/S3 encryption status | Continuous |
| C1.2 | Confidentiality | Encryption in transit (TLS 1.3) | Implemented | TLS handshake logs + vulnerability scans | Monthly |
| C1.3 | Confidentiality | PII masking in logs | Implemented | Audit log sample review | Quarterly |

---

## 6. Gap Analysis & Remediation

| Gap | Risk Level | Target Fix | Planned Date |
|-----|------------|-----------|--------------|
| BYOK encryption not available | Medium | Implement customer-managed key support | Q3 2026 |
| CAB process not formalized | Medium | Document change advisory board SOP | Q2 2026 |
| Immutable audit log not enforced | High | Migrate to WORM storage or append-only DB | Q4 2026 |
| Active-active multi-region not available | Medium | Implement cross-region replication | Q4 2026 |

---

## 7. Compliance Assertion

IRM Sentinel implements the core controls required for SOC 2 Type II certification across Security, Availability, and Confidentiality trust services. Formal audit is scheduled for Q4 2026 following 18 months of operational history.

**Next Review**: 2026-06-24
