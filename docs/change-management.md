# Change Management Policy

**IRM Command** - Enterprise GRC SaaS Platform
**Document Version**: 1.0
**Last Updated**: 2026-03-24
**Status**: Active

## 1. Introduction

This policy defines how IRM Command manages changes to infrastructure, application code, configurations, and data models. The goal is to minimize risk while maintaining deployment velocity for critical security updates.

---

## 2. Change Classification

Changes are categorized into three types based on risk and complexity:

### Standard Changes
**Definition**: Pre-approved, low-risk changes with proven procedures.

**Examples**:
- Dependency updates (patch versions, no breaking changes)
- Documentation updates
- UI text/color/spacing changes (non-functional)
- Non-security bug fixes affecting <1% of users
- Log level adjustments

**Approval**: Auto-approved by CI/CD pipeline; no human review required
**Deployment Window**: Any time (24/7)
**Rollback**: Automatic via GitOps on failure

### Normal Changes
**Definition**: Moderate-risk changes requiring peer review and testing.

**Examples**:
- New feature development
- API endpoint changes
- Database schema migrations
- Security-relevant code changes (auth, encryption)
- Dependency updates (minor/major versions)
- Infrastructure changes (compute, storage, networking)
- Configuration changes (feature flags, rate limits, timeouts)

**Approval**: Requires 2 peer code reviewers; 1 approver for deployment
**Deployment Window**: Business hours preferred; core hours (9am-5pm PT) for prod
**Rollback**: Manual rollback or GitOps revert within 15 minutes
**Notification**: Slack #releases channel 30min before deployment

### Emergency Changes
**Definition**: Critical security or availability issues requiring immediate remediation.

**Examples**:
- Active security breach mitigation
- Critical data loss recovery
- DoS/DDoS attack response
- Production outage (>1 hour SLA breach)
- Compliance violation remediation (regulatory deadline)

**Approval**: Any two of {VP Engineering, Security Lead, Incident Commander}; documented via incident ticket
**Deployment Window**: Immediate (24/7)
**Rollback**: Standard procedure; post-incident review mandatory
**Notification**: Incident.io escalation to all on-call engineers

---

## 3. CI/CD Pipeline Gates

All deployments flow through automated gates in sequence. Failure at any gate blocks progression.

```
┌─────────────────────────────────────────────────────────────────┐
│                    Developer Push (git push origin)              │
└──────────────────┬──────────────────────────────────────────────┘
                   │
         ┌─────────▼──────────┐
         │  1. Lint (ESLint)  │  ◄── Catches style violations
         │  ~30 seconds       │
         └─────────┬──────────┘
                   │
         ┌─────────▼────────────────────┐
         │  2. Type Check (TypeScript)  │  ◄── Catches type errors
         │  ~60 seconds                 │
         └─────────┬────────────────────┘
                   │
         ┌─────────▼────────────────────┐
         │  3. Unit Tests (Jest)        │  ◄── Required >80% coverage
         │  ~120 seconds                │
         └─────────┬────────────────────┘
                   │
         ┌─────────▼──────────────────────────────┐
         │  4. SAST Scan (Snyk/SonarQube)         │  ◄── Security scan
         │  ~90 seconds                           │
         └─────────┬──────────────────────────────┘
                   │
         ┌─────────▼──────────────────┐
         │  5. Build (Vite + Docker)  │  ◄── Create Docker image
         │  ~180 seconds              │
         └─────────┬──────────────────┘
                   │
         ┌─────────▼──────────────────────────┐
         │  6. Deploy to Staging (K8s)        │  ◄── Automated via GitOps
         │  ~120 seconds                      │
         └─────────┬──────────────────────────┘
                   │
         ┌─────────▼──────────────────────┐
         │  7. Smoke Tests (k6)           │  ◄── 5min health check suite
         │  ~300 seconds                  │
         └─────────┬──────────────────────┘
                   │
         ┌─────────▼────────────────────────────────────┐
         │  8. Manual Approval (Required for Prod)      │  ◄── Human gate
         │  Requires: 1 approval from {dev lead, CISO} │
         └─────────┬────────────────────────────────────┘
                   │
         ┌─────────▼──────────────────────┐
         │  9. Deploy to Production (K8s) │  ◄── Canary: 10% → 50% → 100%
         │  Blue-green deployment         │
         └─────────┬──────────────────────┘
                   │
         ┌─────────▼────────────────────┐
         │  10. Prod Smoke Tests (k6)   │  ◄── Continuous monitoring
         │  Error rate, p95 latency      │
         └─────────▼────────────────────┘
                   │
              DEPLOYED
```

