# IRM Sentinel: Structured Demo Script

## Overview

This document provides a comprehensive demo script for IRM Sentinel, an enterprise AI-powered integrated risk management platform. The script is organized into five flows covering different user personas and use cases.

**Demo Duration**: 25–30 minutes (full walkthrough)
**Recommended Audience**: Executives, risk officers, compliance teams, board members
**Key Message**: Enterprise-grade GRC powered by AI, running entirely in-browser with bank-grade security

---

## Demo Flow 1: Executive Dashboard Experience

### Objective
Show enterprise risk posture at a glance and demonstrate AI-powered narrative generation.

### Steps

1. **Launch IRM Sentinel**
   - Open the browser and navigate to the IRM Sentinel URL
   - Lands on the **Dashboard** page
   - Note the clean, professional dark theme with purple accents
   - Take a screenshot of the full dashboard for reference

2. **Review Enterprise Risk Score**
   - Center-left: Large gauge showing **Enterprise Risk Score: 3.2 / 5.0**
   - Color: Yellow (Satisfactory–Watchlist zone)
   - Trend arrow: Slightly down (improving)
   - Talking point: "Our overall risk position is satisfactory but requires active management. The score aggregates operational, credit, market, and liquidity risks."
   - Click the score to show detailed breakdown (Op Risk: 3.5, Credit: 2.8, etc.)

3. **Scan KRI Breaches & Open Issues**
   - Top-right: **KRI Monitor** widget showing 8 critical/warning KRIs
   - Example KRIs:
     - Net Stable Funding Ratio (NSFR): 98% (Yellow – Below 100% threshold)
     - Third-Party Tech Concentration: 42% (Red – Exceeds 40% limit)
     - Cyber Incident Response Time: 4.2 hours (Yellow – Target 2 hours)
   - Point out breach status and escalation patterns
   - Talking point: "KRIs give us real-time signals of emerging risks. Three are at breach levels."

4. **Examine Risk Heat Map**
   - Below KRI Monitor: **Risk Heat Map** matrix
   - Y-axis: Risk categories (Operational, Credit, Market, Liquidity, Compliance, Enterprise)
   - X-axis: Likelihood (Low to High)
   - Colored cells show risk clustering
   - Notable cluster: Operational & Cyber risks concentrated in High Likelihood
   - Talking point: "The heat map reveals our concentration in operational and cyber domains. This aligns with regulatory expectations for fintech and cloud migration risk."

5. **Generate AI Daily Digest**
   - Scroll down to the **Daily Digest** section
   - Note the **"Generate"** button with a sparkle icon
   - Click "Generate" → watch the streaming narrative appear
   - Narrative includes:
     - Executive summary of current risk posture
     - Top 3 action items (remediation of issues, KRI investigation, control testing)
     - Risk scorecard with key metrics
     - Regulatory compliance status
   - Talking point: "This AI-generated digest would normally be prepared by a risk analyst for 30 minutes. It's generated instantly, consistently, and tailored to executive preferences."

6. **Switch to "Examiner View" Tab**
   - In the Daily Digest section, click the **"Examiner View"** tab
   - The narrative regenerates with OCC/FDIC examination tone
   - Language becomes more formal and finding-oriented
   - Includes regulatory references (Basel III, SR 11-7, OCC Guidance)
   - Emphasizes control deficiencies and remediation timeliness
   - Talking point: "The same data, different audience. AI automatically adjusts tone and emphasis for regulators, executives, or auditors."

7. **Review Program Overview**
   - Scroll down to **Program Overview** section
   - Display a **Maturity Pentagon** (5-point star chart) showing:
     - Governance: 4/5 (strong)
     - Risk Identification: 3/5 (developing)
     - Control Design: 3.5/5 (maturing)
     - Testing & Monitoring: 2.5/5 (needs improvement)
     - Remediation & Escalation: 3/5 (developing)
   - Overall: Moving toward "Managed" maturity level
   - Below: Progress bar showing **127 / 150 action items completed** (85%)
   - Test coverage: **92% of controls tested** in last 12 months
   - Talking point: "Our control environment is mature in governance but needs strengthening in testing rigor."

8. **Scroll to Active Issues**
   - Scroll down to **Active Issues** table
   - Show 5 open issues with columns:
     - Issue ID (e.g., ISS-2024-0847)
     - Title (e.g., "MRA: Insufficient documentation of loan origination controls")
     - Type (MRA, MRIA, Finding)
     - Severity (Critical, High, Medium)
     - Due Date (remaining days)
     - Owner
   - Sort by "Due Date" to show imminent deadlines
   - Talking point: "We have 3 MRAs and 2 MRIAs active. Two close this month. This view ensures accountability and urgency."

