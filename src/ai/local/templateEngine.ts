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
    const q = query.toLowerCase().trim();

    // ---- Structured knowledge base: each entry has patterns and a factual response ----
    const knowledgeBase: Array<{ patterns: RegExp[]; response: string; keywords: string[] }> = [
      // ===== GRC FUNDAMENTALS =====
      {
        patterns: [/\b(what is grc|what.?s grc|explain grc|grc mean|grc stand|define grc|grc definition|governance.+risk.+compliance)\b/],
        keywords: ['grc', 'governance risk compliance'],
        response: "GRC stands for Governance, Risk, and Compliance — three interconnected disciplines that ensure an organization operates within its risk appetite while meeting regulatory obligations.\n\nGovernance defines the policies, decision-making structures, and accountability frameworks set by the Board and senior management. Risk Management identifies, assesses, monitors, and mitigates threats across credit, market, operational, cyber, and strategic domains. Compliance ensures adherence to laws, regulations, and internal policies — for banks, this includes OCC, FDIC, Federal Reserve, and SEC requirements.\n\nIRM Command integrates all three into a single platform: the Dashboard provides governance-level visibility, the Risk Register and Workbench handle risk assessment, and the Compliance module tracks regulatory obligations and control mappings."
      },
      // IRM / platform identity
      {
        patterns: [/\b(what is irm|what.?s irm|expand irm|irm stand|irm mean|about irm|tell me about irm|what does irm)\b/],
        keywords: ['irm', 'integrated risk management', 'irm command', 'platform'],
        response: "IRM stands for Integrated Risk Management. IRM Command is an enterprise GRC platform built for G-SIB and large banks — it brings together risk registers, control libraries, vendor oversight, compliance tracking, and AI-powered analytics into a single command center.\n\nThe platform covers eight risk domains (Credit, Market, Operational, Compliance, Cyber, Third-Party, Strategic, Liquidity), maps controls to regulatory frameworks (SOC 2, Basel III, NIST CSF, ISO 27001, SOX, GDPR, DORA), and provides AI-generated narratives calibrated to supervisory expectations from the OCC, FDIC, and Federal Reserve."
      },
      // Copilot usage / help
      {
        patterns: [/\b(help|what can you do|how do i use|capabilities|what do you do|how to use copilot|getting started)\b/],
        keywords: ['help', 'capabilities', 'copilot'],
        response: "I'm your GRC copilot — here's what I can help with:\n\nAsk about your data — \"What are the top risks by severity?\" or \"Which vendors have SLA violations?\"\nGet explanations — \"What is a KRI?\" or \"Explain inherent vs residual risk\"\nNavigate the platform — \"Show me the TPRM module\" or \"Where do I find control testing?\"\nGenerate analysis — \"Summarize our compliance posture\" or \"List overdue audit findings\"\n\nJust type naturally — I understand GRC terminology and can pull live data from your risk register, control library, and vendor catalog."
      },
      // ===== RISK MANAGEMENT CONCEPTS =====
      // KRI
      {
        patterns: [/\b(what is a kri|what.?s a kri|kri mean|key risk indicator|explain kri|define kri)\b/],
        keywords: ['kri', 'key risk indicator'],
        response: "A Key Risk Indicator (KRI) is a metric that signals changes in your risk exposure before losses materialize — essentially an early warning system.\n\nEach KRI has a current value measured against thresholds. When a KRI crosses a threshold, it moves from Normal to Warning to Breach to Critical. Trends show whether it's Improving, Stable, or Deteriorating.\n\nFor example, if your \"Operational Loss Frequency\" KRI spikes from 3 to 8 incidents/month, that's a breach — the platform flags it and triggers alerts to the risk owner. Check the Dashboard to see your current KRI breach count."
      },
      // Risk appetite
      {
        patterns: [/\b(risk appetite|risk tolerance|acceptable risk|how much risk|appetite statement)\b/],
        keywords: ['appetite', 'tolerance', 'acceptable risk'],
        response: "Risk appetite is the level of risk your institution is willing to accept in pursuit of its objectives. It's set by the Board and Risk Committee, then quantified as thresholds for each risk category.\n\nIn IRM Command, risk appetite shows up as the scoring boundaries — when an inherent or residual risk score exceeds the appetite threshold (typically >4 on a 1-5 scale), it triggers escalation to the Risk Committee. The AI Workbench lets you model scenarios against these thresholds to test whether proposed activities fall within or outside your stated appetite."
      },
      // Inherent vs residual risk
      {
        patterns: [/\b(inherent.+residual|residual.+inherent|before controls|after controls|risk score|inherent risk|residual risk)\b/],
        keywords: ['inherent', 'residual', 'risk score'],
        response: "These are the two key risk measurements in any risk management framework:\n\nInherent risk is the risk level before any controls are applied — the raw exposure if nothing were in place to mitigate it. Residual risk is the risk that remains after your controls are in effect.\n\nThe gap between them shows how effective your control environment is. A large gap means strong controls. A small gap means weak controls or controls not addressing the right threats. On the Dashboard, the Enterprise Risk Score reflects average residual risk across your portfolio. The AI Workbench calculates both for any scenario you model."
      },
      // Risk categories
      {
        patterns: [/\b(risk categor|types of risk|risk type|operational risk|credit risk|market risk|cyber risk|strategic risk|liquidity risk|what risks)\b/],
        keywords: ['risk category', 'risk type', 'operational', 'credit', 'market', 'cyber', 'strategic', 'liquidity'],
        response: "IRM Command tracks eight standard risk categories aligned with OCC and Basel supervisory guidance:\n\nCredit Risk — potential loss from borrower or counterparty default.\nMarket Risk — exposure to adverse movements in interest rates, FX, equities, or commodities.\nOperational Risk — loss from failed processes, people, systems, or external events.\nCompliance Risk — violations of laws, regulations, or internal policies.\nCyber Risk — threats to information security, data integrity, and system availability.\nThird-Party Risk — exposure from vendors, outsourcing, and supply chain dependencies.\nStrategic Risk — threats to business model viability, competitive position, or capital planning.\nLiquidity Risk — inability to meet short-term obligations without significant loss.\n\nEach risk in the register is categorized and scored for both inherent and residual exposure."
      },
      // Loss event
      {
        patterns: [/\b(loss event|document.+loss|financial loss|loss history|operational loss)\b/],
        keywords: ['loss event', 'loss history', 'financial loss'],
        response: "A loss event is a documented financial loss from a risk materializing — operational incidents, credit defaults, cyber breaches, compliance penalties, etc.\n\nYou can log them with amount, date, category, business unit, root cause, and linked risks. The platform aggregates losses for KRI trending (e.g., total quarterly losses), regulatory reporting, and the AI Workbench's loss history factor.\n\nCheck the Dashboard's \"Capital at Risk\" metric for the current aggregate exposure."
      },
      // Risk heat map
      {
        patterns: [/\b(heat map|heatmap|risk matrix|likelihood.+impact|impact.+likelihood|risk plot)\b/],
        keywords: ['heat map', 'heatmap', 'risk matrix'],
        response: "The Risk Heat Map is a visual matrix that plots risks by likelihood (x-axis) and impact (y-axis), both scored 1-5. Each cell is color-coded: red for critical (high likelihood + high impact), amber for elevated, yellow for moderate, and green for low.\n\nOn the Dashboard, the heat map provides an at-a-glance view of your risk distribution. Clicking any cell shows the specific risks in that zone. The distribution bars show how many risks fall in each severity band, helping identify concentration risk."
      },
      // Escalation
      {
        patterns: [/\b(escalat|critical risk|high risk|risk committee|board report)\b/],
        keywords: ['escalation', 'critical risk', 'risk committee', 'board'],
        response: "Risks are escalated when they exceed defined thresholds — typically a residual score above 4 or financial impact above $10M. Escalated risks require Risk Committee review and a documented decision: either accept the risk with justification, or approve a remediation plan with timeline.\n\nYou can also manually escalate any risk from its detail view if you believe it warrants senior attention. The Board Pack quick action in the AI Command Center generates a board-ready summary of all escalated risks."
      },
      // ===== CONTROLS & COMPLIANCE =====
      // Control testing
      {
        patterns: [/\b(control test|test.+control|testing|control effectiveness|soc 2 control|control environment)\b/],
        keywords: ['control testing', 'control effectiveness', 'test'],
        response: "Control testing validates that your controls are actually working as designed. In the SOC 2 Controls page, each control shows:\n\nTest frequency — Quarterly, Semi-Annual, Annual, or On-Demand.\nLast tested / Next review dates.\nEffectiveness — Effective, Partially Effective, or Ineffective.\nEvidence — documentation proving the control operates correctly.\n\nControls marked Ineffective or Partially Effective get flagged for remediation. The Dashboard shows your overall Control Test Coverage percentage. Control types include Preventive, Detective, and Corrective — a mature environment has a mix of all three."
      },
      // Compliance / framework
      {
        patterns: [/\b(compliance|regulatory change|regulation|regulatory|sox|gdpr|nist|basel|iso 27001|framework|dora|coso)\b/],
        keywords: ['compliance', 'regulatory', 'framework', 'sox', 'gdpr', 'nist', 'basel', 'iso', 'dora', 'coso'],
        response: "IRM Command maps controls to major regulatory frameworks: SOC 2 Type II, Basel III/IV, NIST CSF 2.0, ISO 27001:2022, COSO ERM, SOX, GDPR, and DORA.\n\nThe Compliance module tracks regulatory changes by source (OCC, FDIC, Federal Reserve, SEC, etc.), assesses their impact, and links them to your existing controls and frameworks. When a new regulation drops, you can trace exactly which controls need updating.\n\nCheck the Compliance page to see your current compliance posture and any gaps."
      },
      // MRA / MRIA / findings
      {
        patterns: [/\b(management finding|mra|mria|audit finding|finding|matter.+requiring|examination finding)\b/],
        keywords: ['mra', 'mria', 'finding', 'audit', 'management finding'],
        response: "Management findings are deficiencies identified through audits or exams:\n\nMRA (Matter Requiring Attention) — needs corrective action within a defined timeline. These are the standard exam findings from OCC, FDIC, or internal audit.\nMRIA (Matter Requiring Immediate Attention) — urgent, requires immediate remediation. These indicate significant risk to the institution's safety and soundness.\n\nEach finding has a severity, owner, due date, remediation plan, and links to affected risks and controls. The Exceptions page tracks all open findings and their remediation status. Overdue findings are escalated automatically."
      },
      // Three lines of defense
      {
        patterns: [/\b(three lines|3 lines|lines of defense|first line|second line|third line|1st line|2nd line|3rd line)\b/],
        keywords: ['three lines', 'lines of defense', 'first line', 'second line'],
        response: "The Three Lines of Defense model is the standard governance framework for risk management in financial institutions:\n\nFirst Line — Business units and operational management. They own and manage risk day-to-day, execute controls, and escalate issues. In IRM Command, these are the risk and control owners assigned to each item.\n\nSecond Line — Risk Management and Compliance functions. They set policy, provide oversight, challenge the first line, and monitor KRIs. The Dashboard and Compliance modules support this function.\n\nThird Line — Internal Audit. They provide independent assurance that the first and second lines are operating effectively. Audit findings flow into the Exceptions module as MRAs/MRIAs.\n\nRegulators like the OCC expect clear separation between these lines."
      },
      // ===== THIRD-PARTY RISK =====
      // Vendor / TPRM
      {
        patterns: [/\b(vendor risk|tprm|third.?party|monitor vendor|vendor tier|vendor assessment|vendor management|outsourc)\b/],
        keywords: ['vendor', 'tprm', 'third party', 'outsourcing'],
        response: "The TPRM module is where you manage all third-party risk. Each vendor gets a tier (1-3) based on criticality:\n\nTier 1 — Critical vendors (cloud providers, core banking) — enhanced oversight, quarterly reviews.\nTier 2 — Important vendors — standard monitoring, semi-annual reviews.\nTier 3 — Standard vendors — periodic review, annual attestation.\n\nFor each vendor you can track SLA status (Green/Yellow/Red), inherent and residual risk scores, contract details, and monitoring alerts. The TPRM page also generates due diligence questionnaires and vendor assessment narratives calibrated to OCC guidance on third-party relationships."
      },
      // SLA
      {
        patterns: [/\b(sla|service level|uptime|availability|performance metric)\b/],
        keywords: ['sla', 'service level', 'uptime', 'availability'],
        response: "Service Level Agreements (SLAs) define contracted performance standards between your institution and its vendors. IRM Command tracks SLA status with a traffic-light system:\n\nGreen — vendor consistently meets all SLA commitments.\nYellow — marginal performance, at-risk of breaching.\nRed — contracted performance not met, requires remediation or escalation.\n\nSLA monitoring covers uptime, response times, incident resolution, and data processing commitments. Vendors in Red status trigger alerts and may require management action plans or contract re-negotiation."
      },
      // ===== EXAM & SUPERVISORY =====
      // Exam / examiner / ROE
      {
        patterns: [/\b(exam|examiner|roe|report of examination|occ|fdic|supervisory|regulator visit)\b/],
        keywords: ['exam', 'examiner', 'roe', 'occ', 'fdic', 'supervisory'],
        response: "IRM Command can generate OCC/FDIC-style Report of Examination (ROE) narratives. The Examiner View compiles your risk profile, control environment assessment, management findings status, and KRI metrics into a supervisory-ready narrative.\n\nThis is especially useful for exam preparation — you can preview what regulators would see and identify gaps before they do. The AI Command Center's quick actions include \"Draft Exam Response\" which produces a narrative calibrated to supervisory language and expectations."
      },
      // CAMELS
      {
        patterns: [/\b(camels|camel rating|composite rating|safety.+soundness)\b/],
        keywords: ['camels', 'composite rating', 'safety soundness'],
        response: "CAMELS is the supervisory rating system used by U.S. banking regulators (OCC, FDIC, Federal Reserve) to assess a bank's overall condition. Each component is rated 1 (strong) to 5 (critically deficient):\n\nC — Capital adequacy\nA — Asset quality\nM — Management capability\nE — Earnings quality\nL — Liquidity position\nS — Sensitivity to market risk\n\nIRM Command's risk data maps to several CAMELS dimensions: the risk register informs Asset quality and Sensitivity, the control environment reflects Management capability, and loss events tie to Earnings and Capital. A composite rating of 1-2 is considered satisfactory; 3 indicates concerns; 4-5 is unsatisfactory."
      },
      // ===== OPERATIONAL RESILIENCE =====
      {
        patterns: [/\b(operational resilience|business continuity|disaster recovery|bcp|drp|rto|rpo)\b/],
        keywords: ['resilience', 'continuity', 'disaster recovery', 'bcp', 'drp'],
        response: "Operational resilience is the ability of an institution to deliver critical operations through disruption. It goes beyond traditional BCP/DR by focusing on the end-to-end delivery of important business services.\n\nKey concepts: Recovery Time Objective (RTO) — maximum acceptable downtime. Recovery Point Objective (RPO) — maximum acceptable data loss. Impact Tolerance — the maximum disruption a service can absorb before causing intolerable harm.\n\nIRM Command tracks resilience through vendor BCP assessments, control testing for availability controls, and monitoring alerts for service disruptions. The TPRM module specifically evaluates vendor resilience posture."
      },
      // ===== AI & PLATFORM =====
      // Architecture / tech stack
      {
        patterns: [/\b(architecture|tech stack|built with|technology|how is it built|what tech)\b/],
        keywords: ['architecture', 'tech stack', 'technology'],
        response: "IRM Command is built on a modern enterprise stack:\n\nFrontend — React 18, TypeScript, Vite 5, Tailwind CSS.\nState Management — Zustand for client state.\nData Layer — Supabase (PostgreSQL) with Row Level Security and tenant isolation.\nAI Engine — Multi-LLM routing (Claude, GPT-4, Groq) with MCP tool registry and RAG knowledge base, governed by an AI governance framework with prompt injection detection and data classification.\nDeployment — Vercel Edge Network with global CDN.\nSecurity — RBAC engine, JWT verification with JWKS, audit logging, enterprise SSO support, Zod input validation.\n\nSee the Architecture page for full TOGAF ADM phases, diagrams, and the integration catalog."
      },
      // AI governance
      {
        patterns: [/\b(ai governance|ai risk|model risk|ai policy|responsible ai|llm risk|ai safety)\b/],
        keywords: ['ai governance', 'model risk', 'responsible ai', 'ai safety'],
        response: "AI Governance ensures that AI/ML systems operate within defined risk parameters. IRM Command's AI governance framework includes:\n\nPre-flight validation — every AI request is checked for prompt injection, PII leakage, and data classification before processing.\nProvider routing — queries are routed to appropriate LLM providers based on complexity and data sensitivity.\nOutput validation — AI responses are reviewed for hallucination indicators and compliance with institutional policies.\nAudit trail — all AI interactions are logged for regulatory examination.\n\nThis aligns with the OCC's guidance on model risk management (SR 11-7) and emerging AI-specific regulatory expectations from the Federal Reserve and FDIC."
      },
      // Create a risk
      {
        patterns: [/\b(create.+risk|add.+risk|new risk|register.+risk|log.+risk|how to add)\b/],
        keywords: ['create risk', 'add risk', 'new risk', 'register'],
        response: "To create a new risk, head to the Dashboard or Risk Register and look for the \"New Risk\" action. You'll fill in:\n\nTitle and description — what the risk is.\nCategory — Credit, Market, Operational, Compliance, Cyber, Third-Party, Strategic, or Liquidity.\nBusiness unit — which part of the bank it affects.\nLikelihood and Impact — scored 1-5, the platform auto-calculates your inherent risk score.\nOwner and linked controls — who's accountable and what mitigates it.\n\nOnce saved, it shows up across the dashboard metrics, KRI linkages, and compliance mappings automatically."
      },
      // RCSA
      {
        patterns: [/\b(rcsa|risk.+control.+self.+assessment|self assessment)\b/],
        keywords: ['rcsa', 'self assessment'],
        response: "RCSA (Risk and Control Self-Assessment) is a process where business units identify and evaluate their own risks and the effectiveness of controls mitigating those risks. It's a first-line-of-defense activity that feeds into the enterprise risk register.\n\nIn a typical RCSA cycle: business units document processes, identify risk events, assess inherent risk, map existing controls, rate control effectiveness, and calculate residual risk. IRM Command's AI Workbench can model RCSA scenarios by letting you select business line, risk type, and control parameters to generate composite risk scores."
      },
      // Stress testing / scenario analysis
      {
        patterns: [/\b(stress test|scenario analysis|what.?if|monte carlo|sensitivity analysis|capital stress)\b/],
        keywords: ['stress test', 'scenario', 'what if', 'sensitivity'],
        response: "Scenario analysis and stress testing evaluate how adverse conditions affect your risk profile. The AI Workbench in IRM Command lets you model risk scenarios by configuring:\n\nBusiness line, product, geography, and risk type.\nInherent risk level and control strength.\nHistorical loss data.\n\nThe engine calculates a composite risk score using a weighted model: InherentRisk (30%) + ControlGap (25%) + LossHistory (15%) + BusinessComplexity (10%) + RegulatoryFactor (10%) + AdditionalFactors (10%). Pre-built scenarios are available for common risk events. Results include a residual risk rating and AI-generated narrative."
      },
      // Concentration risk
      {
        patterns: [/\b(concentration risk|single.+exposure|diversif|portfolio.+concentration)\b/],
        keywords: ['concentration', 'single exposure', 'diversification'],
        response: "Concentration risk arises when an institution has excessive exposure to a single counterparty, sector, geography, or risk factor. Regulators flag concentration when:\n\nA single vendor or counterparty represents a disproportionate share of critical operations.\nRisk is concentrated in one category or business line.\nGeographic exposure is undiversified.\n\nIRM Command's Dashboard heat map and risk distribution charts help identify concentration. The TPRM module flags vendor concentration (multiple critical services from one provider), and the risk register highlights category concentrations."
      },
      // Incident response
      {
        patterns: [/\b(incident response|incident management|security incident|breach response|cyber incident|containment)\b/],
        keywords: ['incident response', 'incident management', 'security incident', 'breach'],
        response: "Incident response is the structured process for detecting, containing, eradicating, and recovering from security events. IRM Command documents incident response procedures aligned with NIST SP 800-61:\n\nSeverity classification — Critical (P1, 15-min response SLA), High (P2, 1-hour), Medium (P3, 4-hour), Low (P4, 24-hour).\nContainment steps — network isolation, credential rotation, evidence preservation.\nEscalation paths — SOC to CISO to Risk Committee to Board for critical incidents.\nRegulatory notification — OCC, FDIC, and law enforcement timelines.\n\nThe monitoring alerts in the Dashboard track active incidents and their resolution status."
      },
      // Data classification
      {
        patterns: [/\b(data classif|data sensitiv|pii|personal data|confidential data|data protect|data privacy)\b/],
        keywords: ['data classification', 'pii', 'personal data', 'confidential', 'data protection'],
        response: "Data classification assigns sensitivity levels to information assets to ensure appropriate handling and protection. Standard classification tiers:\n\nPublic — no restrictions on disclosure.\nInternal — for authorized personnel only, no external sharing.\nConfidential — restricted access, encryption required at rest and in transit.\nRestricted/PII — personally identifiable information subject to regulatory requirements (GDPR, CCPA, GLBA).\n\nIRM Command's AI governance layer automatically classifies data in AI requests and strips PII before processing. The security controls framework includes data protection controls mapped to NIST and ISO 27001."
      },
      // Audit trail
      {
        patterns: [/\b(audit trail|audit log|logging|who did what|change log|tamper)\b/],
        keywords: ['audit trail', 'audit log', 'logging'],
        response: "The audit trail provides a tamper-evident record of all significant actions in the platform. Every risk assessment, control update, vendor review, and AI interaction is logged with:\n\nTimestamp, user identity, action performed, before/after state, and IP address (anonymized for privacy).\n\nAudit logs are append-only — they cannot be modified or deleted. This satisfies OCC examination requirements for demonstrating management oversight and regulatory compliance. The logs support the SIEM integration for real-time security monitoring."
      },
      // RBAC / permissions
      {
        patterns: [/\b(rbac|role.?based|permission|access control|who can|user role|authorization)\b/],
        keywords: ['rbac', 'role based', 'permission', 'access control'],
        response: "IRM Command uses Role-Based Access Control (RBAC) to enforce least-privilege access. Pre-defined roles include:\n\nCRO (Chief Risk Officer) — full read/write access across all modules, workbench execution, AI copilot interaction.\nRisk Manager — risk register and control management.\nCompliance Officer — compliance module and regulatory change management.\nAuditor — read-only access across all modules for examination purposes.\nViewer — dashboard and reporting access only.\n\nEach role has specific permissions (e.g., workbench:execute, risks:write, compliance:manage). Permissions are enforced at the UI component level and validated server-side."
      },
    ];

    // ---- Pattern matching against knowledge base ----
    for (const entry of knowledgeBase) {
      for (const pattern of entry.patterns) {
        if (pattern.test(q)) {
          return entry.response;
        }
      }
    }

    // ---- Fuzzy keyword fallback: score each entry by keyword overlap ----
    const queryWords = q.split(/\s+/).filter(w => w.length > 2);
    let bestMatch: { score: number; response: string } = { score: 0, response: '' };

    for (const entry of knowledgeBase) {
      let score = 0;
      for (const keyword of entry.keywords) {
        const kwWords = keyword.split(/\s+/);
        for (const kw of kwWords) {
          if (q.includes(kw) && kw.length > 2) {
            score += kw.length; // longer keyword matches are stronger signals
          }
        }
      }
      // Also check if any query word appears in the response (topical relevance)
      for (const word of queryWords) {
        if (entry.keywords.some(k => k.includes(word))) {
          score += 2;
        }
      }
      if (score > bestMatch.score) {
        bestMatch = { score, response: entry.response };
      }
    }

    // If we found a reasonable fuzzy match (threshold: at least one meaningful keyword)
    if (bestMatch.score >= 3) {
      return bestMatch.response;
    }

    // ---- Intelligent fallback: acknowledge the question and offer relevant paths ----
    const dal = getDataAccess();
    const risks = dal.getRisks();
    const issues = dal.getIssues();
    const kris = dal.getKRIs();
    const breached = kris.filter(k => k.breachLevel === 'Breach' || k.breachLevel === 'Critical').length;
    const overdue = issues.filter(i => {
      const due = i.dueDate instanceof Date ? i.dueDate : new Date(i.dueDate);
      return due < new Date() && i.status !== 'Closed';
    }).length;

    return `I don't have a specific answer for "${query.trim()}" in my knowledge base. I can answer questions about GRC concepts (governance, risk, compliance), risk management terminology, regulatory frameworks, and your institution's live risk data.\n\nHere's what's happening right now in your risk environment:\n• ${risks.length} risks tracked across 8 categories\n• ${breached} KRIs in breach status requiring attention\n• ${overdue} overdue management findings\n\nTry asking: "What is GRC?", "Show me the top risks", "Which KRIs are breached?", "Explain three lines of defense", or "What is a CAMELS rating?"`;
  }
}