**Gate Descriptions:**

1. **Lint**: ESLint checks code style (no-unused-vars, semicolons, etc.)
2. **Type Check**: TypeScript compiler validates type safety
3. **Unit Tests**: Jest suite must pass; code coverage >80%
4. **SAST Scan**: Snyk + SonarQube detect security vulnerabilities
5. **Build**: Vite builds frontend; Docker builds API image; push to ECR/GCR
6. **Staging Deploy**: Automatically deploy to staging via ArgoCD
7. **Smoke Tests**: k6 script validates critical user journeys
8. **Manual Approval**: Required for prod (except Standard changes)
9. **Prod Deploy**: Canary rollout (10% → 50% → 100% over 30 minutes)
10. **Prod Smoke Tests**: Continuous validation post-deployment

**Failure Handling**: If any gate fails, deployment is blocked. Developer must fix and retry.

---

## 4. Code Review Requirements

### Standard Changes
- **Reviewers Required**: 0 (auto-approved)
- **Review Scope**: N/A
- **Approval Deadline**: N/A

### Normal Changes
**Reviewers Required**: 2 peer reviewers (both must approve)

**Review Checklist**:
- [ ] Code follows style guide and passes linter
- [ ] Logic is clear and maintainable
- [ ] No security vulnerabilities introduced (OWASP Top 10)
- [ ] Database changes are backward-compatible
- [ ] Tests cover happy path + error cases
- [ ] Performance impact assessed (e.g., N+1 queries)
- [ ] Accessibility standards met (WCAG 2.1 AA)
- [ ] No hardcoded credentials or secrets
- [ ] Error handling is graceful
- [ ] Documentation updated

**Security-Sensitive Changes** (require special attention):
- Authentication / MFA / session management
- Authorization / RBAC / permission checks
- Cryptography / key management
- API changes (breaking, deprecated endpoints)
- Data export / bulk operations
- Third-party integrations
- Audit logging

For security-sensitive changes: **2 reviewers required, with at least 1 security-trained reviewer**.

**Approval Deadline**: Reviews must complete within 24 hours of PR opening (weekday only).

### Emergency Changes
- **Reviewers Required**: 0 (bypassed for emergency)
- **Post-Deploy Review**: Mandatory within 24 hours
- **Post-Mortem**: Incident postmortem required within 72 hours

---

## 5. High-Risk Configuration Change Request Model

Configuration changes that affect security, compliance, or availability require formal approval via a **ChangeRequest** workflow.

### ChangeRequest TypeScript Definition

