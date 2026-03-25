/**
 * Knowledge Service - Client-side RAG-lite knowledge base
 * Keyword/TF-IDF style matching over enterprise GRC documentation
 */

/**
 * Document section interface
 */
export interface DocumentSection {
  id: string;
  documentTitle: string;
  docType: 'policy' | 'framework' | 'procedure' | 'guidance' | 'control_design' | 'faq';
  sectionTitle: string;
  content: string;
  keywords: string[];
  framework?: string;
}

/**
 * Search result interface
 */
export interface SearchResult {
  section: DocumentSection;
  relevanceScore: number;
  matchedKeywords: string[];
}

/**
 * Comprehensive knowledge base with 20+ sections covering GRC topics
 */
export const KNOWLEDGE_BASE: DocumentSection[] = [
  // SOC 2 Trust Services Criteria - 5 sections
  {
    id: 'soc2-cc6',
    documentTitle: 'SOC 2 Trust Services Criteria - Security',
    docType: 'framework',
    sectionTitle: 'CC6: Logical Access Control',
    content: `CC6 addresses logical access controls to ensure that only authorized individuals can access information systems. This criterion requires that organizations implement mechanisms to authenticate users, enforce access permissions, and prevent unauthorized access to sensitive systems and data. Strong password policies, multi-factor authentication, and role-based access control (RBAC) are essential components. Regular reviews of user access rights and immediate termination of access upon role changes or employee departure are mandatory. Monitoring and logging of all access attempts provides audit trails for compliance verification.`,
    keywords: ['logical access', 'authentication', 'MFA', 'passwords', 'RBAC', 'access control', 'CC6', 'SOC 2'],
    framework: 'SOC 2',
  },
  {
    id: 'soc2-cc7',
    documentTitle: 'SOC 2 Trust Services Criteria - Security',
    docType: 'framework',
    sectionTitle: 'CC7: System Monitoring and Change Management',
    content: `CC7 requires comprehensive monitoring of information system activities and implementation of formal change management procedures. Organizations must detect and respond to security incidents in a timely manner through continuous monitoring of logs and alerts. Change management controls must ensure that all system changes are authorized, tested, documented, and reviewed before implementation. Configuration management tracking, segregation of duties, and rollback procedures are critical safeguards. Regular security testing, penetration testing, and vulnerability assessments validate the effectiveness of controls. All changes must maintain the integrity and security of the system.`,
    keywords: ['change management', 'monitoring', 'logging', 'incident detection', 'configuration', 'testing', 'CC7', 'SOC 2'],
    framework: 'SOC 2',
  },
  {
    id: 'soc2-cc8',
    documentTitle: 'SOC 2 Trust Services Criteria - Security',
    docType: 'framework',
    sectionTitle: 'CC8: Encryption and Sensitive Data Protection',
    content: `CC8 mandates the protection of sensitive data through encryption both in transit and at rest. Organizations must classify data by sensitivity level and apply appropriate encryption standards (AES-256 for data at rest, TLS 1.2+ for data in transit). Key management procedures must include secure generation, storage, rotation, and destruction of cryptographic keys. Sensitive information such as passwords, API keys, and personally identifiable information must never be stored in plain text. Database-level encryption, file-level encryption, and secure deletion procedures protect against unauthorized access and data breach scenarios.`,
    keywords: ['encryption', 'data protection', 'TLS', 'AES', 'key management', 'sensitive data', 'CC8', 'SOC 2'],
    framework: 'SOC 2',
  },
  {
    id: 'soc2-a1',
    documentTitle: 'SOC 2 Trust Services Criteria - Availability',
    docType: 'framework',
    sectionTitle: 'A1: System Availability and Performance',
    content: `A1 focuses on maintaining system availability and performance to ensure uninterrupted service delivery. Organizations must define and monitor service level objectives (SLOs) with target uptime commitments, typically 99.9% or higher for critical systems. Redundant infrastructure, load balancing, and failover mechanisms prevent single points of failure. Capacity planning ensures resources match demand, and performance monitoring tracks system health metrics. Incident response procedures minimize downtime, and disaster recovery plans enable rapid restoration of services following outages. Regular testing of backup and recovery procedures validates their effectiveness.`,
    keywords: ['availability', 'SLO', 'uptime', 'redundancy', 'failover', 'disaster recovery', 'A1', 'SOC 2'],
    framework: 'SOC 2',
  },
  {
    id: 'soc2-c1',
    documentTitle: 'SOC 2 Trust Services Criteria - Confidentiality',
    docType: 'framework',
    sectionTitle: 'C1: Information Confidentiality and Privacy',
    content: `C1 addresses the protection of confidential customer information and compliance with privacy regulations. Organizations must identify what information is confidential and implement controls to prevent unauthorized disclosure. Access to confidential data must be restricted to authorized personnel on a need-to-know basis. Contracts and agreements must include confidentiality clauses and data handling requirements. Training programs educate employees on confidentiality obligations and proper handling of sensitive information. Data breach notification procedures ensure timely communication if unauthorized access occurs. Privacy impact assessments guide appropriate use of customer data.`,
    keywords: ['confidentiality', 'privacy', 'data protection', 'PII', 'disclosure', 'need-to-know', 'C1', 'SOC 2'],
    framework: 'SOC 2',
  },

  // RBAC and Access Control - 2 sections
  {
    id: 'rbac-policy',
    documentTitle: 'Role-Based Access Control (RBAC) Policy',
    docType: 'policy',
    sectionTitle: 'RBAC Framework and Implementation',
    content: `Role-Based Access Control (RBAC) is the primary mechanism for managing user access to information systems and data. Roles are defined based on job functions and business responsibilities, with each role assigned a specific set of permissions. Users are assigned to roles rather than individual permissions, simplifying administration and reducing errors. Role hierarchies allow inheritance of permissions, and separation of duties prevents conflicting role assignments (e.g., requestor and approver cannot be the same person). Periodic access reviews (quarterly or semi-annually) ensure role assignments remain appropriate. Segregation of duties controls prevent high-risk permission combinations in financial, compliance, and security functions.`,
    keywords: ['RBAC', 'roles', 'permissions', 'access control', 'separation of duties', 'role assignment', 'access review'],
    framework: 'ISO27001',
  },
  {
    id: 'rbac-implementation',
    documentTitle: 'Role-Based Access Control (RBAC) Policy',
    docType: 'procedure',
    sectionTitle: 'RBAC Access Request and Approval Process',
    content: `Access requests must be submitted through the identity and access management (IAM) system and include business justification, manager approval, and role specification. Critical roles require additional approval from compliance and security teams. Access provisioning is completed within 3 business days for standard requests and 5 days for critical roles. New employees complete security training before access provisioning. Access modifications or terminations are processed within 1 business day of role change or employee departure. Quarterly attestations by managers verify continued appropriateness of active role assignments. Privileged access (admin, audit, compliance roles) requires enhanced controls including multi-factor authentication, session recording, and just-in-time activation.`,
    keywords: ['access request', 'approval process', 'provisioning', 'IAM', 'attestation', 'privileged access', 'JIT'],
    framework: 'ISO27001',
  },

  // Audit Logging and Monitoring - 2 sections
  {
    id: 'audit-logging',
    documentTitle: 'Audit Logging and Monitoring Procedures',
    docType: 'procedure',
    sectionTitle: 'Audit Log Collection and Retention',
    content: `Comprehensive audit logging captures all user actions, system changes, and access events in centralized repositories. Audit logs must include timestamp, user ID, action performed, resource affected, source IP address, and result (success/failure). Logs from all critical systems (databases, applications, identity systems, security appliances) are collected in a security information and event management (SIEM) platform. Log retention policies preserve logs for a minimum of 2 years for operational logs and 7 years for compliance-sensitive logs. Log integrity controls prevent tampering: logs are transmitted using secure channels, stored with read-only access for non-admin users, and backed up to immutable storage. Real-time alerting on suspicious activities enables rapid incident response.`,
    keywords: ['audit log', 'logging', 'SIEM', 'monitoring', 'log retention', 'immutable', 'alert'],
    framework: 'SOC 2',
  },
  {
    id: 'audit-monitoring',
    documentTitle: 'Audit Logging and Monitoring Procedures',
    docType: 'procedure',
    sectionTitle: 'Security Event Detection and Response',
    content: `Security monitoring uses automated rules to detect suspicious activities and potential incidents. Key alert scenarios include: multiple failed login attempts (brute force detection), access outside normal hours, privilege escalation without authorization, mass data exfiltration, and configuration changes to security controls. Alert severity is categorized as critical (immediate escalation), high (investigation within 24 hours), or medium (investigation within 7 days). Security analysts investigate alerts and validate whether they represent actual incidents or false positives. Incident response procedures document findings, contain affected systems, restore normal operations, and conduct post-incident reviews. Quarterly analysis of log data identifies trends, anomalies, and improvement opportunities.`,
    keywords: ['detection', 'alert', 'incident response', 'investigation', 'brute force', 'exfiltration', 'anomaly'],
    framework: 'SOC 2',
  },

  // Change Management - 2 sections
  {
    id: 'change-mgmt-policy',
    documentTitle: 'Change Management Policy',
    docType: 'policy',
    sectionTitle: 'Change Management Framework',
    content: `Formal change management controls ensure all system changes are authorized, documented, tested, and reviewed before implementation. Changes are categorized by risk level: emergency changes (immediate threat mitigation, documented post-implementation), standard changes (pre-approved recurring changes), and controlled changes (full review and approval required). Change requests must include: business justification, technical description, implementation plan, rollback procedures, testing evidence, and scheduled maintenance window. Change advisory boards review and approve controlled changes, ensuring no conflicts, sufficient testing, and documented stakeholder communication. Changes to security controls require security team approval. All changes are documented in the configuration management database (CMDB) with version control.`,
    keywords: ['change management', 'change request', 'approval', 'testing', 'rollback', 'CAB', 'CMDB'],
    framework: 'ITIL',
  },
  {
    id: 'change-mgmt-procedure',
    documentTitle: 'Change Management Policy',
    docType: 'procedure',
    sectionTitle: 'Change Implementation and Documentation',
    content: `Change implementation follows strict procedures to minimize risk and ensure traceability. Pre-implementation checks verify test results, backup completion, and stakeholder notification. Implementation windows are scheduled during low-traffic periods with dedicated resources for the change and incident response. Implementation progress is communicated to stakeholders and executives. Post-implementation validation confirms the change achieved expected outcomes and no unintended side effects occurred. Changes to production databases require database administrators to validate integrity and performance. Failed changes trigger immediate rollback procedures. Change records are permanently archived with completion status, actual duration, any incidents during implementation, and lessons learned.`,
    keywords: ['implementation', 'rollback', 'testing', 'validation', 'backup', 'maintenance window', 'failure'],
    framework: 'ITIL',
  },

  // Incident Response - 1 section
  {
    id: 'incident-response',
    documentTitle: 'Incident Response Procedures',
    docType: 'procedure',
    sectionTitle: 'Incident Detection, Classification, and Response',
    content: `Incident response procedures enable rapid detection and containment of security incidents. Security incidents include unauthorized access, data breaches, malware infections, denial-of-service attacks, and security control failures. Incidents are classified by severity: critical (customer data exposed, service down >1 hour), high (partial system compromise, risk of exposure), medium (suspicious activity, contained), and low (suspicious activity, minimal impact). Incident response teams activate within 1 hour of critical/high-severity incidents. Response steps include: isolate affected systems to prevent spread, preserve evidence for forensic analysis, communicate with stakeholders and customers, restore normal operations, and conduct post-incident review. Root cause analysis identifies contributing factors, and corrective actions prevent recurrence. All incidents are documented with timeline, actions taken, and lessons learned.`,
    keywords: ['incident', 'breach', 'response', 'detection', 'forensics', 'containment', 'notification'],
    framework: 'SOC 2',
  },

  // Data Classification - 1 section
  {
    id: 'data-classification',
    documentTitle: 'Data Classification Policy',
    docType: 'policy',
    sectionTitle: 'Data Classification Levels and Handling Requirements',
    content: `Data classification defines sensitivity levels and associated protection requirements. Public data (no restrictions, shareable externally) requires standard controls. Internal data (confidential to employees, limited external sharing) requires access controls and confidentiality agreements. Confidential data (customer data, financial information, strategic plans) requires encryption, audit logging, and restricted access. Restricted data (personally identifiable information, regulated data, trade secrets) requires the highest protection: encryption, role-based access, audit logging, data loss prevention tools, and incident notification procedures. Data owners classify their data during creation. Responsibility matrices define who can create, read, modify, and delete data in each classification. Automated tools scan repositories to identify misclassified or unclassified data. Annual reviews ensure classification accuracy.`,
    keywords: ['data classification', 'sensitivity', 'protection', 'encryption', 'confidential', 'restricted', 'DLP'],
    framework: 'ISO27001',
  },

  // Third-Party Risk Management - 2 sections
  {
    id: 'vendor-risk-mgmt',
    documentTitle: 'Third-Party Risk Management Procedures',
    docType: 'procedure',
    sectionTitle: 'Vendor Assessment and Onboarding',
    content: `Third-party vendors are assessed before engagement to evaluate security, compliance, and operational risk. Vendor assessments include: security questionnaires (technical controls, incident response, security certifications), financial stability review, regulatory compliance verification, and reference checks. Vendors classified as critical (access to sensitive data, critical systems) require SOC 2 reports, penetration testing results, or on-site security assessments. Vendor contracts include mandatory terms: data protection and confidentiality obligations, right to audit and inspect, incident notification requirements, liability and indemnification clauses, and data return/destruction provisions. Risk scores are calculated based on assessment results: critical vendors score < 70, high-risk vendors score 70-84, acceptable vendors score > 85. Board approval is required for engagement of critical or high-risk vendors. Vendor information is stored in a centralized vendor management system.`,
    keywords: ['vendor', 'third-party', 'assessment', 'contract', 'risk score', 'SOC 2', 'due diligence'],
    framework: 'ISO27001',
  },
  {
    id: 'vendor-monitoring',
    documentTitle: 'Third-Party Risk Management Procedures',
    docType: 'procedure',
    sectionTitle: 'Ongoing Vendor Monitoring and Management',
    content: `Vendor performance and security posture are monitored continuously through multiple mechanisms. Annual security reassessments (questionnaires, vulnerability scans, security audits) verify vendor controls remain effective. Service level agreements (SLAs) define availability, performance, and support expectations with financial penalties for breaches. Incident reporting procedures require vendors to notify the organization within 24 hours of security incidents or breaches affecting customer data. Quarterly business reviews with vendors discuss security events, performance metrics, and improvement plans. Vendor access to internal systems is provisioned using role-based access control with automatic deprovisioning upon contract termination. Vendor-provided software and systems are scanned for vulnerabilities before deployment and monitored for new threats post-deployment. If vendor security posture degrades significantly, remediation plans or vendor replacement is required.`,
    keywords: ['vendor monitoring', 'SLA', 'incident reporting', 'reassessment', 'access revocation', 'business review'],
    framework: 'ISO27001',
  },

  // Risk Assessment Methodology - 2 sections
  {
    id: 'risk-assessment-method',
    documentTitle: 'Risk Assessment Methodology',
    docType: 'guidance',
    sectionTitle: 'Risk Identification and Quantification',
    content: `Risk assessment identifies, analyzes, and prioritizes risks that could adversely affect the organization. Inherent risk reflects the organization's exposure without controls, calculated as likelihood multiplied by impact on a 1-5 scale (inherent score = likelihood × impact × 5, resulting in 0-25 scale). Risk likelihood considers threat frequency and vulnerability ease of exploitation. Risk impact considers confidentiality (data exposure), integrity (unauthorized modifications), and availability (service disruption) dimensions. Risk scenarios describe threat actors, attack paths, and business consequences. Residual risk reflects effectiveness of existing controls in reducing inherent risk. Risk appetite defines the maximum acceptable residual risk by category and scenario; risks exceeding appetite require active mitigation. Risk assessments are conducted annually and after significant changes to systems, processes, or threat environment.`,
    keywords: ['risk assessment', 'inherent risk', 'residual risk', 'likelihood', 'impact', 'risk appetite', 'mitigation'],
    framework: 'NIST',
  },
  {
    id: 'risk-monitoring',
    documentTitle: 'Risk Assessment Methodology',
    docType: 'guidance',
    sectionTitle: 'Risk Monitoring and Key Risk Indicators',
    content: `Risk monitoring tracks changes to inherent and residual risk through key risk indicators (KRIs) that provide leading and lagging signals of risk changes. Leading indicators (early warning signs) include: unresolved audit findings, control testing failures, overdue security patches, failed change implementations, and regulatory non-compliance findings. Lagging indicators (confirmed risk events) include: security incidents, operational failures, regulatory penalties, and audit failures. KRIs are monitored at least monthly with thresholds triggering escalation and response. KRI dashboards are shared with executive leadership and boards quarterly. Trend analysis identifies whether risks are improving, stable, or deteriorating, informing management decisions about resource allocation and strategic initiatives. Risk registers document risk scenarios, associated controls, current scores, trend, and mitigation status.`,
    keywords: ['KRI', 'key risk indicator', 'monitoring', 'dashboard', 'trend', 'threshold', 'escalation'],
    framework: 'NIST',
  },

  // Control Testing and Effectiveness - 1 section
  {
    id: 'control-testing',
    documentTitle: 'Control Testing and Effectiveness Procedures',
    docType: 'procedure',
    sectionTitle: 'Control Design and Testing Methodology',
    content: `Controls are designed to mitigate specific risks and must be regularly tested to verify they operate effectively. Control testing is conducted at least annually, with higher-risk controls tested more frequently (semi-annually or quarterly). Design testing confirms the control addresses the intended risk scenario and control procedures are appropriate. Operating effectiveness testing confirms the control is performed correctly and consistently by authorized personnel. Testing methods include: observation of control execution, re-performance of control procedures, examination of control evidence (logs, reports, approvals), and inquiry of control owners. Testing results are documented with control rating: Effective (consistently prevents/detects risk), Partially Effective (intermittent or limited effectiveness), or Ineffective (does not achieve objectives). Ineffective controls require immediate remediation plans and executive notification. Testing evidence is retained for audit and compliance purposes.`,
    keywords: ['control testing', 'effectiveness', 'design', 'operating', 'evidence', 'remediation', 'documentation'],
    framework: 'SOC 2',
  },

  // AI Governance - 1 section
  {
    id: 'ai-governance',
    documentTitle: 'AI Governance Policy',
    docType: 'policy',
    sectionTitle: 'Responsible AI Use and Risk Management',
    content: `AI and machine learning systems are governed by principles of transparency, fairness, accountability, and security. All AI/ML applications must be registered in the AI registry with documented business purpose, data inputs, and target users. Bias and fairness testing is performed to ensure AI models do not discriminate against protected classes or marginalized groups. AI applications handling sensitive data require additional controls: data minimization (use only necessary data), encryption, and audit logging. AI model explainability is documented so users understand how decisions are reached. Adversarial testing identifies vulnerabilities to prompt injection, data poisoning, and model evasion attacks. AI systems are subject to regular audits to verify alignment with established governance policies. Use of third-party AI services (ChatGPT, Claude, etc.) is restricted to non-sensitive information. Internal LLM systems are monitored for data leakage and prompt injection risks.`,
    keywords: ['AI', 'machine learning', 'governance', 'bias', 'fairness', 'LLM', 'prompt injection'],
    framework: 'General',
  },

  // Session Management and Authentication - 1 section
  {
    id: 'session-management',
    documentTitle: 'Session Management and Authentication Policy',
    docType: 'policy',
    sectionTitle: 'Authentication, Authorization, and Session Control',
    content: `Session management ensures users are properly authenticated, authorized, and maintain secure sessions throughout their system use. Authentication mechanisms verify user identity using one or more factors: something you know (password), something you have (security key, token), something you are (biometric). Multi-factor authentication (MFA) is required for all user accounts with access to sensitive systems or data. Session timeouts automatically terminate inactive sessions after a defined period (typically 30 minutes for sensitive applications). Concurrent session limits prevent unauthorized simultaneous logins from different locations. Password policies require minimum 12 characters, complexity (uppercase, lowercase, numbers, special characters), and changes every 90 days. Passwords are never transmitted in plain text; secure channels (HTTPS, VPN) are always used. Session tokens must be generated securely with sufficient entropy and updated upon authentication and privilege escalation.`,
    keywords: ['authentication', 'MFA', 'session', 'password', 'token', 'timeout', 'concurrent'],
    framework: 'NIST',
  },
];

