import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  TrendingUp,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useThemeStore } from '../store/themeStore';
import { useIndustryStore } from '../store/industryStore';
import { getDataAccess } from '../data/DataAccessLayer';

interface NormalizedException {
  id: string;
  type: 'Finding' | 'KRI Breach' | 'Alert';
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  title: string;
  description: string;
  source: string;
  date: string;
  owner?: string;
  status: string;
  daysOverdue: number;
  priorityScore: number;
  mraType?: string;
}

const Exceptions: React.FC = () => {
  const isDark = useThemeStore((state) => state.isDark);
  const industryId = useIndustryStore((s) => s.industryId);
  const [filterType, setFilterType] = useState<'All' | 'Findings' | 'KRI Breaches' | 'Alerts'>('All');
  const [filterSeverity, setFilterSeverity] = useState<'All' | 'Critical' | 'High' | 'Medium' | 'Low'>('All');
  const [searchText, setSearchText] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const dal = getDataAccess();
  const issues = dal.getIssues();
  const monitoringAlerts = dal.getMonitoringAlerts();
  const kris = dal.getKRIs();

  // Normalize exceptions from all sources
  const allExceptions: NormalizedException[] = useMemo(() => {
    const exceptions: NormalizedException[] = [];

    // Add issues as Findings
    issues.forEach((issue) => {
      if (issue.status !== 'Closed') {
        const dueDate = new Date(issue.dueDate);
        const today = new Date();
        const daysOverdue = Math.max(0, Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));

        // Calculate priority score
        const severityScore =
          issue.severity === 'Critical' ? 40 : issue.severity === 'High' ? 30 : issue.severity === 'Medium' ? 20 : 10;
        const overdueScore = Math.min(daysOverdue * 2, 30);
        const typeScore = 10;
        const mraScore = issue.mraType === 'MRIA' ? 15 : issue.mraType === 'MRA' ? 10 : 0;
        const priorityScore = severityScore + overdueScore + typeScore + mraScore;

        exceptions.push({
          id: `issue-${issue.id}`,
          type: 'Finding',
          severity: issue.severity as 'Critical' | 'High' | 'Medium' | 'Low',
          title: issue.title,
          description: issue.description,
          source: issue.domain,
          date: issue.createdDate,
          owner: issue.owner,
          status: issue.status,
          daysOverdue,
          priorityScore,
          mraType: issue.mraType,
        });
      }
    });

    // Add KRI Breaches
    kris.forEach((kri) => {
      if (kri.breachLevel === 'Breach' || kri.breachLevel === 'Critical') {
        const severityMap = { Breach: 'High' as const, Critical: 'Critical' as const };
        const severity = severityMap[kri.breachLevel];
        const today = new Date();
        const lastAssessmentDate = new Date(kri.lastAssessmentDate);
        const daysOverdue = Math.floor((today.getTime() - lastAssessmentDate.getTime()) / (1000 * 60 * 60 * 24));

        // Calculate priority score for KRI breaches
        const severityScore = severity === 'Critical' ? 40 : 30;
        const overdueScore = Math.min(Math.max(0, daysOverdue) * 2, 30);
        const typeScore = 15;
        const priorityScore = severityScore + overdueScore + typeScore;

        exceptions.push({
          id: `kri-${kri.id}`,
          type: 'KRI Breach',
          severity,
          title: kri.name,
          description: `Current value: ${kri.currentValue} (${kri.breachLevel} level)`,
          source: 'KRI Monitoring',
          date: kri.lastAssessmentDate,
          owner: kri.owner,
          status: kri.breachLevel,
          daysOverdue: Math.max(0, daysOverdue),
          priorityScore,
        });
      }
    });

    // Add Monitoring Alerts
    monitoringAlerts.forEach((alert) => {
      // Calculate priority score for alerts
      const severityScore =
        alert.severity === 'Critical' ? 40 : alert.severity === 'High' ? 30 : alert.severity === 'Medium' ? 20 : 10;
      const typeScore = 5;
      const priorityScore = severityScore + typeScore;

      exceptions.push({
        id: `alert-${alert.id}`,
        type: 'Alert',
        severity: alert.severity as 'Critical' | 'High' | 'Medium' | 'Low',
        title: alert.title,
        description: alert.description,
        source: alert.source,
        date: alert.detectedAt,
        status: alert.status,
        daysOverdue: 0,
        priorityScore,
      });
    });

    return exceptions;
  }, []);

  // Filter exceptions
  const filteredExceptions = useMemo(() => {
    return allExceptions
      .filter((exc) => {
        // Type filter
        if (filterType !== 'All' && exc.type !== filterType) return false;
        // Severity filter
        if (filterSeverity !== 'All' && exc.severity !== filterSeverity) return false;
        // Text search
        if (
          searchText &&
          !exc.title.toLowerCase().includes(searchText.toLowerCase()) &&
          !exc.description.toLowerCase().includes(searchText.toLowerCase())
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => b.priorityScore - a.priorityScore);
  }, [allExceptions, filterType, filterSeverity, searchText]);

  // Calculate summary stats
  const stats = useMemo(() => {
    const critical = allExceptions.filter((exc) => exc.severity === 'Critical').length;
    const overdue = allExceptions.filter((exc) => exc.daysOverdue > 0).length;
    const kriBreaches = allExceptions.filter((exc) => exc.type === 'KRI Breach').length;

    return {
      total: allExceptions.length,
      critical,
      overdue,
      kriBreaches,
    };
  }, [allExceptions]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical':
        return isDark
          ? { bg: 'bg-red-900/30', text: 'text-red-300', badge: 'bg-red-900 text-red-100' }
          : { bg: 'bg-red-50', text: 'text-red-700', badge: 'bg-red-100 text-red-800' };
      case 'High':
        return isDark
          ? { bg: 'bg-orange-900/30', text: 'text-orange-300', badge: 'bg-orange-900 text-orange-100' }
          : { bg: 'bg-orange-50', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-800' };
      case 'Medium':
        return isDark
          ? { bg: 'bg-yellow-900/30', text: 'text-yellow-300', badge: 'bg-yellow-900 text-yellow-100' }
          : { bg: 'bg-yellow-50', text: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-800' };
      case 'Low':
        return isDark
          ? { bg: 'bg-blue-900/30', text: 'text-blue-300', badge: 'bg-blue-900 text-blue-100' }
          : { bg: 'bg-blue-50', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-800' };
      default:
        return isDark
          ? { bg: 'bg-slate-900/30', text: 'text-slate-300', badge: 'bg-slate-900 text-slate-100' }
          : { bg: 'bg-slate-50', text: 'text-slate-700', badge: 'bg-slate-100 text-slate-800' };
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Finding':
        return isDark ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-800';
      case 'KRI Breach':
        return isDark ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-800';
      case 'Alert':
        return isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-800';
      default:
        return isDark ? 'bg-slate-900/30 text-slate-300' : 'bg-slate-100 text-slate-800';
    }
  };

  const getPriorityBarColor = (score: number) => {
    if (score >= 80) return 'bg-red-500';
    if (score >= 60) return 'bg-orange-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  const toggleRowExpand = (id: string) => {
    const newSet = new Set(expandedRows);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedRows(newSet);
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
      {/* Header */}
      <div className={`${isDark ? 'bg-gradient-to-r from-slate-900 to-slate-800' : 'bg-gradient-to-r from-red-600 to-orange-600'} text-white py-8 px-4`}>
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-8 h-8" />
            <h1 className="text-3xl font-bold">Exception Management</h1>
          </div>
          <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-orange-100'}`}>
            Monitor and manage GRC exceptions, findings, and KRI breaches
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div
            className={`p-6 rounded-lg border ${
              isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
            }`}
          >
            <div className={`text-sm font-medium mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Total Active Exceptions
            </div>
            <div className={`text-3xl font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
              {stats.total}
            </div>
          </div>

          <div
            className={`p-6 rounded-lg border ${
              isDark
                ? 'bg-red-900/30 border-red-700'
                : 'bg-red-50 border-red-200'
            }`}
          >
            <div className={`text-sm font-medium mb-2 ${
              isDark ? 'text-red-300' : 'text-red-700'
            }`}>
              Critical
            </div>
            <div className={`text-3xl font-bold ${
              isDark ? 'text-red-200' : 'text-red-600'
            }`}>
              {stats.critical}
            </div>
          </div>

          <div
            className={`p-6 rounded-lg border ${
              isDark
                ? 'bg-orange-900/30 border-orange-700'
                : 'bg-orange-50 border-orange-200'
            }`}
          >
            <div className={`text-sm font-medium mb-2 ${
              isDark ? 'text-orange-300' : 'text-orange-700'
            }`}>
              Overdue Findings
            </div>
            <div className={`text-3xl font-bold ${
              isDark ? 'text-orange-200' : 'text-orange-600'
            }`}>
              {stats.overdue}
            </div>
          </div>

          <div
            className={`p-6 rounded-lg border ${
              isDark
                ? 'bg-yellow-900/30 border-yellow-700'
                : 'bg-yellow-50 border-yellow-200'
            }`}
          >
            <div className={`text-sm font-medium mb-2 ${
              isDark ? 'text-yellow-300' : 'text-yellow-700'
            }`}>
              KRI Breaches
            </div>
            <div className={`text-3xl font-bold ${
              isDark ? 'text-yellow-200' : 'text-yellow-600'
            }`}>
              {stats.kriBreaches}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className={`p-4 rounded-lg border mb-6 ${
          isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
        }`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-slate-300' : 'text-slate-700'
              }`}>
                Search
              </label>
              <div className="relative">
                <Search className={`absolute left-3 top-3 w-4 h-4 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`} />
                <input
                  type="text"
                  placeholder="Search exceptions..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 rounded border ${
                    isDark
                      ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-400'
                      : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500'
                  }`}
                />
              </div>
            </div>

            {/* Type Filter */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-slate-300' : 'text-slate-700'
              }`}>
                Type
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as typeof filterType)}
                className={`w-full px-4 py-2 rounded border ${
                  isDark
                    ? 'bg-slate-700 border-slate-600 text-slate-100'
                    : 'bg-white border-slate-300 text-slate-900'
                }`}
              >
                <option>All</option>
                <option>Findings</option>
                <option>KRI Breaches</option>
                <option>Alerts</option>
              </select>
            </div>

            {/* Severity Filter */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-slate-300' : 'text-slate-700'
              }`}>
                Severity
              </label>
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value as typeof filterSeverity)}
                className={`w-full px-4 py-2 rounded border ${
                  isDark
                    ? 'bg-slate-700 border-slate-600 text-slate-100'
                    : 'bg-white border-slate-300 text-slate-900'
                }`}
              >
                <option>All</option>
                <option>Critical</option>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Exception List */}
        <div className="space-y-3">
          {filteredExceptions.length === 0 ? (
            <div
              className={`p-8 rounded-lg border text-center ${
                isDark
                  ? 'bg-slate-800 border-slate-700 text-slate-400'
                  : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No exceptions match the selected filters</p>
            </div>
          ) : (
            filteredExceptions.map((exc) => {
              const severityColor = getSeverityColor(exc.severity);
              const isExpanded = expandedRows.has(exc.id);

              return (
                <div
                  key={exc.id}
                  className={`rounded-lg border overflow-hidden ${
                    isDark
                      ? 'bg-slate-800 border-slate-700'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  {/* Row Header */}
                  <button
                    onClick={() => toggleRowExpand(exc.id)}
                    className={`w-full p-4 flex items-center gap-4 hover:opacity-80 transition-opacity`}
                  >
                    {/* Priority Bar */}
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-10 text-center">
                        <div className="text-sm font-bold">{exc.priorityScore}</div>
                      </div>
                      <div className="w-1 h-12 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className={`w-full transition-all ${getPriorityBarColor(exc.priorityScore)}`}
                          style={{
                            height: `${(exc.priorityScore / 100) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* Type Badge */}
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(exc.type)}`}>
                      {exc.type}
                    </div>

                    {/* Severity Badge */}
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${severityColor.badge}`}
                    >
                      {exc.severity}
                    </div>

                    {/* Title & Description */}
                    <div className="flex-1 text-left">
                      <h3 className={`font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                        {exc.title}
                      </h3>
                      <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {exc.description}
                      </p>
                    </div>

                    {/* Source & Date */}
                    <div className={`text-sm text-right ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      <p className="font-medium">{exc.source}</p>
                      <p className="text-xs">{new Date(exc.date).toLocaleDateString()}</p>
                    </div>

                    {/* Expand Icon */}
                    <div className={`flex-shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {isExpanded ? <ChevronUp /> : <ChevronDown />}
                    </div>
                  </button>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div
                      className={`px-4 py-4 border-t ${
                        isDark
                          ? 'border-slate-700 bg-slate-800/50'
                          : 'border-slate-100 bg-slate-50'
                      }`}
                    >
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className={`font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            Status
                          </p>
                          <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>{exc.status}</p>
                        </div>
                        {exc.owner && (
                          <div>
                            <p className={`font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                              Owner
                            </p>
                            <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>{exc.owner}</p>
                          </div>
                        )}
                        {exc.daysOverdue > 0 && (
                          <div>
                            <p className={`font-semibold mb-1 ${isDark ? 'text-orange-300' : 'text-orange-700'}`}>
                              Days Overdue
                            </p>
                            <p className={isDark ? 'text-orange-400' : 'text-orange-600'}>{exc.daysOverdue} days</p>
                          </div>
                        )}
                        {exc.mraType && (
                          <div>
                            <p className={`font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                              MRA Type
                            </p>
                            <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>{exc.mraType}</p>
                          </div>
                        )}
                        <div>
                          <p className={`font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            Priority Score
                          </p>
                          <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>{exc.priorityScore}/100</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer Info */}
        <div
          className={`mt-8 p-4 rounded-lg border text-sm ${
            isDark
              ? 'bg-slate-800 border-slate-700 text-slate-400'
              : 'bg-slate-50 border-slate-200 text-slate-600'
          }`}
        >
          <p>
            Showing <strong>{filteredExceptions.length}</strong> of <strong>{allExceptions.length}</strong> exceptions,
            sorted by priority score (highest first). Priority calculation includes severity, days overdue, exception
            type, and MRA type.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Exceptions;