```typescript
interface ChangeRequest {
  // Identity
  id: string; // UUID
  createdAt: ISO8601;
  createdBy: UserId;

  // Change details
  type: 'config' | 'infrastructure' | 'policy';
  title: string;
  description: string;

  // Change specification
  affectedComponent: string; // e.g., 'api_rate_limit', 'db_backup_retention'
  beforeValue: Record<string, any>;
  afterValue: Record<string, any>;
  businessJustification: string;

  // Risk assessment
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  potentialImpact: string;
  rollbackPlan: string;
  testingStrategy: string;

  // Approval workflow
  requesterRole: 'compliance' | 'security' | 'ops' | 'engineering';
  approvals: Approval[];
  status: 'Draft' | 'Pending' | 'Approved' | 'Deployed' | 'Rejected' | 'RolledBack';

  // Deployment
  deploymentScheduledFor?: ISO8601;
  deployedAt?: ISO8601;
  deployedBy?: UserId;

  // Post-deployment
  deploymentResult: 'success' | 'failed' | 'rolled_back';
  rollbackReason?: string;
  rolledBackAt?: ISO8601;
}

interface Approval {
  approverId: UserId;
  approverRole: string;
  approvedAt: ISO8601;
  comments: string;
  decision: 'approved' | 'rejected';
}

// Example: RDS backup retention increase
const exampleChangeRequest: ChangeRequest = {
  id: 'cr-2026-0324-001',
  createdAt: '2026-03-24T10:00:00Z',
  createdBy: 'user-456',
  type: 'config',
  title: 'Increase RDS backup retention from 30 to 90 days',
  description: 'Comply with new SOC 2 audit requirement for 90-day backup history',
  affectedComponent: 'rds_backup_retention',
  beforeValue: { retentionDays: 30 },
  afterValue: { retentionDays: 90 },
  businessJustification: 'Audit requirement for SOC 2 Type II certification',
  riskLevel: 'low',
  potentialImpact: 'Cost increase ~$150/month; storage quota increase 60GB',
  rollbackPlan: 'Revert RDS parameter to retentionDays=30',
  testingStrategy: 'Test in staging; verify backup restoration works',
  requesterRole: 'compliance',
  approvals: [
    {
      approverId: 'user-123',
      approverRole: 'ciso',
      approvedAt: '2026-03-24T11:30:00Z',
      comments: 'Approved for audit compliance',
      decision: 'approved'
    },
    {
      approverId: 'user-789',
      approverRole: 'devops',
      approvedAt: '2026-03-24T12:00:00Z',
      comments: 'Capacity verified; no infra impact',
      decision: 'approved'
    }
  ],
  status: 'Approved',
  deploymentScheduledFor: '2026-03-25T02:00:00Z', // Off-hours
  deployedAt: '2026-03-25T02:15:00Z',
  deployedBy: 'user-789',
  deploymentResult: 'success'
};
```

### ChangeRequest Workflow

1. **Draft**: Requester creates CR with full details
2. **Pending**: CR submitted for approval; email notification to approvers
3. **Approval Chain**:
   - If riskLevel = 'low': 1 approval required (VP Ops or CISO)
   - If riskLevel = 'medium': 2 approvals required (CISO + Engineering Lead)
   - If riskLevel = 'high' or 'critical': 3 approvals (CISO + VP Eng + CFO/Compliance)
4. **Approved**: All required approvals obtained; ready for deployment
5. **Deployed**: Change applied to production
6. **Success/Failed**: Post-deployment validation
7. **RolledBack**: If deployment fails, automatic rollback triggered

---

## 6. Deployment Approval Matrix

| Environment | Change Type | Approvers | Auto-Approve | Approval Deadline |
|-------------|------------|-----------|--------------|------------------|
| **Staging** | Standard | None | ✓ | N/A |
| **Staging** | Normal | 1 (Tech Lead) | ✗ | 24h |
| **Staging** | Emergency | None (Incident Cmdr) | ✓ | Real-time |
| **Production** | Standard | None | ✓ | N/A |
| **Production** | Normal | 1 (VP Eng or CISO) | ✗ | 24h |
| **Production** | Emergency | 2 of {VP Eng, CISO, On-Call Lead} | ✓ | Real-time |

**Approver Matrix** (who can approve what):
- **VP Engineering**: Can approve all changes for staging/prod; Standard + Normal
- **CISO**: Can approve security-sensitive Normal/Emergency changes
- **Incident Commander**: Can approve Emergency changes (incident context)
- **Tech Lead**: Can approve Normal changes for staging only
- **Any engineer**: Cannot approve (can only request)

---

## 7. Rollback Procedures

### Automatic Rollback (Immediate)
Triggered if:
- Error rate >1% (5min window)
- p99 latency >1000ms (5min window)
- API crashes on startup
- Health checks fail on 3+ pods
- Critical SIEM alert fires

