/**
 * IRM Sentinel — Industry-Aware Seed Data Generator
 *
 * Generates realistic seed data for each industry vertical.
 * Banking data comes from the existing seedData.ts (unchanged).
 * Other verticals get purpose-built data that reflects real-world
 * risks, controls, vendors, and KRIs for that industry.
 */

import {
  Risk, Control, Vendor, Issue, KRI, LossEvent,
  RegulatoryChange, MonitoringAlert, AuditEntry, RiskScenario,
} from './types';
import * as bankingSeedData from './seedData';
import { IndustryId } from '../config/industries';

export interface IndustrySeedBundle {
  risks: Risk[];
  controls: Control[];
  vendors: Vendor[];
  issues: Issue[];
  kris: KRI[];
  lossEvents: LossEvent[];
  regulatoryChanges: RegulatoryChange[];
  monitoringAlerts: MonitoringAlert[];
  auditLog: AuditEntry[];
  riskScenarios: RiskScenario[];
}

// Cache to avoid regenerating on every call
const cache: Partial<Record<IndustryId, IndustrySeedBundle>> = {};

export function getIndustrySeedData(industryId: IndustryId): IndustrySeedBundle {
  if (cache[industryId]) return cache[industryId]!;

  let bundle: IndustrySeedBundle;

  switch (industryId) {
    case 'banking':
      bundle = {
        risks: bankingSeedData.risks,
        controls: bankingSeedData.controls,
        vendors: bankingSeedData.vendors,
        issues: bankingSeedData.issues,
        kris: bankingSeedData.kris,
        lossEvents: bankingSeedData.lossEvents,
        regulatoryChanges: bankingSeedData.regulatoryChanges,
        monitoringAlerts: bankingSeedData.monitoringAlerts,
        auditLog: bankingSeedData.auditLog,
        riskScenarios: bankingSeedData.riskScenarios,
      };
      break;
    case 'healthcare':
      bundle = generateHealthcareData();
      break;
    case 'technology':
      bundle = generateTechnologyData();
      break;
    case 'energy':
      bundle = generateEnergyData();
      break;
    case 'manufacturing':
      bundle = generateManufacturingData();
      break;
    default:
      bundle = {
        risks: bankingSeedData.risks,
        controls: bankingSeedData.controls,
        vendors: bankingSeedData.vendors,
        issues: bankingSeedData.issues,
        kris: bankingSeedData.kris,
        lossEvents: bankingSeedData.lossEvents,
        regulatoryChanges: bankingSeedData.regulatoryChanges,
        monitoringAlerts: bankingSeedData.monitoringAlerts,
        auditLog: bankingSeedData.auditLog,
        riskScenarios: bankingSeedData.riskScenarios,
      };
  }

  cache[industryId] = bundle;
  return bundle;
}

/** Clear cache when industry changes */
export function clearIndustrySeedCache(): void {
  Object.keys(cache).forEach(k => delete cache[k as IndustryId]);
}