9. **Review KRI Monitor in Detail**
   - Click into the **KRI Monitor** widget
   - Show detailed list view with columns:
     - KRI Name
     - Current Value
     - Threshold (Warning / Breach)
     - Frequency (Daily, Weekly, Monthly)
     - Trend (↑ increasing, ↓ decreasing, → stable)
   - Identify the Critical/Breach status items:
     - **Third-Party Tech Concentration**: 42% (Red, threshold 40%)
     - **Cyber Incident Response Time**: 4.2 hours (Yellow, target 2 hours)
   - Talking point: "These two KRIs warrant immediate investigation and remediation planning."

---

## Demo Flow 2: Third-Party Risk Management (TPRM)

### Objective
Showcase vendor lifecycle management, control coverage mapping, and AI-driven vendor risk assessment.

### Steps

1. **Navigate to TPRM**
   - Click **"TPRM"** in the left sidebar
   - Page loads showing **Vendor Overview** stats (top of page)
   - Display metrics:
     - Total Vendors: 847
     - Tier 1 Critical: 12
     - Tier 2 Important: 156
     - Tier 3 Other: 679
   - SLA Status breakdown (Green: 450, Yellow: 280, Red: 117)
   - Average Control Coverage: 87%
   - Talking point: "We have significant third-party exposure. Over 10% of our vendor base is on SLA watch or breach."

2. **Review Vendor Overview Stats**
   - Show card layout:
     - **Critical Risk Count**: 3 vendors with high risk scores
     - **Recent Changes**: 2 vendors added, 1 de-risked this month
     - **Assessment Due**: 8 vendors due for reassessment
     - **Alerts**: 12 active monitoring alerts
   - Talking point: "Third-party risk is growing faster than our control capacity. We're using AI to prioritize and accelerate assessments."

3. **Sort Vendors by Criticality**
   - Click the **Vendor List** table
   - Sort descending by "Criticality"
   - Top vendors appear: **Meridian Cloud Services**, **Regional Payment Network**, **Data Vault Analytics**, etc.
   - Each row shows:
     - Vendor name
     - Type (Technology, Service, Outsourcing)
     - Criticality tier
     - SLA status (green/yellow/red dot)
     - Last assessment date
     - Risk score
   - Talking point: "Meridian handles 60% of our cloud infrastructure. It's our highest-impact vendor."

4. **Filter by SLA Status = Red**
   - Click the **SLA Status** filter dropdown
   - Select "Red" → table now shows 117 vendors on alert
   - Show the **first 5 vendors in breach**:
     - **Meridian Cloud Services**: SLA breach (uptime 98.5% vs 99.5% target)
     - **SecurePayments Inc**: SLA breach (response time 8 hours vs 4-hour SLA)
     - **Compliance Dashboard Pro**: SLA breach (feature release delay)
   - Talking point: "These vendors need immediate escalation conversations. Let's dive into Meridian."

5. **Click into "Meridian Cloud Services" Vendor Detail**
   - Click the Meridian row → opens **Vendor Detail Page**
   - Full-page view with tabbed interface:
     - Overview (default)
     - Control Mapping
     - Assessment History
     - Monitoring Alerts
     - Documents & Contracts

6. **Review Vendor Header Metrics**
   - Top section displays:
     - Vendor Name: **Meridian Cloud Services**
     - Type: **Technology / Cloud Infrastructure**
     - Criticality: **Tier 1 - Critical**
     - Relationship Duration: **8 years**
     - Annual Spend: **$4.2M**
     - Services: "Cloud compute, storage, disaster recovery"
   - Key metrics in cards:
     - **Risk Score**: 3.7 / 5.0 (Yellow – requires remediation)
     - **Control Coverage**: 82% (12 of 15 critical controls mapped)
     - **SLA Status**: Red (Uptime: 98.5% vs target 99.5%)
     - **Last Assessment**: 90 days ago
     - **Testing Status**: 3 of 4 controls tested this year
   - Talking point: "Meridian is critical and elevated risk. We need to close the 3 unmapped controls and improve SLA performance."

7. **Click "Generate AI Assessment"**
   - Button in the Overview section or header
   - Modal opens with **Assessment Generation** options:
     - Assessment Type: "Risk Assessment" (dropdown also shows "Compliance Audit", "Due Diligence", etc.)
     - Tone: "Risk Officer" (vs Examiner, Executive, Auditor)
     - Include: Checkboxes for Controls, Recent Alerts, Contract Terms, Testing Results
   - Click "Generate" → watch streaming narrative appear in modal
   - Narrative includes sections:
     - **Overview**: Meridian's role, importance, relationship tenure
     - **Risk Assessment**: Identified risks (concentration, operational, compliance)
     - **Control Evaluation**: Strength of control environment, gaps
     - **SLA Analysis**: Performance trends, breach implications, remediation recommendations
     - **Recommendations**: Priority actions to improve risk posture
   - Duration: 3–5 seconds of streaming text
   - Talking point: "Generating a vendor assessment used to require 2 hours of manual analysis. This narrative is instant, consistent, and audit-ready."

