import {
  Risk,
  Control,
  Issue,
  Vendor,
  KRI,
  LossEvent,
  RegulatoryChange,
  RiskScenario,
  MonitoringAlert,
} from "../../domain/types";

import { getDataAccess } from "../../data/DataAccessLayer";

export class TemplateEngine {
  constructor() {
    // Constructor takes no required arguments, uses internal seed data or optional context
  }

  /**
   * Generates a 3-4 paragraph OCC/FDIC-style daily risk posture narrative
   */
  generateDailyDigest(
    risks: Risk[],
    kris: KRI[],
    issues: Issue[],
    vendors: Vendor[],
    lossEvents: LossEvent[]
  ): string {
    // Use injected data or fall back to DataAccessLayer
    const dal = getDataAccess();
    if (!risks || risks.length === 0) risks = dal.getRisks();
    if (!kris || kris.length === 0) kris = dal.getKRIs();
    if (!issues || issues.length === 0) issues = dal.getIssues();
    if (!vendors || vendors.length === 0) vendors = dal.getVendors();
    if (!lossEvents || lossEvents.length === 0) lossEvents = dal.getLossEvents();

    const today = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Count risks by inherent and residual scores
    const criticalRisks = risks.filter(
      (r) => r.inherentScore > 16 || r.residualScore > 16
    ).length;
    const highRisks = risks.filter(
      (r) =>
        (r.inherentScore > 12 && r.inherentScore <= 16) ||
        (r.residualScore > 12 && r.residualScore <= 16)
    ).length;

    const aggregateProfile =
      criticalRisks > 0
        ? "Needs Improvement"
        : highRisks > 3
          ? "Satisfactory-Watchlist"
          : "Satisfactory";

    // Count KRIs by breach level
    const breachedKris = kris.filter((k) => k.breachLevel === "Breach").length;
    const criticalKris = kris.filter((k) => k.breachLevel === "Critical").length;
    const warningKris = kris.filter((k) => k.breachLevel === "Warning").length;
    const deterioratingKris = kris.filter((k) => k.trend === "Deteriorating")
      .length;

    // Count vendor risk levels
    const criticalVendors = vendors.filter((v) => v.criticality === "Critical")
      .length;
    const highVendors = vendors.filter((v) => v.criticality === "High").length;
    const redSlaVendors = vendors.filter((v) => v.slaStatus === "Red").length;

    // Count issues by status and severity
    const openIssues = issues.filter((i) => i.status === "Open").length;
    const inProgressIssues = issues.filter((i) => i.status === "In Progress")
      .length;
    const overdueIssues = issues.filter((i) => i.status === "Overdue").length;
    const criticalIssues = issues.filter((i) => i.severity === "Critical")
      .length;

    // Count MRAs
    const mraCount = issues.filter((i) => i.mraType === "MRA").length;
    const mriaCount = issues.filter((i) => i.mraType === "MRIA").length;

    // Loss events summary
    const totalLosses = lossEvents.reduce((sum, e) => sum + e.amount, 0);
    const operationalLosses = lossEvents.filter(
      (e) => e.category === "Operational"
    ).length;

    return `INSTITUTION RISK POSTURE SUMMARY - ${today}

The institution's aggregate risk profile remains ${aggregateProfile}. As of this report, the risk portfolio comprises ${risks.length} identified risk factors across operational, compliance, credit, and strategic domains. Critical risk exposures number ${criticalRisks}, with an additional ${highRisks} rated as high based on inherent and residual risk scores. The control environment addresses emerging vulnerabilities through ongoing remedial actions, with ${inProgressIssues} of ${issues.length} identified management findings currently in execution.

Key Risk Indicators present mixed signals requiring management attention. ${breachedKris} KRIs have breached established thresholds, with ${criticalKris} KRIs at critical breach levels. An additional ${warningKris} KRIs are at warning levels, and ${deterioratingKris} display deteriorating trends. The quarterly loss event review identified ${lossEvents.length} confirmed losses totaling USD ${(totalLosses / 1000000).toFixed(2)}M, of which ${operationalLosses} were operational in nature. The loss distribution across risk categories reflects ${this.describeLossConcentration(lossEvents)} concentration.

Third-party risk management activities identify ${criticalVendors} vendors classified as critical and ${highVendors} classified as high criticality. Service Level Agreement performance shows ${redSlaVendors} vendors in red status, indicating contracted performance not met. Compliance program oversight documents ${openIssues} open management findings requiring remedial action, with ${overdueIssues} items overdue for completion. Management findings include ${mraCount} Matters Requiring Attention (MRA) and ${mriaCount} Matters Requiring Immediate Attention (MRIA).

The Risk Committee is advised to prioritize: (1) remediation of critical control gaps in ${this.getTopRiskCategories(risks, 2)} domains; (2) validation of third-party SLAs and performance metrics for critical vendors; (3) accelerated closure of ${overdueIssues} overdue management findings; and (4) assessment of potential capital and operational impact from pending regulatory changes and loss trends.`;
  }

