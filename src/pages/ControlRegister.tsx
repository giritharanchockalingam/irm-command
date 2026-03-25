import React, { useState } from 'react';
import { Card, Badge } from '../components/ui';
import { useThemeStore } from '../store/themeStore';
import { useSecurity, RequirePermission } from '../security/SecurityContext';

interface Control {
  id: string;
  category: 'Security' | 'Availability' | 'Confidentiality';
  tscReference: string;
  controlName: string;
  description: string;
  owner: string;
  implementationStatus: 'Implemented' | 'Partially Implemented' | 'Planned' | 'Not Applicable';
  lastReviewDate: string;
  evidenceArtifacts: string[];
  notes: string;
}

const CONTROLS: Control[] = [
  {
    id: 'SOC-001',
    category: 'Security',
    tscReference: 'CC6.1',
    controlName: 'Logical Access Control Framework',
    description: 'Establish and maintain a role-based access control (RBAC) framework to restrict system access to authorized personnel based on job responsibilities.',
    owner: 'Chief Information Security Officer',
    implementationStatus: 'Implemented',
    lastReviewDate: '2026-02-15',
    evidenceArtifacts: ['RBAC Policy v3.2', 'Access Control Matrix', 'User Provisioning Logs (Jan 2026)'],
    notes: 'Framework reviewed quarterly. Multi-factor authentication required for all administrative access.',
  },
  {
    id: 'SOC-002',
    category: 'Security',
    tscReference: 'CC6.2',
    controlName: 'Authentication Mechanisms',
    description: 'Implement strong authentication mechanisms including MFA for all user accounts with privileged access.',
    owner: 'Director of Identity & Access Management',
    implementationStatus: 'Implemented',
    lastReviewDate: '2026-02-20',
    evidenceArtifacts: ['MFA Configuration Standard', 'Azure AD Enforcement Policy', 'Authentication Audit Logs'],
    notes: 'TOTP and hardware security keys supported. Password policy enforces 16+ characters.',
  },
  {
    id: 'SOC-003',
    category: 'Security',
    tscReference: 'CC7.1',
    controlName: 'Encryption in Transit',
    description: 'Ensure all data transmitted over networks is encrypted using TLS 1.2 or higher protocols.',
    owner: 'Chief Information Security Officer',
    implementationStatus: 'Implemented',
    lastReviewDate: '2026-02-18',
    evidenceArtifacts: ['SSL/TLS Configuration', 'Network Traffic Analysis Report', 'Certificate Management Log'],
    notes: 'TLS 1.3 enabled for all new connections. Certificate rotation automated via Let\'s Encrypt.',
  },
  {
    id: 'SOC-004',
    category: 'Security',
    tscReference: 'CC7.2',
    controlName: 'Encryption at Rest',
    description: 'Implement AES-256 encryption for all data stored in production databases and backup systems.',
    owner: 'VP of Infrastructure',
    implementationStatus: 'Implemented',
    lastReviewDate: '2026-02-10',
    evidenceArtifacts: ['Database Encryption Config', 'Key Management Policy', 'Backup Encryption Standards'],
    notes: 'Keys stored in AWS KMS with automatic rotation enabled. Tested quarterly.',
  },
  {
    id: 'SOC-005',
    category: 'Security',
    tscReference: 'CC6.5',
    controlName: 'Vulnerability Management Program',
    description: 'Maintain a comprehensive vulnerability management program including regular scans, patching, and remediation tracking.',
    owner: 'Security Engineering Manager',
    implementationStatus: 'Partially Implemented',
    lastReviewDate: '2026-03-01',
    evidenceArtifacts: ['Vulnerability Scanning Schedule', 'Patch Management Process', 'Outstanding Vulnerabilities List'],
    notes: 'Weekly automated scans in place. P1 vulnerabilities remediated within 24 hours. P2/P3 remediation plan in progress.',
  },
  {
    id: 'SOC-006',
    category: 'Security',
    tscReference: 'CC7.3',
    controlName: 'Incident Response & Management',
    description: 'Maintain an incident response plan with defined procedures for detection, investigation, containment, and remediation of security incidents.',
    owner: 'Head of Security Operations',
    implementationStatus: 'Implemented',
    lastReviewDate: '2026-01-28',
    evidenceArtifacts: ['Incident Response Plan v2.1', 'Contact Tree', 'Historical Incident Reports', 'SIEM Dashboard Access'],
    notes: 'Team trained quarterly. SIEM configured for real-time alerting. Average response time: 12 minutes.',
  },
  {
    id: 'SOC-007',
    category: 'Security',
    tscReference: 'CC8.1',
    controlName: 'Security Awareness Training',
    description: 'Provide mandatory annual security awareness training for all employees covering phishing, social engineering, and data protection.',
    owner: 'Chief Compliance Officer',
    implementationStatus: 'Implemented',
    lastReviewDate: '2026-02-28',
    evidenceArtifacts: ['Training Curriculum', 'Completion Certificates', 'Phishing Simulation Results'],
    notes: '98% completion rate in 2026. Quarterly phishing simulations show 3% click-through rate (industry avg: 4%).',
  },
  {
    id: 'SOC-008',
    category: 'Security',
    tscReference: 'CC9.1',
    controlName: 'Change Management',
    description: 'Implement a formal change management process requiring approval, testing, and documentation before deploying changes to production systems.',
    owner: 'VP of Engineering',
    implementationStatus: 'Implemented',
    lastReviewDate: '2026-02-25',
    evidenceArtifacts: ['Change Management Policy', 'CAB Meeting Minutes', 'Deployment Logs (Feb 2026)', 'Rollback Procedures'],
    notes: 'All changes tracked in Jira. CAB meets twice weekly. Zero unauthorized changes detected in FY2026.',
  },
  {
    id: 'SOC-009',
    category: 'Availability',
    tscReference: 'A1.1',
    controlName: 'System Availability Monitoring',
    description: 'Monitor all critical systems continuously and maintain visibility into system uptime, performance, and availability metrics.',
    owner: 'Director of Site Reliability',
    implementationStatus: 'Implemented',
    lastReviewDate: '2026-03-05',
    evidenceArtifacts: ['Datadog Dashboard', 'Availability Reports (Monthly)', 'Alert Configuration'],
    notes: 'Target SLA: 99.95%. YTD average: 99.97%. Real-time alerting configured for threshold violations.',
  },
  {
    id: 'SOC-010',
    category: 'Availability',
    tscReference: 'A1.2',
    controlName: 'Disaster Recovery Plan',
    description: 'Establish and test a comprehensive disaster recovery plan with defined recovery time objectives (RTO) and recovery point objectives (RPO).',
    owner: 'VP of Infrastructure',
    implementationStatus: 'Partially Implemented',
    lastReviewDate: '2026-02-15',
    evidenceArtifacts: ['DR Plan v3.0', 'Last Test Report (Jan 2026)', 'RTO/RPO Matrix', 'Backup Verification Logs'],
    notes: 'RTO: 4 hours, RPO: 1 hour. Semi-annual testing scheduled. Geographic redundancy in two regions.',
  },
  {
    id: 'SOC-011',
    category: 'Availability',
    tscReference: 'A1.3',
    controlName: 'Capacity Planning',
    description: 'Implement capacity planning and forecasting processes to ensure adequate resources for expected growth and peak demand.',
    owner: 'Director of Site Reliability',
    implementationStatus: 'Planned',
    lastReviewDate: '2026-03-10',
    evidenceArtifacts: [],
    notes: 'Implementation planned for Q2 2026. Predictive scaling models under development with data science team.',
  },
  {
    id: 'SOC-012',
    category: 'Availability',
    tscReference: 'A1.4',
    controlName: 'Backup & Recovery Testing',
    description: 'Regularly test backup and recovery procedures to ensure data can be recovered within defined timeframes.',
    owner: 'VP of Infrastructure',
    implementationStatus: 'Implemented',
    lastReviewDate: '2026-02-28',
    evidenceArtifacts: ['Backup Test Schedule', 'Recovery Test Results (Feb 2026)', 'Restore Time Metrics'],
    notes: 'Monthly full backup tests conducted. Average restore time: 23 minutes. All backup integrity checks passing.',
  },
  {
    id: 'SOC-013',
    category: 'Confidentiality',
    tscReference: 'C1.1',
    controlName: 'Data Classification & Handling',
    description: 'Classify all data based on sensitivity level and establish handling requirements for each classification level.',
    owner: 'Chief Compliance Officer',
    implementationStatus: 'Implemented',
    lastReviewDate: '2026-01-30',
    evidenceArtifacts: ['Data Classification Policy', 'Handling Guidelines', 'Classification Register'],
    notes: 'Four classification levels: Public, Internal, Confidential, Restricted. Training completed for 95% of staff.',
  },
  {
    id: 'SOC-014',
    category: 'Confidentiality',
    tscReference: 'C1.2',
    controlName: 'Data Retention & Disposal',
    description: 'Establish data retention schedules and secure disposal procedures to minimize data accumulation and reduce exposure risk.',
    owner: 'Chief Privacy Officer',
    implementationStatus: 'Partially Implemented',
    lastReviewDate: '2026-02-22',
    evidenceArtifacts: ['Retention Schedule', 'Disposal Procedures', 'Audit Logs (Jan-Feb 2026)'],
    notes: 'Automated retention policies in place. Manual disposal procedures being refined for non-standard data types.',
  },
  {
    id: 'SOC-015',
    category: 'Confidentiality',
    tscReference: 'C1.3',
    controlName: 'Customer Data Segregation',
    description: 'Implement logical and physical controls to ensure customer data remains segregated and inaccessible to other customers.',
    owner: 'Chief Information Security Officer',
    implementationStatus: 'Implemented',
    lastReviewDate: '2026-03-08',
    evidenceArtifacts: ['Multi-Tenancy Architecture', 'Row-Level Security Config', 'Data Access Audit Logs'],
    notes: 'Database-level row-level security enforced. Quarterly audit confirms zero cross-tenant data access.',
  },
];