// ============================================================================
// HEALTHCARE
// ============================================================================
function generateHealthcareData(): IndustrySeedBundle {
  const risks: Risk[] = [
    { id: 'RSK-001', title: 'PHI Data Breach via Unencrypted EHR Access', category: 'Cyber' as any, description: 'Risk of unauthorized access to protected health information through unencrypted endpoints in the electronic health record system. Potential HIPAA violation and OCR enforcement action.', businessUnit: 'Health IT', impact: 5, likelihood: 3, inherentScore: 15, residualScore: 9, owner: 'ciso@hospital.org', status: 'Active', controlIds: ['CTL-001', 'CTL-002'], kpiIds: ['KRI-001'], lastAssessmentDate: new Date('2026-02-15'), nextReviewDate: new Date('2026-05-15'), createdAt: new Date('2025-06-01'), updatedAt: new Date('2026-02-15') },
    { id: 'RSK-002', title: 'Medication Administration Error – CPOE System', category: 'Clinical' as any, description: 'Risk of adverse drug events from CPOE system downtime or alert fatigue. Patient safety incident potential with regulatory and liability exposure.', businessUnit: 'Nursing', impact: 5, likelihood: 4, inherentScore: 20, residualScore: 12, owner: 'cmo@hospital.org', status: 'Active', controlIds: ['CTL-003', 'CTL-004'], kpiIds: ['KRI-002'], lastAssessmentDate: new Date('2026-02-01'), nextReviewDate: new Date('2026-08-01'), createdAt: new Date('2025-03-20'), updatedAt: new Date('2026-02-01') },
    { id: 'RSK-003', title: 'Ransomware Attack on Medical Imaging Systems', category: 'Cyber' as any, description: 'Ransomware targeting PACS and DICOM imaging infrastructure. Potential disruption to radiology, surgery planning, and emergency diagnostics.', businessUnit: 'Health IT', impact: 5, likelihood: 3, inherentScore: 15, residualScore: 8, owner: 'ciso@hospital.org', status: 'Active', controlIds: ['CTL-005', 'CTL-006'], kpiIds: ['KRI-003'], lastAssessmentDate: new Date('2026-01-20'), nextReviewDate: new Date('2026-07-20'), createdAt: new Date('2025-05-10'), updatedAt: new Date('2026-01-20') },
    { id: 'RSK-004', title: 'HIPAA Privacy Rule Non-Compliance – Business Associates', category: 'Compliance' as any, description: 'Incomplete Business Associate Agreements and inadequate oversight of third-party PHI handling. OCR audit exposure.', businessUnit: 'Compliance', impact: 4, likelihood: 3, inherentScore: 12, residualScore: 6, owner: 'privacy@hospital.org', status: 'Active', controlIds: ['CTL-007', 'CTL-008'], kpiIds: ['KRI-004'], lastAssessmentDate: new Date('2026-01-15'), nextReviewDate: new Date('2026-07-15'), createdAt: new Date('2025-02-01'), updatedAt: new Date('2026-01-15') },
    { id: 'RSK-005', title: 'Clinical Staff Shortage – ICU and ED', category: 'Operational' as any, description: 'Persistent staffing gaps in critical care and emergency departments. Impact on patient safety metrics, wait times, and nurse-to-patient ratios.', businessUnit: 'Hospital Operations', impact: 4, likelihood: 4, inherentScore: 16, residualScore: 12, owner: 'cno@hospital.org', status: 'Active', controlIds: ['CTL-009'], kpiIds: ['KRI-005'], lastAssessmentDate: new Date('2026-02-10'), nextReviewDate: new Date('2026-05-10'), createdAt: new Date('2025-01-15'), updatedAt: new Date('2026-02-10') },
    { id: 'RSK-006', title: 'Medical Device Cybersecurity – IoMT Vulnerabilities', category: 'Cyber' as any, description: 'Internet of Medical Things devices (infusion pumps, monitors) running outdated firmware with known CVEs. Network segmentation gaps.', businessUnit: 'Biomedical Engineering', impact: 5, likelihood: 2, inherentScore: 10, residualScore: 6, owner: 'biomed@hospital.org', status: 'Under Review', controlIds: ['CTL-010', 'CTL-011'], kpiIds: ['KRI-006'], lastAssessmentDate: new Date('2026-01-05'), nextReviewDate: new Date('2026-04-05'), createdAt: new Date('2025-08-01'), updatedAt: new Date('2026-01-05') },
    { id: 'RSK-007', title: 'CMS Reimbursement Reduction – Value-Based Care Metrics', category: 'Financial' as any, description: 'Risk of reduced Medicare reimbursement due to underperformance on quality measures (HCAHPS, readmission rates, HAIs).', businessUnit: 'Revenue Cycle', impact: 4, likelihood: 3, inherentScore: 12, residualScore: 8, owner: 'cfo@hospital.org', status: 'Active', controlIds: ['CTL-012'], kpiIds: ['KRI-007'], lastAssessmentDate: new Date('2025-12-15'), nextReviewDate: new Date('2026-06-15'), createdAt: new Date('2025-04-01'), updatedAt: new Date('2025-12-15') },
    { id: 'RSK-008', title: 'Clinical Trial Data Integrity – IRB Compliance', category: 'Research' as any, description: 'Risk of GCP violations in active clinical trials. Incomplete informed consent documentation and data integrity issues in trial management system.', businessUnit: 'Clinical Research', impact: 4, likelihood: 2, inherentScore: 8, residualScore: 4, owner: 'research@hospital.org', status: 'Mitigated', controlIds: ['CTL-013', 'CTL-014'], kpiIds: [], lastAssessmentDate: new Date('2026-01-30'), nextReviewDate: new Date('2026-07-30'), createdAt: new Date('2025-09-15'), updatedAt: new Date('2026-01-30') },
  ];

  const controls: Control[] = [
    { id: 'CTL-001', title: 'EHR Access Encryption (TLS 1.3)', framework: 'HIPAA-SR' as any, controlType: 'Preventive', status: 'Implemented', effectiveness: 'Effective', testFrequency: 'Quarterly', lastTested: new Date('2026-01-15'), nextReview: new Date('2026-04-15'), owner: 'ciso@hospital.org', description: 'End-to-end encryption for all EHR access points', evidence: 'Pen test report, TLS scan results', riskIds: ['RSK-001'], linkedRiskIds: ['RSK-001'] },
    { id: 'CTL-002', title: 'Multi-Factor Authentication – Clinical Systems', framework: 'HIPAA-SR' as any, controlType: 'Preventive', status: 'Implemented', effectiveness: 'Effective', testFrequency: 'Quarterly', lastTested: new Date('2026-02-01'), nextReview: new Date('2026-05-01'), owner: 'ciso@hospital.org', description: 'MFA required for all clinical system access', evidence: 'MFA enrollment report, access logs', riskIds: ['RSK-001'], linkedRiskIds: ['RSK-001'] },
    { id: 'CTL-003', title: 'CPOE Clinical Decision Support Alerts', framework: 'TJC' as any, controlType: 'Detective', status: 'Implemented', effectiveness: 'Partially Effective', testFrequency: 'Monthly', lastTested: new Date('2026-02-10'), nextReview: new Date('2026-03-10'), owner: 'cmio@hospital.org', description: 'Drug interaction and dosing alerts in CPOE system', evidence: 'Alert override reports, ADR tracking', riskIds: ['RSK-002'], linkedRiskIds: ['RSK-002'] },
    { id: 'CTL-004', title: 'Barcode Medication Administration (BCMA)', framework: 'TJC' as any, controlType: 'Preventive', status: 'Implemented', effectiveness: 'Effective', testFrequency: 'Quarterly', lastTested: new Date('2026-01-20'), nextReview: new Date('2026-04-20'), owner: 'cno@hospital.org', description: 'Barcode scanning at bedside for medication verification', evidence: 'BCMA compliance rate reports', riskIds: ['RSK-002'], linkedRiskIds: ['RSK-002'] },
    { id: 'CTL-005', title: 'Network Segmentation – Medical Devices', framework: 'NIST' as any, controlType: 'Preventive', status: 'Partially Implemented', effectiveness: 'Partially Effective', testFrequency: 'Semi-Annual', lastTested: new Date('2025-11-15'), nextReview: new Date('2026-05-15'), owner: 'ciso@hospital.org', description: 'VLAN isolation for medical imaging and IoMT devices', evidence: 'Network topology diagram, firewall rules', riskIds: ['RSK-003'], linkedRiskIds: ['RSK-003'] },
    { id: 'CTL-006', title: 'Endpoint Detection & Response – Clinical Workstations', framework: 'NIST' as any, controlType: 'Detective', status: 'Implemented', effectiveness: 'Effective', testFrequency: 'Quarterly', lastTested: new Date('2026-01-30'), nextReview: new Date('2026-04-30'), owner: 'ciso@hospital.org', description: 'EDR agents on all clinical and admin workstations', evidence: 'EDR dashboard, incident logs', riskIds: ['RSK-003'], linkedRiskIds: ['RSK-003'] },
    { id: 'CTL-007', title: 'Business Associate Agreement Management', framework: 'HIPAA-PR' as any, controlType: 'Preventive', status: 'Implemented', effectiveness: 'Effective', testFrequency: 'Annual', lastTested: new Date('2025-12-01'), nextReview: new Date('2026-12-01'), owner: 'privacy@hospital.org', description: 'BAA tracking and renewal for all PHI-handling vendors', evidence: 'BAA inventory, compliance attestations', riskIds: ['RSK-004'], linkedRiskIds: ['RSK-004'] },
    { id: 'CTL-008', title: 'PHI Minimum Necessary Access Reviews', framework: 'HIPAA-PR' as any, controlType: 'Detective', status: 'Implemented', effectiveness: 'Partially Effective', testFrequency: 'Quarterly', lastTested: new Date('2026-01-15'), nextReview: new Date('2026-04-15'), owner: 'privacy@hospital.org', description: 'Quarterly review of user access to PHI against role requirements', evidence: 'Access review reports, exception logs', riskIds: ['RSK-004'], linkedRiskIds: ['RSK-004'] },
    { id: 'CTL-009', title: 'Staffing Ratio Monitoring & Escalation', framework: 'TJC' as any, controlType: 'Detective', status: 'Implemented', effectiveness: 'Partially Effective', testFrequency: 'Monthly', lastTested: new Date('2026-02-05'), nextReview: new Date('2026-03-05'), owner: 'cno@hospital.org', description: 'Real-time nurse-to-patient ratio monitoring with auto-escalation', evidence: 'Staffing dashboard, escalation logs', riskIds: ['RSK-005'], linkedRiskIds: ['RSK-005'] },
    { id: 'CTL-010', title: 'Medical Device Firmware Patching Program', framework: 'NIST' as any, controlType: 'Corrective', status: 'Partially Implemented', effectiveness: 'Ineffective', testFrequency: 'Semi-Annual', lastTested: new Date('2025-10-15'), nextReview: new Date('2026-04-15'), owner: 'biomed@hospital.org', description: 'Coordinated firmware updates for connected medical devices', evidence: 'Patch compliance report, vendor advisories', riskIds: ['RSK-006'], linkedRiskIds: ['RSK-006'] },
    { id: 'CTL-011', title: 'IoMT Asset Inventory & Risk Classification', framework: 'NIST' as any, controlType: 'Preventive', status: 'Implemented', effectiveness: 'Effective', testFrequency: 'Quarterly', lastTested: new Date('2026-01-10'), nextReview: new Date('2026-04-10'), owner: 'biomed@hospital.org', description: 'Complete inventory of all connected medical devices with risk scoring', evidence: 'Asset inventory, classification matrix', riskIds: ['RSK-006'], linkedRiskIds: ['RSK-006'] },
    { id: 'CTL-012', title: 'Quality Measure Dashboard & Reporting', framework: 'CMS' as any, controlType: 'Detective', status: 'Implemented', effectiveness: 'Effective', testFrequency: 'Monthly', lastTested: new Date('2026-02-01'), nextReview: new Date('2026-03-01'), owner: 'quality@hospital.org', description: 'Real-time tracking of CMS quality measures and HCAHPS scores', evidence: 'Quality dashboard screenshots, CMS submissions', riskIds: ['RSK-007'], linkedRiskIds: ['RSK-007'] },
    { id: 'CTL-013', title: 'IRB Protocol Compliance Monitoring', framework: 'FDA-P11' as any, controlType: 'Detective', status: 'Implemented', effectiveness: 'Effective', testFrequency: 'Monthly', lastTested: new Date('2026-01-25'), nextReview: new Date('2026-02-25'), owner: 'research@hospital.org', description: 'Ongoing monitoring of clinical trial protocol adherence', evidence: 'IRB audit reports, protocol deviation logs', riskIds: ['RSK-008'], linkedRiskIds: ['RSK-008'] },
    { id: 'CTL-014', title: 'Clinical Trial Data Integrity Validation', framework: 'FDA-P11' as any, controlType: 'Preventive', status: 'Implemented', effectiveness: 'Effective', testFrequency: 'Quarterly', lastTested: new Date('2026-01-15'), nextReview: new Date('2026-04-15'), owner: 'research@hospital.org', description: 'Automated data validation checks in trial management system', evidence: 'Validation reports, audit trail', riskIds: ['RSK-008'], linkedRiskIds: ['RSK-008'] },
  ];

  const vendors: Vendor[] = [
    { id: 'VND-001', name: 'Epic Systems', tier: 1 as any, category: 'Health IT', criticality: 'Critical', services: ['EHR Platform', 'MyChart Portal', 'Clinical Decision Support'], location: 'Verona, WI', inherentRisk: 4, residualRisk: 2, slaStatus: 'Green', contractExpiry: new Date('2028-12-31'), lastAssessmentDate: new Date('2026-01-15'), nextReviewDate: new Date('2026-04-15'), regulatoryRelevance: true, dataSensitivity: 'High' as any, controlIds: ['CTL-001', 'CTL-002'] },
    { id: 'VND-002', name: 'CrowdStrike', tier: 1 as any, category: 'Cybersecurity', criticality: 'Critical', services: ['EDR', 'Threat Intelligence', 'Incident Response'], location: 'Austin, TX', inherentRisk: 3, residualRisk: 1, slaStatus: 'Green', contractExpiry: new Date('2027-06-30'), lastAssessmentDate: new Date('2026-02-01'), nextReviewDate: new Date('2026-05-01'), regulatoryRelevance: true, dataSensitivity: 'Medium' as any, controlIds: ['CTL-006'] },
    { id: 'VND-003', name: 'Cerner (Oracle Health)', tier: 1 as any, category: 'Health IT', criticality: 'High', services: ['Lab Information System', 'Pharmacy Management'], location: 'Kansas City, MO', inherentRisk: 4, residualRisk: 3, slaStatus: 'Yellow', contractExpiry: new Date('2027-03-31'), lastAssessmentDate: new Date('2025-12-15'), nextReviewDate: new Date('2026-06-15'), regulatoryRelevance: true, dataSensitivity: 'High' as any, controlIds: ['CTL-003'] },
    { id: 'VND-004', name: 'Iron Mountain', tier: 2 as any, category: 'Records Management', criticality: 'Medium', services: ['Medical Records Storage', 'Secure Destruction'], location: 'Boston, MA', inherentRisk: 3, residualRisk: 2, slaStatus: 'Green', contractExpiry: new Date('2027-09-30'), lastAssessmentDate: new Date('2025-11-01'), nextReviewDate: new Date('2026-05-01'), regulatoryRelevance: true, dataSensitivity: 'High' as any, controlIds: ['CTL-007'] },
    { id: 'VND-005', name: 'Philips Healthcare', tier: 2 as any, category: 'Medical Devices', criticality: 'High', services: ['MRI Systems', 'Patient Monitoring', 'Imaging Software'], location: 'Cambridge, MA', inherentRisk: 4, residualRisk: 3, slaStatus: 'Red', contractExpiry: new Date('2027-12-31'), lastAssessmentDate: new Date('2026-01-20'), nextReviewDate: new Date('2026-04-20'), regulatoryRelevance: true, dataSensitivity: 'Medium' as any, controlIds: ['CTL-010'] },
  ];

  const kris: KRI[] = [
    { id: 'KRI-001', name: 'PHI Breach Incident Count', category: 'Cyber', currentValue: 2, threshold: 0, unit: 'count', breachLevel: 'Breach', trend: 'Deteriorating', owner: 'ciso@hospital.org', lastUpdated: new Date('2026-02-15'), riskId: 'RSK-001' },
    { id: 'KRI-002', name: 'Adverse Drug Event Rate', category: 'Clinical' as any, currentValue: 3.8, threshold: 2, unit: 'per 1000 doses', breachLevel: 'Breach', trend: 'Stable', owner: 'cmo@hospital.org', lastUpdated: new Date('2026-02-10'), riskId: 'RSK-002' },
    { id: 'KRI-003', name: 'Unpatched Medical Device CVEs', category: 'Cyber', currentValue: 18, threshold: 5, unit: 'count', breachLevel: 'Critical', trend: 'Deteriorating', owner: 'biomed@hospital.org', lastUpdated: new Date('2026-02-12'), riskId: 'RSK-003' },
    { id: 'KRI-004', name: 'BAA Compliance Gap Count', category: 'Compliance', currentValue: 4, threshold: 2, unit: 'count', breachLevel: 'Breach', trend: 'Stable', owner: 'privacy@hospital.org', lastUpdated: new Date('2026-02-01'), riskId: 'RSK-004' },
    { id: 'KRI-005', name: 'ICU Nurse-to-Patient Ratio', category: 'Operational', currentValue: 1.8, threshold: 2.0, unit: 'ratio', breachLevel: 'Warning', trend: 'Deteriorating', owner: 'cno@hospital.org', lastUpdated: new Date('2026-02-14'), riskId: 'RSK-005' },
    { id: 'KRI-006', name: 'Connected Medical Devices Unpatched', category: 'Cyber', currentValue: 42, threshold: 20, unit: 'count', breachLevel: 'Breach', trend: 'Deteriorating', owner: 'biomed@hospital.org', lastUpdated: new Date('2026-02-08'), riskId: 'RSK-006' },
    { id: 'KRI-007', name: 'Hospital Readmission Rate (30-day)', category: 'Financial' as any, currentValue: 16.2, threshold: 14, unit: '%', breachLevel: 'Warning', trend: 'Stable', owner: 'quality@hospital.org', lastUpdated: new Date('2026-02-05'), riskId: 'RSK-007' },
    { id: 'KRI-008', name: 'HCAHPS Overall Rating', category: 'Reputation' as any, currentValue: 3.2, threshold: 3.5, unit: 'out of 5', breachLevel: 'Warning', trend: 'Improving', owner: 'quality@hospital.org', lastUpdated: new Date('2026-02-01'), riskId: 'RSK-007' },
  ];

  const issues: Issue[] = [
    { id: 'ISS-001', title: 'HIPAA Risk Assessment Overdue – Annual Review', severity: 'High', status: 'Overdue', source: 'Internal Audit' as any, owner: 'privacy@hospital.org', dueDate: new Date('2026-01-31'), description: 'Annual HIPAA risk assessment not completed within required timeframe.', remediationPlan: 'Schedule comprehensive risk assessment with external consultant.', mraType: 'MRA', riskIds: ['RSK-004'], controlIds: ['CTL-007'] },
    { id: 'ISS-002', title: 'Medical Device Network Segmentation Incomplete', severity: 'Critical', status: 'In Progress', source: 'Self-Identified' as any, owner: 'ciso@hospital.org', dueDate: new Date('2026-04-30'), description: 'Network segmentation project for IoMT devices is 60% complete. Remaining devices on flat network.', remediationPlan: 'Complete VLAN migration for remaining 40% of medical devices.', mraType: 'MRIA', riskIds: ['RSK-006'], controlIds: ['CTL-005'] },
    { id: 'ISS-003', title: 'Business Associate Agreement Gaps – 4 Vendors', severity: 'High', status: 'Open', source: 'Regulatory Exam' as any, owner: 'privacy@hospital.org', dueDate: new Date('2026-03-31'), description: 'OCR audit identified 4 vendors handling PHI without current BAAs.', remediationPlan: 'Immediate outreach to non-compliant vendors for BAA execution.', mraType: 'MRA', riskIds: ['RSK-004'], controlIds: ['CTL-007'] },
    { id: 'ISS-004', title: 'ED Wait Time Exceeding Target – Staffing Impact', severity: 'Medium', status: 'In Progress', source: 'Self-Identified' as any, owner: 'cno@hospital.org', dueDate: new Date('2026-05-15'), description: 'Average ED wait time 45 minutes above target due to staffing shortages.', remediationPlan: 'Implement travel nurse contracts and accelerated hiring pipeline.', mraType: null, riskIds: ['RSK-005'], controlIds: ['CTL-009'] },
  ];

  const lossEvents: LossEvent[] = [
    { id: 'LE-001', title: 'PHI Breach – Stolen Laptop with Unencrypted Patient Records', category: 'Cyber' as any, amount: 2500000, recoveryAmount: 500000, date: new Date('2025-08-15'), businessUnit: 'Ambulatory Care', status: 'Closed', riskId: 'RSK-001', description: 'Laptop containing unencrypted PHI for 12,000 patients stolen from physician vehicle.' },
    { id: 'LE-002', title: 'Medication Error – Wrong Dose Administration', category: 'Clinical' as any, amount: 800000, recoveryAmount: 200000, date: new Date('2025-11-20'), businessUnit: 'Nursing', status: 'Closed', riskId: 'RSK-002', description: 'CPOE alert overridden resulting in 10x dose administration. Patient required ICU transfer.' },
    { id: 'LE-003', title: 'Ransomware Incident – 72-hour System Downtime', category: 'Cyber' as any, amount: 4200000, recoveryAmount: 1800000, date: new Date('2025-06-10'), businessUnit: 'Health IT', status: 'Closed', riskId: 'RSK-003', description: 'Ransomware encrypted radiology PACS. 72-hour downtime for imaging. Procedures diverted.' },
  ];

  const regulatoryChanges: RegulatoryChange[] = [
    { id: 'RC-001', title: 'HIPAA Security Rule Update – Encryption Requirements', source: 'HHS' as any, status: 'Implementation', impactLevel: 'High', effectiveDate: new Date('2026-06-01'), summary: 'Updated HIPAA Security Rule mandating encryption for all ePHI at rest and in transit.', affectedFrameworks: ['HIPAA-SR'], actionPlanOwner: 'ciso@hospital.org', actionPlanDueDate: new Date('2026-05-15') },
    { id: 'RC-002', title: 'CMS Interoperability & Prior Authorization Final Rule', source: 'CMS' as any, status: 'Implementation', impactLevel: 'Medium', effectiveDate: new Date('2026-01-01'), summary: 'Requires payers and providers to implement FHIR-based APIs for patient data exchange.', affectedFrameworks: ['HITECH'], actionPlanOwner: 'cto@hospital.org', actionPlanDueDate: new Date('2026-03-31') },
  ];

  const monitoringAlerts: MonitoringAlert[] = [
    { id: 'MA-001', vendorId: 'VND-005', severity: 'Critical', type: 'SLA Breach' as any, message: 'Philips Healthcare MRI maintenance SLA missed – 48-hour response exceeded', timestamp: new Date('2026-02-12'), acknowledged: false },
    { id: 'MA-002', vendorId: 'VND-003', severity: 'High', type: 'Data Incident' as any, message: 'Cerner system latency spike – EHR response times > 5s for 30 minutes', timestamp: new Date('2026-02-10'), acknowledged: true },
    { id: 'MA-003', vendorId: 'VND-001', severity: 'Medium', type: 'Regulatory Filing' as any, message: 'Epic Systems released HIPAA compliance update – review required', timestamp: new Date('2026-02-08'), acknowledged: false },
  ];

  return {
    risks, controls, vendors, issues, kris, lossEvents, regulatoryChanges, monitoringAlerts,
    auditLog: bankingSeedData.auditLog, // Reuse generic audit log structure
    riskScenarios: bankingSeedData.riskScenarios, // Reuse scenario structure
  };
}