8. **Review Control Coverage Table**
   - Click the **Control Mapping** tab
   - Table shows all critical controls with:
     - Control ID (e.g., CS-001)
     - Control Name (e.g., "Data Encryption at Rest")
     - Status (Mapped, Tested, Expired, Gap)
     - Testing Status (Passed, Failed, Pending)
     - Last Test Date
     - Responsible Vendor Contact
   - Identify 3 unmapped controls (red):
     - CS-010: Disaster Recovery Plan Testing
     - CS-012: Incident Response Runbook
     - CS-014: Backup Restoration Validation
   - Talking point: "These three controls are critical for our disaster recovery posture but haven't been formally tested. We need to close this gap by Q2."

9. **Click "Generate Due Diligence Questionnaire"**
   - Button in Control Mapping or a floating action bar
   - Modal opens with options:
     - Assessment Focus: "Vendor Risk Assessment" (dropdown)
     - Framework: "Basel III" (or SOC 2, ISO 27001, etc.)
     - Depth: "Comprehensive" (vs Standard, Light)
     - Tone: "Professional"
   - Click "Generate" → streaming text shows a professional DDQ (10–15 questions)
   - Example questions:
     - "Describe your data encryption standards for data at rest and in transit."
     - "What is your incident response process? How quickly do you notify customers of breaches?"
     - "Provide evidence of your last independent security audit (SOC 2 / ISO 27001)."
     - "Describe your business continuity and disaster recovery testing frequency."
   - Talking point: "This DDQ is tailored to Meridian's role and our control gaps. We can send it immediately for vendor response."

10. **Click "Generate OCC-Ready Exam Narrative"**
    - Button in Assessment or Workpaper section
    - Modal opens with options:
      - Report Type: "Examination Workpaper" (vs Audit Report, Management Letter)
      - Examiner Perspective: "OCC" (vs FDIC, Fed, Internal Auditor)
      - Include Evidence: Checkboxes for Test Results, Issue History, Remediation Plans
    - Click "Generate" → streaming text produces formal exam workpaper
    - Sections:
      - **Examination Objective**: Assess effectiveness of third-party risk management controls
      - **Background**: Meridian's role, services, relationship
      - **Scope of Examination**: Controls tested, timeframe, limitations
      - **Findings Summary**: Control design and operational effectiveness assessment
      - **Deficiencies Noted**: SLA breach, gap in DR testing, insufficient documentation
      - **Positive Practices**: Strong encryption, regular vulnerability scans
      - **Recommendations**: Formalized DR testing plan, SLA improvement actions
      - **Conclusion**: Overall control environment is adequate but requires attention to identified items
    - Tone: Formal, regulatory-focused, finding-oriented
    - Talking point: "If the OCC were to examine our TPRM function, this is the level of documentation and rigor they expect. Our AI generates it in seconds."

11. **Review Monitoring Alerts**
    - Click the **Monitoring Alerts** tab
    - Show 4–5 recent alerts:
      - **SLA Breach Alert** (2026-03-22): Uptime fell below 99.5% threshold
      - **Contract Renewal Due** (2026-04-15): Agreement expires in 22 days
      - **Security Patch Delay** (2026-03-20): Critical OS patch not applied within 30-day window
      - **Audit Finding** (2026-03-10): SOC 2 audit noted one medium-risk finding
    - Each alert has:
      - Alert type and timestamp
      - Brief description
      - Severity (Critical, High, Medium)
      - **AI Interpretation** section (generated narrative)
      - Link to related control or issue
    - Click into an alert → see full AI interpretation narrative (what the alert means, why it matters, recommended action)
    - Talking point: "Alerts with AI interpretation remove ambiguity. Our teams immediately understand impact and next steps."

---

## Demo Flow 3: Compliance & Regulatory Intelligence

### Objective
Demonstrate compliance tracking, regulatory intelligence, and AI-powered impact analysis.

### Steps

1. **Navigate to Compliance**
   - Click **"Compliance"** in the left sidebar
   - Page loads showing **Compliance Overview** section
   - Display key metrics:
     - **Total Controls**: 287
     - **Implemented**: 218 (76%)
     - **Partially Implemented**: 54 (19%)
     - **Not Implemented**: 15 (5%)
   - **MRA/MRIA Count**: 12 open (3 critical, 6 high, 3 medium)
   - **Test Coverage**: 92% of controls tested in last 12 months
   - **Regulatory Frameworks Tracked**: Basel III, SR 11-7, OCC Guidance, CCAR/DFAST
   - Talking point: "We have solid control coverage, but 23% are not fully implemented or tested. Regulatory pressure is increasing."

