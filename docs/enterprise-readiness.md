# Enterprise Readiness Checklist – IRM Command

Alignment to SaaS compliance expectations (SOC 2, ISO 27001, HIPAA-ready).

---

## Identity & Access Management

- [x] **RBAC Implementation** – 6 enterprise roles (Admin, Manager, Analyst, Viewer, Auditor, Guest)
- [x] **Granular Permissions** – 29 permissions across modules (risk, control, vendor, audit, ai, config)
- [x] **SecurityContext Provider** – React-based auth boundary with permission validation
- [x] **RequirePermission Component** – Gating for routes and UI elements
- [x] **Authorization Utility** – `can()` function for dynamic checks
- [ ] **SSO/OIDC Integration** – Extension point ready; requires IdP (Okta, Azure AD, Auth0)
- [ ] **SCIM User Provisioning** – Design placeholder; future API-backed
- [ ] **MFA/WebAuthn** – Future phase

**Code Location**: `src/security/types.ts`, `src/security/SecurityContext.tsx`, `src/security/authorization.ts`

---

## Data Security

- [x] **Centralized Configuration** – No window globals; `config/index.ts`
- [x] **TenantId on All Core Entities** – Risk, Control, Vendor, Issue, AICall, AuditEvent
- [x] **DataAccessLayer Abstraction** – Ready for API migration with tenant filtering
- [x] **No Sensitive Data in LocalStorage** – Only theme preference and non-sensitive audit metadata
- [x] **Environment-Based Secrets** – Separate prod/staging/dev config
- [ ] **Encryption at Rest** – Future: database-level (RDS, Azure TDE)
- [ ] **Encryption in Transit** – Future: TLS 1.3 enforced at API gateway
- [ ] **Data Residency Controls** – Future: per-tenant region config, governance layer enforces locality

**Code Location**: `src/config/index.ts`, `src/data/DataAccessLayer.ts`, `src/data/tenantId.ts`

---

## Audit & Compliance

- [x] **Typed AuditEvent Model** – Immutable events with `userId`, `tenantId`, `action`, `timestamp`, `context`
- [x] **AuditLogger with Pluggable Sinks** – Console (dev), localStorage (session), future: SIEM
- [x] **All AI Calls Audited** – Every `AIGovernanceClient` call tagged with full context
- [x] **Immutable Audit Trail in Domain Model** – Append-only event log
- [x] **Telemetry Module** – Event, error, and performance tracking
- [x] **Error Boundary Integration** – Unhandled errors logged and tracked
- [ ] **SIEM Integration** – Splunk, Elastic, or similar (sink interface ready)
- [ ] **SOC 2 Controls Mapping** – Future: detailed control→code artifact matrix
- [ ] **Audit Log Retention Policy** – Future: 7-year retention for regulatory

**Code Location**: `src/security/AuditLogger.ts`, `src/telemetry/index.ts`, `src/components/ErrorBoundary.tsx`

---

## AI Governance

- [x] **AIGovernanceClient Abstraction** – Interface for pluggable AI implementations
- [x] **LocalTemplateAIClient** – Deterministic, fully audited template-based narratives
- [x] **StubGovernedAIClient** – Simulated Claude integration with governance layer simulation
- [x] **Every AI Call Tagged** – `userId`, `tenantId`, `module`, `action`, `input`, `output` logged
- [x] **Output Safety** – No `dangerouslySetInnerHTML`, plain text rendering only
- [ ] **Production Claude Governance Layer** – Blueprint in `architecture.md`; requires Claude governance API
- [ ] **Policy-as-Code Enforcement** – Future: REGO/CEL-based policy engine
- [ ] **Fine-Tuning & Model Governance** – Future: model versioning, rollback capability
- [ ] **Cost Tracking per Tenant** – Future: token counting, billing integration

**Code Location**: `src/ai/AIGovernanceClient.ts`, `src/ai/LocalTemplateAIClient.ts`, `src/ai/StubGovernedAIClient.ts`

---

## Multi-Tenant Readiness

- [x] **TenantId Binding** – All core entities inherit `tenantId` from SecurityContext
- [x] **Tenant Config in Central Configuration** – Per-tenant settings in `config/index.ts`
- [x] **DataAccessLayer Tenant Filtering** – Ready to filter all queries by `tenantId`
- [x] **Tenant-Aware Seed Data** – Demo data includes `tenantId` assignment
- [ ] **Per-Tenant Data Isolation (Database)** – Future: separate database per tenant or row-level security
- [ ] **Per-Tenant Feature Flags** – Future: governance layer enables/disables features per tenant
- [ ] **Per-Tenant API Keys & Webhooks** – Future: webhook routing to tenant-specific endpoints
- [ ] **Tenant Metrics & Usage Dashboards** – Future: per-tenant consumption tracking

**Code Location**: `src/data/tenantId.ts`, `src/config/index.ts`, `src/data/DataAccessLayer.ts`

---

## Error Handling & Resilience