// ============================================================================
// TECHNOLOGY
// ============================================================================
function generateTechnologyData(): IndustrySeedBundle {
  const risks: Risk[] = [
    { id: 'RSK-001', title: 'Customer Data Breach via API Vulnerability', category: 'Cyber' as any, description: 'Unauthenticated API endpoint in v2 REST API exposing customer PII. OWASP Top 10 BOLA vulnerability pattern.', businessUnit: 'Engineering', impact: 5, likelihood: 3, inherentScore: 15, residualScore: 8, owner: 'ciso@company.io', status: 'Active', controlIds: ['CTL-001', 'CTL-002'], kpiIds: ['KRI-001'], lastAssessmentDate: new Date('2026-02-15'), nextReviewDate: new Date('2026-05-15'), createdAt: new Date('2025-06-01'), updatedAt: new Date('2026-02-15') },
    { id: 'RSK-002', title: 'AI Model Bias – Hiring Algorithm Fairness', category: 'AI' as any, description: 'ML model used in customer-facing recommendation engine showing demographic bias. EU AI Act high-risk system classification.', businessUnit: 'Data Science', impact: 4, likelihood: 3, inherentScore: 12, residualScore: 6, owner: 'ml-lead@company.io', status: 'Active', controlIds: ['CTL-003', 'CTL-004'], kpiIds: ['KRI-002'], lastAssessmentDate: new Date('2026-02-01'), nextReviewDate: new Date('2026-08-01'), createdAt: new Date('2025-03-20'), updatedAt: new Date('2026-02-01') },
    { id: 'RSK-003', title: 'Platform Availability – Multi-Region Failover', category: 'Operational' as any, description: 'Single-region deployment for primary database. RTO of 4 hours exceeds enterprise customer SLA of 1 hour.', businessUnit: 'DevOps', impact: 5, likelihood: 2, inherentScore: 10, residualScore: 6, owner: 'sre-lead@company.io', status: 'Active', controlIds: ['CTL-005', 'CTL-006'], kpiIds: ['KRI-003'], lastAssessmentDate: new Date('2026-01-20'), nextReviewDate: new Date('2026-07-20'), createdAt: new Date('2025-05-10'), updatedAt: new Date('2026-01-20') },
    { id: 'RSK-004', title: 'GDPR Right to Erasure – Data Deletion Pipeline', category: 'Privacy' as any, description: 'Incomplete data deletion across microservices. Customer PII persists in analytics data lake and backup systems beyond retention period.', businessUnit: 'Engineering', impact: 4, likelihood: 3, inherentScore: 12, residualScore: 8, owner: 'dpo@company.io', status: 'Active', controlIds: ['CTL-007', 'CTL-008'], kpiIds: ['KRI-004'], lastAssessmentDate: new Date('2026-01-15'), nextReviewDate: new Date('2026-07-15'), createdAt: new Date('2025-02-01'), updatedAt: new Date('2026-01-15') },
    { id: 'RSK-005', title: 'Supply Chain Attack – Open Source Dependency', category: 'ThirdParty' as any, description: 'Critical npm/PyPI dependencies with 200+ transitive packages. Risk of compromised upstream packages (XZ Utils pattern).', businessUnit: 'Security', impact: 5, likelihood: 2, inherentScore: 10, residualScore: 5, owner: 'security-lead@company.io', status: 'Active', controlIds: ['CTL-009', 'CTL-010'], kpiIds: ['KRI-005'], lastAssessmentDate: new Date('2026-02-10'), nextReviewDate: new Date('2026-05-10'), createdAt: new Date('2025-01-15'), updatedAt: new Date('2026-02-10') },
    { id: 'RSK-006', title: 'SOC 2 Type II Audit Finding – Access Reviews', category: 'Compliance' as any, description: 'Previous SOC 2 audit identified gaps in quarterly user access reviews for production systems. Remediation in progress.', businessUnit: 'Security', impact: 3, likelihood: 3, inherentScore: 9, residualScore: 4, owner: 'compliance@company.io', status: 'Active', controlIds: ['CTL-011', 'CTL-012'], kpiIds: ['KRI-006'], lastAssessmentDate: new Date('2026-01-05'), nextReviewDate: new Date('2026-04-05'), createdAt: new Date('2025-08-01'), updatedAt: new Date('2026-01-05') },
  ];

  const controls: Control[] = [
    { id: 'CTL-001', title: 'API Authentication & Rate Limiting', framework: 'SOC 2' as any, controlType: 'Preventive', status: 'Implemented', effectiveness: 'Effective', testFrequency: 'Quarterly', lastTested: new Date('2026-01-15'), nextReview: new Date('2026-04-15'), owner: 'security-lead@company.io', description: 'OAuth 2.0 + API key authentication with per-client rate limits', evidence: 'Pen test report, API gateway logs', riskIds: ['RSK-001'], linkedRiskIds: ['RSK-001'] },
    { id: 'CTL-002', title: 'SAST/DAST Pipeline Integration', framework: 'NIST' as any, controlType: 'Detective', status: 'Implemented', effectiveness: 'Effective', testFrequency: 'Continuous', lastTested: new Date('2026-02-15'), nextReview: new Date('2026-03-15'), owner: 'security-lead@company.io', description: 'Automated static and dynamic security testing in CI/CD pipeline', evidence: 'Scan reports, blocking policy config', riskIds: ['RSK-001'], linkedRiskIds: ['RSK-001'] },
    { id: 'CTL-003', title: 'AI Model Bias Testing Framework', framework: 'AI-RMF' as any, controlType: 'Detective', status: 'Implemented', effectiveness: 'Partially Effective', testFrequency: 'Monthly', lastTested: new Date('2026-02-01'), nextReview: new Date('2026-03-01'), owner: 'ml-lead@company.io', description: 'Automated fairness metrics across protected attributes', evidence: 'Bias audit reports, model cards', riskIds: ['RSK-002'], linkedRiskIds: ['RSK-002'] },
    { id: 'CTL-004', title: 'AI Model Governance Board Review', framework: 'ISO42001' as any, controlType: 'Preventive', status: 'Implemented', effectiveness: 'Effective', testFrequency: 'Quarterly', lastTested: new Date('2026-01-20'), nextReview: new Date('2026-04-20'), owner: 'ml-lead@company.io', description: 'Cross-functional review board for model deployment approvals', evidence: 'Meeting minutes, approval records', riskIds: ['RSK-002'], linkedRiskIds: ['RSK-002'] },
    { id: 'CTL-005', title: 'Multi-Region Database Replication', framework: 'SOC 2' as any, controlType: 'Preventive', status: 'Partially Implemented', effectiveness: 'Partially Effective', testFrequency: 'Quarterly', lastTested: new Date('2025-11-15'), nextReview: new Date('2026-05-15'), owner: 'sre-lead@company.io', description: 'Active-passive database replication across two AWS regions', evidence: 'Replication lag metrics, DR test reports', riskIds: ['RSK-003'], linkedRiskIds: ['RSK-003'] },
    { id: 'CTL-006', title: 'Chaos Engineering Program', framework: 'SOC 2' as any, controlType: 'Detective', status: 'Implemented', effectiveness: 'Effective', testFrequency: 'Monthly', lastTested: new Date('2026-02-05'), nextReview: new Date('2026-03-05'), owner: 'sre-lead@company.io', description: 'Monthly chaos experiments to validate failover and resilience', evidence: 'Game day reports, incident post-mortems', riskIds: ['RSK-003'], linkedRiskIds: ['RSK-003'] },
    { id: 'CTL-007', title: 'Data Subject Rights Automation', framework: 'GDPR' as any, controlType: 'Preventive', status: 'Implemented', effectiveness: 'Partially Effective', testFrequency: 'Quarterly', lastTested: new Date('2026-01-10'), nextReview: new Date('2026-04-10'), owner: 'dpo@company.io', description: 'Automated DSAR processing pipeline for access, deletion, and portability', evidence: 'DSAR completion metrics, audit logs', riskIds: ['RSK-004'], linkedRiskIds: ['RSK-004'] },
    { id: 'CTL-008', title: 'Data Retention & Purge Policies', framework: 'GDPR' as any, controlType: 'Preventive', status: 'Partially Implemented', effectiveness: 'Partially Effective', testFrequency: 'Quarterly', lastTested: new Date('2026-01-15'), nextReview: new Date('2026-04-15'), owner: 'dpo@company.io', description: 'Automated data lifecycle management with configurable retention periods', evidence: 'Retention policy docs, purge job logs', riskIds: ['RSK-004'], linkedRiskIds: ['RSK-004'] },
    { id: 'CTL-009', title: 'Software Composition Analysis (SCA)', framework: 'NIST' as any, controlType: 'Detective', status: 'Implemented', effectiveness: 'Effective', testFrequency: 'Continuous', lastTested: new Date('2026-02-15'), nextReview: new Date('2026-03-15'), owner: 'security-lead@company.io', description: 'Automated dependency scanning for known CVEs and license violations', evidence: 'SCA dashboard, SBOM reports', riskIds: ['RSK-005'], linkedRiskIds: ['RSK-005'] },
    { id: 'CTL-010', title: 'Signed Artifact Verification', framework: 'NIST' as any, controlType: 'Preventive', status: 'Implemented', effectiveness: 'Effective', testFrequency: 'Continuous', lastTested: new Date('2026-02-10'), nextReview: new Date('2026-03-10'), owner: 'devops-lead@company.io', description: 'Sigstore/Cosign verification for container images and build artifacts', evidence: 'Signing policy, verification logs', riskIds: ['RSK-005'], linkedRiskIds: ['RSK-005'] },
    { id: 'CTL-011', title: 'Quarterly User Access Review', framework: 'SOC 2' as any, controlType: 'Detective', status: 'Implemented', effectiveness: 'Effective', testFrequency: 'Quarterly', lastTested: new Date('2026-01-31'), nextReview: new Date('2026-04-30'), owner: 'compliance@company.io', description: 'Automated quarterly review of user access to production and sensitive systems', evidence: 'Access review reports, remediation tracking', riskIds: ['RSK-006'], linkedRiskIds: ['RSK-006'] },
    { id: 'CTL-012', title: 'JIT/PAM for Production Access', framework: 'SOC 2' as any, controlType: 'Preventive', status: 'Implemented', effectiveness: 'Effective', testFrequency: 'Quarterly', lastTested: new Date('2026-02-01'), nextReview: new Date('2026-05-01'), owner: 'security-lead@company.io', description: 'Just-in-time privileged access with time-boxed sessions and full audit logging', evidence: 'PAM session logs, approval workflows', riskIds: ['RSK-006'], linkedRiskIds: ['RSK-006'] },
  ];

  const vendors: Vendor[] = [
    { id: 'VND-001', name: 'Amazon Web Services', tier: 1 as any, category: 'Cloud Infrastructure', criticality: 'Critical', services: ['Compute (EC2/ECS)', 'Database (RDS/Aurora)', 'Storage (S3)', 'CDN (CloudFront)'], location: 'Seattle, WA', inherentRisk: 4, residualRisk: 2, slaStatus: 'Green', contractExpiry: new Date('2028-12-31'), lastAssessmentDate: new Date('2026-01-15'), nextReviewDate: new Date('2026-04-15'), regulatoryRelevance: true, dataSensitivity: 'High' as any, controlIds: ['CTL-005'] },
    { id: 'VND-002', name: 'Datadog', tier: 1 as any, category: 'Observability', criticality: 'High', services: ['APM', 'Log Management', 'Infrastructure Monitoring'], location: 'New York, NY', inherentRisk: 3, residualRisk: 2, slaStatus: 'Green', contractExpiry: new Date('2027-06-30'), lastAssessmentDate: new Date('2026-02-01'), nextReviewDate: new Date('2026-05-01'), regulatoryRelevance: false, dataSensitivity: 'Medium' as any, controlIds: [] },
    { id: 'VND-003', name: 'Stripe', tier: 1 as any, category: 'Payment Processing', criticality: 'Critical', services: ['Payment Gateway', 'Billing', 'Fraud Detection'], location: 'San Francisco, CA', inherentRisk: 5, residualRisk: 2, slaStatus: 'Green', contractExpiry: new Date('2027-12-31'), lastAssessmentDate: new Date('2025-12-15'), nextReviewDate: new Date('2026-06-15'), regulatoryRelevance: true, dataSensitivity: 'High' as any, controlIds: ['CTL-001'] },
    { id: 'VND-004', name: 'Anthropic', tier: 2 as any, category: 'AI/ML Provider', criticality: 'High', services: ['Claude API', 'Enterprise AI'], location: 'San Francisco, CA', inherentRisk: 3, residualRisk: 2, slaStatus: 'Green', contractExpiry: new Date('2027-03-31'), lastAssessmentDate: new Date('2026-01-20'), nextReviewDate: new Date('2026-07-20'), regulatoryRelevance: true, dataSensitivity: 'High' as any, controlIds: ['CTL-003', 'CTL-004'] },
    { id: 'VND-005', name: 'Snyk', tier: 2 as any, category: 'Application Security', criticality: 'Medium', services: ['SCA', 'Container Security', 'IaC Scanning'], location: 'Boston, MA', inherentRisk: 2, residualRisk: 1, slaStatus: 'Green', contractExpiry: new Date('2027-09-30'), lastAssessmentDate: new Date('2026-02-05'), nextReviewDate: new Date('2026-08-05'), regulatoryRelevance: false, dataSensitivity: 'Low' as any, controlIds: ['CTL-009'] },
  ];

  const kris: KRI[] = [
    { id: 'KRI-001', name: 'Critical CVE Count (Unpatched > 7 days)', category: 'Cyber', currentValue: 7, threshold: 3, unit: 'count', breachLevel: 'Breach', trend: 'Deteriorating', owner: 'security-lead@company.io', lastUpdated: new Date('2026-02-15'), riskId: 'RSK-001' },
    { id: 'KRI-002', name: 'AI Model Fairness Score (Demographic Parity)', category: 'AI' as any, currentValue: 0.78, threshold: 0.85, unit: 'score', breachLevel: 'Warning', trend: 'Improving', owner: 'ml-lead@company.io', lastUpdated: new Date('2026-02-01'), riskId: 'RSK-002' },
    { id: 'KRI-003', name: 'Platform Uptime (30-day rolling)', category: 'Operational', currentValue: 99.92, threshold: 99.95, unit: '%', breachLevel: 'Warning', trend: 'Stable', owner: 'sre-lead@company.io', lastUpdated: new Date('2026-02-15'), riskId: 'RSK-003' },
    { id: 'KRI-004', name: 'DSAR Overdue Count', category: 'Privacy' as any, currentValue: 3, threshold: 0, unit: 'count', breachLevel: 'Breach', trend: 'Stable', owner: 'dpo@company.io', lastUpdated: new Date('2026-02-10'), riskId: 'RSK-004' },
    { id: 'KRI-005', name: 'Critical Dependency CVEs', category: 'ThirdParty' as any, currentValue: 4, threshold: 2, unit: 'count', breachLevel: 'Breach', trend: 'Deteriorating', owner: 'security-lead@company.io', lastUpdated: new Date('2026-02-12'), riskId: 'RSK-005' },
    { id: 'KRI-006', name: 'SOC 2 Open Observations', category: 'Compliance', currentValue: 2, threshold: 3, unit: 'count', breachLevel: 'Normal', trend: 'Improving', owner: 'compliance@company.io', lastUpdated: new Date('2026-02-01'), riskId: 'RSK-006' },
  ];

  const issues: Issue[] = [
    { id: 'ISS-001', title: 'GDPR Data Deletion Pipeline – Incomplete Coverage', severity: 'High', status: 'In Progress', source: 'Internal Audit' as any, owner: 'dpo@company.io', dueDate: new Date('2026-04-30'), description: 'Data deletion pipeline does not cover analytics data lake. 30% of customer PII persists beyond retention.', remediationPlan: 'Extend deletion pipeline to Snowflake and S3 data lake.', mraType: 'MRA', riskIds: ['RSK-004'], controlIds: ['CTL-008'] },
    { id: 'ISS-002', title: 'SOC 2 Observation – Production Access Reviews', severity: 'Medium', status: 'In Progress', source: 'External Audit' as any, owner: 'compliance@company.io', dueDate: new Date('2026-03-31'), description: 'Q3 access review was completed 15 days late for 3 production systems.', remediationPlan: 'Implement automated access review reminders and escalation.', mraType: null, riskIds: ['RSK-006'], controlIds: ['CTL-011'] },
    { id: 'ISS-003', title: 'AI Model Card Documentation Gap', severity: 'Medium', status: 'Open', source: 'Self-Identified' as any, owner: 'ml-lead@company.io', dueDate: new Date('2026-05-15'), description: 'Model cards missing for 2 of 5 production ML models. EU AI Act requires documentation for high-risk systems.', remediationPlan: 'Create model cards with bias metrics, training data description, and limitation disclosure.', mraType: null, riskIds: ['RSK-002'], controlIds: ['CTL-003'] },
  ];

  const lossEvents: LossEvent[] = [
    { id: 'LE-001', title: 'Production Outage – Database Failover Failure', category: 'Operational', amount: 850000, recoveryAmount: 200000, date: new Date('2025-09-15'), businessUnit: 'Engineering', status: 'Closed', riskId: 'RSK-003', description: '4-hour production outage due to failed database failover. SLA credits issued to enterprise customers.' },
    { id: 'LE-002', title: 'GDPR Fine – Data Retention Violation', category: 'Compliance', amount: 1200000, recoveryAmount: 0, date: new Date('2025-07-20'), businessUnit: 'Legal', status: 'Closed', riskId: 'RSK-004', description: 'EU DPA fine for retaining customer data beyond consented retention period.' },
  ];

  const regulatoryChanges: RegulatoryChange[] = [
    { id: 'RC-001', title: 'EU AI Act – High-Risk System Requirements', source: 'EU Commission' as any, status: 'Implementation', impactLevel: 'High', effectiveDate: new Date('2026-08-01'), summary: 'Mandatory conformity assessment, risk management, and transparency requirements for high-risk AI systems.', affectedFrameworks: ['AI-RMF', 'ISO42001'], actionPlanOwner: 'ml-lead@company.io', actionPlanDueDate: new Date('2026-07-01') },
    { id: 'RC-002', title: 'CCPA/CPRA Enforcement Update – Automated Decision-Making', source: 'CPPA' as any, status: 'Monitoring', impactLevel: 'Medium', effectiveDate: new Date('2026-07-01'), summary: 'New requirements for disclosure and opt-out of automated decision-making technologies.', affectedFrameworks: ['CCPA'], actionPlanOwner: 'dpo@company.io', actionPlanDueDate: new Date('2026-06-01') },
  ];

  const monitoringAlerts: MonitoringAlert[] = [
    { id: 'MA-001', vendorId: 'VND-001', severity: 'Medium', type: 'SLA Breach' as any, message: 'AWS us-east-1 latency spike – p99 > 200ms for 15 minutes', timestamp: new Date('2026-02-12'), acknowledged: true },
    { id: 'MA-002', vendorId: 'VND-004', severity: 'Low', type: 'Regulatory Filing' as any, message: 'Anthropic updated Claude usage policy – review data processing addendum', timestamp: new Date('2026-02-10'), acknowledged: false },
  ];

  return {
    risks, controls, vendors, issues, kris, lossEvents, regulatoryChanges, monitoringAlerts,
    auditLog: bankingSeedData.auditLog,
    riskScenarios: bankingSeedData.riskScenarios,
  };
}