2. **Review Control Library Stats**
   - Show card grid with framework breakdown:
     - **Basel III**: 67 controls tracked, 58 implemented (87%)
     - **SR 11-7 (Third-Party)**: 32 controls, 24 implemented (75%)
     - **OCC Guidance**: 45 controls, 38 implemented (84%)
     - **CCAR/DFAST**: 23 controls, 22 implemented (96%)
     - **Other Regulatory**: 120 controls, 76 implemented (63%)
   - Talking point: "Our weakest area is 'Other Regulatory'—a catch-all for emerging guidance. We're deprioritizing, which is risky."

3. **Filter by "Basel III" Framework**
   - Click the **Framework Filter** or search bar
   - Select "Basel III" → control library narrows to 67 controls
   - Table columns:
     - Control ID (e.g., BIII-CAP-001)
     - Name (e.g., "Minimum CET1 Ratio Monitoring")
     - Implementation Status (Designed, Implemented, Tested, Partially Implemented, Not Implemented)
     - Last Assessment Date
     - Related Issues (count)
     - Owner
   - Show the distribution: ~60% fully tested, ~20% implemented but not tested, ~5% partial, ~15% gaps
   - Talking point: "Basel III Endgame is coming in 2025. Our controls are mostly in place, but testing gaps create audit risk."

4. **Click a "Partially Implemented" Control**
   - Click a control with status "Partially Implemented"
   - Example: **BIII-STRESS-012: Reverse Stress Testing Model Governance**
   - Control Detail Page opens with sections:
     - **Control Description**: What the control is designed to do
     - **Implementation Status**: Partial (reason: policy drafted, not yet approved by board risk committee)
     - **Testing Status**: Not yet tested (awaiting full implementation)
     - **Related Risks**: Operational Risk #OP-045 (Model Risk Management)
     - **Related Issues**: Issue ISS-2024-0723 (MRA – Board approval pending)
     - **Design Evidence**: Links to policy document, procedures
     - **Testing Evidence**: None yet
     - **Remediation Plan**: Board Risk Committee approval scheduled for Q2 2026
   - Talking point: "This is a governance control. We've done the design work but need executive approval before we can test."

5. **Switch to "Gaps & Findings" Tab**
   - In the Control Library view, click the **"Gaps & Findings"** tab
   - Shows consolidated view of control gaps and findings
   - Statistics:
     - **Design Gaps**: 12 controls lack adequate procedures or documentation
     - **Testing Gaps**: 34 controls not tested in the last 12 months
     - **Operational Gaps**: 8 controls not operating as designed
     - **Emerging Gaps**: 5 controls impacted by new regulatory requirements (Basel III Endgame, Digital Asset Guidance)
   - Table format:
     - Gap Type
     - Affected Control(s)
     - Risk Category
     - Severity (Critical, High, Medium, Low)
     - Remediation Plan
     - Target Close Date
   - Talking point: "These gaps represent our control program's weak spots. We're working to close them, but they create regulatory exposure."

6. **Review MRA/MRIA Counts**
   - In the left sidebar or top of Gaps & Findings, show MRA/MRIA summary:
     - **MRA (Matter Requiring Attention)**: 3 items (regulatory expectations not met, remediation planned)
     - **MRIA (Matter Requiring Immediate Attention)**: 6 items (control deficiency with immediate impact)
     - **Finding (Internal)**: 3 items (audit findings in progress)
   - Total: 12 open items, average age 45 days
   - Talking point: "MRIAs demand rapid closure. We have 6 in flight. The OCC will follow up on these."

7. **Filter Issues by "Regulatory Exam" Source**
   - Click the **Issues** tab or Issues section
   - Filter by "Source" → select "Regulatory Exam"
   - Show issues from recent exams:
     - ISS-2025-0012 (OCC Exam Jan 2025): MRIA – Third-party risk governance deficiency
     - ISS-2025-0011 (Fed Exam Jan 2025): MRA – Stress testing documentation incomplete
     - ISS-2024-0987 (OCC Exam July 2024): MRIA – Model risk controls not operating as designed (remediation in progress)
   - For each issue, show:
     - Issue type (MRA, MRIA, Finding)
     - Examiner source (OCC, Fed, FDIC)
     - Severity (Critical, High, Medium)
     - Root cause
     - Remediation plan
     - Target close date
     - Owner
   - Talking point: "These are the issues examiners are watching. Meeting remediation deadlines is essential for maintaining our regulatory relationship."

