/**
 * IRM Sentinel — Industry Vertical Configuration
 *
 * Defines the configurable aspects of each industry vertical:
 * - Regulatory frameworks and supervisory bodies
 * - Risk taxonomy (categories, typical risks)
 * - KRI templates with industry-specific thresholds
 * - AI narrative tone and supervisory language
 * - Vendor/third-party context
 *
 * The core platform engine is industry-agnostic.
 * These "vertical packs" slot in the right content.
 */

// ============================================================================
// TYPES
// ============================================================================

export type IndustryId = 'banking' | 'healthcare' | 'technology' | 'energy' | 'manufacturing';

export interface RegulatoryBody {
  name: string;
  abbreviation: string;
}

export interface FrameworkDef {
  name: string;
  shortName: string;
  description: string;
}

export interface RiskCategoryDef {
  id: string;
  label: string;
  description: string;
}

export interface KRITemplate {
  name: string;
  unit: string;
  category: string;
  typicalThreshold: number;
  direction: 'above' | 'below'; // breach when above or below threshold
}

export interface IndustryConfig {
  id: IndustryId;
  name: string;
  shortName: string;
  description: string;
  icon: string; // Lucide icon name
  color: string; // Accent hex
  regulatoryBodies: RegulatoryBody[];
  frameworks: FrameworkDef[];
  riskCategories: RiskCategoryDef[];
  kriTemplates: KRITemplate[];
  narrativeTone: {
    style: string; // e.g. "OCC/FDIC supervisory", "HIPAA compliance", etc.
    examinerTitle: string; // e.g. "Report of Examination", "Compliance Audit Report"
    regulatoryPrefix: string; // e.g. "The institution", "The covered entity", "The organization"
    boardTitle: string; // e.g. "Risk Committee", "Compliance Committee", "Board of Directors"
  };
  sampleBusinessUnits: string[];
  sampleProducts: string[];
  sampleGeographies: string[];
}

// ============================================================================
// INDUSTRY PACKS
// ============================================================================