// ============================================================================
// ENERGY (Compact — uses representative data)
// ============================================================================
function generateEnergyData(): IndustrySeedBundle {
  const risks: Risk[] = [
    { id: 'RSK-001', title: 'SCADA/ICS Cyber Intrusion – Grid Control Systems', category: 'Cyber' as any, description: 'Nation-state threat actor targeting operational technology networks. NERC CIP compliance gap in network segmentation between IT and OT environments.', businessUnit: 'Grid Operations', impact: 5, likelihood: 3, inherentScore: 15, residualScore: 9, owner: 'ot-security@utility.com', status: 'Active', controlIds: ['CTL-001', 'CTL-002'], kpiIds: ['KRI-001'], lastAssessmentDate: new Date('2026-02-15'), nextReviewDate: new Date('2026-05-15'), createdAt: new Date('2025-06-01'), updatedAt: new Date('2026-02-15') },
    { id: 'RSK-002', title: 'Pipeline Integrity – Corrosion Monitoring Gaps', category: 'Safety' as any, description: 'Aging pipeline infrastructure with incomplete inline inspection coverage. PHMSA compliance risk for integrity management program.', businessUnit: 'Pipeline Operations', impact: 5, likelihood: 2, inherentScore: 10, residualScore: 6, owner: 'safety@utility.com', status: 'Active', controlIds: ['CTL-003', 'CTL-004'], kpiIds: ['KRI-002'], lastAssessmentDate: new Date('2026-02-01'), nextReviewDate: new Date('2026-08-01'), createdAt: new Date('2025-03-20'), updatedAt: new Date('2026-02-01') },
    { id: 'RSK-003', title: 'NERC CIP Compliance – Electronic Security Perimeter', category: 'Compliance' as any, description: 'Gap in electronic security perimeter controls for medium-impact BES Cyber Systems. Potential NERC CIP-005 violation.', businessUnit: 'Compliance', impact: 4, likelihood: 3, inherentScore: 12, residualScore: 6, owner: 'nerc-compliance@utility.com', status: 'Active', controlIds: ['CTL-005', 'CTL-006'], kpiIds: ['KRI-003'], lastAssessmentDate: new Date('2026-01-20'), nextReviewDate: new Date('2026-07-20'), createdAt: new Date('2025-05-10'), updatedAt: new Date('2026-01-20') },
    { id: 'RSK-004', title: 'Extreme Weather Event – Grid Resilience', category: 'Climate' as any, description: 'Increasing frequency of extreme weather events impacting transmission and distribution infrastructure. Winter storm and wildfire exposure.', businessUnit: 'Transmission', impact: 5, likelihood: 4, inherentScore: 20, residualScore: 14, owner: 'resilience@utility.com', status: 'Active', controlIds: ['CTL-007'], kpiIds: ['KRI-004'], lastAssessmentDate: new Date('2026-01-15'), nextReviewDate: new Date('2026-04-15'), createdAt: new Date('2025-02-01'), updatedAt: new Date('2026-01-15') },
    { id: 'RSK-005', title: 'Workplace Safety – Contractor Incident Rate', category: 'Safety' as any, description: 'Elevated OSHA recordable rate among contractor workforce performing transmission line maintenance and substation work.', businessUnit: 'HSE', impact: 4, likelihood: 3, inherentScore: 12, residualScore: 8, owner: 'hse@utility.com', status: 'Active', controlIds: ['CTL-008', 'CTL-009'], kpiIds: ['KRI-005'], lastAssessmentDate: new Date('2026-02-10'), nextReviewDate: new Date('2026-05-10'), createdAt: new Date('2025-01-15'), updatedAt: new Date('2026-02-10') },
    { id: 'RSK-006', title: 'Carbon Emission Targets – Decarbonization Pace', category: 'Environmental' as any, description: 'Risk of missing 2030 emissions reduction targets. Renewable energy buildout behind schedule due to permitting and interconnection delays.', businessUnit: 'Generation', impact: 4, likelihood: 3, inherentScore: 12, residualScore: 8, owner: 'sustainability@utility.com', status: 'Active', controlIds: ['CTL-010'], kpiIds: ['KRI-006'], lastAssessmentDate: new Date('2026-01-05'), nextReviewDate: new Date('2026-07-05'), createdAt: new Date('2025-08-01'), updatedAt: new Date('2026-01-05') },
  ];

  const controls: Control[] = [
    { id: 'CTL-001', title: 'IT-OT Network Segmentation & Firewall Rules', framework: 'NERC-CIP' as any, controlType: 'Preventive', status: 'Implemented', effectiveness: 'Effective', testFrequency: 'Quarterly', lastTested: new Date('2026-01-15'), nextReview: new Date('2026-04-15'), owner: 'ot-security@utility.com', description: 'Enforced network segmentation between IT and OT environments with NERC CIP-005 compliant firewalls', evidence: 'Firewall rule reviews, network diagrams', riskIds: ['RSK-001'], linkedRiskIds: ['RSK-001'] },
    { id: 'CTL-002', title: 'SCADA Intrusion Detection System', framework: 'NERC-CIP' as any, controlType: 'Detective', status: 'Implemented', effectiveness: 'Effective', testFrequency: 'Monthly', lastTested: new Date('2026-02-01'), nextReview: new Date('2026-03-01'), owner: 'ot-security@utility.com', description: 'OT-specific IDS monitoring SCADA protocols (DNP3, Modbus, IEC 61850)', evidence: 'IDS alert logs, tuning reports', riskIds: ['RSK-001'], linkedRiskIds: ['RSK-001'] },
    { id: 'CTL-003', title: 'Inline Inspection (ILI) Program', framework: 'API' as any, controlType: 'Detective', status: 'Implemented', effectiveness: 'Partially Effective', testFrequency: 'Annual', lastTested: new Date('2025-10-15'), nextReview: new Date('2026-10-15'), owner: 'pipeline-integrity@utility.com', description: 'Smart pig runs for pipeline wall thickness and anomaly detection', evidence: 'ILI reports, anomaly tracking', riskIds: ['RSK-002'], linkedRiskIds: ['RSK-002'] },
    { id: 'CTL-004', title: 'Cathodic Protection Monitoring', framework: 'API' as any, controlType: 'Preventive', status: 'Implemented', effectiveness: 'Effective', testFrequency: 'Monthly', lastTested: new Date('2026-01-20'), nextReview: new Date('2026-02-20'), owner: 'pipeline-integrity@utility.com', description: 'Continuous cathodic protection monitoring with remote reading capabilities', evidence: 'CP survey data, rectifier readings', riskIds: ['RSK-002'], linkedRiskIds: ['RSK-002'] },
    { id: 'CTL-005', title: 'Electronic Security Perimeter Controls', framework: 'NERC-CIP' as any, controlType: 'Preventive', status: 'Partially Implemented', effectiveness: 'Partially Effective', testFrequency: 'Quarterly', lastTested: new Date('2025-11-15'), nextReview: new Date('2026-05-15'), owner: 'nerc-compliance@utility.com', description: 'Access controls for BES Cyber Systems electronic security perimeters', evidence: 'Access logs, perimeter device inventory', riskIds: ['RSK-003'], linkedRiskIds: ['RSK-003'] },
    { id: 'CTL-006', title: 'NERC CIP Compliance Self-Assessment', framework: 'NERC-CIP' as any, controlType: 'Detective', status: 'Implemented', effectiveness: 'Effective', testFrequency: 'Annual', lastTested: new Date('2025-12-01'), nextReview: new Date('2026-12-01'), owner: 'nerc-compliance@utility.com', description: 'Annual internal assessment against all applicable CIP standards', evidence: 'Self-assessment report, gap analysis', riskIds: ['RSK-003'], linkedRiskIds: ['RSK-003'] },
    { id: 'CTL-007', title: 'Storm Hardening & Vegetation Management', framework: 'FERC' as any, controlType: 'Preventive', status: 'Implemented', effectiveness: 'Partially Effective', testFrequency: 'Annual', lastTested: new Date('2025-09-15'), nextReview: new Date('2026-09-15'), owner: 'resilience@utility.com', description: 'Transmission line hardening and right-of-way vegetation management', evidence: 'Vegetation management reports, hardening project tracker', riskIds: ['RSK-004'], linkedRiskIds: ['RSK-004'] },
    { id: 'CTL-008', title: 'Contractor Safety Qualification Program', framework: 'OSHA' as any, controlType: 'Preventive', status: 'Implemented', effectiveness: 'Effective', testFrequency: 'Quarterly', lastTested: new Date('2026-01-30'), nextReview: new Date('2026-04-30'), owner: 'hse@utility.com', description: 'ISNetworld qualification and safety pre-qualification for all contractors', evidence: 'ISNetworld scores, qualification records', riskIds: ['RSK-005'], linkedRiskIds: ['RSK-005'] },
    { id: 'CTL-009', title: 'Job Hazard Analysis (JHA) Program', framework: 'OSHA' as any, controlType: 'Preventive', status: 'Implemented', effectiveness: 'Effective', testFrequency: 'Continuous', lastTested: new Date('2026-02-10'), nextReview: new Date('2026-03-10'), owner: 'hse@utility.com', description: 'Pre-task JHA required for all field work activities', evidence: 'JHA completion rates, field audits', riskIds: ['RSK-005'], linkedRiskIds: ['RSK-005'] },
    { id: 'CTL-010', title: 'Renewable Portfolio Standard Tracking', framework: 'EPA' as any, controlType: 'Detective', status: 'Implemented', effectiveness: 'Effective', testFrequency: 'Monthly', lastTested: new Date('2026-02-01'), nextReview: new Date('2026-03-01'), owner: 'sustainability@utility.com', description: 'Monthly tracking of renewable energy generation vs. RPS targets', evidence: 'RPS compliance reports, REC inventory', riskIds: ['RSK-006'], linkedRiskIds: ['RSK-006'] },
  ];

  const vendors: Vendor[] = [
    { id: 'VND-001', name: 'Siemens Energy', tier: 1 as any, category: 'OT/SCADA', criticality: 'Critical', services: ['SCADA Systems', 'Grid Automation', 'Turbine Maintenance'], location: 'Orlando, FL', inherentRisk: 4, residualRisk: 2, slaStatus: 'Green', contractExpiry: new Date('2028-12-31'), lastAssessmentDate: new Date('2026-01-15'), nextReviewDate: new Date('2026-04-15'), regulatoryRelevance: true, dataSensitivity: 'High' as any, controlIds: ['CTL-001'] },
    { id: 'VND-002', name: 'Dragos', tier: 1 as any, category: 'OT Cybersecurity', criticality: 'Critical', services: ['OT Threat Detection', 'Incident Response', 'Vulnerability Management'], location: 'Hanover, MD', inherentRisk: 3, residualRisk: 1, slaStatus: 'Green', contractExpiry: new Date('2027-06-30'), lastAssessmentDate: new Date('2026-02-01'), nextReviewDate: new Date('2026-05-01'), regulatoryRelevance: true, dataSensitivity: 'Medium' as any, controlIds: ['CTL-002'] },
    { id: 'VND-003', name: 'T.D. Williamson', tier: 2 as any, category: 'Pipeline Services', criticality: 'High', services: ['Inline Inspection', 'Hot Tapping', 'Pipeline Intervention'], location: 'Tulsa, OK', inherentRisk: 3, residualRisk: 2, slaStatus: 'Yellow', contractExpiry: new Date('2027-03-31'), lastAssessmentDate: new Date('2025-12-15'), nextReviewDate: new Date('2026-06-15'), regulatoryRelevance: true, dataSensitivity: 'Low' as any, controlIds: ['CTL-003'] },
  ];

  const kris: KRI[] = [
    { id: 'KRI-001', name: 'SCADA Intrusion Attempts (Monthly)', category: 'Cyber', currentValue: 23, threshold: 10, unit: 'count', breachLevel: 'Breach', trend: 'Deteriorating', owner: 'ot-security@utility.com', lastUpdated: new Date('2026-02-15'), riskId: 'RSK-001' },
    { id: 'KRI-002', name: 'Pipeline Anomalies Requiring Repair', category: 'Safety' as any, currentValue: 8, threshold: 5, unit: 'count', breachLevel: 'Warning', trend: 'Stable', owner: 'pipeline-integrity@utility.com', lastUpdated: new Date('2026-02-01'), riskId: 'RSK-002' },
    { id: 'KRI-003', name: 'NERC CIP Self-Assessment Gaps', category: 'Compliance', currentValue: 3, threshold: 0, unit: 'count', breachLevel: 'Breach', trend: 'Improving', owner: 'nerc-compliance@utility.com', lastUpdated: new Date('2026-01-20'), riskId: 'RSK-003' },
    { id: 'KRI-004', name: 'SAIDI (Avg Interruption Duration)', category: 'Operational', currentValue: 112, threshold: 90, unit: 'minutes', breachLevel: 'Warning', trend: 'Deteriorating', owner: 'resilience@utility.com', lastUpdated: new Date('2026-02-12'), riskId: 'RSK-004' },
    { id: 'KRI-005', name: 'OSHA Recordable Incident Rate', category: 'Safety' as any, currentValue: 2.1, threshold: 1.5, unit: 'per 200K hrs', breachLevel: 'Warning', trend: 'Stable', owner: 'hse@utility.com', lastUpdated: new Date('2026-02-08'), riskId: 'RSK-005' },
    { id: 'KRI-006', name: 'Renewable Generation vs Target', category: 'Environmental' as any, currentValue: 78, threshold: 85, unit: '%', breachLevel: 'Warning', trend: 'Improving', owner: 'sustainability@utility.com', lastUpdated: new Date('2026-02-01'), riskId: 'RSK-006' },
  ];

  const issues: Issue[] = [
    { id: 'ISS-001', title: 'NERC CIP-005 ESP Gap – Medium Impact Systems', severity: 'High', status: 'In Progress', source: 'Self-Identified' as any, owner: 'nerc-compliance@utility.com', dueDate: new Date('2026-04-30'), description: 'Electronic security perimeter controls incomplete for 3 medium-impact BES Cyber Systems.', remediationPlan: 'Deploy additional firewall rules and access control lists.', mraType: 'MRA', riskIds: ['RSK-003'], controlIds: ['CTL-005'] },
    { id: 'ISS-002', title: 'Contractor Safety Training – Gap in Fall Protection', severity: 'Critical', status: 'Open', source: 'Regulatory Exam' as any, owner: 'hse@utility.com', dueDate: new Date('2026-03-31'), description: 'OSHA inspection identified contractor crews without current fall protection certification.', remediationPlan: 'Suspend non-compliant contractors. Implement mandatory re-certification.', mraType: 'MRIA', riskIds: ['RSK-005'], controlIds: ['CTL-008'] },
  ];

  const lossEvents: LossEvent[] = [
    { id: 'LE-001', title: 'Winter Storm – Transmission Line Damage', category: 'Operational', amount: 15000000, recoveryAmount: 8000000, date: new Date('2025-12-20'), businessUnit: 'Transmission', status: 'Closed', riskId: 'RSK-004', description: 'Ice storm caused 45 transmission structure failures. 200,000 customers without power for 72+ hours.' },
    { id: 'LE-002', title: 'NERC CIP Penalty – Compliance Violation', category: 'Compliance', amount: 500000, recoveryAmount: 0, date: new Date('2025-08-15'), businessUnit: 'Compliance', status: 'Closed', riskId: 'RSK-003', description: 'NERC enforcement action for CIP-007 security patch management deficiency.' },
  ];

  const regulatoryChanges: RegulatoryChange[] = [
    { id: 'RC-001', title: 'NERC CIP-013 Supply Chain Risk Management Update', source: 'NERC' as any, status: 'Implementation', impactLevel: 'High', effectiveDate: new Date('2026-07-01'), summary: 'Enhanced supply chain risk management requirements for BES Cyber System components.', affectedFrameworks: ['NERC-CIP'], actionPlanOwner: 'nerc-compliance@utility.com', actionPlanDueDate: new Date('2026-06-15') },
    { id: 'RC-002', title: 'TSA Pipeline Security Directive – SD-02D', source: 'TSA' as any, status: 'Monitoring', impactLevel: 'High', effectiveDate: new Date('2026-04-01'), summary: 'Updated cybersecurity requirements for owner/operators of hazardous liquid and natural gas pipelines.', affectedFrameworks: ['TSA-PSD'], actionPlanOwner: 'ot-security@utility.com', actionPlanDueDate: new Date('2026-03-15') },
  ];

  const monitoringAlerts: MonitoringAlert[] = [
    { id: 'MA-001', vendorId: 'VND-003', severity: 'High', type: 'SLA Breach' as any, message: 'T.D. Williamson ILI report delivery 14 days overdue', timestamp: new Date('2026-02-12'), acknowledged: false },
    { id: 'MA-002', vendorId: 'VND-001', severity: 'Medium', type: 'Cyber Intel' as any, message: 'Siemens issued firmware advisory for SCADA RTU vulnerability (CVE-2026-1234)', timestamp: new Date('2026-02-10'), acknowledged: true },
  ];

  return {
    risks, controls, vendors, issues, kris, lossEvents, regulatoryChanges, monitoringAlerts,
    auditLog: bankingSeedData.auditLog,
    riskScenarios: bankingSeedData.riskScenarios,
  };
}