8. **Switch to "Regulatory Intelligence" Tab**
   - Click **"Regulatory Intelligence"** tab (or separate page)
   - Shows recent regulatory updates and guidance
   - Example updates:
     - **Basel III Endgame Final Rule** (Effective 2025-01-01)
       - Title: Enhanced Capital Requirements
       - Impact: Capital calculation models, internal models, stress testing
       - Deadline: Phased implementation starting 2025
       - Status: Under review by Risk team
     - **OCC Bulletin 2025-XX** (Digital Assets Guidance)
       - Title: Bank Engagement with Crypto and Digital Assets
       - Impact: Risk management, KYC/AML controls
       - Deadline: Compliance required by 2025-Q3
       - Status: Control gap identified, remediation plan in development
     - **Fed SR Letter** (Third-Party Risk Management Expectations)
       - Impact: Vendor assessment protocols, KRI monitoring
       - Status: Alignment assessment completed
   - Each item shows: rule name, effective date, impact areas, current status, assigned owner
   - Talking point: "Regulatory guidance changes continuously. We track it centrally and assess impact across our control environment."

9. **Click "Analyze Impact" on Basel III Endgame**
   - On the Regulatory Intelligence page, find the **Basel III Endgame** update
   - Click **"Analyze Impact"** button
   - Modal opens with options:
     - Analysis Scope: "Capital & Liquidity" (vs Risk Governance, Stress Testing, all)
     - Detail Level: "Comprehensive"
     - Output Type: "Impact Summary" (vs Detailed Analysis, Control Gap Assessment)
   - Click "Analyze" → watch streaming narrative appear
   - Output includes:
     - **Overview**: What Basel III Endgame requires
     - **Capital Impact**: Changes to risk-weighted assets (RWA) calculations, likely increase in capital requirements
     - **Stress Testing Impact**: More rigorous stress testing scenarios, increased model validation requirements
     - **Control Gaps**: Areas where our current controls will need enhancement
     - **Timeline**: Phased implementation by 2025–2027
     - **Recommendations**: Specific actions to prepare
   - Talking point: "Basel III Endgame will have material impact on our capital models and stress testing. We need to start preparations now."

10. **Review Capital, Reporting & Control Gap Analysis**
    - Continuing from the impact analysis (or separate section), show:
    - **Capital Impact Summary**:
      - Estimated RWA increase: 10–15% (to be modeled)
      - Affected portfolios: CRE (largest impact), commercial lending, equity
      - Timeline: Three-phase implementation 2025–2027
    - **Reporting Impact**:
      - New regulatory reports required (Basel III Endgame Report)
      - Changes to existing reports (FR Y-7Q, Y-9C)
      - System and data architecture changes needed
    - **Control Gap Analysis** (table):
      - Gap: Models not yet Basel III Endgame compliant
      - Affected Controls: BIII-CAP-001, BIII-CAP-015, BIII-STRESS-020
      - Severity: High
      - Remediation: Model enhancement project, estimated 6–9 months
      - Owner: Chief Risk Officer, Head of Quantitative Risk
      - Target Date: 2026-Q4
    - Talking point: "This regulatory change will drive significant technology and control investments. We're planning now to avoid exam findings."

---

## Demo Flow 4: Risk Scoring Studio (AI Workbench)

### Objective
Showcase interactive risk assessment, explainable AI scoring, and scenario modeling.

### Steps

1. **Navigate to AI Workbench**
   - Click **"Workbench"** in the left sidebar
   - Page loads showing **Scenario Library** (left side) and **Assessment Builder** (main)
   - Pre-built scenario templates are visible:
     - CRE Credit Concentration Risk
     - Operational Loss Escalation
     - Cyber Incident Impact
     - Liquidity Stress
     - Regulatory Change Impact
   - Talking point: "The Workbench lets us quickly model risk scenarios with AI-powered scoring. It's like stress-testing on demand."

2. **Click "CRE Credit Concentration" Pre-Built Scenario**
   - Click the **CRE Credit Concentration** scenario card
   - Scenario loads in the Assessment Builder with:
     - **Scenario Name**: CRE Credit Concentration Risk
     - **Description**: Assesses risk from concentration in commercial real estate portfolio
     - **Input Parameters** (sliders and toggles):
       - Inherent Risk (slider): Currently set to 3 / 5
       - Portfolio Concentration (metric): 45% in CRE
       - Economic Outlook: "Stable"
     - **Risk Factors** (checkboxes):
       - □ Rising interest rates
       - □ Recent audit findings
       - □ Regulatory scrutiny
       - □ Market downturn (recent)
       - □ Vendor concentration (data providers)
     - **Control Effectiveness** (dropdown):
       - Underwriting Controls: "Strong"
       - Monitoring Controls: "Adequate"
       - Escalation Procedures: "Strong"
     - Talking point: "This scenario captures the key drivers of CRE concentration risk. We'll adjust inputs to see how risk changes."

