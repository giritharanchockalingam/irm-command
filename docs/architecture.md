# IRM Command: Enterprise Architecture Documentation

## 1. Overview

**IRM Command** is an Enterprise AI-Powered Integrated Risk Management (IRM) platform designed for Global Systemically Important Banks (G-SIBs). The platform provides comprehensive governance, risk, and compliance (GRC) capabilities through an intelligent, AI-driven interface.

- **Product Vision**: Unified IRM across operational, credit, market, liquidity, compliance, and enterprise risks
- **Implementation Model**: Browser-only prototype with embedded Claude governance blueprint for production deployment
- **Target Users**: Risk officers, compliance managers, internal auditors, examiners, and executive leadership
- **Regulatory Context**: Basel III Endgame, OCC, FDIC, and Fed exam-ready reporting

## 2. Tech Stack

### Frontend Framework
- **React 18** with TypeScript for type-safe component development
- **Vite** for lightning-fast development and optimized builds
- **React Router v6** for client-side routing without server dependencies

### Styling & UI
- **Tailwind CSS** with custom dark/light theme system
- **Lucide React** for consistent, scalable iconography
- No CSS-in-JS runtime overhead

### State Management
- **Zustand** for lightweight, modular store architecture
- **localStorage** for client-side persistence (theme preferences, user state)
- No backend state synchronization required

### AI Integration
- **Local Template Engine** for deterministic, streaming narratives (current)
- **Claude API Integration Blueprint** for governed AI calls (future production)
- Pluggable AIClient interface for seamless migration

### Design System
- Custom component library built on Tailwind primitives
- Responsive design supporting mobile to desktop
- Dark mode by default with light mode option
- Accessibility-first component architecture (WCAG 2.1)

### Build & Deployment
- No backend or external APIs required for core functionality
- All data loading happens on initial bootstrap
- Fully client-rendered for maximum security and portability

## 3. Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                         UI LAYER (Pages)                          │
│  Dashboard | TPRM | Compliance | Workbench | Copilot | Settings  │
└──────────────────────────────────────────────────────────────────┘
                                 ▲
                                 │
┌──────────────────────────────────────────────────────────────────┐
│                    COMPONENT LIBRARY LAYER                        │
│  Card | Badge | Table | Modal | StreamingText | Chart | Gauge    │
│  Input | Button | Select | Dialog | Tabs | Tooltip | Alert       │
└──────────────────────────────────────────────────────────────────┘
                                 ▲
                                 │
┌──────────────────────────────────────────────────────────────────┐
│                  AI CLIENT ABSTRACTION LAYER                      │
│  ┌────────────────────┐      ┌────────────────────────────────┐  │
│  │ LocalTemplateAI    │      │ ClaudeGovernedAIClient         │  │
│  │ Client             │      │ (Future - Production)          │  │
│  │ (Current Prototype)│      │ • Governance Service           │  │
│  └────────────────────┘      │ • Rate Limiting & Audit        │  │
│                              │ • Tool Orchestration            │  │
│                              │ • Role-Based Prompting          │  │
│                              └────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
                                 ▲
                                 │
┌──────────────────────────────────────────────────────────────────┐
│            LOCAL AI TEMPLATE ENGINE & STREAMING                   │
│  • Deterministic narrative generation                             │
│  • Streaming simulation for realistic UX                          │
│  • Configurable regulatory tone (OCC/FDIC/Basel III)             │
│  • Prompt template registry                                       │
│  • Multi-agent scenario orchestration                             │
└──────────────────────────────────────────────────────────────────┘
                                 ▲
                                 │
┌──────────────────────────────────────────────────────────────────┐
│                DOMAIN MODEL & SEED DATA LAYER                     │
│  • Risks (Operational, Credit, Market, Liquidity, Compliance)    │
│  • Controls (Preventive, Detective, Corrective)                  │
│  • Vendors & Third-Party Relationships                            │
│  • Issues, Findings, & MRA/MRIA Items                             │
│  • KRIs & Monitoring Alerts                                       │
│  • Loss Events & Historical Data                                  │
│  • Regulatory Changes & Industry Updates                          │
│  • Stress Test Scenarios & Assessment Models                      │
│  • Audit Trail & Change History                                   │
└──────────────────────────────────────────────────────────────────┘
                                 ▲
                                 │
