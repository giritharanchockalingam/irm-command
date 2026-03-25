/**
 * IRM-Specific MCP Tool Server
 * 18+ GRC tools for risk, compliance, vendor, audit, and SOC 2 domains
 * All tools operate client-side on in-memory seed data
 */

import {
  BaseMCPServer,
  MCPTool,
  MCPToolCall,
  MCPToolResult,
  createJsonResult,
  createTextResult,
  createErrorResult,
} from './protocol';

import { getDataAccess } from '../../data/DataAccessLayer';

/**
 * SOC 2 Controls — inline definition since seedData doesn't export these
 */
const soc2Controls = [
  { criterion: 'CC1.1', category: 'Security', description: 'COSO Principle 1 – Integrity & Ethical Values: Code of conduct, conflict-of-interest policy, tone-at-the-top governance artifacts', implemented: true, testingDate: '2025-01-15', evidenceLinks: ['DOC-GOV-001', 'DOC-ETH-002'] },
  { criterion: 'CC1.2', category: 'Security', description: 'COSO Principle 2 – Board Independence: Board charter, independent director roster, oversight meeting minutes', implemented: true, testingDate: '2025-01-15', evidenceLinks: ['DOC-BOD-001'] },
  { criterion: 'CC2.1', category: 'Security', description: 'Information & Communication: Security awareness training completion records, policy distribution acknowledgments', implemented: true, testingDate: '2025-02-01', evidenceLinks: ['DOC-TRN-001', 'DOC-POL-003'] },
  { criterion: 'CC3.1', category: 'Security', description: 'Risk Assessment: Annual risk assessment report, risk register with treatment plans', implemented: true, testingDate: '2025-02-15', evidenceLinks: ['DOC-RA-001', 'REG-RISK-001'] },
  { criterion: 'CC4.1', category: 'Security', description: 'Monitoring Activities: Continuous monitoring dashboards, KRI breach alerts, quarterly control effectiveness reviews', implemented: true, testingDate: '2025-03-01', evidenceLinks: ['DASH-MON-001', 'RPT-QTR-001'] },
  { criterion: 'CC5.1', category: 'Security', description: 'Control Activities – Logical Access: SSO/MFA enforcement, RBAC policy with 6 roles and 29 permissions, quarterly access reviews', implemented: true, testingDate: '2025-03-01', evidenceLinks: ['CFG-SSO-001', 'DOC-RBAC-001'] },
  { criterion: 'CC6.1', category: 'Security', description: 'Logical & Physical Access Controls: Network segmentation, WAF rules, encryption at rest (AES-256) and in transit (TLS 1.3)', implemented: true, testingDate: '2025-03-15', evidenceLinks: ['CFG-NET-001', 'CFG-ENC-001'] },
  { criterion: 'CC7.1', category: 'Security', description: 'System Operations: Incident response plan, runbook library, SIEM integration with <15 min alert SLA', implemented: true, testingDate: '2025-03-15', evidenceLinks: ['DOC-IRP-001', 'CFG-SIEM-001'] },
  { criterion: 'A1.1', category: 'Availability', description: 'Availability Commitment: 99.9% uptime SLA, multi-AZ deployment, automated failover, RTO < 4 hours', implemented: true, testingDate: '2025-02-01', evidenceLinks: ['SLA-001', 'CFG-HA-001'] },
  { criterion: 'A1.2', category: 'Availability', description: 'Disaster Recovery: DR plan, quarterly DR drills, cross-region backup replication, RPO < 1 hour', implemented: true, testingDate: '2025-02-15', evidenceLinks: ['DOC-DR-001', 'RPT-DRD-001'] },
  { criterion: 'A1.3', category: 'Availability', description: 'Backup & Recovery: Automated daily backups, quarterly restore tests, backup encryption verification', implemented: false, testingDate: undefined, evidenceLinks: [] },
  { criterion: 'A1.4', category: 'Availability', description: 'Environmental Safeguards: Cloud-provider physical controls attestation, network redundancy verification', implemented: true, testingDate: '2025-01-20', evidenceLinks: ['ATT-AWS-001'] },
  { criterion: 'C1.1', category: 'Confidentiality', description: 'Confidentiality Commitment: Data classification policy (4 tiers), DLP scanning, field-level encryption for PII/PHI', implemented: true, testingDate: '2025-03-01', evidenceLinks: ['DOC-DCP-001', 'CFG-DLP-001'] },
  { criterion: 'C1.2', category: 'Confidentiality', description: 'Data Retention & Disposal: 7-year retention for regulatory data, secure shredding for decommissioned media, automated purge workflows', implemented: false, testingDate: undefined, evidenceLinks: [] },
  { criterion: 'C1.3', category: 'Confidentiality', description: 'Confidential Data Protection: Tokenization for payment data, masking in non-production, VPN requirement for remote admin', implemented: true, testingDate: '2025-03-15', evidenceLinks: ['CFG-TOK-001', 'CFG-MASK-001'] },
];

