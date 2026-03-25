import React, { useState, useMemo, useCallback } from 'react';
import {
  ChevronDown,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Filter,
  Search,
  Download,
  Eye,
  EyeOff,
} from 'lucide-react';
import { getDataAccess } from '../data/DataAccessLayer';
import { Control, Risk, RegulatoryChange, Issue, Framework } from '../domain/types';
import { TemplateEngine } from '../ai/local/templateEngine';
import { useThemeStore } from '../store/themeStore';
import { useIndustryStore } from '../store/industryStore';
import { useClientStore } from '../store/clientStore';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { StreamingText } from '../components/ui/StreamingText';
import { Modal } from '../components/ui/Modal';
import { Table } from '../components/ui/Table';
import { useAppStore } from '../store/appStore';
import { useSecurity, RequirePermission } from '../security/SecurityContext';

type ComplianceTab = 'controls' | 'gaps' | 'regulatory';
type FrameworkFilter = 'All' | Framework;
type IssueSourceFilter = 'All' | 'Internal Audit' | 'External Audit' | 'Regulatory Exam' | 'Self-Identified' | 'TPRM Review';

interface ControlDetail {
  controlId: string;
  isOpen: boolean;
}

interface RegulatoryAnalysis {
  changeId: string;
  isOpen: boolean;
  analysis?: string;
  isLoading?: boolean;
}

const FRAMEWORK_COLORS: Record<Framework, string> = {
  'Basel III': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  SOX: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  GDPR: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  NIST: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  'ISO 27001': 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
};

const STATUS_COLORS: Record<string, string> = {
  'Implemented': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  'Partially Implemented': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  'Not Implemented': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  'Under Review': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
};

const SEVERITY_COLORS: Record<string, string> = {
  Critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  High: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  Medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  Low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
};

const SOURCE_COLORS: Record<string, string> = {
  'OCC': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  'FDIC': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  'Fed': 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200',
  'Basel': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'SEC': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  'EU': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
};