**Action**: ArgoCD automatic revert to previous stable commit; PagerDuty alert fired; Slack #incidents notification

**Time to Rollback**: ~2 minutes

### Manual Rollback (On-Demand)
Initiated by on-call engineer or incident commander:

```bash
# Option 1: Revert to previous deployment
kubectl rollout undo deployment/irm-api -n prod --to-revision=<N>

# Option 2: Git revert (trigger CI/CD)
git revert HEAD --no-edit
git push origin main

# Option 3: ArgoCD sync to previous commit
argocd app sync irm-prod --revision=<commit-sha>
```

**Time to Rollback**: 5-10 minutes (manual review)

### Post-Rollback
1. Incident ticket created with root cause
2. Post-mortem scheduled within 24 hours
3. Postmortem findings drive code/process improvements
4. If change is still needed: fix, re-review, re-test, re-deploy

---

## 8. Emergency Change Process

**Definition**: Critical issue requiring immediate remediation (security breach, data loss, compliance violation, production outage).

### Activation
1. Any engineer can declare an emergency via `/incident` Slack command
2. Incident.io alert sent to on-call engineering, security, and ops teams
3. Incident channel created (#incident-XXXX)

### Change Execution
1. **Fix Development** (0-15 min): Engineer writes fix locally; minimal review (1 peer approval acceptable)
2. **Testing** (15-30 min): Smoke tests in staging; can skip if <5 lines & critical
3. **Deployment** (30-45 min): Deploy to prod; monitor metrics continuously
4. **Validation** (45-60 min): Confirm incident resolved; impact assessment

### Post-Incident (Required)
1. **Incident Report** (within 24h): Root cause, timeline, remediation
2. **Postmortem** (within 72h): Cross-functional review
   - What happened?
   - Why did it happen?
   - What changes prevent recurrence?
   - Action items (assigned, due dates)
3. **Action Item Tracking**: Jira tickets for all improvements
4. **Communication**: Customer notification (if SLA breached)

### Example Emergency Postmortem
```markdown
# Incident Postmortem: Data Exposure via Unmasked PII in Logs

**Date**: 2026-03-24
**Severity**: SEV-1 (Critical)
**Duration**: 2h 15min
**Impact**: 47 tenants affected; 3,200 records with unmasked SSNs

## What Happened
1. 09:15 - SIEM alert: Unusual export volume detected
2. 09:32 - Security team confirmed: PII masking function broken
3. 09:48 - Emergency fix merged; deployed to prod
4. 10:15 - Validation complete; masking restored
5. 11:30 - Root cause identified: recent refactor removed masking call

## Root Cause
Commit abc123 refactored audit log serialization; accidentally removed
`maskPII()` call in export handler.

## Remediation
- Revert commit abc123
- Add regression test: export must mask SSN/email/phone
- Require security review for all log/export changes

## Action Items
- [ ] Implement mandatory security code review (Owner: VP Eng, Due: 2026-03-25)
- [ ] Add PII masking test to CI/CD (Owner: Engineer X, Due: 2026-03-27)
- [ ] Audit all logs for exposed PII; notify affected tenants (Owner: Legal, Due: 2026-03-28)
```

---

## 9. Compliance & Audit

- **Change Log Retention**: 7 years (archived in S3 Glacier)
- **Audit Verification**: Monthly manual audit of 10% of deployments (verify logs match CI/CD records)
- **Compliance Review**: Quarterly audit by external firm for SOC 2
- **Change Metrics**: Tracked in Datadog (deployment frequency, lead time, failure rate, MTTR)

---

## 10. Contact & Escalation

- **Policy Questions**: Slack #engineering-process
- **Change Approval**: Jira tickets to #releases-team
- **Emergency**: Page on-call via PagerDuty (Incident.io)
- **Policy Updates**: Approved by Security Committee (CISO + 2 VP-level approvers) quarterly

**Next Review**: 2026-06-24