import { getAuditLogger } from '../../security/AuditLogger';

/**
 * Risk domain result types
 */
interface RiskSummary {
  id: string;
  title: string;
  category: string;
  inherentScore: number;
  residualScore: number;
  status: string;
  owner: string;
}

interface RiskDetail extends RiskSummary {
  description: string;
  likelihood: number;
  impact: number;
  linkedControls: string[];
  linkedKRIs: string[];
  createdDate: string;
  lastAssessmentDate: string;
  riskAppetite: number;
}

interface RiskMetrics {
  totalRisks: number;
  byCategory: Record<string, number>;
  avgInherentScore: number;
  avgResidualScore: number;
  criticalRiskCount: number;
  risksAboveAppetite: number;
}

interface KRIInfo {
  name: string;
  currentValue: number;
  threshold: number;
  breachLevel: string;
  trend: 'up' | 'down' | 'stable';
  unit: string;
}

interface LossEvent {
  title: string;
  category: string;
  amount: number;
  date: string;
  status: string;
  description?: string;
}

/**
 * Compliance domain result types
 */
interface ControlSummary {
  id: string;
  name: string;
  framework: string;
  effectiveness: string;
  status: string;
  lastTestDate: string;
}

interface ControlDetail extends ControlSummary {
  description: string;
  linkedRisks: string[];
  evidence: string[];
  testingApproach: string;
  testingFrequency: string;
}

interface ComplianceGap {
  controlId: string;
  controlName: string;
  framework: string;
  effectiveness: string;
  remediation: string;
}

interface RegulatoryChange {
  title: string;
  source: string;
  status: string;
  impactLevel: string;
  effectiveDate: string;
  description?: string;
}

interface FrameworkCoverage {
  framework: string;
  totalControls: number;
  implementedControls: number;
  coveragePercentage: number;
}

/**
 * Vendor domain result types
 */
interface VendorSummary {
  id: string;
  name: string;
  tier: string;
  criticality: string;
  residualRisk: number;
  slaStatus: string;
}

interface VendorDetail extends VendorSummary {
  description: string;
  linkedControls: string[];
  monitoringAlerts: string[];
  lastAssessmentDate: string;
  contractEndDate: string;
}

interface VendorRiskSummary {
  totalVendors: number;
  byCriticality: Record<string, number>;
  slaStatusBreakdown: Record<string, number>;
  concentrationRisk: number;
}

/**
 * Audit domain result types
 */
interface Issue {
  id: string;
  title: string;
  severity: string;
  status: string;
  owner: string;
  dueDate: string;
  mraType: string;
  description?: string;
}

interface OverdueFinding extends Issue {
  daysOverdue: number;
}

interface AuditEvent {
  timestamp: string;
  action: string;
  actor: string;
  resource: string;
  details: string;
}

/**
 * SOC 2 result types
 */
interface SOC2Control {
  criterion: string;
  category: string;
  description: string;
  implemented: boolean;
  testingDate?: string;
  evidenceLinks: string[];
}

/**
 * IRMToolServer - Main MCP tool server for GRC operations
 */
export class IRMToolServer extends BaseMCPServer {
  readonly serverName = 'irm-tools';