┌──────────────────────────────────────────────────────────────────┐
│              STATE MANAGEMENT LAYER (Zustand)                     │
│  • Theme Store (dark/light mode)                                  │
│  • App Store (navigation, filters, selections)                    │
│  • localStorage Persistence                                       │
│  • Derived state selectors                                        │
└──────────────────────────────────────────────────────────────────┘
```

## 4. Domain Model

### Core Entities

**Risk**
- Unique identifier and risk type (Operational, Credit, Market, Liquidity, Compliance, Enterprise)
- Inherent and residual risk scores (0–5.0 scale)
- Description, root causes, and potential impact
- Associated controls (preventive, detective, corrective)
- Related KRIs and monitoring indicators
- Status (Active, Mitigated, Accepted, Escalated)

**Control**
- Control ID, name, and framework association (Basel III, SR 11-7, OCC Guidance)
- Implementation status (Designed, Implemented, Tested, Partially Implemented, Not Implemented)
- Design and operational effectiveness ratings
- Related risks and test evidence
- Last assessment date and next review date
- Owner and responsible function

**Vendor (Third-Party)**
- Vendor name, type (Technology, Service, Outsourcing), and criticality tier
- SLA status and performance metrics
- Control coverage and assessment status
- Due diligence questionnaire responses
- Monitoring alerts and risk metrics
- Regulatory classification (Critical, Important, Other)

**Issue (Finding/MRA/MRIA)**
- Issue ID, title, and description
- Severity (Critical, High, Medium, Low)
- Source (Regulatory Exam, Internal Audit, Risk Assessment, Control Testing)
- Root causes and contributing factors
- Remediation plan with target closure date
- Status (Open, In Progress, Resolved, Closed)
- Related risks and controls
- Ownership and accountability

**KRI (Key Risk Indicator)**
- KRI name, definition, and calculation formula
- Measurement frequency (Daily, Weekly, Monthly, Quarterly)
- Current value, threshold (Warning/Breach), and trend
- Supporting metrics and drill-down data
- Alert mechanism and escalation path
- Owner and monitoring responsibility

**Loss Event**
- Event date, discovery date, and loss amount
- Description and root cause analysis
- Related risk category and control gap
- Internal or external loss classification
- Remediation actions taken

**Regulatory Change**
- Regulation name and effective date
- Impact areas (Capital, Liquidity, Risk Governance, Reporting)
- Compliance deadline and current status
- Related controls and testing scope
- Fed/OCC/FDIC source and guidance documents

**Scenario / Assessment**
- Scenario name, type (Stress Test, Risk Assessment, Sensitivity Analysis)
- Input parameters and assumptions
- Computed risk scores and outcomes
- Supporting narrative and decision logic
- Timestamp and scenario version

### Relationships

```
Risk --[mitigatedBy]--> Control (1:M)
Risk --[monitoredBy]--> KRI (1:M)
Risk --[triggersIssue]--> Issue (1:M)

Control --[reportsTo]--> Framework (1:M)
Control --[testedBy]--> Audit (1:M)

Vendor --[hasControls]--> Control (M:M)
Vendor --[hasIssues]--> Issue (1:M)

Issue --[remediates]--> Risk (M:1)
Issue --[relatesTo]--> Control (M:M)

KRI --[breachTriggers]--> Alert (1:M)

