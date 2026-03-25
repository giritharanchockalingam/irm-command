/**
 * IRM Sentinel - Integrated Risk Management Platform for G-SIB Banks
 * Comprehensive TypeScript types for the entire IRM data model
 */

// ============================================================================
// ENUMS AND UTILITY TYPES
// ============================================================================

export type RiskCategory =
  | 'Credit'
  | 'Market'
  | 'Operational'
  | 'Compliance'
  | 'Cyber'
  | 'ThirdParty'
  | 'Strategic'
  | 'Liquidity'
  // Healthcare
  | 'Clinical'
  | 'Research'
  // Technology
  | 'AI'
  | 'Privacy'
  // Energy
  | 'Safety'
  | 'Environmental'
  // Manufacturing
  | 'Quality'
  | 'ESG';

export type SeverityLevel = 'Critical' | 'High' | 'Medium' | 'Low';

export type Framework =
  | 'Basel III'
  | 'SOX'
  | 'GDPR'
  | 'NIST'
  | 'ISO27001'
  // Healthcare
  | 'HIPAA'
  | 'HITECH'
  | 'FDA 21 CFR Part 11'
  // Technology
  | 'SOC 2'
  | 'EU AI Act'
  | 'CCPA'
  // Energy
  | 'NERC CIP'
  | 'EPA'
  | 'DOT PHMSA'
  // Manufacturing
  | 'ISO 9001'
  | 'ISO 45001'
  | 'OSHA';

export type ControlStatus = 'Implemented' | 'Partially Implemented' | 'Not Implemented' | 'Under Review';

export type ControlEffectiveness = 'Effective' | 'Partially Effective' | 'Ineffective';

export type RiskStatus = 'Active' | 'Mitigated' | 'Accepted' | 'Retired' | 'Under Review';

export type IssueStatus = 'Open' | 'In Progress' | 'Remediation Planned' | 'Closed' | 'Overdue';

export type IssueSource = 'Internal Audit' | 'External Audit' | 'Regulatory Exam' | 'Self-Identified' | 'TPRM Review';

export type VendorTier = 1 | 2 | 3;

export type VendorCriticality = 'Critical' | 'High' | 'Medium' | 'Low';

export type DataSensitivity = 'High' | 'Medium' | 'Low';

export type SLAStatus = 'Green' | 'Yellow' | 'Red';

export type KRIBreachLevel = 'Normal' | 'Warning' | 'Breach' | 'Critical';

export type KRITrend = 'Improving' | 'Stable' | 'Deteriorating';

export type RegulatorySource =
  | 'OCC'
  | 'FDIC'
  | 'Federal Reserve'
  | 'Basel Committee'
  | 'SEC'
  | 'EU Commission'
  // Healthcare
  | 'HHS'
  | 'OCR'
  | 'FDA'
  | 'CMS'
  // Technology
  | 'FTC'
  | 'DPA'
  // Energy
  | 'FERC'
  | 'NERC'
  | 'PHMSA'
  // Manufacturing
  | 'OSHA'
  | 'EPA'
  | 'CPSC';

export type RegulatoryStatus = 'Monitoring' | 'Impact Assessment' | 'Implementation' | 'Completed';

export type ImpactLevel = 'High' | 'Medium' | 'Low';

export type MonitoringAlertType =
  | 'SLA Breach'
  | 'Data Incident'
  | 'Cyber Intel'
  | 'Concentration Risk'
  | 'Regulatory Filing'
  | 'Financial Distress';

export type MRAType = 'MRA' | 'MRIA' | null;

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'ACKNOWLEDGE' | 'REVIEW' | 'APPROVE';

export type BusinessUnit =
  | 'Global Markets'
  | 'Retail Banking'
  | 'Commercial Banking'
  | 'Wealth Management'
  | 'Treasury'
  | 'Operations'
  | 'Technology'
  | 'Risk Management'
  | 'Compliance'
  // Healthcare
  | 'Clinical Operations'
  | 'Health IT'
  | 'Patient Services'
  | 'Research & Development'
  | 'Pharmacy'
  // Technology
  | 'Engineering'
  | 'Product'
  | 'Data Science'
  | 'Security'
  | 'Infrastructure'
  // Energy
  | 'Generation'
  | 'Transmission'
  | 'Distribution'
  | 'Trading'
  | 'Exploration'
  // Manufacturing
  | 'Production'
  | 'Supply Chain'
  | 'Quality Assurance'
  | 'Logistics'
  | 'R&D';