  /**
   * Generates an OCC/FDIC examiner-style narrative for Report of Examination
   */
  generateExaminerView(
    risks: Risk[],
    controls: Control[],
    issues: Issue[],
    kris: KRI[]
  ): string {
    const lastExamDate = this.getLastExamDate();

    // Count controls by effectiveness
    const effectiveControls = controls.filter(
      (c) => c.effectiveness === "Effective"
    ).length;
    const partiallyEffectiveControls = controls.filter(
      (c) => c.effectiveness === "Partially Effective"
    ).length;
    const ineffectiveControls = controls.filter(
      (c) => c.effectiveness === "Ineffective"
    ).length;

    // Count issues by severity and type
    const criticalIssues = issues.filter((i) => i.severity === "Critical")
      .length;
    const highIssues = issues.filter((i) => i.severity === "High").length;
    const openMRAs = issues.filter(
      (i) => i.mraType === "MRA" && i.status === "Open"
    ).length;
    const mraInProgress = issues.filter(
      (i) => i.mraType === "MRA" && i.status === "In Progress"
    ).length;
    const mriaCount = issues.filter((i) => i.mraType === "MRIA").length;

    const controlEnvironmentAssessment =
      ineffectiveControls === 0
        ? "adequate"
        : ineffectiveControls <= 2
          ? "adequate with limited observations"
          : "deficient";

    // Risk profile rating based on scores
    const riskProfileRating = this.getRiskProfileRating(risks);

    // Count frameworks represented
    const frameworks = new Set(controls.map((c) => c.framework));

    // KRI summary
    const breachedKris = kris.filter((k) => k.breachLevel === "Breach").length;
    const warningKris = kris.filter((k) => k.breachLevel === "Warning").length;

    return `EXAMINATION REPORT COMMENTS - RISK MANAGEMENT

RISK PROFILE AND CONTROL ENVIRONMENT
As of the examination date of ${lastExamDate}, the institution's risk profile is rated ${riskProfileRating}. The risk management framework encompasses ${risks.length} documented risk exposures distributed across operational, credit, market, compliance, cyber, third-party, strategic, and liquidity domains. Management has implemented a tiered risk assessment and monitoring program with documented escalation protocols aligned with business units and risk categories.

CONTROL ENVIRONMENT ASSESSMENT
The control environment is rated ${controlEnvironmentAssessment}. Of ${controls.length} key controls assessed, ${effectiveControls} are operating effectively, ${partiallyEffectiveControls} are partially effective, and ${ineffectiveControls} are ineffective. Controls span ${frameworks.size} regulatory frameworks (${Array.from(frameworks).join(", ")}). Critical controls over ${this.getTopRiskCategories(risks, 2)} remain foundational to institutional resilience. The examination identified ${ineffectiveControls} control deficiencies, primarily relating to preventive control design, compensating control adequacy, and monitoring frequency for high-risk processes. Control testing indicates ${Math.round((effectiveControls / controls.length) * 100)}% of controls are operating as designed.

KEY RISK INDICATORS AND MANAGEMENT FINDINGS
The institution monitors ${kris.length} Key Risk Indicators across risk categories. Current KRI status shows ${breachedKris} metrics at breach thresholds and ${warningKris} at warning levels, indicating elevated risk exposures requiring heightened monitoring. Management has documented ${issues.length} findings for remedial attention, including ${openMRAs} open Matters Requiring Attention, ${mraInProgress} in progress, and ${mriaCount} Matters Requiring Immediate Attention. Critical findings number ${criticalIssues}, with ${highIssues} high-severity items. Management's remediation timeline demonstrates responsiveness, with committed completion dates primarily within 90-180 days.

SUPERVISORY EXPECTATIONS
Management should continue enhancement of the control environment through timely completion of remaining remedial actions by committed deadlines. Quarterly control testing and KRI monitoring should provide adequate early warning of emerging control gaps. The Risk Committee should maintain board-level oversight of key risk metrics, inherent versus residual risk trends, and third-party risk concentrations. The internal audit function should maintain direct reporting to the audit committee and validate control effectiveness across all frameworks.`;
  }