  constructor() {
    super();
    this.initializeTools();
  }

  private initializeTools(): void {
    // Risk Domain Tools
    this.registerTool(
      this.createListRisksTool(),
      this.handleListRisks.bind(this)
    );

    this.registerTool(
      this.createGetRiskDetailTool(),
      this.handleGetRiskDetail.bind(this)
    );

    this.registerTool(
      this.createGetRiskMetricsTool(),
      this.handleGetRiskMetrics.bind(this)
    );

    this.registerTool(
      this.createSearchKRIsTool(),
      this.handleSearchKRIs.bind(this)
    );

    this.registerTool(
      this.createGetLossEventsTool(),
      this.handleGetLossEvents.bind(this)
    );

    // Compliance Domain Tools
    this.registerTool(
      this.createListControlsTool(),
      this.handleListControls.bind(this)
    );

    this.registerTool(
      this.createGetControlDetailTool(),
      this.handleGetControlDetail.bind(this)
    );

    this.registerTool(
      this.createGetComplianceGapsTool(),
      this.handleGetComplianceGaps.bind(this)
    );

    this.registerTool(
      this.createListRegulatoryChangesTool(),
      this.handleListRegulatoryChanges.bind(this)
    );

    this.registerTool(
      this.createGetFrameworkCoverageTool(),
      this.handleGetFrameworkCoverage.bind(this)
    );

    // Vendor Domain Tools
    this.registerTool(
      this.createListVendorsTool(),
      this.handleListVendors.bind(this)
    );

    this.registerTool(
      this.createGetVendorDetailTool(),
      this.handleGetVendorDetail.bind(this)
    );

    this.registerTool(
      this.createGetVendorRiskSummaryTool(),
      this.handleGetVendorRiskSummary.bind(this)
    );

    // Audit Domain Tools
    this.registerTool(
      this.createListIssuesTool(),
      this.handleListIssues.bind(this)
    );

    this.registerTool(
      this.createGetOverduesFindingsTool(),
      this.handleGetOverdueFindings.bind(this)
    );

    this.registerTool(
      this.createSearchAuditLogTool(),
      this.handleSearchAuditLog.bind(this)
    );

    // SOC 2 Domain Tools
    this.registerTool(
      this.createGetSOC2ControlStatusTool(),
      this.handleGetSOC2ControlStatus.bind(this)
    );

    this.registerTool(
      this.createGetSOC2ReadinessTool(),
      this.handleGetSOC2Readiness.bind(this)
    );
  }

  // ==================== RISK DOMAIN TOOLS ====================

  private createListRisksTool(): MCPTool {
    return {
      name: 'list_risks',
      description: 'List all risks with optional filters by category, status, and minimum score',
      inputSchema: {
        type: 'object',
        properties: {
          category: { type: 'string', description: 'Filter by risk category (e.g., operational, compliance, strategic)' },
          status: { type: 'string', description: 'Filter by status (e.g., active, mitigated, closed)' },
          minScore: { type: 'number', description: 'Minimum inherent score (0-25)' },
        },
      },
      domain: 'risk',
    };
  }

  private handleListRisks(args: Record<string, unknown>): MCPToolResult {
    const { category, status, minScore } = args;
    const risks = getDataAccess().getRisks();
    let filtered = [...risks];

    if (category && typeof category === 'string') {
      filtered = filtered.filter((r) => r.category === category);
    }
    if (status && typeof status === 'string') {
      filtered = filtered.filter((r) => r.status === status);
    }
    if (typeof minScore === 'number') {
      filtered = filtered.filter((r) => r.inherentScore >= minScore);
    }

    const results: RiskSummary[] = filtered.map((r) => ({
      id: r.id,
      title: r.title,
      category: r.category,
      inherentScore: r.inherentScore,
      residualScore: r.residualScore,
      status: r.status,
      owner: r.owner,
    }));

    return createJsonResult(results);
  }

  private createGetRiskDetailTool(): MCPTool {
    return {
      name: 'get_risk_detail',
      description: 'Get full details for a specific risk including linked controls and KRIs',
      inputSchema: {
        type: 'object',
        properties: {
          riskId: { type: 'string', description: 'The risk ID' },
        },
        required: ['riskId'],
      },
      domain: 'risk',
    };
  }