3. **Adjust Inherent Risk Slider to 5**
   - Click the **Inherent Risk** slider
   - Drag from 3 to 5 (highest inherent risk)
   - Input field updates to show "5.0"
   - Narrative preview at bottom updates: "You have set inherent risk to the maximum level, reflecting high-risk lending environment conditions."
   - Talking point: "By moving this slider, we're modeling a worst-case scenario—highly risky CRE market."

4. **Check "Regulatory Scrutiny" and "Recent Audit Findings"**
   - Check the following risk factor checkboxes:
     - ☑ Regulatory scrutiny (CRE concentration guidance from OCC/Fed)
     - ☑ Recent audit findings (control gaps in CRE underwriting)
   - Each checked factor changes the assessment context
   - Talking point: "These risk factors compound the concentration risk. Regulators are watching CRE closely, and we have internal control gaps."

5. **Click "Run Assessment"**
   - Button at bottom of form or top-right
   - Modal or page shows **Running Assessment...** with a progress bar
   - Duration: 2–3 seconds (simulating AI generation)
   - Results appear in a **Results Panel**

6. **Review Composite Score Gauge**
   - Top section displays a large **Risk Score Gauge**:
     - Score: **4.1 / 5.0** (Needs Improvement – red/orange zone)
     - Trend arrow: ↑ increasing (compared to prior assessment)
     - Reasoning: Elevated inherent risk + regulatory scrutiny + control gaps = higher composite risk
   - Below gauge: Scorecard with component scores:
     - Inherent Risk: 5.0 (maximum)
     - Control Effectiveness: 2.5 (weak relative to risk level)
     - Regulatory & External Factors: 4.0 (high pressure)
     - **Residual Risk Score: 4.1**
   - Talking point: "This scenario shows high residual risk. Our controls are not strong enough for the current risk environment. Immediate action is needed."

7. **Walk Through XAI Score Decomposition**
   - Scroll down to **Score Decomposition** section
   - Show a visual breakdown (waterfall chart or stacked bar):
     - Base Inherent Risk: +3.5 points
     - Regulatory Scrutiny Factor: +0.4 points (increases risk)
     - Audit Findings Factor: +0.3 points (increases risk)
     - Control Effectiveness Discount: −0.5 points (mitigates risk)
     - Economic Outlook Adjustment: −0.1 points
     - **= Final Residual Risk: 4.1**
   - Talking point: "You can see exactly how each factor contributed to the score. No black box—full transparency."

8. **Show Collapsible Scoring Logic Formula**
   - Below the decomposition, show **Scoring Logic** section (collapsible)
   - When expanded, displays the formula:
     ```
     RESIDUAL_RISK =
       (INHERENT_RISK × 0.4) +
       (CONTROL_EFFECTIVENESS_GAP × 0.3) +
       (REGULATORY_FACTOR × 0.2) +
       (ECONOMIC_FACTOR × 0.1)

     Where:
     - INHERENT_RISK = Portfolio concentration + Market conditions
     - CONTROL_EFFECTIVENESS_GAP = 5 - (Control Design + Operational Effectiveness)
     - REGULATORY_FACTOR = Guidance strength + Examiner feedback
     - ECONOMIC_FACTOR = Interest rate environment + Credit cycle
     ```
   - Checkboxes allow toggling formula components on/off to see their impact
   - Talking point: "This formula is customizable. Risk teams can adjust weights based on their risk appetite and strategy."

9. **Read AI Assessment Narrative**
   - Below the scoring logic, show **AI Assessment** narrative section
   - Streaming or pre-rendered narrative (2–3 paragraphs):
     - **Summary**: "CRE concentration risk is elevated due to high inherent risk, regulatory scrutiny, and recent control findings."
     - **Risk Drivers**: Explains why score is 4.1 (concentration, audit gaps, regulatory expectations)
     - **Control Assessment**: Notes that control effectiveness is insufficient relative to risk level
     - **Recommendations**: Specific actions:
       1. Enhance underwriting controls to reduce concentration
       2. Accelerate remediation of audit findings
       3. Increase monitoring frequency for concentration metrics
       4. Escalate to Risk Committee for risk appetite discussion
     - **Confidence**: "This assessment is based on current data with 92% confidence."
   - Talking point: "The AI doesn't just score—it reasons through the risk drivers and recommends concrete actions."

10. **Click "Export JSON"**
    - Button at bottom-right of Results Panel
    - Click → download or show preview of structured JSON export
    - JSON structure includes:
      ```json
      {
        "scenario": "CRE Credit Concentration Risk",
        "timestamp": "2026-03-24T15:32:00Z",
        "inputs": {
          "inherent_risk": 5.0,
          "concentration_pct": 45,
          "risk_factors": ["regulatory_scrutiny", "recent_audit_findings"],
          "control_effectiveness": "Adequate"
        },
        "results": {
          "composite_score": 4.1,
          "component_scores": { ... },
          "trend": "increasing"
        },
        "narrative": "...",
        "recommendations": [ ... ]
      }
      ```
    - Talking point: "The JSON export is system-ready. Risk teams can integrate this into risk dashboards, regulatory reports, and board reporting."