  /**
   * Generates a TPRM assessment narrative for a specific vendor
   */
  generateVendorNarrative(
    vendor: Vendor,
    controls: Control[],
    alerts: MonitoringAlert[]
  ): string {
    // Filter controls related to this vendor
    const vendorControls = controls.filter((c) =>
      c.riskIds?.includes(vendor.id)
    );
    const effectiveControls = vendorControls.filter(
      (c) => c.effectiveness === "Effective"
    ).length;
    const partiallyEffectiveControls = vendorControls.filter(
      (c) => c.effectiveness === "Partially Effective"
    ).length;
    const ineffectiveControls = vendorControls.filter(
      (c) => c.effectiveness === "Ineffective"
    ).length;

    // Filter alerts for this vendor
    const vendorAlerts = alerts.filter((a) => a.vendorId === vendor.id);
    const openAlerts = vendorAlerts.filter((a) => !a.acknowledged);
    const criticalAlerts = vendorAlerts.filter(
      (a) => a.severity === "Critical"
    );

    const performanceAssessment =
      vendor.criticality === "Critical"
        ? "requires enhanced monitoring and governance"
        : vendor.criticality === "High"
          ? "warrants close attention and quarterly review"
          : "performs satisfactorily";

    const slaAssessment =
      vendor.slaStatus === "Red"
        ? "does not meet contracted performance levels"
        : vendor.slaStatus === "Yellow"
          ? "marginally meets contracted performance"
          : "consistently meets SLA commitments";

    const riskAssessment =
      vendor.residualRisk >= 4
        ? "elevated and requires active risk mitigation"
        : "moderate and within acceptable parameters";

    return `THIRD-PARTY RISK MANAGEMENT ASSESSMENT - ${vendor.name}

VENDOR RISK PROFILE
${vendor.name} is classified as a Tier ${vendor.tier} service provider in the ${vendor.category} category, supporting critical operations in ${vendor.services?.join(", ") || "multiple business functions"}. The vendor is located in ${vendor.location}. Regulatory relevance: ${vendor.regulatoryRelevance ? "Yes" : "No"}. The vendor's risk profile has been assessed with inherent risk of ${vendor.inherentRisk}/5 and residual risk of ${vendor.residualRisk}/5 based on service criticality, data access sensitivity (${vendor.dataSensitivity}), regulatory exposure, and operational interdependence. Current criticality assessment: ${vendor.criticality}. This assessment reflects ${vendor.name}'s importance to operational resilience and the institution's risk appetite.

CONTROL COVERAGE AND EFFECTIVENESS ASSESSMENT
The control framework for ${vendor.name} comprises ${vendorControls.length} documented controls, of which ${effectiveControls} are operating effectively, ${partiallyEffectiveControls} are partially effective, and ${ineffectiveControls} require remedial attention. Control testing frequency aligns with criticality tier: ${vendorControls.map((c) => c.testFrequency).join(", ") || "quarterly to annual"}. Control effectiveness rate is ${Math.round((effectiveControls / (vendorControls.length || 1)) * 100)}%. Key control types include ${this.getControlTypes(vendorControls).join(", ")}. Control evidence is documented through ${this.getEvidenceTypes(vendorControls)}. However, ${ineffectiveControls} controls require remedial attention within 60-90 days.

SLA AND PERFORMANCE ANALYSIS
${vendor.name} maintains contractual SLAs across multiple service dimensions. Performance monitoring over the past four quarters indicates SLA status of ${vendor.slaStatus} (${slaAssessment}). The vendor's most recent assessment was dated ${vendor.lastAssessmentDate?.toLocaleDateString() || "Q1 2026"}, with next review scheduled for ${vendor.nextReviewDate?.toLocaleDateString() || "Q2 2026"}. Service exceptions and alerts: ${openAlerts.length > 0 ? `${openAlerts.length} unacknowledged alerts including ${criticalAlerts.length} critical severity items` : "no unacknowledged service exceptions noted"}.

RESIDUAL RISK AND REMEDIATION PRIORITIES
Following assessment of existing controls, the residual risk profile is ${riskAssessment}. Management should ensure completion of remediation activities for ${ineffectiveControls} identified control gaps within 60-90 days. Quarterly control attestations, business reviews, and SOC 2 evidence should be maintained. Vendor relationship escalation protocols are in place for critical incidents. The contract expires on ${vendor.contractExpiry?.toLocaleDateString() || "TBD"}, requiring renewal assessment in advance.`;
  }

  /**
   * Generates 8-12 exam-tone due diligence questions for a vendor
   */
  generateVendorQuestionnaire(
    vendor: Vendor
  ): Array<{ category: string; question: string }> {
    const isCritical = vendor.criticality === "Critical";
    const isTier1 = vendor.tier === 1;
    const highDataSensitivity = vendor.dataSensitivity === "High";

    return [
      {
        category: "Operational Resilience",
        question: `Describe ${vendor.name}'s business continuity and disaster recovery procedures, including Recovery Time Objective (RTO) and Recovery Point Objective (RPO) commitments for the services provided to our institution.`,
      },
      {
        category: "Operational Resilience",
        question: `Provide documentation of ${vendor.name}'s testing frequency and results for business continuity plans over the past 12 months, including evidence of backup facility activation and failover procedures.`,
      },
      {
        category: "Data Security",
        question: `Describe the encryption standards applied to data in transit and at rest, including key management procedures, key rotation frequency, and compliance with NIST or equivalent cryptographic standards.`,
      },
      {
        category: "Data Security",
        question: `Provide evidence of penetration testing and vulnerability assessments conducted in the past 12 months, including scope, methodology, remediation timeline, and status of identified findings.`,
      },
      {
        category: "Compliance & Regulatory",
        question: `Confirm ${vendor.name}'s compliance status with relevant regulatory requirements including ${vendor.regulatoryRelevance ? "FDIC, OCC, or equivalent" : "industry"} standards, and disclose any pending or recent regulatory findings related to service delivery to financial institutions.`,
      },
      {
        category: "Compliance & Regulatory",
        question: `Describe the escalation procedures and mandatory notification requirements in the event of a material cybersecurity incident, data breach, service disruption, or regulatory examination finding.`,
      },
      {
        category: "Subcontractor Management",
        question: `Identify all material subcontractors engaged by ${vendor.name} in the delivery of contracted services, including their geographic location, regulatory oversight, and criticality to service delivery.`,
      },
      {
        category: "Change Management",
        question: `Describe the change management process for material changes to systems, infrastructure, personnel, or service parameters supporting the contracted service, including pre-implementation notification timelines and change advisory procedures.`,
      },
      ...(isCritical || isTier1
        ? [
            {
              category: "Financial Stability",
              question: `Provide the most recent audited financial statements for ${vendor.name}, including evidence of financial stability, credit ratings, and disclosure of any material changes to ownership structure or capitalization.`,
            },
            {
              category: "Insurance & Indemnification",
              question: `Confirm current professional liability insurance coverage limits and cyber liability insurance, along with evidence of contractual indemnification for third-party claims and incident response costs.`,
            },
          ]
        : []),
      {
        category: "Service Level Monitoring",
        question: `Provide quarterly SLA attainment reports for the past four quarters, detailing uptime percentages, incident response times, availability metrics, and any service credits issued for non-compliance.`,
      },
      {
        category: "Audit & Control Testing",
        question: `Confirm the schedule and scope of planned SOC 2 Type II, ISO 27001, or equivalent third-party audits, including management's assessment of control deficiencies and remediation timelines.`,
      },
      ...(highDataSensitivity
        ? [
            {
              category: "Data Protection",
              question: `Describe the specific controls and procedures implemented for data classification, retention, secure deletion, and prevention of unauthorized access to sensitive data processed on behalf of our institution.`,
            },
          ]
        : []),
    ];
  }

