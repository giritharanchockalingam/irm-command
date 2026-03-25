import React, { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  TrendingUp,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Download,
  Copy,
  ChevronDown,
  ChevronUp,
  Filter,
  ArrowUpDown,
  Building2,
  MapPin,
  Zap,
  Shield,
  Calendar,
} from 'lucide-react';
import { getDataAccess } from '../data/DataAccessLayer';
import { Vendor, Control, MonitoringAlert, Risk } from '../domain/types';
import { TemplateEngine } from '../ai/local/templateEngine';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { StreamingText } from '../components/ui/StreamingText';
import { Modal } from '../components/ui/Modal';
import { Table } from '../components/ui/Table';
import { useIndustryStore } from '../store/industryStore';
import { useAppStore } from '../store/appStore';
import { useThemeStore } from '../store/themeStore';
import { useClientStore } from '../store/clientStore';
import { useSecurity, RequirePermission } from '../security/SecurityContext';

interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

interface FilterConfig {
  tier: string;
  criticality: string;
  slaStatus: string;
}

export default function TPRMPage() {
  const { vendorId } = useParams();
  const navigate = useNavigate();

  if (vendorId) {
    return <VendorDetailView vendorId={vendorId} />;
  }

  return <VendorRegisterView />;
}

function VendorRegisterView() {
  const navigate = useNavigate();
  const isDarkMode = useThemeStore((s) => s.isDark);
  const industryId = useIndustryStore((s) => s.industryId);
  const activeClientId = useClientStore((s) => s.activeClientId);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'asc' });
  const [filters, setFilters] = useState<FilterConfig>({ tier: '', criticality: '', slaStatus: '' });
  const [expandedAlerts, setExpandedAlerts] = useState<Set<string>>(new Set());
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState<Set<string>>(new Set());

  const dal = getDataAccess();
  const vendors = dal.getVendors();
  const monitoringAlerts = dal.getMonitoringAlerts();

  // Stats calculations
  const totalVendors = vendors.length;
  const criticalVendors = vendors.filter((v) => v.criticality === 'Critical').length;
  const avgRiskScore = vendors.length > 0
    ? (vendors.reduce((sum, v) => sum + (v.residualRisk || v.inherentRisk), 0) / vendors.length).toFixed(1)
    : '0.0';
  const overdueReassessments = vendors.filter((v) => {
    const lastReview = new Date(v.lastAssessmentDate);
    const daysAgo = (Date.now() - lastReview.getTime()) / (1000 * 60 * 60 * 24);
    return daysAgo > 365;
  }).length;
  const slaBreaches = vendors.filter((v) => v.slaStatus === 'Red').length;

  // Filter and sort vendors
  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
      if (filters.tier && v.tier.toString() !== filters.tier) return false;
      if (filters.criticality && v.criticality !== filters.criticality) return false;
      if (filters.slaStatus && v.slaStatus !== filters.slaStatus) return false;
      return true;
    });
  }, [filters]);

  const sortedVendors = useMemo(() => {
    const sorted = [...filteredVendors];
    sorted.sort((a, b) => {
      const aVal = a[sortConfig.key as keyof Vendor];
      const bVal = b[sortConfig.key as keyof Vendor];

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      return sortConfig.direction === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
    return sorted;
  }, [filteredVendors, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const toggleAlertExpand = (alertId: string) => {
    setExpandedAlerts((prev) => {
      const updated = new Set(prev);
      if (updated.has(alertId)) updated.delete(alertId);
      else updated.add(alertId);
      return updated;
    });
  };

  const acknowledgeAlert = (alertId: string) => {
    setAcknowledgedAlerts((prev) => new Set([...prev, alertId]));
  };

  const isDateOverdue = (dateStr: string): boolean => {
    const date = new Date(dateStr);
    return date < new Date();
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical':
        return 'bg-red-900 text-red-100';
      case 'high':
        return 'bg-orange-900 text-orange-100';
      case 'medium':
        return 'bg-yellow-900 text-yellow-100';
      default:
        return 'bg-blue-900 text-blue-100';
    }
  };

  const getRiskColor = (score: number): string => {
    if (score >= 4) return 'bg-gradient-to-r from-red-500 to-red-700';
    if (score >= 3) return 'bg-gradient-to-r from-orange-500 to-red-500';
    if (score >= 2) return 'bg-gradient-to-r from-yellow-500 to-orange-500';
    return 'bg-gradient-to-r from-green-500 to-yellow-500';
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-4xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            TPRM Vendor Lifecycle Management
          </h1>
          <p className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>
            Full third-party risk assessment, monitoring, and control coverage
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <div className={`p-4 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
              <div className={`text-sm font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Total Vendors
              </div>
              <div className={`text-3xl font-bold mt-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                {totalVendors}
              </div>
            </div>
          </Card>
          <Card>
            <div className={`p-4 ${isDarkMode ? 'bg-red-900/30' : 'bg-red-100'}`}>
              <div className={`text-sm font-semibold ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>
                Critical
              </div>
              <div className={`text-3xl font-bold mt-2 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                {criticalVendors}
              </div>
            </div>
          </Card>
          <Card>
            <div className={`p-4 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
              <div className={`text-sm font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Avg Risk Score
              </div>
              <div className={`text-3xl font-bold mt-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                {avgRiskScore}
              </div>
            </div>
          </Card>
          <Card>
            <div className={`p-4 ${isDarkMode ? 'bg-yellow-900/30' : 'bg-yellow-100'}`}>
              <div className={`text-sm font-semibold ${isDarkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
                Overdue Review
              </div>
              <div className={`text-3xl font-bold mt-2 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                {overdueReassessments}
              </div>
            </div>
          </Card>
          <Card>
            <div className={`p-4 ${isDarkMode ? 'bg-red-900/30' : 'bg-red-100'}`}>
              <div className={`text-sm font-semibold ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>
                SLA Breaches
              </div>
              <div className={`text-3xl font-bold mt-2 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                {slaBreaches}
              </div>
            </div>
          </Card>
        </div>

        {/* Risk Matrix */}
        <Card className="mb-8">
          <div className={`p-6 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Vendor Risk Matrix
            </h3>
            <div className="grid grid-cols-3 gap-4 h-48">
              {['low', 'medium', 'critical'].map((criticality, idx) => {
                const vendorsInQuadrant = vendors.filter((v) => v.criticality === criticality).length;
                return (
                  <div
                    key={criticality}
                    className={`p-4 rounded border-2 flex flex-col justify-center items-center ${
                      isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className={`text-sm font-semibold capitalize ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                      {criticality}
                    </div>
                    <div className={`text-2xl font-bold mt-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      {vendorsInQuadrant}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-3 gap-6">
          {/* Main Vendor Table */}
          <div className="col-span-2">
            <Card>
              <div className={`p-6 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
                <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  Vendor Register
                </h3>

                {/* Filters */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <select
                    value={filters.tier}
                    onChange={(e) => setFilters((prev) => ({ ...prev, tier: e.target.value }))}
                    className={`px-3 py-2 text-sm rounded border ${
                      isDarkMode
                        ? 'bg-slate-700 border-slate-600 text-white'
                        : 'bg-white border-slate-200 text-slate-900'
                    }`}
                  >
                    <option value="">All Tiers</option>
                    <option value="1">Tier 1</option>
                    <option value="2">Tier 2</option>
                    <option value="3">Tier 3</option>
                  </select>
                  <select
                    value={filters.criticality}
                    onChange={(e) => setFilters((prev) => ({ ...prev, criticality: e.target.value }))}
                    className={`px-3 py-2 text-sm rounded border ${
                      isDarkMode
                        ? 'bg-slate-700 border-slate-600 text-white'
                        : 'bg-white border-slate-200 text-slate-900'
                    }`}
                  >
                    <option value="">All Criticality</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                  <select
                    value={filters.slaStatus}
                    onChange={(e) => setFilters((prev) => ({ ...prev, slaStatus: e.target.value }))}
                    className={`px-3 py-2 text-sm rounded border ${
                      isDarkMode
                        ? 'bg-slate-700 border-slate-600 text-white'
                        : 'bg-white border-slate-200 text-slate-900'
                    }`}
                  >
                    <option value="">All SLA Status</option>
                    <option value="compliant">Compliant</option>
                    <option value="warning">Warning</option>
                    <option value="breach">Breach</option>
                  </select>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className={isDarkMode ? 'border-b border-slate-600' : 'border-b border-slate-200'}>
                        {[
                          { key: 'vendorId', label: 'Vendor ID' },
                          { key: 'name', label: 'Name' },
                          { key: 'tier', label: 'Tier' },
                          { key: 'criticality', label: 'Criticality' },
                          { key: 'dataSensitivity', label: 'Data Sensitivity' },
                          { key: 'inherentRisk', label: 'Inherent Risk' },
                          { key: 'residualRisk', label: 'Residual Risk' },
                          { key: 'slaStatus', label: 'SLA' },
                          { key: 'nextReviewDate', label: 'Next Review' },
                        ].map((col) => (
                          <th
                            key={col.key}
                            onClick={() => handleSort(col.key)}
                            className={`px-3 py-2 text-left cursor-pointer hover:opacity-75 ${
                              isDarkMode ? 'text-slate-300' : 'text-slate-700'
                            } font-semibold`}
                          >
                            <div className="flex items-center gap-1">
                              {col.label}
                              <ArrowUpDown size={14} />
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sortedVendors.map((vendor) => (
                        <tr
                          key={vendor.id}
                          onClick={() => navigate(`/tprm/${vendor.id}`)}
                          className={`cursor-pointer transition-colors ${
                            isDarkMode
                              ? 'border-b border-slate-700 hover:bg-slate-700'
                              : 'border-b border-slate-100 hover:bg-slate-50'
                          }`}
                        >
                          <td className={`px-3 py-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'} text-xs`}>
                            {vendor.id}
                          </td>
                          <td className={`px-3 py-3 font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                            {vendor.name}
                          </td>
                          <td className="px-3 py-3">
                            <Badge className={`text-xs ${vendor.tier === 1 ? 'bg-red-900 text-red-100' : vendor.tier === 2 ? 'bg-orange-900 text-orange-100' : 'bg-yellow-900 text-yellow-100'}`}>
                              Tier {vendor.tier}
                            </Badge>
                          </td>
                          <td className="px-3 py-3">
                            <Badge className={`text-xs capitalize ${vendor.criticality === 'critical' ? 'bg-red-900 text-red-100' : vendor.criticality === 'high' ? 'bg-orange-900 text-orange-100' : 'bg-blue-900 text-blue-100'}`}>
                              {vendor.criticality}
                            </Badge>
                          </td>
                          <td className="px-3 py-3">
                            <Badge className={`text-xs ${vendor.dataSensitivity === 'high' ? 'bg-red-900 text-red-100' : vendor.dataSensitivity === 'medium' ? 'bg-orange-900 text-orange-100' : 'bg-green-900 text-green-100'}`}>
                              {vendor.dataSensitivity}
                            </Badge>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2">
                              <div className={`h-2 w-16 rounded ${getRiskColor(vendor.inherentRisk)}`}></div>
                              <span className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}>{vendor.inherentRisk}</span>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2">
                              <div className={`h-2 w-16 rounded ${getRiskColor(vendor.residualRisk || vendor.inherentRisk)}`}></div>
                              <span className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}>{vendor.residualRisk || vendor.inherentRisk}</span>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <div className={`w-3 h-3 rounded-full ${vendor.slaStatus === 'compliant' ? 'bg-green-500' : vendor.slaStatus === 'warning' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                          </td>
                          <td className={`px-3 py-3 text-xs ${isDateOverdue(vendor.nextReviewDate) ? 'text-red-500 font-semibold' : isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            {new Date(vendor.nextReviewDate).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          </div>

          {/* Monitoring Alerts Sidebar */}
          <div>
            <Card>
              <div className={`p-6 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
                <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  Monitoring Alerts
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {monitoringAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-3 rounded border ${
                        acknowledgedAlerts.has(alert.id)
                          ? isDarkMode
                            ? 'bg-slate-700 border-slate-600 opacity-60'
                            : 'bg-slate-100 border-slate-200 opacity-60'
                          : isDarkMode
                            ? 'bg-slate-700 border-slate-600'
                            : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-start gap-3 mb-2">
                        <div className="mt-1">
                          {alert.type === 'compliance' && <Shield size={16} className="text-blue-500" />}
                          {alert.type === 'performance' && <TrendingUp size={16} className="text-yellow-500" />}
                          {alert.type === 'risk' && <AlertTriangle size={16} className="text-red-500" />}
                        </div>
                        <div className="flex-1">
                          <div className={`font-semibold text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                            {alert.title}
                          </div>
                          <Badge className={`text-xs mt-1 ${getSeverityColor(alert.severity)}`}>
                            {alert.severity.toUpperCase()}
                          </Badge>
                          <div className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            {alert.vendor}
                          </div>
                          <div className={`text-xs mt-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                            {new Date(alert.timestamp).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      {/* AI Interpretation */}
                      {expandedAlerts.has(alert.id) && (
                        <div className={`mt-3 p-2 rounded text-xs ${isDarkMode ? 'bg-slate-600' : 'bg-slate-100'}`}>
                          <div className={`font-semibold mb-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                            AI Interpretation:
                          </div>
                          <StreamingText text={alert.aiInterpretation} />
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => toggleAlertExpand(alert.id)}
                          className={`text-xs px-2 py-1 rounded transition-colors ${
                            isDarkMode
                              ? 'bg-slate-600 hover:bg-slate-500 text-slate-300'
                              : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                          }`}
                        >
                          {expandedAlerts.has(alert.id) ? (
                            <ChevronUp size={14} className="inline mr-1" />
                          ) : (
                            <ChevronDown size={14} className="inline mr-1" />
                          )}
                          Details
                        </button>
                        {!acknowledgedAlerts.has(alert.id) && (
                          <button
                            onClick={() => acknowledgeAlert(alert.id)}
                            className="text-xs px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                          >
                            Acknowledge
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function VendorDetailView({ vendorId }: { vendorId: string }) {
  const { can: canPerform } = useSecurity();
  const isDarkMode = useThemeStore((s) => s.isDark);
  const industryId = useIndustryStore((s) => s.industryId);
  const activeClientId = useClientStore((s) => s.activeClientId);
  const navigate = useNavigate();
  const [showAIAssessment, setShowAIAssessment] = useState(false);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [showExamNarrative, setShowExamNarrative] = useState(false);
  const [aiAssessment, setAiAssessment] = useState('');
  const [questionnaire, setQuestionnaire] = useState('');
  const [examNarrative, setExamNarrative] = useState('');
  const [expandedAlerts, setExpandedAlerts] = useState<Set<string>>(new Set());

  const dal = getDataAccess();
  const vendors = dal.getVendors();
  const controls = dal.getControls();
  const monitoringAlerts = dal.getMonitoringAlerts();

  const vendor = vendors.find((v) => v.id === vendorId);
  const vendorControls = vendor ? controls.filter((c) => vendor.controlIds.includes(c.id)) : [];
  const vendorAlerts = monitoringAlerts.filter((a) => a.vendorId === vendor?.id);

  const engine = useMemo(() => new TemplateEngine(), []);

  const generateAIAssessment = useCallback(async () => {
    if (!vendor) return;
    setShowAIAssessment(true);
    const narrative = engine.generateVendorNarrative(vendor, vendorControls, vendorAlerts);
    setAiAssessment(narrative);
  }, [vendor, vendorControls, vendorAlerts, engine]);

  const generateQuestionnaire = useCallback(async () => {
    if (!vendor) return;
    setShowQuestionnaire(true);
    const questions = engine.generateVendorQuestionnaire(vendor);
    setQuestionnaire(questions.map((q, i) => `${i + 1}. [${q.category}] ${q.question}`).join('\n'));
  }, [vendor, engine]);

  const generateExamNarrative = useCallback(async () => {
    if (!vendor) return;
    setShowExamNarrative(true);
    const narrative = engine.generateVendorNarrative(vendor, vendorControls, vendorAlerts);
    setExamNarrative(narrative);
  }, [vendor, vendorControls, vendorAlerts, engine]);

  if (!vendor) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-slate-900' : 'bg-white'} p-6`}>
        <div className={`text-center ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          Vendor not found
        </div>
      </div>
    );
  }

  const toggleAlertExpand = (alertId: string) => {
    setExpandedAlerts((prev) => {
      const updated = new Set(prev);
      if (updated.has(alertId)) updated.delete(alertId);
      else updated.add(alertId);
      return updated;
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical':
        return 'bg-red-900 text-red-100';
      case 'high':
        return 'bg-orange-900 text-orange-100';
      case 'medium':
        return 'bg-yellow-900 text-yellow-100';
      default:
        return 'bg-blue-900 text-blue-100';
    }
  };

  const getRiskColor = (score: number): string => {
    if (score >= 4) return 'bg-gradient-to-r from-red-500 to-red-700';
    if (score >= 3) return 'bg-gradient-to-r from-orange-500 to-red-500';
    if (score >= 2) return 'bg-gradient-to-r from-yellow-500 to-orange-500';
    return 'bg-gradient-to-r from-green-500 to-yellow-500';
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}>
      <div className="max-w-6xl mx-auto p-6">
        {/* Back Navigation */}
        <button
          onClick={() => navigate('/tprm')}
          className={`flex items-center gap-2 mb-6 px-3 py-2 rounded transition-colors ${
            isDarkMode
              ? 'text-blue-400 hover:bg-slate-800'
              : 'text-blue-600 hover:bg-slate-100'
          }`}
        >
          <ChevronLeft size={20} />
          Back to Vendor Register
        </button>

        {/* Vendor Header Card */}
        <Card className="mb-6">
          <div className={`p-6 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  {vendor.name}
                </h1>
                <div className="flex gap-2 mt-3">
                  <Badge className={`text-xs ${vendor.tier === 1 ? 'bg-red-900 text-red-100' : vendor.tier === 2 ? 'bg-orange-900 text-orange-100' : 'bg-yellow-900 text-yellow-100'}`}>
                    Tier {vendor.tier}
                  </Badge>
                  <Badge className={`text-xs capitalize ${vendor.criticality === 'critical' ? 'bg-red-900 text-red-100' : vendor.criticality === 'high' ? 'bg-orange-900 text-orange-100' : 'bg-blue-900 text-blue-100'}`}>
                    {vendor.criticality}
                  </Badge>
                  <div className={`flex items-center gap-2 px-3 py-1 rounded text-xs font-semibold ${vendor.slaStatus === 'compliant' ? 'bg-green-900/50 text-green-300' : vendor.slaStatus === 'warning' ? 'bg-yellow-900/50 text-yellow-300' : 'bg-red-900/50 text-red-300'}`}>
                    <div className={`w-2 h-2 rounded-full ${vendor.slaStatus === 'compliant' ? 'bg-green-500' : vendor.slaStatus === 'warning' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                    {vendor.slaStatus === 'compliant' ? 'SLA Compliant' : vendor.slaStatus === 'warning' ? 'SLA Warning' : 'SLA Breach'}
                  </div>
                </div>
              </div>
            </div>

            {/* Key Metrics Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-700">
              <div>
                <div className={`text-xs font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'} uppercase tracking-wider`}>
                  Inherent Risk
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <div className={`h-3 w-20 rounded ${getRiskColor(vendor.inherentRisk)}`}></div>
                  <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    {vendor.inherentRisk}/5
                  </span>
                </div>
              </div>
              <div>
                <div className={`text-xs font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'} uppercase tracking-wider`}>
                  Residual Risk
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <div className={`h-3 w-20 rounded ${getRiskColor(vendor.residualRisk || vendor.inherentRisk)}`}></div>
                  <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    {vendor.residualRisk || vendor.inherentRisk}/5
                  </span>
                </div>
              </div>
              <div>
                <div className={`text-xs font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'} uppercase tracking-wider`}>
                  Data Sensitivity
                </div>
                <div className={`mt-2 font-semibold capitalize ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  {vendor.dataSensitivity}
                </div>
              </div>
              <div>
                <div className={`text-xs font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'} uppercase tracking-wider`}>
                  Contract Expiry
                </div>
                <div className={`mt-2 font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  {new Date(vendor.contractExpiry).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-6 pt-6 border-t border-slate-700">
              <div>
                <div className={`flex items-center gap-2 text-sm font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  <MapPin size={16} />
                  Location
                </div>
                <div className={`mt-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  {vendor.location}
                </div>
              </div>
              <div>
                <div className={`flex items-center gap-2 text-sm font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  <Zap size={16} />
                  Primary Service
                </div>
                <div className={`mt-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  {vendor.services[0]}
                </div>
              </div>
              <div>
                <div className={`flex items-center gap-2 text-sm font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  <Shield size={16} />
                  Regulatory
                </div>
                <div className={`mt-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  {vendor.regulatoryRelevance.join(', ')}
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="col-span-2 space-y-6">
            {/* AI Risk Narrative */}
            <Card>
              <div className={`p-6 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    AI Risk Assessment
                  </h3>
                  <RequirePermission permission="vendor:write">
                    <button
                      onClick={generateAIAssessment}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded font-semibold transition-colors"
                    >
                      Generate Assessment
                    </button>
                  </RequirePermission>
                </div>

                {showAIAssessment && aiAssessment && (
                  <div className={`p-4 rounded ${isDarkMode ? 'bg-slate-700' : 'bg-white'} mt-4`}>
                    <StreamingText text={aiAssessment} />
                    <button
                      onClick={() => copyToClipboard(aiAssessment)}
                      className={`mt-4 flex items-center gap-2 text-sm px-3 py-2 rounded transition-colors ${
                        isDarkMode
                          ? 'bg-slate-600 hover:bg-slate-500 text-slate-300'
                          : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                      }`}
                    >
                      <Copy size={14} />
                      Copy to Clipboard
                    </button>
                  </div>
                )}
              </div>
            </Card>

            {/* Control Coverage */}
            <Card>
              <div className={`p-6 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
                <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  Control Coverage ({vendorControls.length} controls)
                </h3>

                {vendorControls.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className={isDarkMode ? 'border-b border-slate-600' : 'border-b border-slate-200'}>
                          <th className={`px-3 py-2 text-left ${isDarkMode ? 'text-slate-300' : 'text-slate-700'} font-semibold`}>
                            Control
                          </th>
                          <th className={`px-3 py-2 text-left ${isDarkMode ? 'text-slate-300' : 'text-slate-700'} font-semibold`}>
                            Status
                          </th>
                          <th className={`px-3 py-2 text-left ${isDarkMode ? 'text-slate-300' : 'text-slate-700'} font-semibold`}>
                            Effectiveness
                          </th>
                          <th className={`px-3 py-2 text-left ${isDarkMode ? 'text-slate-300' : 'text-slate-700'} font-semibold`}>
                            Last Test
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {vendorControls.map((control) => (
                          <tr
                            key={control.controlId}
                            className={`${isDarkMode ? 'border-b border-slate-700' : 'border-b border-slate-100'}`}
                          >
                            <td className={`px-3 py-3 font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                              {control.controlName}
                            </td>
                            <td className="px-3 py-3">
                              <Badge
                                className={`text-xs ${
                                  control.status === 'Implemented'
                                    ? 'bg-green-900 text-green-100'
                                    : control.status === 'Under Review'
                                      ? 'bg-blue-900 text-blue-100'
                                      : 'bg-red-900 text-red-100'
                                }`}
                              >
                                {control.status}
                              </Badge>
                            </td>
                            <td className={`px-3 py-3 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                              {control.effectiveness}
                            </td>
                            <td className={`px-3 py-3 text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                              {new Date(control.lastTestDate).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    No controls mapped to this vendor
                  </div>
                )}
              </div>
            </Card>

            {/* Monitoring Alerts */}
            {vendorAlerts.length > 0 && (
              <Card>
                <div className={`p-6 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
                  <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    Monitoring Alerts ({vendorAlerts.length})
                  </h3>

                  <div className="space-y-3">
                    {vendorAlerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={`p-4 rounded border ${
                          isDarkMode
                            ? 'bg-slate-700 border-slate-600'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex-1">
                            <div className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                              {alert.title}
                            </div>
                            <Badge className={`text-xs mt-1 ${getSeverityColor(alert.severity)}`}>
                              {alert.severity.toUpperCase()}
                            </Badge>
                            <div className={`text-xs mt-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                              {new Date(alert.timestamp).toLocaleDateString()}
                            </div>
                          </div>
                        </div>

                        {expandedAlerts.has(alert.id) && (
                          <div className={`mt-3 p-3 rounded text-sm ${isDarkMode ? 'bg-slate-600' : 'bg-slate-100'}`}>
                            <StreamingText text={alert.aiInterpretation} />
                          </div>
                        )}

                        <button
                          onClick={() => toggleAlertExpand(alert.id)}
                          className={`mt-2 text-xs px-3 py-1 rounded transition-colors ${
                            isDarkMode
                              ? 'bg-slate-600 hover:bg-slate-500 text-slate-300'
                              : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                          }`}
                        >
                          {expandedAlerts.has(alert.id) ? (
                            <ChevronUp size={14} className="inline mr-1" />
                          ) : (
                            <ChevronDown size={14} className="inline mr-1" />
                          )}
                          {expandedAlerts.has(alert.id) ? 'Hide' : 'Show'} Details
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* Questionnaire Generator */}
            <Card>
              <div className={`p-6 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    Due Diligence Questionnaire
                  </h3>
                  <RequirePermission permission="vendor:write">
                    <button
                      onClick={generateQuestionnaire}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded font-semibold transition-colors"
                    >
                      Generate
                    </button>
                  </RequirePermission>
                </div>

                {showQuestionnaire && questionnaire && (
                  <div className={`p-4 rounded ${isDarkMode ? 'bg-slate-700' : 'bg-white'} mt-4`}>
                    <div className={`text-sm whitespace-pre-wrap ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      {questionnaire}
                    </div>
                    <button
                      onClick={() => copyToClipboard(questionnaire)}
                      className={`mt-4 flex items-center gap-2 text-sm px-3 py-2 rounded transition-colors ${
                        isDarkMode
                          ? 'bg-slate-600 hover:bg-slate-500 text-slate-300'
                          : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                      }`}
                    >
                      <Copy size={14} />
                      Copy to Clipboard
                    </button>
                  </div>
                )}
              </div>
            </Card>

            {/* OCC Exam Narrative */}
            <Card>
              <div className={`p-6 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
                <RequirePermission permission="vendor:write">
                  <button
                    onClick={generateExamNarrative}
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded text-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <FileText size={20} />
                    Generate OCC-Ready Exam Narrative
                  </button>
                </RequirePermission>

                {showExamNarrative && examNarrative && (
                  <div className={`p-6 rounded mt-4 ${isDarkMode ? 'bg-slate-700' : 'bg-white'}`}>
                    <div className={`text-sm whitespace-pre-wrap ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      <StreamingText text={examNarrative} />
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => copyToClipboard(examNarrative)}
                        className={`flex items-center gap-2 text-sm px-3 py-2 rounded transition-colors ${
                          isDarkMode
                            ? 'bg-slate-600 hover:bg-slate-500 text-slate-300'
                            : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                        }`}
                      >
                        <Copy size={14} />
                        Copy
                      </button>
                      <button
                        onClick={() => {
                          const element = document.createElement('a');
                          element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(examNarrative));
                          element.setAttribute('download', `${vendor.name}_OCC_Narrative.txt`);
                          element.style.display = 'none';
                          document.body.appendChild(element);
                          element.click();
                          document.body.removeChild(element);
                        }}
                        className={`flex items-center gap-2 text-sm px-3 py-2 rounded transition-colors ${
                          isDarkMode
                            ? 'bg-slate-600 hover:bg-slate-500 text-slate-300'
                            : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                        }`}
                      >
                        <Download size={14} />
                        Export
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Quick Info */}
            <Card>
              <div className={`p-6 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
                <h4 className={`font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  Quick Info
                </h4>
                <div className="space-y-3 text-sm">
                  <div>
                    <div className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>Vendor ID</div>
                    <div className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      {vendor.id}
                    </div>
                  </div>
                  <div className="border-t border-slate-700 pt-3">
                    <div className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>Last Reviewed</div>
                    <div className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      {new Date(vendor.lastReviewDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="border-t border-slate-700 pt-3">
                    <div className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>Next Review Due</div>
                    <div className={`font-semibold ${new Date(vendor.nextReviewDate) < new Date() ? 'text-red-500' : isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      {new Date(vendor.nextReviewDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="border-t border-slate-700 pt-3">
                    <div className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>Contact</div>
                    <div className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      {vendor.primaryContact}
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Risk Score Legend */}
            <Card>
              <div className={`p-6 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
                <h4 className={`font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  Risk Scale
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-8 rounded ${getRiskColor(5)}`}></div>
                    <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>5 = Critical</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-8 rounded ${getRiskColor(4)}`}></div>
                    <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>4 = High</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-8 rounded ${getRiskColor(3)}`}></div>
                    <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>3 = Medium</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-8 rounded ${getRiskColor(2)}`}></div>
                    <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>2 = Low</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-8 rounded ${getRiskColor(1)}`}></div>
                    <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>1 = Minimal</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
