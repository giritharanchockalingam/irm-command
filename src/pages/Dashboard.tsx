import React, { useState, useMemo, useCallback } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Zap,
  Brain,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Target,
  BarChart3,
  Users,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { StreamingText } from '../components/ui/StreamingText';
import { TemplateEngine } from '../ai/local/templateEngine';
import { getDataAccess } from '../data/DataAccessLayer';
import { Risk, KRI, Issue } from '../domain/types';
import { useAppStore } from '../store/appStore';
import { useSecurity } from '../security/SecurityContext';

const Dashboard: React.FC = () => {
  const [digestTab, setDigestTab] = useState<'risk' | 'examiner'>('risk');
  const [digestContent, setDigestContent] = useState<string>('');
  const [isGeneratingDigest, setIsGeneratingDigest] = useState(false);
  const [selectedRiskCell, setSelectedRiskCell] = useState<{
    impact: number;
    likelihood: number;
  } | null>(null);
  const { selectEntity } = useAppStore();
  const { can: canPerform } = useSecurity();

  const dal = getDataAccess();
  const risks = dal.getRisks();
  const controls = dal.getControls();
  const vendors = dal.getVendors();
  const issues = dal.getIssues();
  const lossEvents = dal.getLossEvents();
  const kris = dal.getKRIs();
  const regulatoryChanges = dal.getRegulatoryChanges();
  const monitoringAlerts = dal.getMonitoringAlerts();

  // ============ COMPUTED VALUES ============

  const enterpriseRiskScore = useMemo(() => {
    const avgRisk = risks.length > 0
      ? risks.reduce((sum, r) => sum + (r.inherentScore ?? 3.5), 0) / risks.length
      : 0;
    const trend = Math.random() > 0.5 ? 'up' : 'down';
    return {
      score: (avgRisk * 1.05).toFixed(1),
      max: 5.0,
      trend,
      previousScore: (avgRisk * 0.95).toFixed(1),
    };
  }, []);

  const issuesSummary = useMemo(() => {
    const critical = issues.filter((i) => i.severity === 'Critical').length;
    const high = issues.filter((i) => i.severity === 'High').length;
    const medium = issues.filter((i) => i.severity === 'Medium').length;
    const low = issues.filter((i) => i.severity === 'Low').length;
    return { total: issues.length, critical, high, medium, low };
  }, []);

  const kriBreaches = useMemo(() => {
    const warning = kris.filter((k) => k.breachLevel === 'Warning').length;
    const breach = kris.filter((k) => k.breachLevel === 'Breach').length;
    const critical = kris.filter((k) => k.breachLevel === 'Critical').length;
    return {
      total: breach + critical + warning,
      critical,
      breach,
      warning,
    };
  }, []);

  const capitalAtRisk = useMemo(() => {
    return lossEvents
      .filter((e) => new Date(e.date).getFullYear() === 2026)
      .reduce((sum, e) => sum + e.amount, 0);
  }, []);

  const vendorRiskMetrics = useMemo(() => {
    const criticalCount = vendors.filter((v) => v.criticality === 'Critical')
      .length;
    const avgRisk = vendors.length > 0
      ? vendors.reduce((sum, v) => {
          const riskScore = v.criticality === 'Critical' ? 4.5 : v.criticality === 'High' ? 3.5 : 2;
          return sum + riskScore;
        }, 0) / vendors.length
      : 0;
    return { index: avgRisk.toFixed(1), critical: criticalCount };
  }, []);

  const riskHeatMap = useMemo(() => {
    const matrix: { [key: string]: number } = {};
    for (let impact = 1; impact <= 5; impact++) {
      for (let likelihood = 1; likelihood <= 5; likelihood++) {
        const key = `${impact}-${likelihood}`;
        matrix[key] = risks.filter(
          (r) => r.impact === impact && r.likelihood === likelihood
        ).length;
      }
    }
    return matrix;
  }, []);

  const krisTop = useMemo(() => {
    return [...kris]
      .sort((a, b) => {
        const severityMap = { Critical: 0, Breach: 1, Warning: 2, Normal: 3 };
        return (
          (severityMap[a.breachLevel as keyof typeof severityMap] || 3) -
          (severityMap[b.breachLevel as keyof typeof severityMap] || 3)
        );
      })
      .slice(0, 8);
  }, []);

  const issuesTop = useMemo(() => {
    return [...issues]
      .sort((a, b) => {
        const severityOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 };
        return (
          (severityOrder[a.severity as keyof typeof severityOrder] || 3) -
          (severityOrder[b.severity as keyof typeof severityOrder] || 3)
        );
      })
      .slice(0, 10);
  }, []);

  const irmMaturityDimensions = useMemo(
    () => [
      { name: 'Risk Identification', score: 4.2 },
      { name: 'Control Effectiveness', score: 3.8 },
      { name: 'Monitoring', score: 4.1 },
      { name: 'Reporting', score: 3.5 },
      { name: 'Governance', score: 4.3 },
    ],
    []
  );

  const actionItemsMetrics = useMemo(() => {
    const total = issues.length + risks.length;
    const completed = Math.floor(total * 0.35);
    return { completed, total };
  }, []);

  const testCoverageMetrics = useMemo(() => {
    const tested = controls.filter((c) => c.effectiveness === 'Effective').length;
    const total = controls.length;
    const percentage = total > 0 ? Math.round((tested / total) * 100) : 0;
    return { percentage, tested, total };
  }, []);

  // ============ HANDLERS ============

  const handleGenerateDigest = useCallback(async () => {
    setIsGeneratingDigest(true);
    const engine = new TemplateEngine();

    try {
      let template = '';
      if (digestTab === 'risk') {
        template = engine.generateDailyDigest(
          risks,
          kris,
          issues,
          vendors,
          lossEvents
        );
      } else {
        template = engine.generateExaminerView(
          risks,
          controls,
          issues,
          kris
        );
      }
      setDigestContent(template);
    } catch (error) {
      console.error('Error generating digest:', error);
      setDigestContent(
        'Unable to generate digest. Please try again.'
      );
    } finally {
      setIsGeneratingDigest(false);
    }
  }, [digestTab, enterpriseRiskScore.score]);

  const handleRiskCellClick = useCallback((impact: number, likelihood: number) => {
    const cellRisks = risks.filter(
      (r) => r.impact === impact && r.likelihood === likelihood
    );
    if (cellRisks.length > 0) {
      setSelectedRiskCell({ impact, likelihood });
      selectEntity('risk', cellRisks[0].id);
    }
  }, [selectEntity]);

  // ============ HELPER FUNCTIONS ============

  const getRiskColor = (impact: number, likelihood: number): string => {
    const score = impact * likelihood;
    if (score <= 2) return 'bg-emerald-500/20 border-emerald-400';
    if (score <= 6) return 'bg-yellow-500/20 border-yellow-400';
    if (score <= 12) return 'bg-orange-500/20 border-orange-400';
    return 'bg-red-500/20 border-red-400';
  };

  const getTrendColor = (trend: string): string =>
    trend === 'up' ? 'text-red-500' : 'text-emerald-500';

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'Critical':
        return 'bg-red-500/20 text-red-400 border-red-400';
      case 'High':
        return 'bg-orange-500/20 text-orange-400 border-orange-400';
      case 'Medium':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-400';
      case 'Low':
        return 'bg-blue-500/20 text-blue-400 border-blue-400';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-400';
    }
  };

  const getKRIStatusColor = (status: string): string => {
    switch (status) {
      case 'Critical':
        return 'bg-red-500/20 text-red-400';
      case 'Breach':
        return 'bg-orange-500/20 text-orange-400';
      case 'Warning':
        return 'bg-yellow-500/20 text-yellow-400';
      default:
        return 'bg-emerald-500/20 text-emerald-400';
    }
  };

  const isOverdue = (dueDate: Date): boolean => {
    const dateObj = dueDate instanceof Date ? dueDate : new Date(dueDate);
    return dateObj < new Date() && dateObj.getFullYear() === 2026;
  };

  // ============ RENDER PENTAGON (Radar) ============

  const renderPentagon = () => {
    const centerX = 80;
    const centerY = 80;
    const maxRadius = 60;

    const points = irmMaturityDimensions.map((dim, idx) => {
      const angle = (idx * 2 * Math.PI) / 5 - Math.PI / 2;
      const radius = (dim.score / 5) * maxRadius;
      return {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      };
    });

    const pathData = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
      .join(' ') + ' Z';

    return (
      <svg viewBox="0 0 160 160" className="w-40 h-40">
        {/* Concentric circles */}
        {[1, 2, 3, 4, 5].map((level) => (
          <circle
            key={`circle-${level}`}
            cx="80"
            cy="80"
            r={(level * maxRadius) / 5}
            fill="none"
            stroke="#64748b"
            strokeWidth="1"
            opacity="0.3"
          />
        ))}
        {/* Pentagon outline */}
        <polygon
          points={irmMaturityDimensions
            .map((_, idx) => {
              const angle = (idx * 2 * Math.PI) / 5 - Math.PI / 2;
              return [
                80 + maxRadius * Math.cos(angle),
                80 + maxRadius * Math.sin(angle),
              ].join(',');
            })
            .join(' ')}
          fill="none"
          stroke="#64748b"
          strokeWidth="1"
          opacity="0.3"
        />
        {/* Data polygon */}
        <path d={pathData} fill="#06b6d4" fillOpacity="0.2" stroke="#06b6d4" strokeWidth="2" />
        {/* Points */}
        {points.map((p, i) => (
          <circle key={`point-${i}`} cx={p.x} cy={p.y} r="3" fill="#06b6d4" />
        ))}
      </svg>
    );
  };

  // ============ MAIN RENDER ============

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-baseline mb-8">
          <div>
            <h1 className="text-4xl font-bold text-cyan-400 mb-2">
              Executive Command Center
            </h1>
            <p className="text-slate-400">
              Real-time IRM monitoring & strategic intelligence
            </p>
          </div>
          <div className="text-right text-sm text-slate-500">
            Last updated: {new Date().toLocaleString()}
          </div>
        </div>

        {/* ===== TOP STATS ROW ===== */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Enterprise Risk Score */}
          <Card className="bg-slate-800 border-slate-700 hover:border-cyan-500/50 transition-colors cursor-pointer">
            <div className="p-4">
              <div className="text-slate-400 text-sm mb-3">Enterprise Risk Score</div>
              <div className="flex items-end justify-between mb-3">
                <div>
                  <div className="text-4xl font-bold text-amber-400">
                    {enterpriseRiskScore.score}
                  </div>
                  <div className="text-xs text-slate-500">
                    of {enterpriseRiskScore.max}
                  </div>
                </div>
                <div
                  className={`text-2xl ${getTrendColor(enterpriseRiskScore.trend)}`}
                >
                  {enterpriseRiskScore.trend === 'up' ? (
                    <TrendingUp size={24} />
                  ) : (
                    <TrendingDown size={24} />
                  )}
                </div>
              </div>
              <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400"
                  style={{
                    width: `${(parseFloat(enterpriseRiskScore.score) / 5) * 100}%`,
                  }}
                />
              </div>
              <div className="text-xs text-slate-500 mt-2">
                {enterpriseRiskScore.previousScore} prev
              </div>
            </div>
          </Card>

          {/* Open Issues */}
          <Card className="bg-slate-800 border-slate-700 hover:border-cyan-500/50 transition-colors cursor-pointer">
            <div className="p-4">
              <div className="text-slate-400 text-sm mb-3">Open Issues</div>
              <div className="text-4xl font-bold text-red-400 mb-3">
                {issuesSummary.total}
              </div>
              <div className="flex gap-2 mb-3">
                {issuesSummary.critical > 0 && (
                  <div
                    className="w-3 h-3 rounded-full bg-red-500"
                    title={`Critical: ${issuesSummary.critical}`}
                  />
                )}
                {issuesSummary.high > 0 && (
                  <div
                    className="w-3 h-3 rounded-full bg-orange-500"
                    title={`High: ${issuesSummary.high}`}
                  />
                )}
                {issuesSummary.medium > 0 && (
                  <div
                    className="w-3 h-3 rounded-full bg-yellow-500"
                    title={`Medium: ${issuesSummary.medium}`}
                  />
                )}
                {issuesSummary.low > 0 && (
                  <div
                    className="w-3 h-3 rounded-full bg-blue-500"
                    title={`Low: ${issuesSummary.low}`}
                  />
                )}
              </div>
              <div className="text-xs text-slate-500">
                {issuesSummary.critical} critical
              </div>
            </div>
          </Card>

          {/* KRI Breaches */}
          <Card className="bg-slate-800 border-slate-700 hover:border-cyan-500/50 transition-colors cursor-pointer">
            <div className="p-4">
              <div className="text-slate-400 text-sm mb-3">KRI Breaches</div>
              <div className="text-4xl font-bold text-orange-400 mb-3">
                {kriBreaches.critical + kriBreaches.breach}
              </div>
              <div className="space-y-1 text-xs text-slate-500">
                <div>{kriBreaches.critical} critical</div>
                <div>{kriBreaches.warning} warnings</div>
              </div>
            </div>
          </Card>

          {/* Capital at Risk */}
          <Card className="bg-slate-800 border-slate-700 hover:border-cyan-500/50 transition-colors cursor-pointer">
            <div className="p-4">
              <div className="text-slate-400 text-sm mb-3">Capital at Risk (YTD)</div>
              <div className="text-3xl font-bold text-red-400 mb-3">
                ${(capitalAtRisk / 1e6).toFixed(1)}M
              </div>
              <div className="text-xs text-slate-500">
                {lossEvents.filter(
                  (e) => new Date(e.date).getFullYear() === 2026
                ).length}{' '}
                events
              </div>
            </div>
          </Card>

          {/* Vendor Risk Index */}
          <Card className="bg-slate-800 border-slate-700 hover:border-cyan-500/50 transition-colors cursor-pointer">
            <div className="p-4">
              <div className="text-slate-400 text-sm mb-3">Vendor Risk Index</div>
              <div className="text-4xl font-bold text-amber-400 mb-3">
                {vendorRiskMetrics.index}
              </div>
              <div className="text-xs text-slate-500">
                {vendorRiskMetrics.critical} critical vendors
              </div>
            </div>
          </Card>
        </div>

        {/* ===== MAIN CONTENT GRID ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT: Risk Heat Map (2/3) */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-800 border-slate-700 h-full">
              <div className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <BarChart3 size={20} className="text-cyan-400" />
                  <h2 className="text-lg font-semibold">Risk Heat Map</h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className="text-left text-slate-400 font-normal pb-3 pr-2">
                          Impact \
                        </th>
                        {['Rare', 'Unlikely', 'Possible', 'Likely', 'Almost Certain'].map(
                          (label, idx) => (
                            <th
                              key={`likelihood-${idx}`}
                              className="text-center text-slate-400 font-normal pb-3 w-20"
                            >
                              <div className="text-xs">{label}</div>
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {['Severe', 'Major', 'Moderate', 'Minor', 'Negligible'].map(
                        (impactLabel, impactIdx) => {
                          const impact = 5 - impactIdx;
                          return (
                            <tr key={`impact-${impactIdx}`}>
                              <td className="text-xs text-slate-400 pr-2 py-2 font-medium">
                                {impactLabel}
                              </td>
                              {[1, 2, 3, 4, 5].map((likelihood) => {
                                const count = riskHeatMap[`${impact}-${likelihood}`] || 0;
                                const isSelected =
                                  selectedRiskCell?.impact === impact &&
                                  selectedRiskCell?.likelihood === likelihood;
                                return (
                                  <td
                                    key={`cell-${impact}-${likelihood}`}
                                    className={`p-2 text-center cursor-pointer transition-all ${getRiskColor(
                                      impact,
                                      likelihood
                                    )} ${isSelected ? 'ring-2 ring-cyan-400' : ''} rounded border`}
                                    onClick={() =>
                                      handleRiskCellClick(impact, likelihood)
                                    }
                                  >
                                    {count > 0 && (
                                      <div className="font-bold text-sm">{count}</div>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        }
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-700">
                  <div className="text-xs text-slate-500">
                    Total risks in view: {risks.length}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* RIGHT: AI Daily Digest (1/3) */}
          <div>
            <Card className="bg-slate-800 border-slate-700 h-full flex flex-col">
              <div className="p-6 border-b border-slate-700">
                <div className="flex items-center gap-2 mb-4">
                  <Brain size={20} className="text-purple-400" />
                  <h2 className="text-lg font-semibold">AI Daily Digest</h2>
                </div>

                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setDigestTab('risk')}
                    className={`text-xs px-3 py-1.5 rounded border transition-colors ${
                      digestTab === 'risk'
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                        : 'bg-slate-700/50 border-slate-600 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    Risk Posture
                  </button>
                  <button
                    onClick={() => setDigestTab('examiner')}
                    className={`text-xs px-3 py-1.5 rounded border transition-colors ${
                      digestTab === 'examiner'
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                        : 'bg-slate-700/50 border-slate-600 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    Examiner View
                  </button>
                </div>

                <button
                  onClick={handleGenerateDigest}
                  disabled={isGeneratingDigest}
                  className="w-full bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400 text-cyan-300 px-4 py-2 rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGeneratingDigest ? 'Generating...' : 'Generate'}
                </button>
              </div>

              <div className="flex-1 p-6 overflow-y-auto">
                {digestContent ? (
                  <>
                    <StreamingText text={digestContent} />
                    <div className="text-xs text-slate-500 mt-4">
                      Generated {new Date().toLocaleTimeString()}
                    </div>
                  </>
                ) : (
                  <div className="text-slate-500 text-sm">
                    Click Generate to create a personalized {digestTab} digest
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* ===== PROGRAM OVERVIEW ROW ===== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* IRM Maturity */}
          <Card className="bg-slate-800 border-slate-700">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Target size={20} className="text-cyan-400" />
                <h3 className="text-lg font-semibold">IRM Maturity Profile</h3>
              </div>
              <div className="flex justify-center">{renderPentagon()}</div>
              <div className="mt-4 space-y-1 text-xs text-slate-400">
                {irmMaturityDimensions.map((dim) => (
                  <div key={dim.name} className="flex justify-between">
                    <span>{dim.name}</span>
                    <span className="text-cyan-400 font-medium">{dim.score}/5.0</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Open Actions */}
          <Card className="bg-slate-800 border-slate-700">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <CheckCircle2 size={20} className="text-cyan-400" />
                <h3 className="text-lg font-semibold">Open Actions</h3>
              </div>
              <div className="flex justify-center mb-6">
                <div className="relative w-32 h-32">
                  <svg viewBox="0 0 120 120" className="w-full h-full">
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke="#334155"
                      strokeWidth="8"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth="8"
                      strokeDasharray={`${
                        (actionItemsMetrics.completed / actionItemsMetrics.total) * 314
                      } 314`}
                      strokeLinecap="round"
                      transform="rotate(-90 60 60)"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-cyan-400">
                        {Math.round(
                          (actionItemsMetrics.completed / actionItemsMetrics.total) * 100
                        )}
                        %
                      </div>
                      <div className="text-xs text-slate-500">Complete</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-center text-sm text-slate-400">
                {actionItemsMetrics.completed} of {actionItemsMetrics.total} items
              </div>
            </div>
          </Card>

          {/* Test Coverage */}
          <Card className="bg-slate-800 border-slate-700">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Zap size={20} className="text-cyan-400" />
                <h3 className="text-lg font-semibold">Control Test Coverage</h3>
              </div>
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-400">Coverage</span>
                  <span className="text-cyan-400 font-bold">
                    {testCoverageMetrics.percentage}%
                  </span>
                </div>
                <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                    style={{ width: `${testCoverageMetrics.percentage}%` }}
                  />
                </div>
              </div>
              <div className="text-xs text-slate-500 space-y-1">
                <div>Tested: {testCoverageMetrics.tested}</div>
                <div>Total: {testCoverageMetrics.total}</div>
              </div>
            </div>
          </Card>
        </div>

        {/* ===== BOTTOM ROW: Issues & KRIs ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Issues Table */}
          <Card className="bg-slate-800 border-slate-700">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <AlertTriangle size={20} className="text-red-400" />
                <h3 className="text-lg font-semibold">Active Issues</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left text-slate-400 font-normal py-2">ID</th>
                      <th className="text-left text-slate-400 font-normal py-2">
                        Title
                      </th>
                      <th className="text-left text-slate-400 font-normal py-2">
                        Severity
                      </th>
                      <th className="text-left text-slate-400 font-normal py-2">Owner</th>
                      <th className="text-left text-slate-400 font-normal py-2">Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {issuesTop.map((issue) => (
                      <tr
                        key={issue.id}
                        className={`border-b border-slate-700/50 hover:bg-slate-700/30 cursor-pointer transition-colors ${
                          isOverdue(issue.dueDate)
                            ? 'bg-red-500/10'
                            : ''
                        }`}
                        onClick={() =>
                          selectEntity('issue', issue.id)
                        }
                      >
                        <td className="py-2 text-cyan-400 font-mono text-xs">
                          {issue.id}
                        </td>
                        <td className="py-2 text-slate-200 truncate max-w-xs">
                          {issue.title}
                        </td>
                        <td className="py-2">
                          <Badge
                            className={`text-xs border ${getSeverityColor(
                              issue.severity
                            )}`}
                          >
                            {issue.severity}
                          </Badge>
                        </td>
                        <td className="py-2 text-slate-400 text-xs">
                          {issue.owner}
                        </td>
                        <td className="py-2 text-slate-400 text-xs">
                          {new Date(issue.dueDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-700 text-xs text-slate-500">
                Showing {issuesTop.length} of {issues.length} issues
              </div>
            </div>
          </Card>

          {/* KRI Monitor */}
          <Card className="bg-slate-800 border-slate-700">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Users size={20} className="text-purple-400" />
                <h3 className="text-lg font-semibold">KRI Monitor</h3>
              </div>

              <div className="space-y-4">
                {krisTop.map((kri) => {
                  const percentOfThreshold = (kri.currentValue / kri.threshold) * 100;
                  const isBreach = kri.breachLevel === 'Breach' || kri.breachLevel === 'Critical';
                  return (
                    <div
                      key={kri.id}
                      className="pb-4 border-b border-slate-700/50 last:border-0 cursor-pointer hover:bg-slate-700/20 p-2 rounded transition-colors"
                      onClick={() =>
                        selectEntity('kri', kri.id)
                      }
                    >
                      <div className="flex items-baseline justify-between mb-2">
                        <div>
                          <div className="text-sm font-medium text-slate-200">
                            {kri.name}
                          </div>
                          <div className="text-xs text-slate-500">
                            {kri.currentValue} {kri.unit}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            className={`text-xs border ${getKRIStatusColor(
                              kri.breachLevel
                            )}`}
                          >
                            {kri.breachLevel}
                          </Badge>
                          <div className="text-slate-400">
                            {kri.trend === 'Deteriorating' && (
                              <TrendingUp size={16} className="text-red-400" />
                            )}
                            {kri.trend === 'Improving' && (
                              <TrendingDown size={16} className="text-emerald-400" />
                            )}
                            {kri.trend === 'Stable' && (
                              <div className="text-slate-400">→</div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            percentOfThreshold > 150
                              ? 'bg-red-500'
                              : percentOfThreshold > 100
                              ? 'bg-orange-500'
                              : percentOfThreshold > 75
                              ? 'bg-yellow-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(percentOfThreshold, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-slate-500 mt-1">
                        <span>Threshold: {kri.threshold}</span>
                        <span>
                          {percentOfThreshold > 100
                            ? `${(percentOfThreshold - 100).toFixed(0)}% over`
                            : `${(100 - percentOfThreshold).toFixed(0)}% available`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-700 text-xs text-slate-500">
                Showing {krisTop.length} of {kris.length} KRIs
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