  private handleGetRiskDetail(args: Record<string, unknown>): MCPToolResult {
    const { riskId } = args;
    const risks = getDataAccess().getRisks();
    const risk = risks.find((r) => r.id === riskId);

    if (!risk) {
      return createErrorResult(`Risk not found: ${riskId}`);
    }

    const detail: RiskDetail = {
      id: risk.id,
      title: risk.title,
      category: risk.category,
      inherentScore: risk.inherentScore,
      residualScore: risk.residualScore,
      status: risk.status,
      owner: risk.owner,
      description: risk.description,
      likelihood: risk.likelihood,
      impact: risk.impact,
      linkedControls: risk.controlIds || [],
      linkedKRIs: risk.kpiIds || [],
      createdDate: risk.createdAt instanceof Date ? risk.createdAt.toISOString() : String(risk.createdAt),
      lastAssessmentDate: risk.lastAssessmentDate instanceof Date ? risk.lastAssessmentDate.toISOString() : String(risk.lastAssessmentDate),
      riskAppetite: Math.max(1, risk.residualScore - 2), // Derived: appetite set below residual
    };

    return createJsonResult(detail);
  }

  private createGetRiskMetricsTool(): MCPTool {
    return {
      name: 'get_risk_metrics',
      description: 'Get aggregate risk metrics including category breakdown, average scores, and critical risk count',
      inputSchema: {
        type: 'object',
        properties: {},
      },
      domain: 'risk',
    };
  }

  private handleGetRiskMetrics(): MCPToolResult {
    const risks = getDataAccess().getRisks();
    const byCategory: Record<string, number> = {};
    let totalInherent = 0;
    let totalResidual = 0;
    let criticalCount = 0;
    let aboveAppetiteCount = 0;

    risks.forEach((r) => {
      byCategory[r.category] = (byCategory[r.category] || 0) + 1;
      totalInherent += r.inherentScore;
      totalResidual += r.residualScore;
      if (r.inherentScore > 16) criticalCount++;
      if (r.residualScore > 10) aboveAppetiteCount++; // Above appetite threshold of 10
    });

    const metrics: RiskMetrics = {
      totalRisks: risks.length,
      byCategory,
      avgInherentScore: risks.length > 0 ? totalInherent / risks.length : 0,
      avgResidualScore: risks.length > 0 ? totalResidual / risks.length : 0,
      criticalRiskCount: criticalCount,
      risksAboveAppetite: aboveAppetiteCount,
    };

    return createJsonResult(metrics);
  }

  private createSearchKRIsTool(): MCPTool {
    return {
      name: 'search_kris',
      description: 'Search Key Risk Indicators by breach level or category',
      inputSchema: {
        type: 'object',
        properties: {
          breachLevel: { type: 'string', description: 'Filter by breach level (green, yellow, red)' },
          category: { type: 'string', description: 'Filter by KRI category' },
        },
      },
      domain: 'risk',
    };
  }

  private handleSearchKRIs(args: Record<string, unknown>): MCPToolResult {
    const { breachLevel, category } = args;
    const kris = getDataAccess().getKRIs();
    let filtered = [...kris];

    if (breachLevel && typeof breachLevel === 'string') {
      filtered = filtered.filter((k) => k.breachLevel === breachLevel);
    }
    if (category && typeof category === 'string') {
      filtered = filtered.filter((k) => k.riskCategory === category);
    }

    const results: KRIInfo[] = filtered.map((k) => ({
      name: k.name,
      currentValue: k.currentValue,
      threshold: k.threshold,
      breachLevel: k.breachLevel,
      trend: k.trend as 'up' | 'down' | 'stable',
      unit: k.unit,
    }));

    return createJsonResult(results);
  }

  private createGetLossEventsTool(): MCPTool {
    return {
      name: 'get_loss_events',
      description: 'List loss events with optional category filter',
      inputSchema: {
        type: 'object',
        properties: {
          category: { type: 'string', description: 'Filter by loss event category (e.g., fraud, operational, compliance)' },
        },
      },
      domain: 'risk',
    };
  }

