# Security & Threat Model – IRM Sentinel

## Application Overview

**IRM Sentinel** – Enterprise IRM/GRC Platform
**Current Architecture**: Single-page React app (prototype)
**Future Architecture**: SPA + governed API layer + Claude AI governance

---

## Threat Model

### Attack Surfaces

| Surface | Description | Current Mitigations | Future Mitigations |
|---------|-------------|--------------------|--------------------|
| Copilot Chat Input | User-supplied text rendered in chat UI | Plain text rendering only (no HTML/markdown injection), no `dangerouslySetInnerHTML` | Server-side input validation, rate limiting, content filtering via governance layer |
| LocalStorage | Theme preference, audit logs stored | Low-sensitivity data only, no PII/credentials stored | Encrypted storage, session tokens via `httpOnly` cookies |
| AI Template Engine | Deterministic narratives generated from templates | No user input interpolation in templates, outputs treated as plain text | Governance layer validates all AI outputs before rendering |
| Route Parameters | `vendorId` etc. from URL | Validated against known entity IDs in seed data | Server-side validation, parameterized queries |
| Import/Export (JSON) | Workbench scenario export | `JSON.stringify` only, no file system access | Signed exports, virus scanning on imports |
| Future: API Layer | REST endpoints for data and AI | N/A (no backend yet) | OWASP API Security Top 10 compliance, OAuth2/OIDC, rate limiting, input validation |

---

## OWASP Top 10 2025 Alignment

| Category | Mapping | Implementation |
|----------|---------|-----------------|
| **A01: Broken Access Control** | Role-based access control with 6 roles, 29 granular permissions | `SecurityContext.tsx`, `RequirePermission` component, `can()` authorization utility |
| **A02: Cryptographic Failures** | No sensitive data in localStorage; future TLS everywhere, encrypted tokens | Centralized config, no credentials stored client-side |
| **A03: Injection** | No `dangerouslySetInnerHTML`, no `eval`/`Function`, all user text as plain text | Plain text rendering in Copilot chat, no SQL (client-side only) |
| **A04: Insecure Design** | Threat model documented, security-first architecture, audit logging on all AI calls | `AuditLogger.ts` with typed events, all AI operations logged |
| **A05: Security Misconfiguration** | Centralized config, feature flags, no debug in production, CSP headers planned | `config/index.ts` with security constants, environment-based overrides |
| **A06: Vulnerable Components** | Minimal dependency footprint: React, Vite, Tailwind, Zustand, Lucide | `npm audit` in CI pipeline, dependency scanning |
| **A07: Authentication Failures** | Auth boundary designed, session timeout configured, SSO/OIDC extension point ready | `SecurityProvider` context, demo user validation, future OIDC replacement |
| **A08: Software/Data Integrity** | All AI outputs deterministic and audited, future signed AI responses | `AIGovernanceClient` abstraction, deterministic template engine |
| **A09: Logging/Monitoring** | Typed audit events, Telemetry module with pluggable sinks, all AI calls logged | `AuditLogger.ts`, `telemetry/index.ts`, event tracking on every operation |
| **A10: SSRF** | No server-side requests in prototype; future allowlist-based external calls | Governance layer controls external API access |

---

## Security Controls Implemented

### Code Artifacts

**Identity & Authorization**
- `src/security/types.ts` — Role/Permission model with 6 enterprise roles and 29 permissions
- `src/security/SecurityContext.tsx` — React provider with auth state, `RequirePermission` gating component
- `src/security/authorization.ts` — `can()` utility for dynamic permission checks

**Audit & Logging**
- `src/security/AuditLogger.ts` — Typed `AuditEvent` model with pluggable sinks (console, localStorage)
- `src/telemetry/index.ts` — Telemetry module for errors, events, and performance tracking
- All AI calls audited with `userId`, `tenantId`, `module`, `action` context

**Configuration & Isolation**
- `src/config/index.ts` — Centralized configuration (no window globals)
- `src/data/tenantId.ts` — TenantId binding for multi-tenant isolation
- `src/components/ErrorBoundary.tsx` — Safe error rendering (no stack traces in production)

**Data Access**
- `src/data/DataAccessLayer.ts` — Abstraction for future API migration, tenant-aware filtering
- All core entities tagged with `tenantId` (Risk, Control, Vendor, Issue, AICall, AuditEvent)

**AI Governance**
- `src/ai/AIGovernanceClient.ts` — Abstract governance interface
- `src/ai/LocalTemplateAIClient.ts` — Deterministic, audited template-based AI
- `src/ai/StubGovernedAIClient.ts` — Simulated Claude integration with full audit trail

---

## Security Architecture

### Authentication Boundary

```
┌─────────────────────────┐
│   SecurityProvider      │
├─────────────────────────┤
│  • Auth state           │
│  • Session management   │
│  • Role/permission      │
│    validation           │
└──────────┬──────────────┘
           │
    ┌──────┴──────┐
    │             │
RequirePermission  ✓ Authorized
    │             │
    ✗ Denied      (Route/Component)
```

### Data Flow – AI Operations

```
User Input
    │
    ├─ Copilot Chat (plain text only)
    │
    ├─ AuditLogger.logAICall()
    │  (userId, tenantId, module, action)
    │
    ├─ AIGovernanceClient.generateNarrative()
    │  (LocalTemplateAIClient or StubGovernedAIClient)
    │
    └─ Output rendered as plain text
       (no HTML/markdown injection)
```

---

## Future Security Roadmap

**Phase 1 (Prototype → MVP)**
- SSO/OIDC integration (replace `DEMO_USERS`)
- httpOnly cookie sessions (replace localStorage)
- CSP headers and X-Frame-Options

**Phase 2 (Production)**
- Production Claude governance layer with policy enforcement
- Encrypted storage (at rest + in transit)
- SIEM integration (Splunk, Elastic)
- APM integration (Datadog, New Relic)

**Phase 3 (Enterprise)**
- Hardware security module (HSM) for key management
- SCIM user provisioning
- MFA/WebAuthn support
- Data residency & encryption key rotation per-tenant

---

## References

- OWASP Top 10 2025: https://owasp.org/Top10/
- OWASP API Security: https://owasp.org/www-project-api-security/
- CWE Top 25: https://cwe.mitre.org/top25/