export type PolicyLifecycleStage = 'draft' | 'review' | 'approve' | 'publish' | 'retire';

// ============================================================================
// RISK TYPE
// ============================================================================

export interface Risk {
  id: string; // Format: RSK-XXX
  title: string;
  category: RiskCategory;
  description: string;
  businessUnit: BusinessUnit;
  impact: 1 | 2 | 3 | 4 | 5;
  likelihood: 1 | 2 | 3 | 4 | 5;
  inherentScore: number; // Calculated: impact * likelihood
  residualScore: number; // After controls
  owner: string; // User ID or email
  status: RiskStatus;
  controlIds: string[]; // References to Control.id
  kpiIds: string[]; // References to KRI.id
  lastAssessmentDate: Date;
  nextReviewDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// CONTROL TYPE
// ============================================================================

export interface Control {
  id: string; // Format: CTL-XXX
  title: string;
  description: string;
  framework: Framework;
  status: ControlStatus;
  owner: string;
  testDate: Date;
  nextReviewDate: Date;
  riskIds: string[]; // References to Risk.id
  effectiveness: ControlEffectiveness;
  evidence: string; // URL or document reference
  controlType: 'Detective' | 'Preventive' | 'Corrective';
  testFrequency: 'Quarterly' | 'Semi-Annual' | 'Annual' | 'On-Demand';
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// VENDOR / THIRD-PARTY RISK MANAGEMENT TYPE
// ============================================================================

export interface Vendor {
  id: string; // Format: VND-XXX
  name: string;
  tier: VendorTier;
  category: string; // e.g., 'Cloud Infrastructure', 'Payments Processing', 'Cybersecurity'
  criticality: VendorCriticality;
  dataSensitivity: DataSensitivity;
  inherentRisk: 1 | 2 | 3 | 4 | 5;
  residualRisk: 1 | 2 | 3 | 4 | 5;
  slaStatus: SLAStatus;
  contractExpiry: Date;
  regulatoryRelevance: boolean;
  services: string[]; // List of services provided
  location: string; // Geographic location
  lastAssessmentDate: Date;
  nextReviewDate: Date;
  controlIds: string[]; // References to Control.id
  contractValue?: number; // USD
  backupVendor?: string; // Vendor ID of backup provider
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// ISSUE / FINDING TYPE
// ============================================================================

export interface Issue {
  id: string; // Format: ISS-XXX
  title: string;
  severity: SeverityLevel;
  source: IssueSource;
  status: IssueStatus;
  owner: string;
  dueDate: Date;
  riskIds: string[]; // References to Risk.id
  controlIds: string[]; // References to Control.id
  remediationPlan: string;
  remediationDueDate?: Date;
  mraType: MRAType;
  rootCause?: string;
  impactStatement?: string;
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
}

// ============================================================================
// LOSS EVENT TYPE
// ============================================================================

export interface LossEvent {
  id: string; // Format: LSS-XXX
  title: string;
  category: RiskCategory;
  amount: number; // USD
  date: Date;
  businessUnit: BusinessUnit;
  riskIds: string[]; // References to Risk.id
  rootCause: string;
  status: 'Reported' | 'Under Investigation' | 'Resolved' | 'Archived';
  description: string;
  recoveryAmount?: number;
  regulatoryReporting: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// KEY RISK INDICATOR (KRI) TYPE
// ============================================================================

export interface KRI {
  id: string; // Format: KRI-XXX
  name: string;
  riskCategory: RiskCategory;
  currentValue: number;
  threshold: number;
  breachLevel: KRIBreachLevel;
  trend: KRITrend;
  unit: string; // e.g., '%', '$M', 'count', 'bps'
  lastUpdated: Date;
  historicalValues?: Array<{
    value: number;
    date: Date;
  }>;
  owner: string;
  updateFrequency: 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly';
  warningThreshold?: number;
  criticalThreshold?: number;
  createdAt: Date;
}

// ============================================================================
// REGULATORY CHANGE TYPE
// ============================================================================

export interface RegulatoryChange {
  id: string; // Format: REG-XXX
  title: string;
  source: RegulatorySource;
  effectiveDate: Date;
  status: RegulatoryStatus;
  impactLevel: ImpactLevel;
  summary: string;
  affectedFrameworks: Framework[];
  affectedControlIds: string[]; // References to Control.id
  actionPlanOwner: string;
  actionPlanDueDate: Date;
  implementationNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// RISK SCENARIO TYPE
// ============================================================================

export interface RiskScenario {
  id: string; // Format: SCN-XXX
  title: string;
  businessLine: BusinessUnit;
  product: string;
  geography: string;
  riskType: RiskCategory;
  inherentRisk: 1 | 2 | 3 | 4 | 5;
  controlStrength: 1 | 2 | 3 | 4 | 5;
  lossHistory: Array<{
    amount: number;
    date: Date;
  }>;
  compositeScore: number; // Calculated from inherent risk and control strength
  narrative: string; // Detailed scenario description
  probability: number; // 0-100
  potentialLoss: number; // USD
  mitigatingControls: string[]; // Control IDs
  owner: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// AUDIT ENTRY TYPE (for change tracking/audit trail)
// ============================================================================

export interface AuditEntry {
  id: string; // Format: AUD-XXX
  entityType: 'Risk' | 'Control' | 'Vendor' | 'Issue' | 'KRI' | 'RegulatoryChange' | 'RiskScenario' | 'LossEvent';
  entityId: string; // ID of the entity that was changed
  action: AuditAction;
  field?: string; // Field that was changed (for UPDATE actions)
  oldValue?: unknown; // Previous value
  newValue?: unknown; // New value
  user: string; // User ID or email
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

// ============================================================================
// MONITORING ALERT TYPE
// ============================================================================

export interface MonitoringAlert {
  id: string; // Format: ALT-XXX
  type: MonitoringAlertType;
  vendorId?: string; // Reference to Vendor.id
  severity: SeverityLevel;
  title: string;
  description: string;
  timestamp: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  aiInterpretation?: string; // AI-generated insight about the alert
  relatedEntityId?: string; // Related Risk, Control, or Issue ID
  actionRequired?: boolean;
}

// ============================================================================
// POLICY LIFECYCLE TYPE
// ============================================================================

export interface PolicyLifecycle {
  stage: PolicyLifecycleStage;
  createdAt: Date;
  publishedAt?: Date;
  retiredAt?: Date;
  lastReviewedAt?: Date;
  nextReviewDueDate: Date;
  owner: string;
  approvers: string[]; // User IDs of approvers
  version: number;
}

// ============================================================================
// COMPOSITE / AGGREGATE TYPES
// ============================================================================

export interface RiskPortfolio {
  totalRisks: number;
  risksByCategory: Record<RiskCategory, number>;
  averageInherentScore: number;
  averageResidualScore: number;
  risksByStatus: Record<RiskStatus, number>;
  criticalRisks: Risk[];
  highRisks: Risk[];
}

export interface ComplianceStatus {
  framework: Framework;
  implementedControls: number;
  totalControls: number;
  compliancePercentage: number;
  nextAudit: Date;
  lastAudit: Date;
  gaps: string[];
}

export interface VendorRiskSummary {
  totalVendors: number;
  vendorsByTier: Record<VendorTier, number>;
  criticalVendors: Vendor[];
  highRiskVendors: Vendor[];
  slaViolations: Vendor[];
  overduReviews: Vendor[];
}

export interface IssueMetrics {
  totalIssues: number;
  openIssues: number;
  overdueIssues: number;
  criticalSeverity: number;
  avgResolutionDays: number;
  issueBySeverity: Record<SeverityLevel, number>;
  issueBySource: Record<IssueSource, number>;
}

// ============================================================================
// DASHBOARD / REPORTING TYPES
// ============================================================================

export interface RiskHeatmapCell {
  likelihood: 1 | 2 | 3 | 4 | 5;
  impact: 1 | 2 | 3 | 4 | 5;
  risks: Risk[];
  score: number;
}

export interface DashboardMetrics {
  riskPortfolio: RiskPortfolio;
  complianceByFramework: Partial<Record<Framework, ComplianceStatus>>;
  vendorRiskSummary: VendorRiskSummary;
  issueMetrics: IssueMetrics;
  lossEventYTD: number;
  keyRisksBreachingKRI: KRI[];
  pendingRegulatoryActions: RegulatoryChange[];
}