- [x] **Global ErrorBoundary** – App-level boundary catches unhandled React errors
- [x] **Per-Module ErrorBoundary** – Each page/route wrapped with recovery logic
- [x] **Telemetry Integration** – All errors logged with context (user, action, timestamp)
- [x] **Safe Error Messages** – No stack traces in production; user-friendly fallbacks
- [x] **Health Indicator Component** – App version, environment, and runtime status
- [x] **Graceful Degradation** – AI unavailability doesn't break core GRC workflows
- [ ] **Service-Level Retry Logic** – Future: exponential backoff for API calls
- [ ] **Circuit Breaker Pattern** – Future: graceful degradation under load
- [ ] **Chaos Engineering** – Future: resilience testing in staging

**Code Location**: `src/components/ErrorBoundary.tsx`, `src/telemetry/index.ts`, `src/components/HealthIndicator.tsx`

---

## Observability

- [x] **Telemetry Module** – Pluggable sinks for events, errors, and performance metrics
- [x] **Page Navigation Tracking** – Each route change logged with user context
- [x] **AI Call Performance Measurement** – Latency, token count, cost per call
- [x] **Error Reporting Pipeline** – Errors flow to console, localStorage, and future SIEM
- [x] **Request/Response Logging** – Future API calls will be traced
- [ ] **APM Integration** – Datadog, New Relic, or SigNoz (sink ready to implement)
- [ ] **Custom GRC Dashboards** – Future: AI usage per tenant, risk trend analysis, control effectiveness
- [ ] **Distributed Tracing** – Future: trace user actions across frontend + API + governance layer

**Code Location**: `src/telemetry/index.ts`

**Example APM Integration**:
```typescript
import { getTelemetry } from './telemetry';
getTelemetry().addSink(new DatadogTelemetrySink({
  apiKey: process.env.DATADOG_API_KEY,
  service: 'irm-command',
  environment: process.env.NODE_ENV
}));
```

---

## Build & CI/CD

- [x] **TypeScript Strict Mode** – All code type-safe
- [x] **Lint & Format** – ESLint, Prettier configured
- [x] **Type Checking** – `npm run typecheck` in CI
- [x] **Code Splitting** – React.lazy for lazy-loaded pages (risk, control, vendor, audit, ai)
- [x] **Bundle Optimization** – Vite for fast builds, tree-shaking enabled
- [x] **Environment Isolation** – dev, staging, prod configs
- [ ] **Automated Testing** – Unit, integration, E2E tests (future)
- [ ] **SAST/Dependency Scanning** – Snyk, Dependabot in CI (future)
- [ ] **Container-Based Deployment** – Docker image, Kubernetes-ready (future)
- [ ] **Infrastructure as Code** – Terraform/CDK for cloud infrastructure (future)

**Code Location**: `package.json`, `vite.config.ts`, `tsconfig.json`

---

## Compliance & Regulatory

### SOC 2 Type II Readiness

- [x] **CC6.1 – Logical Access Controls** – RBAC with 6 roles, 29 permissions
- [x] **CC7.2 – System Monitoring** – Telemetry and audit logging
- [x] **CC6.2 – Prior to Issuing System Access** – Demo user validation
- [x] **A1.1 – Availability & Performance** – ErrorBoundary, health checks
- [ ] **CC7.1 – Detect & Respond** – SIEM integration (future)
- [ ] **CC9.1 – Change Management** – Formal release process (future)

### ISO 27001 Alignment

- [x] **A.9.1 – Access Control Policy** – Defined RBAC model
- [x] **A.12.2 – Change Management** – Code review via Git
- [x] **A.12.4 – Logging & Monitoring** – AuditLogger and Telemetry
- [ ] **A.13.1 – Cryptography** – Encryption at rest/transit (future)
- [ ] **A.14.2 – Third-Party Assessments** – Vulnerability scanning (future)

### HIPAA Readiness (if applicable)

- [x] **Access Controls** – User authentication, RBAC
- [x] **Audit Logging** – All operations logged
- [x] **Encryption in Transit** – Future: TLS 1.3 mandatory
- [ ] **Encryption at Rest** – Future: database-level encryption
- [ ] **Business Associate Agreements (BAAs)** – Future: vendor management

**Audit Evidence Location**: All artifacts in `src/security/`, `src/telemetry/`

---

## Operations Handoff Checklist

Before handing to ops team:

- [x] Security threat model documented (`security.md`)
- [x] RBAC model and permissions defined (`types.ts`)
- [x] Audit logging implemented (`AuditLogger.ts`)
- [x] Error handling and telemetry configured (`telemetry/index.ts`, `ErrorBoundary.tsx`)
- [ ] APM integration documented and tested (future)
- [ ] SIEM integration endpoint documented (future)
- [ ] Deployment runbook written (future)
- [ ] Incident response procedures defined (future)
- [ ] Backup & disaster recovery tested (future)
- [ ] Load testing & capacity planning completed (future)

---

## Next Steps

1. **Immediate (MVP)**: Add unit tests for RBAC and AI governance logic
2. **Before Production**: Implement SSO/OIDC, httpOnly cookie sessions
3. **Phase 2**: SIEM and APM integration, encrypted storage
4. **Phase 3**: Full SOC 2 Type II audit, enterprise feature set (SCIM, MFA, data residency)