  private handleGetLossEvents(args: Record<string, unknown>): MCPToolResult {
    const { category } = args;
    const lossEvents = getDataAccess().getLossEvents();
    let filtered = [...lossEvents];

    if (category && typeof category === 'string') {
      filtered = filtered.filter((e) => e.category === category);
    }

    const results = filtered.map((e) => ({
      title: e.title,
      category: e.category,
      amount: e.amount,
      date: e.date instanceof Date ? e.date.toISOString() : String(e.date),
      status: e.status,
      description: e.description,
    }));

    return createJsonResult(results);
  }

  // ==================== COMPLIANCE DOMAIN TOOLS ====================

  private createListControlsTool(): MCPTool {
    return {
      name: 'list_controls',
      description: 'List controls with optional filters by framework, effectiveness, and status',
      inputSchema: {
        type: 'object',
        properties: {
          framework: { type: 'string', description: 'Filter by framework (e.g., SOX, GDPR, NIST, ISO27001, Basel III)' },
          effectiveness: { type: 'string', description: 'Filter by effectiveness (Effective, Partially Effective, Ineffective)' },
          status: { type: 'string', description: 'Filter by status (e.g., implemented, in-progress, not-started)' },
        },
      },
      domain: 'compliance',
    };
  }

  private handleListControls(args: Record<string, unknown>): MCPToolResult {
    const { framework, effectiveness, status } = args;
    const controls = getDataAccess().getControls();
    let filtered = [...controls];

    if (framework && typeof framework === 'string') {
      filtered = filtered.filter((c) => c.framework === framework);
    }
    if (effectiveness && typeof effectiveness === 'string') {
      filtered = filtered.filter((c) => c.effectiveness === effectiveness);
    }
    if (status && typeof status === 'string') {
      filtered = filtered.filter((c) => c.status === status);
    }

    const results: ControlSummary[] = filtered.map((c) => ({
      id: c.id,
      name: c.title,
      framework: c.framework,
      effectiveness: c.effectiveness,
      status: c.status,
      lastTestDate: c.testDate instanceof Date ? c.testDate.toISOString() : String(c.testDate),
    }));

    return createJsonResult(results);
  }

  private createGetControlDetailTool(): MCPTool {
    return {
      name: 'get_control_detail',
      description: 'Get full control details by ID including linked risks and evidence',
      inputSchema: {
        type: 'object',
        properties: {
          controlId: { type: 'string', description: 'The control ID' },
        },
        required: ['controlId'],
      },
      domain: 'compliance',
    };
  }

  private handleGetControlDetail(args: Record<string, unknown>): MCPToolResult {
    const { controlId } = args;
    const controls = getDataAccess().getControls();
    const control = controls.find((c) => c.id === controlId);

    if (!control) {
      return createErrorResult(`Control not found: ${controlId}`);
    }

    const detail: ControlDetail = {
      id: control.id,
      name: control.title,
      framework: control.framework,
      effectiveness: control.effectiveness,
      status: control.status,
      lastTestDate: control.testDate instanceof Date ? control.testDate.toISOString() : String(control.testDate),
      description: control.description,
      linkedRisks: control.riskIds || [],
      evidence: control.evidence ? [control.evidence] : [],
      testingApproach: control.controlType || 'Manual',
      testingFrequency: control.testFrequency || 'Quarterly',
    };

    return createJsonResult(detail);
  }

  private createGetComplianceGapsTool(): MCPTool {
    return {
      name: 'get_compliance_gaps',
      description: 'Find controls that are Ineffective or Partially Effective and need remediation',
      inputSchema: {
        type: 'object',
        properties: {},
      },
      domain: 'compliance',
    };
  }