  /**
   * Generates an impact analysis narrative for a regulatory change
   */
  generateComplianceImpact(
    regChange: RegulatoryChange,
    controls: Control[],
    risks: Risk[]
  ): string {
    // Count affected controls and risks
    const affectedControls = controls.filter((c) =>
      regChange.affectedFrameworks?.includes(c.framework)
    ).length;
    const affectedRisks = risks.filter((r) =>
      regChange.affectedFrameworks?.some((f) => f.includes(r.category))
    ).length;

    const effectiveDate = regChange.effectiveDate?.toLocaleDateString() || "TBD";
    const implementationWindow = this.calculateImplementationWindow(
      regChange.effectiveDate
    );

    const sourceDetails = `the ${regChange.source}`;
    const statusPhrase =
      regChange.status === "Completed"
        ? "was adopted and is now in effect"
        : regChange.status === "Implementation"
          ? "was adopted and is currently in implementation"
          : "is under monitoring for potential adoption";

    return `REGULATORY CHANGE IMPACT ANALYSIS - ${regChange.title}

REGULATORY SUMMARY AND BACKGROUND
${regChange.title} ${statusPhrase} by ${sourceDetails}. The regulation ${regChange.status === "Completed" || regChange.status === "Implementation" ? "becomes or became effective on " + effectiveDate : "is expected to become effective by " + effectiveDate}. The regulatory change addresses ${regChange.summary}. Regulatory impact assessment: ${regChange.impactLevel} impact on the institution. Affected regulatory frameworks include: ${regChange.affectedFrameworks?.join(", ") || "multiple frameworks"}.

CONTROL AND RISK IMPACT ASSESSMENT
The compliance review identifies ${affectedControls} existing controls requiring enhancement, redesign, or new implementation to meet the regulatory standard defined in ${regChange.title}. Additionally, ${affectedRisks} risk factors require updated assessment methodologies and control strategies. Specifically, controls over ${this.getAffectedFrameworks(regChange.affectedFrameworks || [])} require remediation or new design. The analysis indicates control gaps in ${affectedControls > 0 ? "preventive and detective control" : "regulatory monitoring"} domains.

IMPLEMENTATION REQUIREMENTS AND TIMELINE
Management has established an implementation workstream targeting the following milestones: (1) detailed gap analysis and impact quantification by Q2 2026; (2) control redesign and systems requirements definition by Q3 2026; (3) parallel testing and user acceptance testing by Q4 2026; and (4) production implementation and hypercare support by ${effectiveDate}. The implementation window is approximately ${implementationWindow}. Action plan owner: ${regChange.actionPlanOwner}, with committed completion date of ${regChange.actionPlanDueDate?.toLocaleDateString() || "TBD"}.

SUPERVISORY EXPECTATIONS
The Risk Committee should monitor implementation progress monthly and adjust resource allocation as needed. Regulatory change management and internal audit should validate control effectiveness and regulatory compliance prior to and immediately following the effective date. Board-level oversight of regulatory readiness is expected given the ${regChange.impactLevel} impact rating.`;
  }

  /**
   * Generates an OCC/FDIC-style risk assessment narrative
   */
  generateRiskAssessment(scenario: {
    scenarioName: string;
    businessLine: string;
    product: string;
    geography: string;
    riskType: string;
    inherentRisk: number;
    controlStrength: number;
    lossHistory: number;
    compositeScore: number;
    residualRisk: number;
    factors: Array<{
      name: string;
      weight: number;
      value: number;
      contribution: number;
    }>;
  }): string {
    const inherentRiskLevel = this.scoreToLevel(scenario.inherentRisk);
    const residualRiskLevel = this.scoreToLevel(scenario.residualRisk);
    const controlStrengthLevel = this.scoreToLevel(scenario.controlStrength);

    const residualRiskAssessment =
      scenario.residualRisk >= 4
        ? "elevated and requires active management"
        : scenario.residualRisk >= 3
          ? "moderate and within risk appetite"
          : "low and appropriately managed";

    const topFactors = scenario.factors
      .sort((a, b) => b.contribution - a.contribution)
      .slice(0, 3);

    const factorNarrative = topFactors
      .map((f) => `${f.name} (${f.contribution}% contribution)`)
      .join(", ");

    return `RISK ASSESSMENT NARRATIVE - ${scenario.scenarioName}

SCENARIO OVERVIEW AND RATING
Risk Scenario: ${scenario.scenarioName}
Business Line: ${scenario.businessLine}
Product: ${scenario.product}
Geography: ${scenario.geography}
Risk Type: ${scenario.riskType}

The institution's exposure to ${scenario.scenarioName} is assessed as follows:
• Inherent Risk: ${scenario.inherentRisk}/5 (${inherentRiskLevel})
• Control Strength: ${scenario.controlStrength}/5 (${controlStrengthLevel})
• Residual Risk: ${scenario.residualRisk}/5 (${residualRiskLevel})
• Composite Score: ${scenario.compositeScore}/10
• Historical Loss: USD ${(scenario.lossHistory / 1000000).toFixed(2)}M

This rating reflects the likelihood of occurrence, potential impact magnitude across financial, reputational, regulatory, and operational dimensions, and the current state of preventive and detective controls.

RISK SCORE DRIVER ANALYSIS
The composite risk score of ${scenario.compositeScore}/10 is derived from the following components and their relative contributions:
${topFactors.map((f) => `• ${f.name}: Value ${f.value}/5, Weight ${f.weight}%, Contribution ${f.contribution}%`).join("\n")}

The key drivers of risk exposure are ${factorNarrative}. Historical loss data shows USD ${(scenario.lossHistory / 1000000).toFixed(2)}M in realized losses across similar scenarios, informing the inherent risk assessment.

RESIDUAL RISK PROFILE
Following the application of existing controls assessed at ${scenario.controlStrength}/5 strength, the residual risk profile is ${residualRiskAssessment}. The institution's risk appetite threshold for this scenario is 3/5 or lower. Current residual exposure at ${scenario.residualRisk}/5 ${scenario.residualRisk > 3 ? "exceeds" : "remains within"} this threshold. Control effectiveness represents a ${(scenario.inherentRisk - scenario.residualRisk) * 20}% risk reduction from inherent baseline.

REMEDIATION AND MONITORING EXPECTATIONS
Management should prioritize control enhancements targeting the highest-impact risk drivers identified above. Quarterly risk reassessment should track inherent and residual trends. The Risk Committee should review this scenario assessment and remediation progress quarterly until residual risk is reduced to approved appetite levels. Escalation is required if residual risk exceeds 4/5.`;
  }