---

## Demo Flow 5: AI Copilot

### Objective
Demonstrate conversational AI interface for query answering, quick actions, and navigation support.

### Steps

1. **Navigate to Copilot**
   - Option A: Click **"Copilot"** in the left sidebar
   - Option B: Click the **floating Copilot launcher** (chat bubble icon, bottom-right corner, accessible from any page)
   - Copilot page or sidebar opens showing:
     - **Message history** (empty on first visit)
     - **Quick Actions** (tiles for common queries)
     - **Input field** ("Ask anything..." placeholder)
   - Talking point: "The Copilot is your AI assistant for risk management questions. It understands context and can navigate you through the platform."

2. **Click "Daily Posture Summary" Quick Action**
   - Show quick action tiles:
     - Daily Posture Summary
     - Top 3 Vendor Risks
     - Control Testing Status
     - Regulatory Calendar
     - Open Issues
   - Click **"Daily Posture Summary"**
   - Copilot generates and streams a response:
     - "Today's posture summary as of 2026-03-24:..."
     - Lists top metrics: Enterprise risk score (3.2), KRI breaches (2), active issues (12), etc.
     - Provides context-aware insights: "Your risk score improved 0.1 points this week. Third-party concentration remains elevated."
   - Duration: 2–3 seconds of streaming text
   - Talking point: "Quick actions surface the most common questions. This summary would normally require checking 3–4 pages."

3. **Type "What are the top 3 vendor risks?"**
   - Clear the message or start a new query
   - Type the question in the **input field**
   - Press Enter or click the send button
   - Copilot responds with streaming narrative:
     - "Based on current data, your top 3 vendor risks are:..."
     - Lists vendors:
       1. **Meridian Cloud Services** (Risk Score: 3.7, Issue: SLA breach, uptime 98.5%)
       2. **SecurePayments Inc** (Risk Score: 3.4, Issue: Control gap in incident response)
       3. **Data Vault Analytics** (Risk Score: 3.2, Issue: Concentration risk, 40% of analytics workload)
     - Provides context for each
     - Suggests next steps: "Would you like me to generate a vendor assessment or due diligence questionnaire for any of these?"
   - Talking point: "The copilot synthesizes vendor data and gives you a prioritized risk view instantly."

4. **Review Context-Aware Response**
   - Note that the Copilot's response is tailored to your role and current page
   - If on the TPRM page, the response focuses on vendor risks
   - If on Dashboard, it might focus on enterprise risks
   - If on Compliance, it might focus on control gaps
   - Talking point: "The Copilot knows what page you're on and prioritizes relevant information."

5. **Ask "What is an MRA vs MRIA?"**
   - Type this FAQ-style question
   - Copilot responds with clear explanation:
     - **MRA (Matter Requiring Attention)**: "Regulatory observation not meeting expectations; remediation planned and tracked."
     - **MRIA (Matter Requiring Immediate Attention)**: "Control deficiency with immediate impact requiring urgent remediation; regulators follow up closely."
     - Adds context: "You currently have 3 MRAs and 6 MRIAs. MRIAs are higher priority."
     - Offers: "Would you like to see your open MRAs and MRIAs?"
   - Talking point: "The Copilot is an FAQ engine for GRC terminology and context."

6. **Get FAQ-Style Answer**
   - Demonstrate that Copilot can answer common questions:
     - "How is the enterprise risk score calculated?"
     - "What does the heat map show?"
     - "How often should controls be tested?"
     - "What is a KRI?"
   - Copilot provides clear, concise answers with examples
   - Talking point: "The Copilot reduces training time for new users and keeps terminology consistent across the team."

7. **Dismiss Proactive Alerts**
   - Copilot may display proactive alerts/notifications (e.g., "You have 2 MRIAs closing this week"):
     - Click the **X** button to dismiss
     - Or click the alert to navigate to the related page
   - Talking point: "Proactive alerts ensure you don't miss critical items."

8. **Show Page-Aware Behavior**
   - Navigate to the **TPRM page**
   - Open Copilot again
   - Notice that quick actions and suggested responses are now vendor-focused
   - Ask "What should I know about this vendor?" (it auto-selects the current vendor)
   - Response focuses on vendor-specific risks and controls
   - Navigate back to **Dashboard**
   - Copilot quick actions and context now shift to enterprise-level risks
   - Talking point: "Copilot is context-aware. It adapts based on where you are in the application, reducing the need for manual navigation."

---

## Demo Talking Points

### Key Messages

**1. All AI Runs Client-Side**
- "No data leaves your browser. All narrative generation, scoring, and analysis happen locally on your machine."
- "This is critical for security and data residency. Sensitive bank data never touches external servers."
- "In production, Claude integration would use a private governance service running in your cloud infrastructure."