const statusColors = {
  'Implemented': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  'Partially Implemented': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  'Planned': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'Not Applicable': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
};

const categoryColors = {
  'Security': 'bg-red-50 dark:bg-red-900/20',
  'Availability': 'bg-purple-50 dark:bg-purple-900/20',
  'Confidentiality': 'bg-blue-50 dark:bg-blue-900/20',
};

export default function ControlRegister() {
  const isDark = useThemeStore((state) => state.isDark);
  const { user } = useSecurity();
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Security' | 'Availability' | 'Confidentiality'>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const filteredControls = CONTROLS.filter((control) => {
    const matchesCategory = selectedCategory === 'All' || control.category === selectedCategory;
    const matchesSearch =
      control.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      control.controlName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      control.tscReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      control.owner.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const stats = {
    total: CONTROLS.length,
    implemented: CONTROLS.filter((c) => c.implementationStatus === 'Implemented').length,
    partiallyImplemented: CONTROLS.filter((c) => c.implementationStatus === 'Partially Implemented').length,
    planned: CONTROLS.filter((c) => c.implementationStatus === 'Planned').length,
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-gray-50'} p-8`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
            SOC 2 Control Register
          </h1>
          <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Trust Services Criteria — Internal Controls
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className={`p-6 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
            <div className={`text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
              Total Controls
            </div>
            <div className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {stats.total}
            </div>
          </Card>

          <Card className={`p-6 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
            <div className={`text-sm font-semibold text-green-600 dark:text-green-400 mb-2`}>
              Implemented
            </div>
            <div className={`text-3xl font-bold text-green-600 dark:text-green-400`}>
              {stats.implemented}
            </div>
          </Card>

          <Card className={`p-6 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
            <div className={`text-sm font-semibold text-yellow-600 dark:text-yellow-400 mb-2`}>
              Partially Implemented
            </div>
            <div className={`text-3xl font-bold text-yellow-600 dark:text-yellow-400`}>
              {stats.partiallyImplemented}
            </div>
          </Card>

          <Card className={`p-6 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
            <div className={`text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2`}>
              Planned
            </div>
            <div className={`text-3xl font-bold text-blue-600 dark:text-blue-400`}>
              {stats.planned}
            </div>
          </Card>
        </div>

        {/* Filters & Search */}
        <div className="mb-6">
          <div className="flex flex-col gap-4">
            {/* Filter Tabs */}
            <div className="flex gap-2 flex-wrap">
              {(['All', 'Security', 'Availability', 'Confidentiality'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedCategory === cat
                      ? isDark
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-600 text-white'
                      : isDark
                      ? 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search Box */}
            <input
              type="text"
              placeholder="Search controls by ID, name, TSC reference, or owner..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`px-4 py-2 rounded-lg border ${
                isDark
                  ? 'bg-slate-800 border-slate-700 text-white placeholder-gray-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
          </div>
        </div>

        {/* Controls Table */}
        <div className={`rounded-lg overflow-hidden border ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
          <div className={`overflow-x-auto`}>
            <table className="w-full">
              <thead>
                <tr className={isDark ? 'bg-slate-800' : 'bg-gray-100'}>
                  <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    ID
                  </th>
                  <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    TSC Reference
                  </th>
                  <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Control Name
                  </th>
                  <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Owner
                  </th>
                  <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Status
                  </th>
                  <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Last Review
                  </th>
                  <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredControls.map((control, index) => (
                  <React.Fragment key={control.id}>
                    <tr
                      className={`border-t cursor-pointer transition-colors ${
                        isDark
                          ? 'border-slate-700 hover:bg-slate-700/50'
                          : 'border-gray-200 hover:bg-gray-50'
                      } ${categoryColors[control.category]}`}
                      onClick={() => toggleExpanded(control.id)}
                    >
                      <td className={`px-6 py-4 text-sm font-mono font-semibold ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                        {control.id}
                      </td>
                      <td className={`px-6 py-4 text-sm font-mono ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {control.tscReference}
                      </td>
                      <td className={`px-6 py-4 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                        {control.controlName}
                      </td>
                      <td className={`px-6 py-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {control.owner}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <Badge className={statusColors[control.implementationStatus]}>
                          {control.implementationStatus}
                        </Badge>
                      </td>
                      <td className={`px-6 py-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {control.lastReviewDate}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpanded(control.id);
                          }}
                          className={`text-blue-600 dark:text-blue-400 hover:underline font-medium`}
                        >
                          {expandedRows.has(control.id) ? '▼ Hide' : '▶ Show'}
                        </button>
                      </td>
                    </tr>

                    {expandedRows.has(control.id) && (
                      <tr className={isDark ? 'bg-slate-800/50 border-t border-slate-700' : 'bg-gray-50 border-t border-gray-200'}>
                        <td colSpan={7} className="px-6 py-6">
                          <div className="space-y-4">
                            {/* Description */}
                            <div>
                              <h4 className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-900'} mb-2`}>
                                Description
                              </h4>
                              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>
                                {control.description}
                              </p>
                            </div>

                            {/* Evidence Artifacts */}
                            {control.evidenceArtifacts.length > 0 && (
                              <div>
                                <h4 className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-900'} mb-2`}>
                                  Evidence Artifacts
                                </h4>
                                <ul className={`text-sm space-y-1 ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>
                                  {control.evidenceArtifacts.map((artifact, idx) => (
                                    <li key={idx} className="flex items-start gap-2">
                                      <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>•</span>
                                      <span>{artifact}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Notes */}
                            {control.notes && (
                              <div>
                                <h4 className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-900'} mb-2`}>
                                  Notes
                                </h4>
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>
                                  {control.notes}
                                </p>
                              </div>
                            )}

                            {/* Edit Button (with Permission Check) */}
                            <div className="pt-2 border-t border-gray-300 dark:border-slate-600">
                              <RequirePermission permission="admin:settings">
                                <button
                                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                                    isDark
                                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                                  }`}
                                >
                                  Edit Control
                                </button>
                              </RequirePermission>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {filteredControls.length === 0 && (
            <div className={`p-8 text-center ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                No controls found matching your search criteria.
              </p>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className={`mt-6 p-4 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-blue-50'}`}>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-blue-900'}`}>
            This Control Register represents IRM Command's internal SOC 2 controls and is updated quarterly following our annual audit cycle.
          </p>
        </div>
      </div>
    </div>
  );
}