  /**
   * Main copilot responder - handles Quick Actions, FAQ, page-aware context
   */
  generateCopilotResponse(context: {
    module: string;
    entityId?: string;
    message: string;
  }): string {
    // Strip knowledge context to get the raw user query
    const fullMessage = context.message.toLowerCase();
    const knowledgeIdx = fullMessage.indexOf('[knowledge context]');
    const message = knowledgeIdx > -1 ? fullMessage.substring(0, knowledgeIdx).trim() : fullMessage;

    // Data-driven domain routing FIRST — query actual seed data for answers
    const dataResponse = this.handleDataQuery(message);
    if (dataResponse) return dataResponse;

    // Quick Actions routing (only for short navigational queries)
    const quickActions: {
      [key: string]: () => string;
    } = {
      "daily digest": () =>
        "DAILY DIGEST: Use the Daily Risk Posture Summary feature to generate an OCC/FDIC-style narrative of your current risk status. This includes risk counts, KRI breach status, vendor criticality, open issues, and loss events.",
      "examiner view": () =>
        "EXAMINER VIEW: Generate an examination-ready narrative for your Report of Examination (ROE). This includes risk profile assessment, control environment ratings, management findings status, and supervisory expectations.",
      "vendor assessment": () =>
        "VENDOR ASSESSMENT: Select a vendor and generate a TPRM assessment narrative including risk profile, control coverage, SLA performance, and remediation priorities.",
      "compliance impact": () =>
        "COMPLIANCE IMPACT: Analyze the impact of regulatory changes on your control environment. The system identifies affected controls and risks, and generates an implementation timeline.",
      "kri dashboard": () =>
        "KRI MONITORING: View all Key Risk Indicators with current values, thresholds, breach levels, and trends. Filter by risk category or status for focused monitoring.",
      "issue tracker": () =>
        "ISSUE TRACKER: Track management findings, MRAs, and MRIAs with status, severity, due dates, and remediation plans. Escalate overdue items and monitor closure rates.",
    };

    // Check for quick action matches (against clean user query only)
    for (const [action, response] of Object.entries(quickActions)) {
      if (message.includes(action)) {
        return response();
      }
    }

    // Page-aware context routing (only if no specific data match)
    if (context.module === "tprm" && context.entityId) {
      const vendor = vendors.find(v => v.id === context.entityId);
      if (vendor) {
        return `VENDOR: ${vendor.name} (${vendor.tier}, ${vendor.criticality} criticality)\nResidual Risk: ${vendor.residualRisk}/5 | SLA Status: ${vendor.slaStatus}\nContract Expiry: ${vendor.contractExpiry instanceof Date ? vendor.contractExpiry.toLocaleDateString() : vendor.contractExpiry}\nControls linked: ${vendor.controlIds?.length || 0}`;
      }
    }

    if (context.module === "risk" && context.entityId) {
      const risk = risks.find(r => r.id === context.entityId);
      if (risk) {
        return `RISK: ${risk.title}\nCategory: ${risk.category} | Status: ${risk.status}\nInherent Score: ${risk.inherentScore} | Residual Score: ${risk.residualScore}\nImpact: ${risk.impact}/5 | Likelihood: ${risk.likelihood}/5\nOwner: ${risk.owner}\nLinked Controls: ${risk.controlIds?.length || 0}`;
      }
    }

    // FAQ responses (improved matching)
    return this.handleFAQ(message);
  }

  // Helper methods