  private handleGetComplianceGaps(): MCPToolResult {
    const controls = getDataAccess().getControls();
    const gaps: ComplianceGap[] = controls
      .filter((c) => c.effectiveness === 'Ineffective' || c.effectiveness === 'Partially Effective')
      .map((c) => ({
        controlId: c.id,
        controlName: c.title,
        framework: c.framework,
        effectiveness: c.effectiveness,
        remediation: 'Remediation plan required — review with control owner',
      }));

    return createJsonResult(gaps);
  }

  private createListRegulatoryChangesTool(): MCPTool {
    return {
      name: 'list_regulatory_changes',
      description: 'List regulatory changes by source or status',
      inputSchema: {
        type: 'object',
        properties: {
          source: { type: 'string', description: 'Filter by source (e.g., SEC, FCA, GDPR, Basel)' },
          status: { type: 'string', description: 'Filter by status (proposed, pending, effective, archived)' },
        },
      },
      domain: 'compliance',
    };
  }

  private handleListRegulatoryChanges(args: Record<string, unknown>): MCPToolResult {
    const { source, status } = args;
    const regulatoryChanges = getDataAccess().getRegulatoryChanges();
    let filtered = [...regulatoryChanges];

    if (source && typeof source === 'string') {
      filtered = filtered.filter((r) => r.source === source);
    }
    if (status && typeof status === 'string') {
      filtered = filtered.filter((r) => r.status === status);
    }

    const results = filtered.map((r) => ({
      title: r.title,
      source: r.source,
      status: r.status,
      impactLevel: r.impactLevel,
      effectiveDate: r.effectiveDate instanceof Date ? r.effectiveDate.toISOString() : String(r.effectiveDate),
      description: r.summary,
    }));

    return createJsonResult(results);
  }

  private createGetFrameworkCoverageTool(): MCPTool {
    return {
      name: 'get_framework_coverage',
      description: 'Calculate control coverage by framework (Basel III, SOX, GDPR, NIST, ISO27001)',
      inputSchema: {
        type: 'object',
        properties: {},
      },
      domain: 'compliance',
    };
  }

  private handleGetFrameworkCoverage(): MCPToolResult {
    const controls = getDataAccess().getControls();
    const frameworks = ['Basel III', 'SOX', 'GDPR', 'NIST', 'ISO27001'];
    const coverage: FrameworkCoverage[] = frameworks.map((fw) => {
      const fwControls = controls.filter((c) => c.framework === fw);
      const implemented = fwControls.filter((c) => c.status === 'Implemented').length;
      return {
        framework: fw,
        totalControls: fwControls.length,
        implementedControls: implemented,
        coveragePercentage: fwControls.length > 0 ? (implemented / fwControls.length) * 100 : 0,
      };
    });

    return createJsonResult(coverage);
  }

  // ==================== VENDOR DOMAIN TOOLS ====================

  private createListVendorsTool(): MCPTool {
    return {
      name: 'list_vendors',
      description: 'List vendors with optional tier and criticality filters',
      inputSchema: {
        type: 'object',
        properties: {
          tier: { type: 'string', description: 'Filter by tier (Tier 1, Tier 2, Tier 3)' },
          criticality: { type: 'string', description: 'Filter by criticality (critical, high, medium, low)' },
        },
      },
      domain: 'vendor',
    };
  }

  private handleListVendors(args: Record<string, unknown>): MCPToolResult {
    const { tier, criticality } = args;
    const vendors = getDataAccess().getVendors();
    let filtered = [...vendors];

    if (tier && typeof tier === 'string') {
      filtered = filtered.filter((v) => v.tier === tier);
    }
    if (criticality && typeof criticality === 'string') {
      filtered = filtered.filter((v) => v.criticality === criticality);
    }

    const results: VendorSummary[] = filtered.map((v) => ({
      id: v.id,
      name: v.name,
      tier: v.tier,
      criticality: v.criticality,
      residualRisk: v.residualRisk,
      slaStatus: v.slaStatus,
    }));

    return createJsonResult(results);
  }

  private createGetVendorDetailTool(): MCPTool {
    return {
      name: 'get_vendor_detail',
      description: 'Get vendor details including linked controls and monitoring alerts',
      inputSchema: {
        type: 'object',
        properties: {
          vendorId: { type: 'string', description: 'The vendor ID' },
        },
        required: ['vendorId'],
      },
      domain: 'vendor',
    };
  }