Scenario --[uses]--> RiskAssessmentModel (M:1)
```

### Audit Trail Model

Every AI-generated artifact (narrative, assessment, questionnaire) is tracked:

```
AuditTrailEntry {
  id: string
  timestamp: ISO8601
  entityType: "Risk" | "Control" | "Vendor" | "Issue" | ...
  entityId: string
  action: "generated" | "modified" | "deleted" | "reviewed"
  aiClient: "LocalTemplate" | "ClaudeGoverned"
  prompt: string (hashed or full text)
  output: string (hashed or full text)
  userId: string (future)
  role: string (future)
  context: {
    page: string
    filters: Record<string, any>
    parameters: Record<string, any>
  }
}
```

## 5. AI Engine Architecture

### Template Engine Design

The local AI template engine generates narratives, assessments, and structured outputs without requiring external API calls. It combines:

**Deterministic Generation**
- Prompt templates stored in a registry with placeholders
- Seed data and entity properties populate placeholders at runtime
- Deterministic logic operators (threshold-based, categorical, mathematical)
- Persona-based tone and language adapters

**Streaming Simulation**
- Narratives are chunked and yielded character-by-character to simulate streaming
- Timing parameters control perceived "thinking" delays
- Realistic delays between logical sections (introduction, analysis, recommendations)
- User perceives live AI generation while content is pre-computed

### Template Registry Structure

```javascript
{
  "narratives": {
    "daily_digest": {
      "template": "On {DATE}, {BANK_NAME}...",
      "slots": ["DATE", "BANK_NAME", "TOP_ISSUES", ...],
      "tone": "executive",
      "sections": ["summary", "top_risks", "action_items"]
    },
    "vendor_assessment": {
      "template": "...",
      "slots": ["VENDOR_NAME", "RISK_SCORE", ...],
      "tone": "examiner",
      "sections": ["overview", "control_coverage", "remediation"]
    }
  },
  "scoringLogic": {
    "enterprise_risk_score": {
      "inputs": ["op_risk", "credit_risk", "market_risk", ...],
      "weights": { "op_risk": 0.3, ... },
      "scale": [0, 5.0]
    }
  }
}
```

### Narrative Generation Patterns

**Executive Daily Digest**
1. Retrieve top open issues, KRI breaches, and new risks
2. Calculate enterprise risk score and trend
3. Interpolate template slots with entity data
4. Apply regulatory tone filter
5. Stream output in sections: headline, executive summary, top 3 action items, scorecard

**Vendor Assessment**
1. Load vendor profile, control coverage, and recent alerts
2. Compute vendor risk score from weighted KPIs
3. Generate assessment narrative with sections: overview, strengths, gaps, recommendations
4. Reference control testing results and audit findings
5. Stream with professional tone

**Regulatory Exam Workpaper**
1. Collect control testing evidence, findings, and remediation status
2. Generate OCC/FDIC exam-style narrative with required sections
3. Reference regulatory framework (Basel III, SR 11-7, etc.)
4. Highlight control design vs. operational effectiveness
5. Include quantitative metrics and trend analysis

### Regulatory Tone Calibration

Tone adapters adjust language, formality, and emphasis:

| Audience | Tone | Language | Emphasis |
|----------|------|----------|----------|
| Executive | Concise, action-oriented | Simple, metric-heavy | Outcomes, risk appetite |
| Risk Officer | Analytical, detail-focused | Technical, control-centric | Gaps, root causes, remediation |
| Examiner | Formal, finding-oriented | Regulatory language | Deficiencies, compliance, evidence |
| Board | Strategic, high-level | Governance language | Risks to enterprise objectives |

## 6. Claude Governance Integration Blueprint

### Production Architecture (Future)

The governance service acts as a policy enforcement layer between the frontend and Claude API:

```
┌──────────────┐
│   Frontend   │
│  (React App) │
└──────┬───────┘
       │ HTTP POST
       │ { prompt, context, role, entity }
       ▼
┌──────────────────────────────────┐
│   Governance Service Layer       │
│ (Node.js + Policy Engine)        │
│                                  │
│ 1. Validate request & rate limit │
│ 2. Extract role & context        │
│ 3. Apply role-based prompt       │
│ 4. Add audit context             │
│ 5. Call Claude with constraints  │
│ 6. Post-process output           │
│ 7. Record audit trail            │
│ 8. Return to client              │
└──────┬───────────────────────────┘
       │ HTTPS
       │ { model, messages, max_tokens, tools }
       ▼
┌──────────────────────────────────┐
│      Claude API (claude-3)       │
│ (Anthropic SaaS)                 │
└──────┬───────────────────────────┘
       │ Streaming response
       │
       ▼