export default function Compliance() {
  const { can: canPerform } = useSecurity();
  const isDark = useThemeStore((s) => s.isDark);
  const industryId = useIndustryStore((s) => s.industryId);
  const activeClientId = useClientStore((s) => s.activeClientId);
  const [activeTab, setActiveTab] = useState<ComplianceTab>('controls');
  const [frameworkFilter, setFrameworkFilter] = useState<FrameworkFilter>('All');
  const [issueSourceFilter, setIssueSourceFilter] = useState<IssueSourceFilter>('All');
  const [expandedDetails, setExpandedDetails] = useState<Map<string, boolean>>(new Map());
  const [regulatoryAnalyses, setRegulatoryAnalyses] = useState<Map<string, RegulatoryAnalysis>>(new Map());
  const [searchTerm, setSearchTerm] = useState('');

  const dal = getDataAccess();
  const controls = dal.getControls();
  const risks = dal.getRisks();
  const regulatoryChanges = dal.getRegulatoryChanges();
  const issues = dal.getIssues();

  // Stats calculations
  const stats = useMemo(() => {
    const implemented = controls.filter(c => c.status === 'Implemented').length;
    const partial = controls.filter(c => c.status === 'Partially Implemented').length;
    const notImpl = controls.filter(c => c.status === 'Not Implemented').length;
    const today = new Date();
    const thirtyDaysOut = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const upcomingReviews = controls.filter(c => {
      const reviewDate = c.nextReviewDate instanceof Date ? c.nextReviewDate : new Date(c.nextReviewDate);
      return reviewDate >= today && reviewDate <= thirtyDaysOut;
    }).length;

    return {
      total: controls.length,
      implemented,
      partial,
      notImplemented: notImpl,
      upcomingReviews,
    };
  }, []);

  // Filtered controls
  const filteredControls = useMemo(() => {
    return controls.filter(c => {
      const frameworkMatch = frameworkFilter === 'All' || c.framework === frameworkFilter;
      const searchMatch = searchTerm === '' ||
        c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.title.toLowerCase().includes(searchTerm.toLowerCase());
      return frameworkMatch && searchMatch;
    });
  }, [frameworkFilter, searchTerm]);

  // Filtered gaps (Partial + Not Implemented)
  const gapControls = useMemo(() => {
    return filteredControls.filter(c =>
      c.status === 'Partially Implemented' || c.status === 'Not Implemented'
    );
  }, [filteredControls]);

  // Filtered issues
  const filteredIssues = useMemo(() => {
    return issues.filter(i =>
      issueSourceFilter === 'All' || i.source === issueSourceFilter
    );
  }, [issueSourceFilter]);

  // Gap summary stats
  const gapStats = useMemo(() => {
    const criticalGaps = gapControls.filter(c => {
      const linkedRisks = risks.filter(r => c.riskIds?.includes(r.id));
      return linkedRisks.length > 0;
    }).length;
    const highFindings = filteredIssues.filter(i => i.severity === 'High').length;
    const mraCount = filteredIssues.filter(i => i.mraType === 'MRA').length;
    const mriaCount = filteredIssues.filter(i => i.mraType === 'MRIA').length;
    const overdueCount = filteredIssues.filter(i => {
      const dueDate = new Date(i.dueDate);
      return dueDate < new Date();
    }).length;

    return { criticalGaps, highFindings, mraCount, mriaCount, overdueCount };
  }, [gapControls, filteredIssues]);

  const toggleDetail = useCallback((controlId: string) => {
    setExpandedDetails(prev => {
      const newMap = new Map(prev);
      newMap.set(controlId, !newMap.get(controlId));
      return newMap;
    });
  }, []);

  const getLinkedRisks = (controlId: string): Risk[] => {
    const control = controls.find(c => c.id === controlId);
    if (!control?.riskIds) return [];
    return risks.filter(r => control.riskIds?.includes(r.id));
  };

  const getLinkedIssues = (controlId: string): Issue[] => {
    return issues.filter(i => i.controlIds?.includes(controlId));
  };

  const isOverdue = (dateValue: Date | string): boolean => {
    const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
    return date < new Date();
  };

  const isWithin30Days = (dateValue: Date | string): boolean => {
    const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
    const today = new Date();
    const thirtyDaysOut = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    return date >= today && date <= thirtyDaysOut;
  };

  const handleAnalyzeImpact = async (changeId: string) => {
    const change = regulatoryChanges.find(c => c.id === changeId);
    if (!change) return;

    setRegulatoryAnalyses(prev => {
      const newMap = new Map(prev);
      newMap.set(changeId, { changeId, isOpen: true, isLoading: true });
      return newMap;
    });

    // Simulate AI analysis with streaming
    const templateEngine = new TemplateEngine();
    const analysisPrompt = `Analyze the compliance impact of this regulatory change:
Title: ${change.title}
Source: ${change.source}
Effective Date: ${change.effectiveDate}
Summary: ${change.summary}

Provide analysis covering: capital impact, reporting changes, control gaps, action plan, and timeline.`;

    // Simulate streaming by using templateEngine
    setTimeout(() => {
      const mockAnalysis = `Capital Impact: Estimated impact of $2-5M in capital requirements based on current balance sheet structure.

Reporting Changes: Enhanced quarterly reporting to ${change.source} with new metrics required starting ${change.effectiveDate}.

Control Gaps: Gap identified in current Model Risk Management framework. Three controls need enhancement.

Action Plan:
1. Update risk models (30 days)
2. Implement reporting systems (45 days)
3. Train compliance team (15 days)
4. Execute testing (30 days)

Timeline: Full implementation required by ${new Date(new Date(change.effectiveDate).getTime() + 90*24*60*60*1000).toLocaleDateString()}`;

      setRegulatoryAnalyses(prev => {
        const newMap = new Map(prev);
        newMap.set(changeId, { changeId, isOpen: true, analysis: mockAnalysis, isLoading: false });
        return newMap;
      });
    }, 1500);
  };

  const toggleAnalysisPanel = (changeId: string) => {
    setRegulatoryAnalyses(prev => {
      const newMap = new Map(prev);
      const current = newMap.get(changeId) || { changeId, isOpen: false };
      newMap.set(changeId, { ...current, isOpen: !current.isOpen });
      return newMap;
    });
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <div className={`border-b ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-4xl font-bold mb-2">Compliance Management</h1>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            Multi-framework control library, gap analysis, and regulatory intelligence
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className={`border-b ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-8">
            {(['controls', 'gaps', 'regulatory'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-2 font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? isDark
                      ? 'border-blue-500 text-blue-400'
                      : 'border-blue-600 text-blue-600'
                    : isDark
                    ? 'border-transparent text-gray-400 hover:text-gray-300'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab === 'controls' && 'Control Library'}
                {tab === 'gaps' && 'Gaps & Findings'}
                {tab === 'regulatory' && 'Regulatory Intelligence'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* TAB 1: CONTROL LIBRARY */}
        {activeTab === 'controls' && (
          <div className="space-y-6">
            {/* Top Stats Row */}
            <div className="grid grid-cols-5 gap-4">
              <Card className={isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
                <div className="text-center">
                  <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Total Controls</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
                </div>
              </Card>
              <Card className={isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
                <div className="text-center">
                  <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Implemented</p>
                  <p className="text-3xl font-bold text-green-600">{stats.implemented}</p>
                </div>
              </Card>
              <Card className={isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
                <div className="text-center">
                  <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Partial</p>
                  <p className="text-3xl font-bold text-yellow-600">{stats.partial}</p>
                </div>
              </Card>
              <Card className={isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
                <div className="text-center">
                  <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Not Implemented</p>
                  <p className="text-3xl font-bold text-red-600">{stats.notImplemented}</p>
                </div>
              </Card>
              <Card className={isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
                <div className="text-center">
                  <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Upcoming (30d)</p>
                  <p className="text-3xl font-bold text-orange-600">{stats.upcomingReviews}</p>
                </div>
              </Card>
            </div>

            {/* Framework Filter Bar */}
            <Card className={isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
              <div className="flex flex-wrap gap-2">
                {(['All', 'Basel III', 'SOX', 'GDPR', 'NIST', 'ISO 27001'] as const).map(fw => (
                  <button
                    key={fw}
                    onClick={() => setFrameworkFilter(fw)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      frameworkFilter === fw
                        ? isDark
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-600 text-white'
                        : isDark
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {fw}
                  </button>
                ))}
              </div>
            </Card>

            {/* Search Bar */}
            <Card className={isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search controls by ID or title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`flex-1 bg-transparent outline-none ${
                    isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'
                  }`}
                />
              </div>
            </Card>

            {/* Controls Table */}
            <Card className={isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={isDark ? 'border-b border-gray-700' : 'border-b border-gray-200'}>
                      <th className="text-left py-3 px-4 font-semibold">ID</th>
                      <th className="text-left py-3 px-4 font-semibold">Title</th>
                      <th className="text-left py-3 px-4 font-semibold">Framework</th>
                      <th className="text-left py-3 px-4 font-semibold">Status</th>
                      <th className="text-left py-3 px-4 font-semibold">Owner</th>
                      <th className="text-left py-3 px-4 font-semibold">Last Test</th>
                      <th className="text-left py-3 px-4 font-semibold">Next Review</th>
                      <th className="text-left py-3 px-4 font-semibold">Risks</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredControls.map(control => {
                      const isExpanded = expandedDetails.get(control.id);
                      const linkedRisks = getLinkedRisks(control.id);
                      const linkedIssueList = getLinkedIssues(control.id);
                      const overdue = isOverdue(control.nextReview);
                      const within30 = isWithin30Days(control.nextReview);

                      return (
                        <React.Fragment key={control.id}>
                          <tr className={`border-t ${isDark ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'} ${
                            overdue ? (isDark ? 'bg-red-900 bg-opacity-20' : 'bg-red-50') : ''
                          }`}>
                            <td className="py-3 px-4 font-mono text-xs">{control.id}</td>
                            <td className="py-3 px-4">{control.title}</td>
                            <td className="py-3 px-4">
                              <Badge className={FRAMEWORK_COLORS[control.framework]}>
                                {control.framework}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <Badge className={STATUS_COLORS[control.status]}>
                                {control.status}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-xs">{control.owner}</td>
                            <td className="py-3 px-4 text-xs">{new Date(control.lastTestDate).toLocaleDateString()}</td>
                            <td className={`py-3 px-4 text-xs font-medium ${
                              overdue ? (isDark ? 'text-red-300' : 'text-red-700') :
                              within30 ? (isDark ? 'text-orange-300' : 'text-orange-700') : ''
                            }`}>
                              {new Date(control.nextReview).toLocaleDateString()}
                              {overdue && ' (OVERDUE)'}
                              {within30 && !overdue && ' (30d)'}
                            </td>
                            <td className="py-3 px-4 text-xs">
                              {linkedRisks.length > 0 ? (
                                <span title={linkedRisks.map(r => r.title).join(', ')}>
                                  {linkedRisks.length} risk{linkedRisks.length !== 1 ? 's' : ''}
                                </span>
                              ) : (
                                <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>—</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <button
                                onClick={() => toggleDetail(control.id)}
                                className={isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'}
                              >
                                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                              </button>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className={isDark ? 'bg-gray-700 border-t border-gray-600' : 'bg-gray-100 border-t border-gray-200'}>
                              <td colSpan={9} className="py-4 px-4">
                                <div className="space-y-4">
                                  <div>
                                    <h4 className="font-semibold mb-2">Description</h4>
                                    <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>{control.description}</p>
                                  </div>
                                  {control.evidenceSummary && (
                                    <div>
                                      <h4 className="font-semibold mb-2">Evidence Summary</h4>
                                      <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>{control.evidenceSummary}</p>
                                    </div>
                                  )}
                                  {linkedRisks.length > 0 && (
                                    <div>
                                      <h4 className="font-semibold mb-2">Linked Risks</h4>
                                      <div className="flex flex-wrap gap-2">
                                        {linkedRisks.map(risk => (
                                          <Badge key={risk.id} className={SEVERITY_COLORS[risk.severity]}>
                                            {risk.title} ({risk.severity})
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {linkedIssueList.length > 0 && (
                                    <div>
                                      <h4 className="font-semibold mb-2">Linked Issues</h4>
                                      <div className="flex flex-wrap gap-2">
                                        {linkedIssueList.map(issue => (
                                          <Badge key={issue.id} className={SEVERITY_COLORS[issue.severity]}>
                                            {issue.id}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {(control.status === 'Partially Implemented' || control.status === 'Not Implemented') && (
                                    <div>
                                      <h4 className="font-semibold mb-2">Remediation Plan</h4>
                                      <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>{control.remediationPlan || 'No remediation plan yet.'}</p>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* TAB 2: GAPS & FINDINGS */}
        {activeTab === 'gaps' && (
          <div className="space-y-6">
            {/* Gap Summary Cards */}
            <div className="grid grid-cols-5 gap-4">
              <Card className={isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
                <div className="text-center">
                  <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Critical Gaps</p>
                  <p className="text-3xl font-bold text-red-600">{gapStats.criticalGaps}</p>
                </div>
              </Card>
              <Card className={isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
                <div className="text-center">
                  <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>High Findings</p>
                  <p className="text-3xl font-bold text-orange-600">{gapStats.highFindings}</p>
                </div>
              </Card>
              <Card className={isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
                <div className="text-center">
                  <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>MRA Count</p>
                  <p className="text-3xl font-bold text-yellow-600">{gapStats.mraCount}</p>
                </div>
              </Card>
              <Card className={isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
                <div className="text-center">
                  <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>MRIA Count</p>
                  <p className="text-3xl font-bold text-purple-600">{gapStats.mriaCount}</p>
                </div>
              </Card>
              <Card className={isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
                <div className="text-center">
                  <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Overdue</p>
                  <p className="text-3xl font-bold text-red-600">{gapStats.overdueCount}</p>
                </div>
              </Card>
            </div>

            {/* Control Gaps Table */}
            <Card className={isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
              <h3 className="text-lg font-semibold mb-4">Control Gaps</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={isDark ? 'border-b border-gray-700' : 'border-b border-gray-200'}>
                      <th className="text-left py-3 px-4 font-semibold">ID</th>
                      <th className="text-left py-3 px-4 font-semibold">Title</th>
                      <th className="text-left py-3 px-4 font-semibold">Framework</th>
                      <th className="text-left py-3 px-4 font-semibold">Status</th>
                      <th className="text-left py-3 px-4 font-semibold">Owner</th>
                      <th className="text-left py-3 px-4 font-semibold">Due Date</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {gapControls.map(control => {
                      const isExpanded = expandedDetails.get(`gap-${control.id}`);
                      const linkedRisks = getLinkedRisks(control.id);
                      const overdue = isOverdue(control.nextReview);

                      return (
                        <React.Fragment key={control.id}>
                          <tr className={`border-t ${isDark ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'} ${
                            overdue ? (isDark ? 'bg-red-900 bg-opacity-20 border-l-4 border-red-600' : 'bg-red-50 border-l-4 border-red-600') : ''
                          }`}>
                            <td className="py-3 px-4 font-mono text-xs">{control.id}</td>
                            <td className="py-3 px-4">{control.title}</td>
                            <td className="py-3 px-4">
                              <Badge className={FRAMEWORK_COLORS[control.framework]}>
                                {control.framework}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <Badge className={STATUS_COLORS[control.status]}>
                                {control.status}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-xs">{control.owner}</td>
                            <td className={`py-3 px-4 text-xs font-medium ${
                              overdue ? (isDark ? 'text-red-300' : 'text-red-700') : ''
                            }`}>
                              {new Date(control.nextReview).toLocaleDateString()}
                              {overdue && ' (OVERDUE)'}
                            </td>
                            <td className="py-3 px-4">
                              <button
                                onClick={() => toggleDetail(`gap-${control.id}`)}
                                className={isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'}
                              >
                                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                              </button>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className={isDark ? 'bg-gray-700 border-t border-gray-600' : 'bg-gray-100 border-t border-gray-200'}>
                              <td colSpan={7} className="py-4 px-4">
                                <div className="space-y-4">
                                  {linkedRisks.length > 0 && (
                                    <div>
                                      <h4 className="font-semibold mb-2">Impacted Risks</h4>
                                      <div className="space-y-2">
                                        {linkedRisks.map(risk => (
                                          <div key={risk.id} className={`p-2 rounded ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                                            <div className="font-medium">{risk.title}</div>
                                            <div className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                              Severity: <Badge className={SEVERITY_COLORS[risk.severity]}>{risk.severity}</Badge>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {control.remediationPlan && (
                                    <div>
                                      <h4 className="font-semibold mb-2">Remediation Plan</h4>
                                      <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>{control.remediationPlan}</p>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Issues/Findings Table */}
            <Card className={isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
              <h3 className="text-lg font-semibold mb-4">Issues & Findings</h3>

              {/* Source Filter Tabs */}
              <div className="flex flex-wrap gap-2 mb-4">
                {(['All', 'Internal Audit', 'External Audit', 'Regulatory Exam', 'Self-Identified', 'TPRM Review'] as const).map(source => (
                  <button
                    key={source}
                    onClick={() => setIssueSourceFilter(source)}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      issueSourceFilter === source
                        ? isDark
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-600 text-white'
                        : isDark
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {source}
                  </button>
                ))}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={isDark ? 'border-b border-gray-700' : 'border-b border-gray-200'}>
                      <th className="text-left py-3 px-4 font-semibold">ID</th>
                      <th className="text-left py-3 px-4 font-semibold">Title</th>
                      <th className="text-left py-3 px-4 font-semibold">Severity</th>
                      <th className="text-left py-3 px-4 font-semibold">Source</th>
                      <th className="text-left py-3 px-4 font-semibold">Status</th>
                      <th className="text-left py-3 px-4 font-semibold">Owner</th>
                      <th className="text-left py-3 px-4 font-semibold">Due Date</th>
                      <th className="text-left py-3 px-4 font-semibold">Tags</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIssues.map(issue => {
                      const isExpanded = expandedDetails.get(`issue-${issue.id}`);
                      const overdue = isOverdue(issue.dueDate);

                      return (
                        <React.Fragment key={issue.id}>
                          <tr className={`border-t ${isDark ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'} ${
                            overdue ? (isDark ? 'bg-red-900 bg-opacity-20 border-l-4 border-red-600' : 'bg-red-50 border-l-4 border-red-600') : ''
                          }`}>
                            <td className="py-3 px-4 font-mono text-xs">{issue.id}</td>
                            <td className="py-3 px-4">{issue.title}</td>
                            <td className="py-3 px-4">
                              <Badge className={SEVERITY_COLORS[issue.severity]}>
                                {issue.severity}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <Badge className={SOURCE_COLORS[issue.source]}>
                                {issue.source}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <Badge className={STATUS_COLORS[issue.status] || (isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')}>
                                {issue.status}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-xs">{issue.owner}</td>
                            <td className={`py-3 px-4 text-xs font-medium ${
                              overdue ? (isDark ? 'text-red-300' : 'text-red-700') : ''
                            }`}>
                              {new Date(issue.dueDate).toLocaleDateString()}
                              {overdue && ' (OVERDUE)'}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex flex-wrap gap-1">
                                {issue.tags?.map(tag => (
                                  <Badge key={tag} className={isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-800'}>
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <button
                                onClick={() => toggleDetail(`issue-${issue.id}`)}
                                className={isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'}
                              >
                                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                              </button>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className={isDark ? 'bg-gray-700 border-t border-gray-600' : 'bg-gray-100 border-t border-gray-200'}>
                              <td colSpan={9} className="py-4 px-4">
                                <div className="space-y-4">
                                  <div>
                                    <h4 className="font-semibold mb-2">Description</h4>
                                    <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>{issue.description}</p>
                                  </div>
                                  {issue.remediationPlan && (
                                    <div>
                                      <h4 className="font-semibold mb-2">Remediation Plan</h4>
                                      <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>{issue.remediationPlan}</p>
                                    </div>
                                  )}
                                  {issue.linkedControls && issue.linkedControls.length > 0 && (
                                    <div>
                                      <h4 className="font-semibold mb-2">Linked Controls</h4>
                                      <div className="flex flex-wrap gap-2">
                                        {issue.linkedControls.map(cid => (
                                          <Badge key={cid} className={isDark ? 'bg-gray-600 text-gray-200' : 'bg-gray-300 text-gray-800'}>
                                            {cid}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {issue.linkedRisks && issue.linkedRisks.length > 0 && (
                                    <div>
                                      <h4 className="font-semibold mb-2">Linked Risks</h4>
                                      <div className="flex flex-wrap gap-2">
                                        {issue.linkedRisks.map(rid => {
                                          const risk = risks.find(r => r.id === rid);
                                          return risk ? (
                                            <Badge key={rid} className={SEVERITY_COLORS[risk.severity]}>
                                              {risk.title}
                                            </Badge>
                                          ) : null;
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* TAB 3: REGULATORY INTELLIGENCE */}
        {activeTab === 'regulatory' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Regulatory Change Feed */}
              <div className="lg:col-span-2 space-y-4">
                <h2 className="text-xl font-semibold">Regulatory Change Feed</h2>
                {regulatoryChanges.slice(0, 7).map(change => (
                  <Card
                    key={change.id}
                    className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'} cursor-pointer hover:shadow-lg transition-shadow`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2">{change.title}</h3>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge className={SOURCE_COLORS[change.source]}>
                            {change.source}
                          </Badge>
                          <Badge className={
                            change.status === 'Monitoring' ? (isDark ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800') :
                            change.status === 'Impact Assessment' ? (isDark ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800') :
                            change.status === 'Implementation' ? (isDark ? 'bg-orange-900 text-orange-200' : 'bg-orange-100 text-orange-800') :
                            (isDark ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800')
                          }>
                            {change.status}
                          </Badge>
                          <Badge className={
                            change.impactLevel === 'Critical' ? (isDark ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800') :
                            change.impactLevel === 'High' ? (isDark ? 'bg-orange-900 text-orange-200' : 'bg-orange-100 text-orange-800') :
                            change.impactLevel === 'Medium' ? (isDark ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800') :
                            (isDark ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800')
                          }>
                            {change.impactLevel} Impact
                          </Badge>
                        </div>
                        <p className={`text-sm mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {change.summary}
                        </p>
                        <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                          Effective: {new Date(change.effectiveDate).toLocaleDateString()}
                        </p>
                      </div>
                      <RequirePermission permission="compliance:write">
                        <button
                          onClick={() => handleAnalyzeImpact(change.id)}
                          className="ml-4 px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition-colors text-sm whitespace-nowrap"
                        >
                          Analyze Impact
                        </button>
                      </RequirePermission>
                    </div>
                  </Card>
                ))}
              </div>

              {/* AI Impact Analysis Panel */}
              <div className="lg:col-span-1">
                <h2 className="text-xl font-semibold mb-4">Impact Analysis</h2>
                {regulatoryAnalyses.size === 0 ? (
                  <Card className={isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
                    <div className="text-center py-8">
                      <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                        Select a regulatory change to analyze impact
                      </p>
                    </div>
                  </Card>
                ) : (
                  Array.from(regulatoryAnalyses.values()).map(analysis => {
                    const change = regulatoryChanges.find(c => c.id === analysis.changeId);
                    if (!change) return null;

                    return (
                      <Card key={analysis.changeId} className={isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-sm">{change.title}</h3>
                          <button
                            onClick={() => toggleAnalysisPanel(analysis.changeId)}
                            className={isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'}
                          >
                            {analysis.isOpen ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>

                        {analysis.isOpen && (
                          <div className="space-y-3">
                            {analysis.isLoading ? (
                              <div className={`text-center py-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                <div className="inline-block animate-spin">
                                  <Clock className="w-5 h-5" />
                                </div>
                                <p className="mt-2 text-sm">Analyzing impact...</p>
                              </div>
                            ) : analysis.analysis ? (
                              <div className={`text-xs space-y-2 ${isDark ? 'text-gray-300' : 'text-gray-700'} max-h-96 overflow-y-auto`}>
                                <StreamingText text={analysis.analysis} />
                              </div>
                            ) : null}

                            {analysis.analysis && !analysis.isLoading && (
                              <button className="w-full mt-4 px-3 py-2 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                                <Download className="w-4 h-4" />
                                Export Analysis
                              </button>
                            )}
                          </div>
                        )}
                      </Card>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