  private handleGetVendorDetail(args: Record<string, unknown>): MCPToolResult {
    const { vendorId } = args;
    const vendors = getDataAccess().getVendors();
    const monitoringAlerts = getDataAccess().getMonitoringAlerts();
    const vendor = vendors.find((v) => v.id === vendorId);

    if (!vendor) {
      return createErrorResult(`Vendor not found: ${vendorId}`);
    }

    const alerts = monitoringAlerts.filter((a) => a.vendorId === vendorId).map((a) => a.id);

    const detail: VendorDetail = {
      id: vendor.id,
      name: vendor.name,
      tier: vendor.tier,
      criticality: vendor.criticality,
      residualRisk: vendor.residualRisk,
      slaStatus: vendor.slaStatus,
      description: vendor.category || 'Third-party vendor',
      linkedControls: vendor.controlIds || [],
      monitoringAlerts: alerts,
      lastAssessmentDate: vendor.lastAssessmentDate instanceof Date ? vendor.lastAssessmentDate.toISOString() : String(vendor.lastAssessmentDate),
      contractEndDate: vendor.contractExpiry instanceof Date ? vendor.contractExpiry.toISOString() : String(vendor.contractExpiry),
    };

    return createJsonResult(detail);
  }

  private createGetVendorRiskSummaryTool(): MCPTool {
    return {
      name: 'get_vendor_risk_summary',
      description: 'Get aggregate vendor risk analysis including criticality breakdown and concentration risk',
      inputSchema: {
        type: 'object',
        properties: {},
      },
      domain: 'vendor',
    };
  }

  private handleGetVendorRiskSummary(): MCPToolResult {
    const vendors = getDataAccess().getVendors();
    const byCriticality: Record<string, number> = {};
    const slaStatusBreakdown: Record<string, number> = {};
    let concentrationRisk = 0;

    vendors.forEach((v) => {
      byCriticality[v.criticality] = (byCriticality[v.criticality] || 0) + 1;
      slaStatusBreakdown[v.slaStatus] = (slaStatusBreakdown[v.slaStatus] || 0) + 1;
      if (v.criticality === 'critical') {
        concentrationRisk += v.residualRisk;
      }
    });

    const summary: VendorRiskSummary = {
      totalVendors: vendors.length,
      byCriticality,
      slaStatusBreakdown,
      concentrationRisk,
    };

    return createJsonResult(summary);
  }

  // ==================== AUDIT DOMAIN TOOLS ====================

  private createListIssuesTool(): MCPTool {
    return {
      name: 'list_issues',
      description: 'List issues and findings with optional filters by severity, status, and source',
      inputSchema: {
        type: 'object',
        properties: {
          severity: { type: 'string', description: 'Filter by severity (critical, high, medium, low)' },
          status: { type: 'string', description: 'Filter by status (open, in-progress, resolved, closed)' },
          source: { type: 'string', description: 'Filter by source (internal-audit, external-audit, management-review)' },
        },
      },
      domain: 'audit',
    };
  }

  private handleListIssues(args: Record<string, unknown>): MCPToolResult {
    const { severity, status, source } = args;
    const issues = getDataAccess().getIssues();
    let filtered = [...issues];

    if (severity && typeof severity === 'string') {
      filtered = filtered.filter((i) => i.severity === severity);
    }
    if (status && typeof status === 'string') {
      filtered = filtered.filter((i) => i.status === status);
    }
    if (source && typeof source === 'string') {
      filtered = filtered.filter((i) => i.source === source);
    }

    const results: Issue[] = filtered.map((i) => ({
      id: i.id,
      title: i.title,
      severity: i.severity,
      status: i.status,
      owner: i.owner,
      dueDate: i.dueDate instanceof Date ? i.dueDate.toISOString() : String(i.dueDate),
      mraType: i.mraType,
      description: i.remediationPlan || '',
    }));

    return createJsonResult(results);
  }