/**
 * Search the knowledge base using keyword matching and TF-IDF scoring
 * @param query - Search query string
 * @param options - Search options (limit, docType filter, framework filter)
 * @returns Array of search results sorted by relevance
 */
export function searchKnowledge(
  query: string,
  options?: { limit?: number; docType?: string; framework?: string }
): SearchResult[] {
  const limit = options?.limit || 5;
  const docTypeFilter = options?.docType;
  const frameworkFilter = options?.framework;

  // Tokenize and normalize query
  const queryTokens = query
    .toLowerCase()
    .split(/\s+/)
    .filter((token) => token.length > 2);

  if (queryTokens.length === 0) {
    return [];
  }

  // Score each section
  const scored: SearchResult[] = KNOWLEDGE_BASE.map((section) => {
    // Filter by docType if specified
    if (docTypeFilter && section.docType !== docTypeFilter) {
      return { section, relevanceScore: 0, matchedKeywords: [] };
    }

    // Filter by framework if specified
    if (frameworkFilter && section.framework !== frameworkFilter) {
      return { section, relevanceScore: 0, matchedKeywords: [] };
    }

    // Count keyword matches
    const matchedKeywords: string[] = [];
    let matchCount = 0;

    queryTokens.forEach((token) => {
      section.keywords.forEach((keyword) => {
        if (keyword.toLowerCase().includes(token) || token.includes(keyword.toLowerCase())) {
          if (!matchedKeywords.includes(keyword)) {
            matchedKeywords.push(keyword);
          }
          matchCount++;
        }
      });

      // Also search in section title and content
      const contentLower = (section.sectionTitle + ' ' + section.content).toLowerCase();
      if (contentLower.includes(token)) {
        matchCount += 0.5; // Lower weight for content matches vs keyword matches
      }
    });

    // Calculate TF-IDF-style score
    const relevanceScore = matchCount > 0 ? matchCount / (section.keywords.length || 1) : 0;

    return { section, relevanceScore, matchedKeywords };
  });

  // Sort by relevance and filter out zero-scoring results
  return scored
    .filter((result) => result.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, limit);
}

/**
 * Format knowledge base sections into markdown for AI prompt injection
 * @param sections - Array of document sections
 * @returns Formatted markdown string suitable for AI context
 */
export function formatKnowledgeForContext(sections: DocumentSection[]): string {
  const lines: string[] = ['# Enterprise GRC Knowledge Base\n'];

  sections.forEach((section) => {
    lines.push(`## ${section.documentTitle}`);
    lines.push(`*Type: ${section.docType}${section.framework ? ` | Framework: ${section.framework}` : ''}*\n`);
    lines.push(`### ${section.sectionTitle}\n`);
    lines.push(section.content);
    lines.push('');
  });

  return lines.join('\n');
}