// ============================================================================
// MANUFACTURING
// ============================================================================
function generateManufacturingData(): IndustrySeedBundle {
  const risks: Risk[] = [
    { id: 'RSK-001', title: 'Product Quality Defect – Automotive Component Recall', category: 'Quality' as any, description: 'Dimensional tolerance drift in CNC machined brake components. Potential product recall affecting 50,000 units in field.', businessUnit: 'Production', impact: 5, likelihood: 2, inherentScore: 10, residualScore: 6, owner: 'quality-dir@mfg.com', status: 'Active', controlIds: ['CTL-001', 'CTL-002'], kpiIds: ['KRI-001'], lastAssessmentDate: new Date('2026-02-15'), nextReviewDate: new Date('2026-05-15'), createdAt: new Date('2025-06-01'), updatedAt: new Date('2026-02-15') },
    { id: 'RSK-002', title: 'Workplace Safety – Machine Guarding Compliance', category: 'Safety' as any, description: 'OSHA machine guarding standards compliance gaps on legacy press equipment. Amputation hazard classification.', businessUnit: 'HSE', impact: 5, likelihood: 3, inherentScore: 15, residualScore: 8, owner: 'hse-dir@mfg.com', status: 'Active', controlIds: ['CTL-003', 'CTL-004'], kpiIds: ['KRI-002'], lastAssessmentDate: new Date('2026-02-01'), nextReviewDate: new Date('2026-08-01'), createdAt: new Date('2025-03-20'), updatedAt: new Date('2026-02-01') },
    { id: 'RSK-003', title: 'Single-Source Supplier – Semiconductor Shortage', category: 'SupplyChain' as any, description: 'Critical electronic components sourced from single Tier 1 supplier in Taiwan. 16-week lead time with no qualified alternate.', businessUnit: 'Supply Chain', impact: 5, likelihood: 3, inherentScore: 15, residualScore: 10, owner: 'procurement@mfg.com', status: 'Active', controlIds: ['CTL-005', 'CTL-006'], kpiIds: ['KRI-003'], lastAssessmentDate: new Date('2026-01-20'), nextReviewDate: new Date('2026-04-20'), createdAt: new Date('2025-05-10'), updatedAt: new Date('2026-01-20') },
    { id: 'RSK-004', title: 'ICS/SCADA Security – Factory Floor OT Network', category: 'Cyber' as any, description: 'Industrial control systems on production floor accessible from corporate IT network. Legacy PLCs without authentication.', businessUnit: 'Engineering', impact: 4, likelihood: 3, inherentScore: 12, residualScore: 8, owner: 'it-security@mfg.com', status: 'Active', controlIds: ['CTL-007', 'CTL-008'], kpiIds: ['KRI-004'], lastAssessmentDate: new Date('2026-01-15'), nextReviewDate: new Date('2026-07-15'), createdAt: new Date('2025-02-01'), updatedAt: new Date('2026-01-15') },
    { id: 'RSK-005', title: 'ESG Reporting – Scope 1+2 Emissions Target', category: 'Environmental' as any, description: 'Carbon emissions trending 12% above 2026 reduction target. CSRD reporting requirements for EU operations.', businessUnit: 'Sustainability', impact: 3, likelihood: 4, inherentScore: 12, residualScore: 8, owner: 'sustainability@mfg.com', status: 'Active', controlIds: ['CTL-009', 'CTL-010'], kpiIds: ['KRI-005'], lastAssessmentDate: new Date('2026-02-10'), nextReviewDate: new Date('2026-05-10'), createdAt: new Date('2025-01-15'), updatedAt: new Date('2026-02-10') },
  ];

  const controls: Control[] = [
    { id: 'CTL-001', title: 'Statistical Process Control (SPC) Monitoring', framework: 'ISO9001' as any, controlType: 'Detective', status: 'Implemented', effectiveness: 'Effective', testFrequency: 'Continuous', lastTested: new Date('2026-02-15'), nextReview: new Date('2026-03-15'), owner: 'quality-eng@mfg.com', description: 'Real-time SPC monitoring on all critical dimension CTQs', evidence: 'SPC charts, Cp/Cpk reports', riskIds: ['RSK-001'], linkedRiskIds: ['RSK-001'] },
    { id: 'CTL-002', title: 'First Article Inspection (FAI) Protocol', framework: 'ISO9001' as any, controlType: 'Preventive', status: 'Implemented', effectiveness: 'Effective', testFrequency: 'Per Lot', lastTested: new Date('2026-02-10'), nextReview: new Date('2026-03-10'), owner: 'quality-eng@mfg.com', description: 'AS9102 first article inspection for every new lot and after setup changes', evidence: 'FAI reports, CMM data', riskIds: ['RSK-001'], linkedRiskIds: ['RSK-001'] },
    { id: 'CTL-003', title: 'Machine Guarding Audit Program', framework: 'OSHA' as any, controlType: 'Detective', status: 'Implemented', effectiveness: 'Partially Effective', testFrequency: 'Monthly', lastTested: new Date('2026-01-20'), nextReview: new Date('2026-02-20'), owner: 'hse-dir@mfg.com', description: 'Monthly machine guarding inspections per OSHA 29 CFR 1910.212', evidence: 'Audit checklists, corrective action logs', riskIds: ['RSK-002'], linkedRiskIds: ['RSK-002'] },
    { id: 'CTL-004', title: 'LOTO (Lockout/Tagout) Compliance', framework: 'OSHA' as any, controlType: 'Preventive', status: 'Implemented', effectiveness: 'Effective', testFrequency: 'Annual', lastTested: new Date('2025-12-01'), nextReview: new Date('2026-12-01'), owner: 'hse-dir@mfg.com', description: 'Energy isolation procedures with annual authorized employee revalidation', evidence: 'LOTO audit reports, training records', riskIds: ['RSK-002'], linkedRiskIds: ['RSK-002'] },
    { id: 'CTL-005', title: 'Dual-Source Qualification Program', framework: 'IATF' as any, controlType: 'Preventive', status: 'Partially Implemented', effectiveness: 'Partially Effective', testFrequency: 'Quarterly', lastTested: new Date('2025-11-15'), nextReview: new Date('2026-05-15'), owner: 'procurement@mfg.com', description: 'Program to qualify alternate suppliers for all critical components', evidence: 'PPAP approvals, qualification timeline', riskIds: ['RSK-003'], linkedRiskIds: ['RSK-003'] },
    { id: 'CTL-006', title: 'Safety Stock & Buffer Inventory Policy', framework: 'COSO' as any, controlType: 'Preventive', status: 'Implemented', effectiveness: 'Effective', testFrequency: 'Monthly', lastTested: new Date('2026-02-01'), nextReview: new Date('2026-03-01'), owner: 'supply-chain@mfg.com', description: 'Min 8-week safety stock for single-source critical components', evidence: 'Inventory reports, min/max compliance', riskIds: ['RSK-003'], linkedRiskIds: ['RSK-003'] },
    { id: 'CTL-007', title: 'IT-OT Network Segmentation', framework: 'NIST' as any, controlType: 'Preventive', status: 'Partially Implemented', effectiveness: 'Partially Effective', testFrequency: 'Quarterly', lastTested: new Date('2026-01-10'), nextReview: new Date('2026-04-10'), owner: 'it-security@mfg.com', description: 'VLAN segmentation between corporate IT and factory floor OT networks', evidence: 'Network topology, firewall rules', riskIds: ['RSK-004'], linkedRiskIds: ['RSK-004'] },
    { id: 'CTL-008', title: 'PLC/HMI Patch Management Program', framework: 'NIST' as any, controlType: 'Corrective', status: 'Partially Implemented', effectiveness: 'Ineffective', testFrequency: 'Semi-Annual', lastTested: new Date('2025-09-15'), nextReview: new Date('2026-03-15'), owner: 'it-security@mfg.com', description: 'Coordinated patching for Siemens and Allen-Bradley PLCs during maintenance windows', evidence: 'Patch compliance report', riskIds: ['RSK-004'], linkedRiskIds: ['RSK-004'] },
    { id: 'CTL-009', title: 'Carbon Emissions Monitoring & Reporting', framework: 'ISO14001' as any, controlType: 'Detective', status: 'Implemented', effectiveness: 'Effective', testFrequency: 'Monthly', lastTested: new Date('2026-02-05'), nextReview: new Date('2026-03-05'), owner: 'sustainability@mfg.com', description: 'Automated Scope 1+2 emissions tracking per GHG Protocol', evidence: 'Monthly emissions reports, utility data', riskIds: ['RSK-005'], linkedRiskIds: ['RSK-005'] },
    { id: 'CTL-010', title: 'Energy Efficiency Program', framework: 'ISO14001' as any, controlType: 'Preventive', status: 'Implemented', effectiveness: 'Partially Effective', testFrequency: 'Quarterly', lastTested: new Date('2026-01-15'), nextReview: new Date('2026-04-15'), owner: 'sustainability@mfg.com', description: 'LED lighting, VFD motors, compressed air leak reduction program', evidence: 'Energy audit, kWh/unit trending', riskIds: ['RSK-005'], linkedRiskIds: ['RSK-005'] },
  ];

  const vendors: Vendor[] = [
    { id: 'VND-001', name: 'TSMC', tier: 1 as any, category: 'Semiconductor', criticality: 'Critical', services: ['IC Fabrication', 'Wafer Processing'], location: 'Hsinchu, Taiwan', inherentRisk: 5, residualRisk: 3, slaStatus: 'Yellow', contractExpiry: new Date('2027-12-31'), lastAssessmentDate: new Date('2026-01-15'), nextReviewDate: new Date('2026-04-15'), regulatoryRelevance: false, dataSensitivity: 'Low' as any, controlIds: ['CTL-005'] },
    { id: 'VND-002', name: 'Siemens Digital Industries', tier: 1 as any, category: 'Automation', criticality: 'Critical', services: ['PLC/HMI Systems', 'MES Platform', 'Digital Twin'], location: 'Nuremberg, Germany', inherentRisk: 4, residualRisk: 2, slaStatus: 'Green', contractExpiry: new Date('2028-06-30'), lastAssessmentDate: new Date('2026-02-01'), nextReviewDate: new Date('2026-05-01'), regulatoryRelevance: false, dataSensitivity: 'Medium' as any, controlIds: ['CTL-007', 'CTL-008'] },
    { id: 'VND-003', name: 'Rockwell Automation', tier: 2 as any, category: 'Automation', criticality: 'High', services: ['Allen-Bradley PLCs', 'FactoryTalk Software'], location: 'Milwaukee, WI', inherentRisk: 3, residualRisk: 2, slaStatus: 'Green', contractExpiry: new Date('2027-09-30'), lastAssessmentDate: new Date('2025-12-15'), nextReviewDate: new Date('2026-06-15'), regulatoryRelevance: false, dataSensitivity: 'Low' as any, controlIds: ['CTL-008'] },
  ];

  const kris: KRI[] = [
    { id: 'KRI-001', name: 'Defect Rate (PPM)', category: 'Quality' as any, currentValue: 680, threshold: 500, unit: 'ppm', breachLevel: 'Warning', trend: 'Deteriorating', owner: 'quality-dir@mfg.com', lastUpdated: new Date('2026-02-15'), riskId: 'RSK-001' },
    { id: 'KRI-002', name: 'Lost Time Injury Frequency Rate', category: 'Safety' as any, currentValue: 2.8, threshold: 2, unit: 'per M hrs', breachLevel: 'Warning', trend: 'Stable', owner: 'hse-dir@mfg.com', lastUpdated: new Date('2026-02-01'), riskId: 'RSK-002' },
    { id: 'KRI-003', name: 'Single-Source Critical Components', category: 'SupplyChain' as any, currentValue: 7, threshold: 3, unit: 'count', breachLevel: 'Breach', trend: 'Stable', owner: 'procurement@mfg.com', lastUpdated: new Date('2026-01-20'), riskId: 'RSK-003' },
    { id: 'KRI-004', name: 'OT Systems Unpatched > 90 Days', category: 'Cyber', currentValue: 14, threshold: 5, unit: 'count', breachLevel: 'Breach', trend: 'Deteriorating', owner: 'it-security@mfg.com', lastUpdated: new Date('2026-02-12'), riskId: 'RSK-004' },
    { id: 'KRI-005', name: 'Scope 1+2 Emissions vs Target', category: 'Environmental' as any, currentValue: 112, threshold: 100, unit: '%', breachLevel: 'Warning', trend: 'Improving', owner: 'sustainability@mfg.com', lastUpdated: new Date('2026-02-08'), riskId: 'RSK-005' },
    { id: 'KRI-006', name: 'Overall Equipment Effectiveness (OEE)', category: 'Operational', currentValue: 82, threshold: 85, unit: '%', breachLevel: 'Warning', trend: 'Stable', owner: 'production@mfg.com', lastUpdated: new Date('2026-02-01'), riskId: 'RSK-001' },
  ];

  const issues: Issue[] = [
    { id: 'ISS-001', title: 'Machine Guard Missing – Press Line 4', severity: 'Critical', status: 'Open', source: 'Regulatory Exam' as any, owner: 'hse-dir@mfg.com', dueDate: new Date('2026-03-15'), description: 'OSHA citation for missing point-of-operation guard on 200-ton stamping press.', remediationPlan: 'Install light curtain and interlocked guard within 30 days.', mraType: 'MRIA', riskIds: ['RSK-002'], controlIds: ['CTL-003'] },
    { id: 'ISS-002', title: 'Supplier Qualification – Alternate Semiconductor Source', severity: 'High', status: 'In Progress', source: 'Self-Identified' as any, owner: 'procurement@mfg.com', dueDate: new Date('2026-06-30'), description: 'PPAP qualification in progress for alternate semiconductor supplier. Currently at Phase 3 of 5.', remediationPlan: 'Complete run-at-rate and production validation by Q2 2026.', mraType: 'MRA', riskIds: ['RSK-003'], controlIds: ['CTL-005'] },
  ];

  const lossEvents: LossEvent[] = [
    { id: 'LE-001', title: 'Product Recall – Dimensional Tolerance Exceedance', category: 'Quality' as any, amount: 3500000, recoveryAmount: 800000, date: new Date('2025-09-15'), businessUnit: 'Production', status: 'Closed', riskId: 'RSK-001', description: 'Recall of 25,000 brake components due to CNC tool wear causing out-of-tolerance condition.' },
    { id: 'LE-002', title: 'Supply Chain Disruption – 6-Week Production Halt', category: 'SupplyChain' as any, amount: 8200000, recoveryAmount: 2000000, date: new Date('2025-06-10'), businessUnit: 'Supply Chain', status: 'Closed', riskId: 'RSK-003', description: 'Semiconductor shortage from sole-source supplier caused 6-week production line stoppage.' },
  ];

  const regulatoryChanges: RegulatoryChange[] = [
    { id: 'RC-001', title: 'EU CSRD – Mandatory ESG Reporting', source: 'EU Commission' as any, status: 'Implementation', impactLevel: 'High', effectiveDate: new Date('2026-01-01'), summary: 'Corporate Sustainability Reporting Directive requiring detailed ESG metrics, double materiality assessment.', affectedFrameworks: ['CSRD', 'ISO14001'], actionPlanOwner: 'sustainability@mfg.com', actionPlanDueDate: new Date('2026-06-30') },
  ];

  const monitoringAlerts: MonitoringAlert[] = [
    { id: 'MA-001', vendorId: 'VND-001', severity: 'High', type: 'Concentration Risk' as any, message: 'TSMC lead time extended to 20 weeks – exceeds 16-week threshold', timestamp: new Date('2026-02-12'), acknowledged: false },
    { id: 'MA-002', vendorId: 'VND-002', severity: 'Medium', type: 'Cyber Intel' as any, message: 'Siemens advisory: critical PLC firmware vulnerability (CVE-2026-5678)', timestamp: new Date('2026-02-10'), acknowledged: true },
  ];

  return {
    risks, controls, vendors, issues, kris, lossEvents, regulatoryChanges, monitoringAlerts,
    auditLog: bankingSeedData.auditLog,
    riskScenarios: bankingSeedData.riskScenarios,
  };
}