┌──────────────────────────────────┐
│   Post-Processing & Validation   │
│ • Fact-check against seed data   │
│ • Format for regulatory output   │
│ • Redact sensitive content       │
│ • Extract structured fields      │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────┐
│   Frontend   │
│  (Display)   │
└──────────────┘
```

### Policy-as-Code Approach

Governance policies are defined as executable rules:

```javascript
{
  "policies": {
    "risk_assessment": {
      "roles": {
        "risk_officer": {
          "allowed_models": ["claude-3-sonnet"],
          "maxTokens": 2000,
          "rateLimit": "10 calls/hour",
          "promptPrefix": "You are a risk management expert...",
          "outputConstraints": {
            "sections": ["summary", "risk_factors", "mitigation", "recommendation"],
            "maxScore": 5.0,
            "validateAgainst": ["risk_registry"]
          }
        },
        "examiner": {
          "allowed_models": ["claude-3-sonnet"],
          "maxTokens": 3000,
          "rateLimit": "20 calls/hour",
          "promptPrefix": "You are a bank examiner conducting...",
          "outputConstraints": {
            "sections": ["findings", "deficiencies", "positive_practices", "recommendations"],
            "regulatory_references": true
          }
        }
      }
    }
  }
}
```

### Role & Context-Aware Prompts

Prompts are dynamically constructed based on user role and entity context:

```
Base Prompt Template:
"You are a [ROLE_TITLE] for [BANK_NAME]. Generate a [OUTPUT_TYPE] for [ENTITY].
Consider: [RELEVANT_CONTROLS], [RECENT_ISSUES], [REGULATORY_FRAMEWORK].
Output format: [STRUCTURE].
Constraints: [POLICIES]."

Example Execution:
"You are a Senior Risk Officer for JPMorgan Chase. Generate an assessment
for the Meridian Cloud Services vendor (Tier 1, Critical).
Consider: IT controls (SOC 2 Type II, ISO 27001), recent alerts (SLA breach,
patch delay), regulatory framework (SR 11-7, OCC Guidance).
Output format: JSON with sections: overview, control_coverage, risk_score,
remediation_actions.
Constraints: Risk score must be between 1-5; reference control testing dates."
```

### Audit & Observability

Every Claude call is logged with full context:

```javascript
{
  "auditId": "au_1h2i3j4k5l6m7n8o",
  "timestamp": "2026-03-24T14:32:00Z",
  "user": { "id": "user_123", "role": "risk_officer" },
  "request": {
    "entityType": "Vendor",
    "entityId": "vendor_meridian",
    "outputType": "assessment",
    "model": "claude-3-sonnet",
    "prompt_hash": "sha256_abc123..."
  },
  "response": {
    "usage": { "input_tokens": 850, "output_tokens": 1240 },
    "latency_ms": 3200,
    "streamed": true,
    "output_hash": "sha256_def456..."
  },
  "governance": {
    "policy_applied": "risk_assessment",
    "rate_limit_check": "passed",
    "post_processing": ["fact_check", "format_validation", "redaction"]
  }
}
```

### Tool Orchestration for Claude

The Claude API call can include tools for structured information extraction:

```javascript
{
  "model": "claude-3-sonnet",
  "messages": [
    {
      "role": "user",
      "content": "Assess the Meridian Cloud Services vendor..."
    }
  ],
  "tools": [
    {
      "name": "risk_scorer",
      "description": "Score a risk on scale 1-5 with justification",
      "input_schema": {
        "type": "object",
        "properties": {
          "risk_category": { "type": "string", "enum": ["ops", "credit", "tech"] },
          "score": { "type": "number", "minimum": 1, "maximum": 5 },
          "justification": { "type": "string" }
        }
      }
    },
    {
      "name": "find_related_controls",
      "description": "Return control IDs related to assessment",
      "input_schema": { ... }
    }
  ]
}
```

### Failover Strategy

If Claude API is unavailable or rate-limited, the system gracefully falls back to local templates:

```javascript
async function generateNarrative(prompt, options) {
  try {
    // Attempt Claude governance path
    return await claudeGovernedClient.generate(prompt, options);
  } catch (error) {
    if (error.code === "RATE_LIMITED" || error.code === "SERVICE_UNAVAILABLE") {
      console.warn("Claude unavailable, falling back to local template");
      return await localTemplateClient.generate(prompt, options);
    }
    throw error;
  }
}
```

## 7. Frontend Integration Steps

### Phase 1: Current (Local Template Client)

The app uses a pluggable AIClient interface implemented by LocalTemplateAIClient:

```typescript
interface AIClient {
  async generate(prompt: string, options: GenerationOptions): AsyncGenerator<string>
  async assessRisk(risk: Risk): Promise<Assessment>
  async assessVendor(vendor: Vendor): Promise<VendorAssessment>
  async generateQuestionnaire(vendor: Vendor): Promise<Questionnaire>
  async generateExamNarrative(control: Control): Promise<ExamWorkpaper>
}