export const INDUSTRY_CONFIGS: Record<IndustryId, IndustryConfig> = {
  // ========== BANKING ==========
  banking: {
    id: 'banking',
    name: 'Banking & Financial Services',
    shortName: 'Banking',
    description: 'G-SIB and large banks — OCC/FDIC supervisory expectations, Basel frameworks, BSA/AML compliance',
    icon: 'Landmark',
    color: '0097A7',
    regulatoryBodies: [
      { name: 'Office of the Comptroller of the Currency', abbreviation: 'OCC' },
      { name: 'Federal Deposit Insurance Corporation', abbreviation: 'FDIC' },
      { name: 'Federal Reserve Board', abbreviation: 'FRB' },
      { name: 'Securities and Exchange Commission', abbreviation: 'SEC' },
      { name: 'Basel Committee on Banking Supervision', abbreviation: 'BCBS' },
    ],
    frameworks: [
      { name: 'Basel III/IV', shortName: 'Basel', description: 'Capital, liquidity, and leverage requirements' },
      { name: 'SOX (Sarbanes-Oxley)', shortName: 'SOX', description: 'Financial reporting internal controls' },
      { name: 'SOC 2 Type II', shortName: 'SOC 2', description: 'Trust Services Criteria — security, availability, confidentiality' },
      { name: 'NIST CSF 2.0', shortName: 'NIST', description: 'Cybersecurity framework — identify, protect, detect, respond, recover' },
      { name: 'ISO 27001:2022', shortName: 'ISO27001', description: 'Information security management system' },
      { name: 'GDPR', shortName: 'GDPR', description: 'EU data protection and privacy regulation' },
      { name: 'DORA', shortName: 'DORA', description: 'Digital operational resilience for financial entities' },
      { name: 'COSO ERM', shortName: 'COSO', description: 'Enterprise risk management integrated framework' },
    ],
    riskCategories: [
      { id: 'Credit', label: 'Credit Risk', description: 'Loss from borrower or counterparty default' },
      { id: 'Market', label: 'Market Risk', description: 'Adverse movements in interest rates, FX, equities' },
      { id: 'Operational', label: 'Operational Risk', description: 'Failed processes, people, systems, or external events' },
      { id: 'Compliance', label: 'Compliance Risk', description: 'Violations of laws, regulations, or internal policies' },
      { id: 'Cyber', label: 'Cyber Risk', description: 'Threats to information security and system availability' },
      { id: 'ThirdParty', label: 'Third-Party Risk', description: 'Vendor, outsourcing, and supply chain dependencies' },
      { id: 'Strategic', label: 'Strategic Risk', description: 'Threats to business model viability and competitive position' },
      { id: 'Liquidity', label: 'Liquidity Risk', description: 'Inability to meet short-term obligations' },
    ],
    kriTemplates: [
      { name: 'CRE Concentration Ratio', unit: '%', category: 'Credit', typicalThreshold: 20, direction: 'above' },
      { name: 'Operational Loss Frequency', unit: 'count', category: 'Operational', typicalThreshold: 5, direction: 'above' },
      { name: 'BSA/AML False Positive Rate', unit: '%', category: 'Compliance', typicalThreshold: 5, direction: 'above' },
      { name: 'Unpatched Critical Vulnerabilities', unit: 'count', category: 'Cyber', typicalThreshold: 5, direction: 'above' },
      { name: 'Vendor SLA Breach Count', unit: 'count', category: 'ThirdParty', typicalThreshold: 2, direction: 'above' },
      { name: 'Liquidity Coverage Ratio', unit: '%', category: 'Liquidity', typicalThreshold: 100, direction: 'below' },
    ],
    narrativeTone: {
      style: 'OCC/FDIC supervisory examination',
      examinerTitle: 'Report of Examination',
      regulatoryPrefix: 'The institution',
      boardTitle: 'Risk Committee',
    },
    sampleBusinessUnits: ['Commercial Banking', 'Global Markets', 'Retail Banking', 'Wealth Management', 'Operations', 'Compliance', 'Technology'],
    sampleProducts: ['Commercial Loans', 'Mortgage Products', 'Derivatives', 'Treasury Services', 'Digital Banking', 'Payment Processing'],
    sampleGeographies: ['North America', 'EMEA', 'Asia-Pacific', 'Latin America'],
  },

  // ========== HEALTHCARE ==========
  healthcare: {
    id: 'healthcare',
    name: 'Healthcare & Life Sciences',
    shortName: 'Healthcare',
    description: 'Hospitals, health systems, pharma — HIPAA, FDA, patient safety, clinical compliance',
    icon: 'HeartPulse',
    color: 'E91E63',
    regulatoryBodies: [
      { name: 'Department of Health & Human Services', abbreviation: 'HHS' },
      { name: 'Office for Civil Rights', abbreviation: 'OCR' },
      { name: 'Food and Drug Administration', abbreviation: 'FDA' },
      { name: 'Centers for Medicare & Medicaid Services', abbreviation: 'CMS' },
      { name: 'The Joint Commission', abbreviation: 'TJC' },
    ],
    frameworks: [
      { name: 'HIPAA Privacy Rule', shortName: 'HIPAA-PR', description: 'Protected health information privacy requirements' },
      { name: 'HIPAA Security Rule', shortName: 'HIPAA-SR', description: 'Electronic PHI administrative, physical, and technical safeguards' },
      { name: 'HITECH Act', shortName: 'HITECH', description: 'Health IT standards, breach notification, meaningful use' },
      { name: 'SOC 2 Type II', shortName: 'SOC 2', description: 'Trust Services Criteria for service organizations' },
      { name: 'NIST CSF 2.0', shortName: 'NIST', description: 'Cybersecurity framework for critical infrastructure' },
      { name: 'ISO 27001:2022', shortName: 'ISO27001', description: 'Information security management system' },
      { name: 'FDA 21 CFR Part 11', shortName: 'FDA-P11', description: 'Electronic records and signatures for regulated products' },
      { name: 'GDPR', shortName: 'GDPR', description: 'EU data protection for patient data and clinical trials' },
    ],
    riskCategories: [
      { id: 'Clinical', label: 'Clinical Risk', description: 'Patient safety, adverse events, and medical errors' },
      { id: 'Compliance', label: 'Regulatory Compliance', description: 'HIPAA, FDA, CMS, and state health regulations' },
      { id: 'Operational', label: 'Operational Risk', description: 'Staffing shortages, supply chain, facility management' },
      { id: 'Cyber', label: 'Cyber & Data Risk', description: 'PHI breaches, ransomware, medical device security' },
      { id: 'Financial', label: 'Financial Risk', description: 'Reimbursement, payer mix, denial management' },
      { id: 'ThirdParty', label: 'Third-Party Risk', description: 'EHR vendors, medical device suppliers, lab partners' },
      { id: 'Reputation', label: 'Reputational Risk', description: 'Patient satisfaction, quality ratings, media exposure' },
      { id: 'Research', label: 'Research & Clinical Trial Risk', description: 'IRB compliance, data integrity, trial safety' },
    ],
    kriTemplates: [
      { name: 'Patient Safety Incident Rate', unit: 'per 1000', category: 'Clinical', typicalThreshold: 5, direction: 'above' },
      { name: 'PHI Breach Incident Count', unit: 'count', category: 'Cyber', typicalThreshold: 0, direction: 'above' },
      { name: 'HIPAA Audit Findings Open', unit: 'count', category: 'Compliance', typicalThreshold: 3, direction: 'above' },
      { name: 'Medical Device Vulnerability Count', unit: 'count', category: 'Cyber', typicalThreshold: 5, direction: 'above' },
      { name: 'Claims Denial Rate', unit: '%', category: 'Financial', typicalThreshold: 8, direction: 'above' },
      { name: 'Staff Turnover Rate (Clinical)', unit: '%', category: 'Operational', typicalThreshold: 15, direction: 'above' },
    ],
    narrativeTone: {
      style: 'HHS/OCR compliance audit',
      examinerTitle: 'Compliance Audit Report',
      regulatoryPrefix: 'The covered entity',
      boardTitle: 'Compliance Committee',
    },
    sampleBusinessUnits: ['Hospital Operations', 'Ambulatory Care', 'Clinical Research', 'Health IT', 'Revenue Cycle', 'Pharmacy', 'Nursing'],
    sampleProducts: ['Inpatient Services', 'Outpatient Clinics', 'Telehealth', 'Lab Services', 'Pharmacy', 'Medical Devices'],
    sampleGeographies: ['Northeast Region', 'Southeast Region', 'Midwest Region', 'West Region'],
  },

  // ========== TECHNOLOGY ==========
  technology: {
    id: 'technology',
    name: 'Technology & SaaS',
    shortName: 'Technology',
    description: 'Software companies, cloud providers, SaaS platforms — SOC 2, data privacy, AI governance',
    icon: 'Cpu',
    color: '7C3AED',
    regulatoryBodies: [
      { name: 'Federal Trade Commission', abbreviation: 'FTC' },
      { name: 'EU Data Protection Authorities', abbreviation: 'DPA' },
      { name: 'National Institute of Standards & Technology', abbreviation: 'NIST' },
      { name: 'California Privacy Protection Agency', abbreviation: 'CPPA' },
      { name: 'AI Safety Institute', abbreviation: 'AISI' },
    ],
    frameworks: [
      { name: 'SOC 2 Type II', shortName: 'SOC 2', description: 'Trust Services Criteria for SaaS and cloud' },
      { name: 'ISO 27001:2022', shortName: 'ISO27001', description: 'Information security management system' },
      { name: 'NIST CSF 2.0', shortName: 'NIST', description: 'Cybersecurity framework' },
      { name: 'GDPR', shortName: 'GDPR', description: 'EU data protection regulation' },
      { name: 'CCPA/CPRA', shortName: 'CCPA', description: 'California consumer privacy rights' },
      { name: 'NIST AI RMF', shortName: 'AI-RMF', description: 'AI risk management framework' },
      { name: 'ISO 42001', shortName: 'ISO42001', description: 'AI management system standard' },
      { name: 'EU AI Act', shortName: 'EU-AI', description: 'European regulation on artificial intelligence' },
    ],
    riskCategories: [
      { id: 'Cyber', label: 'Cybersecurity Risk', description: 'Application security, infrastructure, data breaches' },
      { id: 'Privacy', label: 'Data Privacy Risk', description: 'PII handling, consent management, cross-border transfers' },
      { id: 'Operational', label: 'Operational Risk', description: 'Service outages, deployment failures, incident response' },
      { id: 'AI', label: 'AI & Model Risk', description: 'Model bias, hallucination, adversarial attacks, explainability' },
      { id: 'ThirdParty', label: 'Supply Chain Risk', description: 'Open source dependencies, cloud providers, API partners' },
      { id: 'IP', label: 'Intellectual Property Risk', description: 'Trade secrets, patent exposure, open source licensing' },
      { id: 'Compliance', label: 'Regulatory Compliance', description: 'FTC enforcement, EU AI Act, privacy regulations' },
      { id: 'Product', label: 'Product Risk', description: 'Feature reliability, scalability, customer data integrity' },
    ],
    kriTemplates: [
      { name: 'Platform Uptime SLA', unit: '%', category: 'Operational', typicalThreshold: 99.9, direction: 'below' },
      { name: 'Critical CVE Count (Unpatched)', unit: 'count', category: 'Cyber', typicalThreshold: 3, direction: 'above' },
      { name: 'Mean Time to Recovery (MTTR)', unit: 'hours', category: 'Operational', typicalThreshold: 1, direction: 'above' },
      { name: 'Data Subject Access Requests Overdue', unit: 'count', category: 'Privacy', typicalThreshold: 0, direction: 'above' },
      { name: 'AI Model Drift Score', unit: 'score', category: 'AI', typicalThreshold: 0.15, direction: 'above' },
      { name: 'Open Source License Violations', unit: 'count', category: 'IP', typicalThreshold: 0, direction: 'above' },
    ],
    narrativeTone: {
      style: 'SOC 2 audit and FTC compliance',
      examinerTitle: 'SOC 2 Type II Audit Report',
      regulatoryPrefix: 'The organization',
      boardTitle: 'Board of Directors',
    },
    sampleBusinessUnits: ['Engineering', 'Product', 'Security', 'Data Science', 'Customer Success', 'Legal', 'DevOps'],
    sampleProducts: ['Core Platform', 'API Gateway', 'Analytics Suite', 'Mobile App', 'AI/ML Engine', 'Admin Console'],
    sampleGeographies: ['US', 'EU', 'APAC', 'Global (Multi-Region)'],
  },

  // ========== ENERGY ==========
  energy: {
    id: 'energy',
    name: 'Energy & Utilities',
    shortName: 'Energy',
    description: 'Power generation, oil & gas, utilities — NERC CIP, pipeline safety, environmental compliance',
    icon: 'Zap',
    color: 'FF9800',
    regulatoryBodies: [
      { name: 'Federal Energy Regulatory Commission', abbreviation: 'FERC' },
      { name: 'North American Electric Reliability Corporation', abbreviation: 'NERC' },
      { name: 'Pipeline and Hazardous Materials Safety Admin', abbreviation: 'PHMSA' },
      { name: 'Environmental Protection Agency', abbreviation: 'EPA' },
      { name: 'Department of Energy', abbreviation: 'DOE' },
    ],
    frameworks: [
      { name: 'NERC CIP Standards', shortName: 'NERC-CIP', description: 'Critical infrastructure protection for bulk electric system' },
      { name: 'ISO 55001', shortName: 'ISO55001', description: 'Asset management system standard' },
      { name: 'NIST CSF 2.0', shortName: 'NIST', description: 'Cybersecurity framework for critical infrastructure' },
      { name: 'ISO 14001', shortName: 'ISO14001', description: 'Environmental management system' },
      { name: 'OSHA PSM', shortName: 'PSM', description: 'Process safety management for hazardous chemicals' },
      { name: 'API 1160/1163', shortName: 'API', description: 'Pipeline integrity management and monitoring' },
      { name: 'SOC 2 Type II', shortName: 'SOC 2', description: 'Trust Services Criteria' },
      { name: 'TSA Pipeline Security Directives', shortName: 'TSA-PSD', description: 'Cybersecurity for pipeline operators' },
    ],
    riskCategories: [
      { id: 'Safety', label: 'Safety Risk', description: 'Worker safety, process safety, public safety incidents' },
      { id: 'Environmental', label: 'Environmental Risk', description: 'Emissions, spills, contamination, remediation' },
      { id: 'Operational', label: 'Operational Risk', description: 'Equipment failure, outages, grid reliability' },
      { id: 'Cyber', label: 'OT/IT Cyber Risk', description: 'SCADA/ICS security, IT-OT convergence threats' },
      { id: 'Compliance', label: 'Regulatory Compliance', description: 'NERC CIP, EPA, PHMSA, state utility commissions' },
      { id: 'ThirdParty', label: 'Supply Chain Risk', description: 'Fuel suppliers, equipment vendors, grid interconnections' },
      { id: 'Market', label: 'Market & Commodity Risk', description: 'Price volatility, hedging, capacity markets' },
      { id: 'Climate', label: 'Climate & Transition Risk', description: 'Extreme weather, decarbonization, stranded assets' },
    ],
    kriTemplates: [
      { name: 'OSHA Recordable Incident Rate', unit: 'per 200K hrs', category: 'Safety', typicalThreshold: 1.5, direction: 'above' },
      { name: 'Unplanned Outage Hours', unit: 'hours', category: 'Operational', typicalThreshold: 24, direction: 'above' },
      { name: 'NERC CIP Violation Count', unit: 'count', category: 'Compliance', typicalThreshold: 0, direction: 'above' },
      { name: 'SCADA Intrusion Attempts', unit: 'count', category: 'Cyber', typicalThreshold: 10, direction: 'above' },
      { name: 'Emissions Exceedance Events', unit: 'count', category: 'Environmental', typicalThreshold: 2, direction: 'above' },
      { name: 'Grid Reliability Index (SAIDI)', unit: 'minutes', category: 'Operational', typicalThreshold: 90, direction: 'above' },
    ],
    narrativeTone: {
      style: 'FERC/NERC regulatory compliance',
      examinerTitle: 'Regulatory Compliance Assessment',
      regulatoryPrefix: 'The operator',
      boardTitle: 'Safety & Risk Committee',
    },
    sampleBusinessUnits: ['Generation', 'Transmission', 'Distribution', 'Pipeline Operations', 'Trading', 'HSE', 'Grid Operations'],
    sampleProducts: ['Power Generation', 'Natural Gas Distribution', 'Renewable Energy', 'Grid Services', 'Pipeline Transport', 'Energy Trading'],
    sampleGeographies: ['Northeast Grid', 'Southeast Grid', 'Western Interconnection', 'Texas (ERCOT)', 'Gulf Coast'],
  },

  // ========== MANUFACTURING ==========
  manufacturing: {
    id: 'manufacturing',
    name: 'Manufacturing & Industrial',
    shortName: 'Manufacturing',
    description: 'Discrete and process manufacturing — ISO quality, supply chain, workplace safety, ESG',
    icon: 'Factory',
    color: '4CAF50',
    regulatoryBodies: [
      { name: 'Occupational Safety and Health Administration', abbreviation: 'OSHA' },
      { name: 'Environmental Protection Agency', abbreviation: 'EPA' },
      { name: 'Consumer Product Safety Commission', abbreviation: 'CPSC' },
      { name: 'International Organization for Standardization', abbreviation: 'ISO' },
      { name: 'Customs and Border Protection', abbreviation: 'CBP' },
    ],
    frameworks: [
      { name: 'ISO 9001:2015', shortName: 'ISO9001', description: 'Quality management system' },
      { name: 'ISO 45001', shortName: 'ISO45001', description: 'Occupational health and safety management' },
      { name: 'ISO 14001', shortName: 'ISO14001', description: 'Environmental management system' },
      { name: 'NIST CSF 2.0', shortName: 'NIST', description: 'Cybersecurity framework' },
      { name: 'IATF 16949', shortName: 'IATF', description: 'Automotive quality management (if applicable)' },
      { name: 'SOC 2 Type II', shortName: 'SOC 2', description: 'Trust Services Criteria for service providers' },
      { name: 'CSRD/ESG Reporting', shortName: 'CSRD', description: 'Corporate sustainability reporting directive' },
      { name: 'COSO ERM', shortName: 'COSO', description: 'Enterprise risk management framework' },
    ],
    riskCategories: [
      { id: 'Quality', label: 'Quality Risk', description: 'Product defects, recalls, warranty claims' },
      { id: 'Safety', label: 'Workplace Safety', description: 'Worker injuries, equipment hazards, ergonomics' },
      { id: 'SupplyChain', label: 'Supply Chain Risk', description: 'Material shortages, logistics disruption, single-source dependency' },
      { id: 'Operational', label: 'Operational Risk', description: 'Equipment downtime, production variance, capacity constraints' },
      { id: 'Environmental', label: 'Environmental Risk', description: 'Emissions, waste management, regulatory compliance' },
      { id: 'Cyber', label: 'Cyber & OT Risk', description: 'ICS/SCADA security, IoT vulnerabilities, IP theft' },
      { id: 'Compliance', label: 'Regulatory Compliance', description: 'OSHA, EPA, product safety, trade compliance' },
      { id: 'ESG', label: 'ESG & Sustainability', description: 'Carbon footprint, labor practices, governance reporting' },
    ],
    kriTemplates: [
      { name: 'Defect Rate (PPM)', unit: 'ppm', category: 'Quality', typicalThreshold: 500, direction: 'above' },
      { name: 'Lost Time Injury Frequency Rate', unit: 'per M hrs', category: 'Safety', typicalThreshold: 2, direction: 'above' },
      { name: 'On-Time Delivery Rate', unit: '%', category: 'SupplyChain', typicalThreshold: 95, direction: 'below' },
      { name: 'Overall Equipment Effectiveness (OEE)', unit: '%', category: 'Operational', typicalThreshold: 85, direction: 'below' },
      { name: 'Scope 1+2 Emissions vs Target', unit: '%', category: 'Environmental', typicalThreshold: 100, direction: 'above' },
      { name: 'Supplier Risk Score (Critical)', unit: 'count', category: 'SupplyChain', typicalThreshold: 3, direction: 'above' },
    ],
    narrativeTone: {
      style: 'ISO management system audit',
      examinerTitle: 'Management System Audit Report',
      regulatoryPrefix: 'The organization',
      boardTitle: 'Board of Directors',
    },
    sampleBusinessUnits: ['Production', 'Quality Assurance', 'Supply Chain', 'HSE', 'Engineering', 'Maintenance', 'Logistics'],
    sampleProducts: ['Assembled Components', 'Raw Materials Processing', 'Precision Parts', 'Packaged Goods', 'Custom Fabrication', 'Finished Products'],
    sampleGeographies: ['North America Plants', 'EU Plants', 'APAC Plants', 'Mexico Operations', 'Global Distribution'],
  },
};

// ============================================================================
// HELPERS
// ============================================================================

export function getIndustryConfig(id: IndustryId): IndustryConfig {
  return INDUSTRY_CONFIGS[id];
}

export function getAllIndustries(): IndustryConfig[] {
  return Object.values(INDUSTRY_CONFIGS);
}

export function getIndustryFrameworkNames(id: IndustryId): string[] {
  return INDUSTRY_CONFIGS[id].frameworks.map(f => f.shortName);
}

export function getIndustryRiskCategoryIds(id: IndustryId): string[] {
  return INDUSTRY_CONFIGS[id].riskCategories.map(c => c.id);
}