**2. Template Engine Demonstrates UX**
- "What you're seeing today is a template engine—pre-built narratives and scoring logic."
- "This proves the UX: how AI narratives should be formatted, how scoring should be explained, how users should interact."
- "In production, we swap the template engine for live Claude API calls running through our governance service."

**3. Claude Integration Blueprint for Production**
- "Our architecture shows how to integrate Claude safely into a bank:"
  - **Governance Service**: Policy enforcement, role-based prompting, rate limiting
  - **Audit Trail**: Every AI call is logged with context
  - **Post-Processing**: Claude output is validated and formatted before reaching users
  - **Failover**: If Claude is unavailable, we gracefully fall back to templates
- "This approach is production-ready and meets regulatory expectations."

**4. Regulatory Tone Calibration**
- "Notice how the Daily Digest changed when we switched to 'Examiner View'."
- "The same data, different tone: executive vs. OCC/FDIC examiner."
- "The Copilot adapts language based on audience: risk officers speak technical, executives speak strategy."
- "Tone calibration is built into our prompt engineering and can be customized per user role."

**5. Audit Trail & Explainability**
- "Every AI-generated artifact is logged: what was asked, when, by whom, and what was output."
- "This creates an audit trail for regulators and enables us to improve models over time."
- "Explainable AI (like the score decomposition) ensures users understand AI decisions, not just trust them."

**6. Enterprise-Grade Platform**
- "IRM Sentinel consolidates risk management across operational, credit, market, liquidity, and compliance domains."
- "It's not a point solution—it's an integrated platform designed for G-SIBs."
- "The AI is a force multiplier: it accelerates risk assessment, reduces manual workload, and improves consistency."

**7. Ready for Production**
- "This is a prototype, but the architecture is production-ready."
- "We can deploy this to your cloud infrastructure, connect it to your data systems, and go live in 6–9 months."
- "The governance blueprint is based on industry best practices and regulatory guidance."

---

## Demo Logistics

### Prerequisites
- IRM Sentinel app running locally or deployed to a staging environment
- Latest Chrome/Safari/Firefox browser
- Screen sharing capability (if remote demo)
- Demo account with sample data pre-loaded

### Timing Breakdown (30-minute demo)
- Intro & setup: 2 minutes
- Flow 1 (Dashboard): 6 minutes
- Flow 2 (TPRM): 7 minutes
- Flow 3 (Compliance): 6 minutes
- Flow 4 (Workbench): 5 minutes
- Flow 5 (Copilot): 3 minutes
- Q&A: 1 minute

### Tips for Smooth Demo
1. **Pre-load the app**: Load the page before the demo starts to avoid initial load delays.
2. **Use test data**: Have a consistent set of seed data to reference. (Meridian Cloud Services is the "hero" vendor.)
3. **Pause for streaming**: Let narratives stream naturally; don't rush through text generation.
4. **Encourage interaction**: Ask audience "What would you want to know about this vendor?" to make it conversational.
5. **Emphasize the "why"**: Explain business value (faster assessments, consistency, audit readiness) alongside features.
6. **Have talking points ready**: Regulatory context (Basel III, OCC) and competitive positioning (vs. Excel-based processes).

### Fallback Plan
If streaming fails or the app crashes:
1. Switch to a pre-recorded demo video
2. Switch to a different browser or device
3. Revert to a static screenshot walkthrough with voiceover
4. Have a deck of key slides as backup

---

**Document Version**: 1.0
**Last Updated**: 2026-03-24
**Audience**: Executives, Risk Officers, Product Teams, Regulators
**Status**: Ready for Delivery

---

## Appendix: FAQ for Demo

**Q: Is all the data real?**
A: No, this is a prototype with realistic but fictional sample data. In production, it would connect to your actual risk, vendor, and control systems.

**Q: Can I customize the narratives?**
A: Yes. Prompt templates are configurable, and in production, the Claude integration allows full customization of tone, format, and emphasis per user role.

**Q: What about data security?**
A: In this prototype, all data stays in-browser. In production, the governance service runs in your cloud infrastructure with full encryption, access controls, and audit logging.

**Q: How does this integrate with our existing systems?**
A: IRM Sentinel is designed as an integration hub. It can pull data from risk management systems, CTRM platforms, audit systems, and regulatory reporting tools via APIs.

**Q: What's the ROI?**
A: Time savings: Risk assessments drop from 2 hours to 5 minutes. Control testing efficiency improves 30%. Audit readiness increases. Regulatory findings decrease.

**Q: When can we go live?**
A: Implementation timeline depends on data readiness and cloud infrastructure setup. Typically 6–9 months from POC to production.

---

End of Demo Script