  private getTopRiskCategories(risks: Risk[], count: number): string[] {
    const categoryCounts: { [key: string]: number } = {};
    risks.forEach((r) => {
      categoryCounts[r.category] = (categoryCounts[r.category] || 0) + 1;
    });
    return Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, count)
      .map((entry) => entry[0]);
  }

  private describeLossConcentration(lossEvents: LossEvent[]): string {
    const categoryCounts: { [key: string]: number } = {};
    lossEvents.forEach((e) => {
      categoryCounts[e.category] = (categoryCounts[e.category] || 0) + 1;
    });
    const topCategory = Object.entries(categoryCounts).sort(
      (a, b) => b[1] - a[1]
    )[0];
    return topCategory
      ? `${topCategory[0]} category (${topCategory[1]} events)`
      : "diverse";
  }

  private getLastExamDate(): string {
    return new Date(new Date().setFullYear(new Date().getFullYear() - 1))
      .toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
  }

  private getRiskProfileRating(risks: Risk[]): string {
    const criticalCount = risks.filter(
      (r) => r.inherentScore > 16 || r.residualScore > 16
    ).length;
    if (criticalCount > 0) return "High";
    const highCount = risks.filter(
      (r) =>
        (r.inherentScore > 12 && r.inherentScore <= 16) ||
        (r.residualScore > 12 && r.residualScore <= 16)
    ).length;
    return highCount > 3 ? "Moderate" : "Low";
  }

  private getControlTypes(controls: Control[]): string[] {
    const types = new Set(controls.map((c) => c.controlType));
    return Array.from(types);
  }

  private getEvidenceTypes(controls: Control[]): string {
    const evidenceSet = new Set(
      controls
        .filter((c) => c.evidence)
        .map((c) => {
          if (c.evidence.includes("SOC")) return "SOC audits";
          if (c.evidence.includes("test")) return "control testing";
          if (c.evidence.includes("attestation")) return "attestations";
          return "documentation";
        })
    );
    return Array.from(evidenceSet).join(", ") || "control documentation";
  }

  private calculateImplementationWindow(date?: Date): string {
    if (!date) return "9-12 months";
    const effectiveDate = new Date(date);
    const today = new Date();
    const monthsUntil = Math.round(
      (effectiveDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30)
    );
    return `${Math.max(1, monthsUntil)} months`;
  }

  private getAffectedFrameworks(frameworks: string[]): string {
    return frameworks.join(", ") || "multiple regulatory frameworks";
  }

  private scoreToLevel(score: number): string {
    if (score >= 4.5) return "Critical";
    if (score >= 3.5) return "High";
    if (score >= 2.5) return "Medium";
    if (score >= 1.5) return "Low";
    return "Minimal";
  }

  /**
   * Data-driven query handler — queries actual seed data to generate meaningful responses
   */
  private handleDataQuery(query: string): string | null {
    const q = query.toLowerCase();
    const dal = getDataAccess();
    const risks = dal.getRisks();
    const controls = dal.getControls();
    const vendors = dal.getVendors();
    const issues = dal.getIssues();
    const kris = dal.getKRIs();
    const lossEvents = dal.getLossEvents();
    const regulatoryChanges = dal.getRegulatoryChanges();

    // SOC 2 controls
    if ((q.includes('soc') && q.includes('control')) || q.includes('soc 2') || q.includes('soc2') || q.includes('trust services')) {
      const soc2Controls = controls.filter(c => c.framework === 'SOX' || c.description?.toLowerCase().includes('soc'));
      const secControls = controls.filter(c => c.controlType === 'Preventive' || c.controlType === 'Detective');
      const effective = controls.filter(c => c.effectiveness === 'Effective').length;
      const partial = controls.filter(c => c.effectiveness === 'Partially Effective').length;
      const ineffective = controls.filter(c => c.effectiveness === 'Ineffective').length;
      return `SOC 2 CONTROL STATUS\n\nIRM Command implements 15 SOC 2 Trust Services controls:\n• Security (CC1-CC7): 8 controls — RBAC, SSO/MFA, encryption, SIEM, incident response\n• Availability (A1.1-A1.4): 4 controls — 99.9% SLA, DR plan, backups, environmental safeguards\n• Confidentiality (C1.1-C1.3): 3 controls — data classification, retention, tokenization\n\nImplementation: 13 of 15 implemented (87% readiness)\nPending: A1.3 (Backup & Recovery testing), C1.2 (Data Retention & Disposal)\n\nOverall Control Environment: ${controls.length} total controls across all frameworks\n• Effective: ${effective} | Partially Effective: ${partial} | Ineffective: ${ineffective}`;
    }

    // Top risks / risk summary
    if ((q.includes('top') && q.includes('risk')) || (q.includes('risk') && (q.includes('summary') || q.includes('status') || q.includes('overview')))) {
      const sorted = [...risks].sort((a, b) => b.inherentScore - a.inherentScore);
      const top5 = sorted.slice(0, 5);
      const criticalCount = risks.filter(r => r.inherentScore >= 15).length;
      const avgInherent = (risks.reduce((sum, r) => sum + r.inherentScore, 0) / risks.length).toFixed(1);
      const avgResidual = (risks.reduce((sum, r) => sum + r.residualScore, 0) / risks.length).toFixed(1);
      let response = `RISK SUMMARY (${risks.length} risks)\n\nAvg Inherent Score: ${avgInherent} | Avg Residual: ${avgResidual} | Critical: ${criticalCount}\n\nTop 5 Risks by Inherent Score:\n`;
      top5.forEach((r, i) => {
        response += `${i + 1}. ${r.title}\n   Category: ${r.category} | Inherent: ${r.inherentScore} | Residual: ${r.residualScore} | Status: ${r.status}\n`;
      });
      return response;
    }

    // KRI breaches
    if (q.includes('kri') || (q.includes('key risk') && q.includes('indicator')) || q.includes('breach')) {
      const breached = kris.filter(k => k.breachLevel === 'Breach' || k.breachLevel === 'Critical');
      const warnings = kris.filter(k => k.breachLevel === 'Warning');
      let response = `KRI STATUS (${kris.length} indicators)\n\nBreached: ${breached.length} | Warning: ${warnings.length} | Normal: ${kris.length - breached.length - warnings.length}\n`;
      if (breached.length > 0) {
        response += `\nBREACHED KRIs:\n`;
        breached.forEach(k => {
          const overPct = Math.round(((k.currentValue - k.threshold) / k.threshold) * 100);
          response += `• ${k.name}: ${k.currentValue} ${k.unit} (threshold: ${k.threshold}, ${overPct}% over)\n`;
        });
      }
      if (warnings.length > 0) {
        response += `\nWARNING KRIs:\n`;
        warnings.forEach(k => {
          const overPct = Math.round(((k.currentValue - k.threshold) / k.threshold) * 100);
          response += `• ${k.name}: ${k.currentValue} ${k.unit} (threshold: ${k.threshold}, ${overPct}% over)\n`;
        });
      }
      return response;
    }

    // Vendor / TPRM
    if (q.includes('vendor') || q.includes('tprm') || q.includes('third party') || q.includes('sla')) {
      const critical = vendors.filter(v => v.criticality === 'Critical');
      const redSLA = vendors.filter(v => v.slaStatus === 'Red');
      const yellowSLA = vendors.filter(v => v.slaStatus === 'Yellow');
      let response = `VENDOR RISK SUMMARY (${vendors.length} vendors)\n\nCritical vendors: ${critical.length} | SLA Red: ${redSLA.length} | SLA Yellow: ${yellowSLA.length}\n\nVendor Breakdown:\n`;
      vendors.forEach(v => {
        response += `• ${v.name} — ${v.tier}, ${v.criticality} | Risk: ${v.residualRisk}/5 | SLA: ${v.slaStatus}\n`;
      });
      return response;
    }

    // Compliance / controls / framework / gaps
    if (q.includes('compliance') || q.includes('gap') || q.includes('framework') || q.includes('control')) {
      const frameworks = ['Basel III', 'SOX', 'GDPR', 'NIST', 'ISO27001'] as const;
      const effective = controls.filter(c => c.effectiveness === 'Effective').length;
      const partial = controls.filter(c => c.effectiveness === 'Partially Effective').length;
      const ineffective = controls.filter(c => c.effectiveness === 'Ineffective').length;
      let response = `COMPLIANCE OVERVIEW (${controls.length} controls)\n\nEffective: ${effective} | Partially Effective: ${partial} | Ineffective: ${ineffective}\n\nFramework Coverage:\n`;
      frameworks.forEach(fw => {
        const fwControls = controls.filter(c => c.framework === fw);
        const impl = fwControls.filter(c => c.status === 'Implemented').length;
        response += `• ${fw}: ${impl}/${fwControls.length} implemented (${fwControls.length > 0 ? Math.round((impl / fwControls.length) * 100) : 0}%)\n`;
      });
      if (ineffective > 0) {
        response += `\nGAPS (Ineffective Controls):\n`;
        controls.filter(c => c.effectiveness === 'Ineffective').forEach(c => {
          response += `• ${c.title} (${c.framework}) — ${c.controlType}\n`;
        });
      }
      return response;
    }

    // Issues / findings / audit / overdue / MRA
    if (q.includes('issue') || q.includes('finding') || q.includes('overdue') || q.includes('mra') || q.includes('audit')) {
      const open = issues.filter(i => i.status === 'Open' || i.status === 'In Progress');
      const critical = issues.filter(i => i.severity === 'Critical');
      const high = issues.filter(i => i.severity === 'High');
      const now = new Date();
      const overdue = issues.filter(i => {
        const due = i.dueDate instanceof Date ? i.dueDate : new Date(i.dueDate);
        return due < now && i.status !== 'Closed';
      });
      let response = `ISSUE TRACKER (${issues.length} total)\n\nOpen/In Progress: ${open.length} | Critical: ${critical.length} | High: ${high.length} | Overdue: ${overdue.length}\n`;
      if (overdue.length > 0) {
        response += `\nOVERDUE FINDINGS:\n`;
        overdue.forEach(i => {
          const due = i.dueDate instanceof Date ? i.dueDate : new Date(i.dueDate);
          const days = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
          response += `• ${i.title}\n  Severity: ${i.severity} | ${days} days overdue | Owner: ${i.owner} | MRA: ${i.mraType}\n`;
        });
      }
      return response;
    }

    // Loss events
    if (q.includes('loss') || q.includes('event')) {
      const totalLoss = lossEvents.reduce((sum, e) => sum + e.amount, 0);
      const totalRecovery = lossEvents.reduce((sum, e) => sum + (e.recoveryAmount || 0), 0);
      let response = `LOSS EVENTS (${lossEvents.length} events)\n\nTotal Loss: $${(totalLoss / 1_000_000).toFixed(1)}M | Recovered: $${(totalRecovery / 1_000_000).toFixed(1)}M | Net: $${((totalLoss - totalRecovery) / 1_000_000).toFixed(1)}M\n\nEvents:\n`;
      lossEvents.forEach(e => {
        response += `• ${e.title}\n  ${e.category} | $${(e.amount / 1_000_000).toFixed(1)}M | ${e.status}\n`;
      });
      return response;
    }

    // Regulatory changes
    if (q.includes('regulatory') || q.includes('regulation') || q.includes('reg change')) {
      let response = `REGULATORY CHANGES (${regulatoryChanges.length} tracked)\n\n`;
      regulatoryChanges.forEach(r => {
        const date = r.effectiveDate instanceof Date ? r.effectiveDate.toLocaleDateString() : String(r.effectiveDate);
        response += `• ${r.title}\n  Source: ${r.source} | Impact: ${r.impactLevel} | Status: ${r.status} | Effective: ${date}\n`;
      });
      return response;
    }

    return null; // No data match — fall through to FAQ
  }

  private handleFAQ(query: string): string {
    const faqDatabase: { [key: string]: string } = {
      "what is irm command":
        "IRM Command is an enterprise Integrated Risk Management platform enabling financial institutions to consolidate risk data, controls, compliance activities, and third-party management. The platform supports risk identification, KRI monitoring, TPRM, regulatory change management, and supervisory exam preparation with OCC/FDIC-style narrative generation.",

      "how do i create a risk":
        "Navigate to the Risk Module and click Create New Risk. Complete the form with: title, category (Credit/Market/Operational/Compliance/Cyber/ThirdParty/Strategic/Liquidity), business unit, description, likelihood (1-5), impact (1-5), owner, status, control IDs, and KPI IDs. The platform automatically calculates inherent and residual scores.",

      "what is a kri":
        "Key Risk Indicators (KRIs) are quantitative metrics measuring risk exposure. KRIs have current values measured against thresholds, with breach levels (Normal/Warning/Breach/Critical) and trends (Improving/Stable/Deteriorating). Examples include operational loss frequency, control exception rates, and regulatory compliance metrics.",

      "how do i monitor vendor risk":
        "Use the TPRM module to assign vendors to tiers (1-3), set criticality levels (Critical/High/Medium/Low), define data sensitivity, and monitor SLA status (Green/Yellow/Red). Track inherent and residual risk scores. Document control coverage and schedule regular business reviews and SOC 2 attestations.",

      "what is a management finding":
        "A Management Finding (MRA - Matter Requiring Attention; MRIA - Matter Requiring Immediate Attention) is a deficiency identified through internal or external audit. It includes: title, severity (Critical/High/Medium/Low), source, status (Open/In Progress/Remediation Planned/Closed/Overdue), owner, due date, remediation plan, and linked risks and controls.",

      "how do i respond to a regulatory change":
        "Use the Compliance Module to log regulatory changes by source (OCC/FDIC/Federal Reserve/Basel Committee/SEC/EU Commission). Assess impact level (High/Medium/Low), status (Monitoring/Impact Assessment/Implementation/Completed), identify affected frameworks and controls, establish implementation timeline, and assign action plan owner.",

      "what is control testing":
        "Control testing validates that a control is operating effectively. Testing includes test frequency (Quarterly/Semi-Annual/Annual/On-Demand), test date documentation, next review date, effectiveness assessment (Effective/Partially Effective/Ineffective), evidence documentation, control type (Detective/Preventive/Corrective), and remediation for exceptions.",

      "how do i generate an exam response":
        "The system generates OCC/FDIC-style Report of Examination narratives automatically. Select 'Examiner View' to create a comprehensive ROE narrative incorporating your risk profile, control environment assessment, management findings status, KRI metrics, and supervisory expectations.",

      "what is a control gap":
        "A control gap exists when a risk does not have adequate detective or preventive controls. Gaps are prioritized by risk exposure and addressed through: control design and implementation, third-party service enhancements, or compensating control additions.",

      "how do i document a loss event":
        "Navigate to Loss Events and enter: title, category (Credit/Market/Operational/Compliance/Cyber), amount, date, business unit, description, status (Reported/Under Investigation/Resolved/Archived), root cause analysis, and linked risk IDs. Aggregate losses quarterly for KRI trending and regulatory reporting.",

      "what is risk appetite":
        "Risk Appetite defines the level of risk the institution accepts in pursuit of objectives. Quantified thresholds are set for each risk category, measured as inherent and residual risk scores (1-5 scale), guiding risk assessment ratings and control design priorities.",

      "what is inherent vs residual risk":
        "Inherent risk is risk exposure prior to controls. Residual risk is remaining risk after controls are applied. Control effectiveness is the gap between inherent and residual scores, informing the need for additional controls or process improvements.",

      "how do i escalate a risk":
        "Risks are automatically escalated when they exceed defined thresholds (e.g., inherent or residual score > 4, financial impact > $10M). Escalated risks require Risk Committee review and documented risk acceptance or remediation.",

      "what frameworks does irm command support":
        "IRM Command supports regulatory mapping to: Basel III, SOX, GDPR, NIST, and ISO 27001. Controls can be classified by framework, and regulatory changes track impact across these frameworks.",

      "what are the vendor tiers":
        "Vendors are classified as: Tier 1 (critical, requires enhanced oversight), Tier 2 (important, standard monitoring), Tier 3 (standard, periodic review). Tier assignments determine testing frequency, questionnaire depth, and SLA monitoring intensity.",

      "how do i track kri trends":
        "KRIs track trend direction: Improving (favorable trajectory), Stable (no significant change), or Deteriorating (adverse movement). Monitor trends monthly or quarterly depending on risk category to identify emerging risks before they materialize.",

      "what is a loss event":
        "A Loss Event is a documented financial loss incurred due to operational, credit, market, compliance, or cyber risk events. Each loss is categorized, amounts tracked, linked to risks, and analyzed for root cause and trends.",

      "how do i use the copilot":
        "The Copilot is a GRC assistant that responds to natural language queries about risk, controls, compliance, vendors, and IRM Command features. Ask about generating narratives, tracking issues, monitoring KRIs, assessing vendors, or understanding regulatory requirements.",

      default:
        "I can assist with risk management, control assessment, compliance tracking, third-party risk, KRI monitoring, regulatory change analysis, and IRM Command features. Try asking about generating narratives, tracking management findings, vendor assessments, or regulatory impact.",
    };

    // Require meaningful overlap — at least 2 significant words must match
    const queryWords = query.split(/\s+/).filter(w => w.length > 2).map(w => w.toLowerCase());

    let bestMatch: { key: string; score: number } = { key: 'default', score: 0 };

    for (const key of Object.keys(faqDatabase)) {
      if (key === 'default') continue;
      const keyWords = key.split(/\s+/);
      const matchCount = queryWords.filter(qw => keyWords.some(kw => kw.includes(qw) || qw.includes(kw))).length;
      if (matchCount >= 2 && matchCount > bestMatch.score) {
        bestMatch = { key, score: matchCount };
      }
    }

    return faqDatabase[bestMatch.key] || faqDatabase.default;
  }
}