class LocalTemplateAIClient implements AIClient {
  async *generate(prompt: string, options: GenerationOptions) {
    const template = this.registry.get(options.templateId);
    const filled = this.interpolate(template, options.slots);
    yield* this.streamText(filled, options.streamDelay);
  }
  // ... other methods
}
```

Usage in components:

```typescript
const { generate } = useAIClient();

async function generateDigest() {
  const messages: string[] = [];
  for await (const chunk of generate(prompt, { templateId: "daily_digest" })) {
    messages.push(chunk);
    setDigest(messages.join(""));
  }
}
```

### Phase 2: Future (Claude Governed Client)

A new implementation wraps the governance service:

```typescript
class ClaudeGovernedAIClient implements AIClient {
  constructor(private governanceServiceUrl: string, private userContext: UserContext) {}

  async *generate(prompt: string, options: GenerationOptions) {
    const response = await fetch(`${this.governanceServiceUrl}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        role: this.userContext.role,
        entity: options.entity,
        outputType: options.outputType
      })
    });

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      yield decoder.decode(value);
    }
  }
  // ... other methods
}
```

### Phase 3: Migration Path

Environment-based client selection:

```typescript
const createAIClient = (): AIClient => {
  if (import.meta.env.VITE_AI_MODE === "claude_governed") {
    return new ClaudeGovernedAIClient(
      import.meta.env.VITE_GOVERNANCE_SERVICE_URL,
      getUserContext()
    );
  }
  return new LocalTemplateAIClient();
};

export const useAIClient = () => {
  const [client] = useState(() => createAIClient());
  return client;
};
```

Feature flag for gradual rollout:

```typescript
const useAIClient = () => {
  const { claudeEnabled } = useFeatureFlags();
  const [client] = useState(() => {
    if (claudeEnabled) return new ClaudeGovernedAIClient(...);
    return new LocalTemplateAIClient();
  });
  return client;
};
```

## 8. Security & Compliance Considerations

### Data Handling

**No PII in Prototype**
- Vendor names are fictional (Meridian Cloud Services, etc.)
- Risk descriptions and issues are generic examples
- No real bank data, customer information, or transaction details
- Safe for demonstration and training purposes

**Audit Trail Design**
- All AI-generated content is logged with timestamps, prompts, and outputs
- Audit trail includes user role, entity context, and governance policies applied
- Tamper-evident audit trail (hash chains for future versions)
- Searchable by entity, date range, user, and output type

### Data Residency (Future)

When integrated with Claude:

- Governance service runs within bank's cloud infrastructure (AWS, Azure, GCP)
- Claude API calls made from bank's VPC with no internet exposure
- Response post-processing happens before client delivery
- Audit logs stored in bank's secure repository

### Usage Monitoring

- Token usage tracked per user, role, and output type
- Anomaly detection for unusual generation patterns
- Dashboard showing AI generation costs and trends
- Rate limiting by role and time window

### Compliance Controls

- Prompts and outputs subject to DLP scanning (future)
- Regulatory-specific tone and constraints enforced at governance layer
- Versioning of prompt templates for audit trail
- Change control process for policy updates

## 9. Module Architecture

### Dashboard Module
Provides executive view of enterprise risk posture. Displays:
- Enterprise Risk Score with trend sparklines
- KRI monitor with breach/warning status
- Top open issues and action items
- Program maturity pentagon
- Daily AI digest with streaming generation
- OCC/FDIC examiner view perspective toggle

### TPRM (Third-Party Risk Management) Module
Manages vendor lifecycle and control coverage. Features:
- Vendor overview with criticality tiers
- SLA performance tracking with alerts
- AI vendor assessment generation
- Due diligence questionnaire generator
- OCC exam-ready workpaper generation
- Control mapping and testing evidence
- Monitoring alert interpretation with AI

### Compliance & Regulatory Module
Tracks control implementation and regulatory changes. Provides:
- Control library searchable by framework (Basel III, SR 11-7, OCC)
- Implementation status tracking with testing evidence
- MRA/MRIA issue tracking and remediation
- Regulatory intelligence updates and impact analysis
- AI-powered regulatory change impact assessment
- Compliance gap analysis with recommendations

### Risk Scoring Studio (Workbench)
Interactive risk assessment and scenario modeling. Includes:
- Pre-built scenario templates (CRE concentration, operational loss, cyber)
- Risk scoring model with configurable weights
- Explainable AI score decomposition
- Streaming assessment narrative generation
- JSON export of structured results
- Sensitivity analysis and threshold testing

### AI Copilot
Conversational interface for query answering and navigation. Supports:
- Quick action tiles (daily summary, top risks, compliance status)
- Natural language question answering
- FAQ-style responses with context awareness
- Proactive alerts and dismissal
- Page-aware context (TPRM → vendor-focused responses)
- Floating launcher accessible from any page

## 10. Code Organization

```
src/
├── domain/
│   ├── types.ts                 # Type definitions for all entities
│   ├── seedData.ts              # Mock data for risks, vendors, controls, etc.
│   └── constants.ts             # Enums, scales, thresholds
│
├── ai/
│   ├── client/
│   │   ├── aiClient.ts          # AIClient interface definition
│   │   ├── localTemplate.ts     # LocalTemplateAIClient implementation
│   │   └── claudeGoverned.ts    # ClaudeGovernedAIClient (future)
│   │
│   └── local/
│       ├── templateEngine.ts    # Template interpolation and retrieval
│       ├── streamingHelper.ts   # Streaming simulation and chunking
│       ├── toneAdapter.ts       # Regulatory tone filters
│       └── templates.ts         # Template registry and definitions
│
├── components/
│   ├── ui/
│   │   ├── Card.tsx             # Reusable card wrapper
│   │   ├── Badge.tsx            # Status/severity badges
│   │   ├── Table.tsx            # Data table with sorting/filtering
│   │   ├── Modal.tsx            # Dialog and modal wrapper
│   │   ├── StreamingText.tsx    # Renders streaming text with animation
│   │   ├── Gauge.tsx            # Risk score gauge/meter
│   │   ├── Chart.tsx            # Chart wrapper for analytics
│   │   └── ...                  # Other UI primitives
│   │
│   ├── Layout.tsx               # Main app layout (sidebar, header)
│   ├── Sidebar.tsx              # Navigation sidebar
│   ├── Header.tsx               # Top navigation bar
│   └── CopilotLauncher.tsx      # Floating copilot button
│
├── pages/
│   ├── Dashboard.tsx            # Executive dashboard
│   ├── TPRM.tsx                 # Third-party risk management
│   ├── Compliance.tsx           # Compliance & regulatory intelligence
│   ├── Workbench.tsx            # Risk scoring studio
│   ├── Copilot.tsx              # AI copilot conversation
│   └── Settings.tsx             # Theme and preferences
│
├── store/
│   ├── themeStore.ts            # Zustand store for dark/light mode
│   ├── appStore.ts              # Zustand store for app state (nav, filters)
│   └── hooks.ts                 # Custom hooks for store access
│
├── hooks/
│   ├── useAIClient.ts           # Hook to access AIClient instance
│   ├── useRisks.ts              # Hook to query/filter risks
│   ├── useVendors.ts            # Hook to query/filter vendors
│   └── ...                      # Other custom hooks
│
├── utils/
│   ├── formatting.ts            # Format numbers, dates, risk scores
│   ├── calculation.ts           # Scoring logic, aggregations
│   └── search.ts                # Search and filter utilities
│
├── main.tsx                     # React app entry point
├── App.tsx                      # App wrapper with routing
└── index.css                    # Global styles and Tailwind directives

docs/
├── architecture.md              # This document
└── demo-script.md               # Guided demo walkthrough
```

### Key Design Patterns

**AIClient Abstraction**
All AI calls go through the pluggable AIClient interface, enabling seamless switching between local and Claude-backed implementations without component changes.

**Streaming-First UI**
Components like `StreamingText` are designed to display text as it arrives, enabling responsive AI generation UX even with local templates.

**Zustand for Simple State**
Lightweight store for theme and navigation state eliminates prop drilling without Redux complexity.

**Seed Data Stratification**
`seedData.ts` contains all mock entities and relationships, making it easy to swap for real data sources or APIs later.

**Type Safety**
TypeScript types (`types.ts`) define the complete domain model, enabling excellent IDE support and compile-time safety.

---

**Document Version**: 1.0
**Last Updated**: 2026-03-24
**Status**: Architecture Blueprint (Ready for Claude Integration Planning)