  private createGetOverduesFindingsTool(): MCPTool {
    return {
      name: 'get_overdue_findings',
      description: 'Find all issues past their due date with days overdue calculation',
      inputSchema: {
        type: 'object',
        properties: {},
      },
      domain: 'audit',
    };
  }

  private handleGetOverdueFindings(): MCPToolResult {
    const issues = getDataAccess().getIssues();
    const now = new Date();
    const overdue: OverdueFinding[] = issues
      .filter((i) => {
        const due = i.dueDate instanceof Date ? i.dueDate : new Date(i.dueDate);
        return due < now && i.status !== 'Closed';
      })
      .map((i) => {
        const due = i.dueDate instanceof Date ? i.dueDate : new Date(i.dueDate);
        const daysOverdue = Math.floor(
          (now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)
        );
        return {
          id: i.id,
          title: i.title,
          severity: i.severity,
          status: i.status,
          owner: i.owner,
          dueDate: due.toISOString(),
          mraType: i.mraType,
          description: i.remediationPlan || '',
          daysOverdue,
        };
      });

    return createJsonResult(overdue);
  }

  private createSearchAuditLogTool(): MCPTool {
    return {
      name: 'search_audit_log',
      description: 'Search recent audit events (last 50 entries)',
      inputSchema: {
        type: 'object',
        properties: {
          action: { type: 'string', description: 'Filter by action type (e.g., create, update, delete, access)' },
        },
      },
      domain: 'audit',
    };
  }

  private handleSearchAuditLog(args: Record<string, unknown>): MCPToolResult {
    const { action } = args;
    const auditLog = getDataAccess().getAuditLog();
    let logs = auditLog.slice(-50);

    if (action && typeof action === 'string') {
      logs = logs.filter((l) => l.action === action);
    }

    const results = logs.map((l) => ({
      timestamp: l.timestamp instanceof Date ? l.timestamp.toISOString() : String(l.timestamp),
      action: l.action,
      actor: l.userEmail,
      resource: `${l.entityType}/${l.entityId}`,
      details: JSON.stringify(l.metadata),
    }));

    return createJsonResult(results);
  }

  // ==================== SOC 2 DOMAIN TOOLS ====================

  private createGetSOC2ControlStatusTool(): MCPTool {
    return {
      name: 'get_soc2_control_status',
      description: 'Get the 15 SOC 2 Trust Services internal controls and their implementation status',
      inputSchema: {
        type: 'object',
        properties: {},
      },
      domain: 'soc2',
    };
  }

  private handleGetSOC2ControlStatus(): MCPToolResult {
    const results: SOC2Control[] = soc2Controls.map((c) => ({
      criterion: c.criterion,
      category: c.category,
      description: c.description,
      implemented: c.implemented,
      testingDate: c.testingDate,
      evidenceLinks: c.evidenceLinks || [],
    }));

    return createJsonResult(results);
  }

  private createGetSOC2ReadinessTool(): MCPTool {
    return {
      name: 'get_soc2_readiness_score',
      description: 'Calculate overall SOC 2 readiness as a percentage based on control implementation',
      inputSchema: {
        type: 'object',
        properties: {},
      },
      domain: 'soc2',
    };
  }

  private handleGetSOC2Readiness(): MCPToolResult {
    const implemented = soc2Controls.filter((c) => c.implemented).length;
    const readinessScore = (implemented / soc2Controls.length) * 100;

    const result = {
      readinessPercentage: Math.round(readinessScore),
      implementedControls: implemented,
      totalControls: soc2Controls.length,
      readinessLevel:
        readinessScore >= 80 ? 'Ready' : readinessScore >= 60 ? 'On-Track' : readinessScore >= 40 ? 'In-Progress' : 'Not-Started',
    };

    return createJsonResult(result);
  }
}

/**
 * Singleton instance of IRMToolServer
 */
let irmToolServerInstance: IRMToolServer | null = null;

/**
 * Get or create the IRMToolServer singleton
 */
export function getIRMToolServer(): IRMToolServer {
  if (!irmToolServerInstance) {
    irmToolServerInstance = new IRMToolServer();
  }
  return irmToolServerInstance;
}
