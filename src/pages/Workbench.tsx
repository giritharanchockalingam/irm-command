import React, { useState, useMemo, useCallback } from 'react';
import {
  ChevronDown,
  RotateCcw,
  Download,
  Copy,
  Check,
  AlertCircle,
  TrendingUp,
  Zap,
  FileText,
  Shield,
  BarChart3,
  Target,
  ClipboardList,
} from 'lucide-react';
import { useSecurity, RequirePermission } from '../security/SecurityContext';
import { getDataAccess } from '../data/DataAccessLayer';
import { RiskScenario } from '../domain/types';
import { TemplateEngine } from '../ai/local/templateEngine';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { StreamingText } from '../components/ui/StreamingText';
import { Modal } from '../components/ui/Modal';
import { useAppStore } from '../store/appStore';

interface FormData {
  scenarioName: string;
  businessLine: string;
  product: string;
  geography: string;
  riskType: string;
  inherentRisk: number;
  controlStrength: number;
  lossHistory: number;
  additionalFactors: string[];
}

interface ScoringResult {
  compositeScore: number;
  residualRisk: number;
  factorContributions: FactorContribution[];
  narrative: string;
  timestamp: string;
}

interface FactorContribution {
  name: string;
  weight: number;
  value: number;
  contribution: number;
}

const BUSINESS_LINES = [
  'Global Markets',
  'Retail Banking',
  'Commercial Banking',
  'Wealth Management',
  'Treasury',
  'Operations',
  'Technology',
];

const PRODUCTS_BY_LINE: Record<string, string[]> = {
  'Global Markets': ['Derivatives', 'Fixed Income', 'Equities', 'FX'],
  'Retail Banking': ['Mortgages', 'Credit Cards', 'Deposits', 'Auto Loans'],
  'Commercial Banking': ['Loans', 'Trade Finance', 'Syndication', 'CRE'],
  'Wealth Management': ['Private Banking', 'Asset Management', 'Advisory', 'Brokerage'],
  'Treasury': ['Liquidity Management', 'Capital Markets', 'FX Trading', 'Repo'],
  'Operations': ['Payment Systems', 'Settlements', 'Custody', 'Vendor Mgmt'],
  'Technology': ['Infrastructure', 'Application Dev', 'Cloud Services', 'Data'],
};

const GEOGRAPHIES = ['North America', 'EMEA', 'APAC', 'LATAM', 'Global'];

const RISK_TYPES = [
  'Credit',
  'Market',
  'Operational',
  'Compliance',
  'Cyber',
  'ThirdParty',
  'Strategic',
  'Liquidity',
];

const ADDITIONAL_FACTORS_OPTIONS = [
  { label: 'Regulatory scrutiny', value: 'regulatoryScrutiny', adjustment: 0.3 },
  { label: 'Recent audit findings', value: 'auditFindings', adjustment: 0.2 },
  { label: 'Management turnover', value: 'managementTurnover', adjustment: 0.2 },
  { label: 'System migration in progress', value: 'systemMigration', adjustment: 0.3 },
  { label: 'Vendor concentration', value: 'vendorConcentration', adjustment: 0.2 },
];

const PRE_BUILT_SCENARIOS = [
  {
    name: 'CRE Credit Concentration',
    businessLine: 'Commercial Banking',
    product: 'CRE',
    geography: 'North America',
    riskType: 'Credit',
    inherentRisk: 4,
    controlStrength: 2,
    lossHistory: 2500000,
    additionalFactors: ['regulatoryScrutiny', 'vendorConcentration'],
  },
  {
    name: 'Cyber Ransomware',
    businessLine: 'Technology',
    product: 'Infrastructure',
    geography: 'Global',
    riskType: 'Cyber',
    inherentRisk: 4,
    controlStrength: 3,
    lossHistory: 1000000,
    additionalFactors: ['systemMigration'],
  },
  {
    name: 'TPRM Cloud Dependency',
    businessLine: 'Operations',
    product: 'Cloud Services',
    geography: 'Global',
    riskType: 'ThirdParty',
    inherentRisk: 4,
    controlStrength: 2,
    lossHistory: 500000,
    additionalFactors: ['auditFindings', 'vendorConcentration'],
  },
  {
    name: 'Basel III Capital Shortfall',
    businessLine: 'Treasury',
    product: 'Capital Markets',
    geography: 'Global',
    riskType: 'Compliance',
    inherentRisk: 3,
    controlStrength: 3,
    lossHistory: 0,
    additionalFactors: ['regulatoryScrutiny'],
  },
];

const getRatingLabel = (score: number): string => {
  if (score <= 2) return 'Satisfactory';
  if (score <= 2.5) return 'Satisfactory-Watchlist';
  if (score <= 3.5) return 'Needs Improvement';
  if (score <= 4.5) return 'Unsatisfactory';
  return 'Critically Deficient';
};

const getScoreColor = (score: number): string => {
  if (score <= 2) return 'text-green-600';
  if (score <= 3) return 'text-yellow-600';
  if (score <= 4) return 'text-orange-600';
  return 'text-red-600';
};

const getScoreBgColor = (score: number): string => {
  if (score <= 2) return 'bg-green-100';
  if (score <= 3) return 'bg-yellow-100';
  if (score <= 4) return 'bg-orange-100';
  return 'bg-red-100';
};

export default function Workbench() {
  const { can: canPerform } = useSecurity();

  const dal = getDataAccess();
  const riskScenarios = dal.getRiskScenarios();
  const risks = dal.getRisks();

  const [formData, setFormData] = useState<FormData>({
    scenarioName: 'New Risk Scenario',
    businessLine: 'Commercial Banking',
    product: 'Loans',
    geography: 'North America',
    riskType: 'Credit',
    inherentRisk: 3,
    controlStrength: 3,
    lossHistory: 0,
    additionalFactors: [],
  });

  const [scoringResult, setScoringResult] = useState<ScoringResult | null>(null);
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const [showScoringLogic, setShowScoringLogic] = useState(false);

  const availableProducts = useMemo(
    () => PRODUCTS_BY_LINE[formData.businessLine] || [],
    [formData.businessLine]
  );

  const handleFormChange = useCallback(
    (field: keyof FormData, value: any) => {
      setFormData((prev) => {
        const updated = { ...prev, [field]: value };
        if (field === 'businessLine' && !availableProducts.includes(updated.product)) {
          updated.product = availableProducts[0] || '';
        }
        return updated;
      });
    },
    [availableProducts]
  );

  const loadPreBuiltScenario = useCallback((scenario: typeof PRE_BUILT_SCENARIOS[0]) => {
    setFormData(scenario as FormData);
    setScoringResult(null);
  }, []);

  const calculateScores = useCallback(() => {
    const inherentRiskFactor = formData.inherentRisk / 5;
    const controlFactor = (6 - formData.controlStrength) / 5;

    const lossHistoryFactor =
      formData.lossHistory > 0 ? Math.min(formData.lossHistory / 5000000, 1) : 0;

    const businessComplexityFactor = formData.businessLine === 'Global Markets' ? 0.8 : 0.5;

    const regulatoryFactor =
      formData.riskType === 'Compliance' ? 0.9 : formData.riskType === 'Cyber' ? 0.7 : 0.5;

    const additionalFactorsAdjustment = formData.additionalFactors.reduce((sum, factorId) => {
      const factor = ADDITIONAL_FACTORS_OPTIONS.find((f) => f.value === factorId);
      return sum + (factor?.adjustment || 0);
    }, 0);

    const factorContributions: FactorContribution[] = [
      {
        name: 'Inherent Risk',
        weight: 0.3,
        value: formData.inherentRisk,
        contribution: inherentRiskFactor * 0.3,
      },
      {
        name: 'Control Environment',
        weight: 0.25,
        value: 6 - formData.controlStrength,
        contribution: controlFactor * 0.25,
      },
      {
        name: 'Loss History',
        weight: 0.15,
        value: lossHistoryFactor,
        contribution: lossHistoryFactor * 0.15,
      },
      {
        name: 'Business Complexity',
        weight: 0.1,
        value: businessComplexityFactor,
        contribution: businessComplexityFactor * 0.1,
      },
      {
        name: 'Regulatory Environment',
        weight: 0.1,
        value: regulatoryFactor,
        contribution: regulatoryFactor * 0.1,
      },
      {
        name: 'Additional Factors',
        weight: 0.1,
        value: additionalFactorsAdjustment,
        contribution: Math.min(additionalFactorsAdjustment * 0.1, 0.5),
      },
    ];

    let compositeScore =
      inherentRiskFactor * 0.3 +
      controlFactor * 0.25 +
      lossHistoryFactor * 0.15 +
      businessComplexityFactor * 0.1 +
      regulatoryFactor * 0.1 +
      Math.min(additionalFactorsAdjustment * 0.1, 0.5);

    compositeScore = Math.max(1, Math.min(5, compositeScore * 5));

    const residualRisk = Math.max(
      1,
      Math.min(5, formData.inherentRisk - formData.controlStrength * 0.6 + additionalFactorsAdjustment)
    );

    const templateEngine = new TemplateEngine();
    const narrative = templateEngine.generateRiskAssessment({
      scenarioName: formData.scenarioName,
      businessLine: formData.businessLine,
      product: formData.product,
      geography: formData.geography,
      riskType: formData.riskType,
      inherentRisk: formData.inherentRisk,
      controlStrength: formData.controlStrength,
      lossHistory: formData.lossHistory,
      compositeScore,
      residualRisk,
      factors: factorContributions,
    });

    setScoringResult({
      compositeScore: Math.round(compositeScore * 100) / 100,
      residualRisk: Math.round(residualRisk * 100) / 100,
      factorContributions,
      narrative,
      timestamp: new Date().toISOString(),
    });
  }, [formData]);

  const handleCopyJson = useCallback(() => {
    if (!scoringResult) return;

    const exportData = {
      scenario: formData,
      scoring: {
        compositeScore: scoringResult.compositeScore,
        residualRisk: scoringResult.residualRisk,
        factorContributions: scoringResult.factorContributions,
      },
      narrative: scoringResult.narrative,
      metadata: {
        timestamp: scoringResult.timestamp,
        engineVersion: '1.0',
        exportedAt: new Date().toISOString(),
      },
    };

    navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
    setCopiedToClipboard(true);
    setTimeout(() => setCopiedToClipboard(false), 2000);
  }, [formData, scoringResult]);

  const handleRegenerate = useCallback(() => {
    setScoringResult(null);
    setTimeout(() => calculateScores(), 100);
  }, [calculateScores]);

  return (
    <div className="min-h-screen bg-navy-950 text-gray-100 p-6">
      {/* Page Header with clear explanation */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Risk Scoring Studio</h1>
        <p className="text-cyan-400 text-base font-medium mb-3">
          AI-powered scenario assessment and resilience analysis for G-SIB risk management
        </p>
        <div className="bg-navy-900 border border-slate-700 rounded-lg p-4 text-sm text-slate-200 leading-relaxed">
          <span className="font-semibold text-white">How it works:</span>{' '}
          Configure a risk scenario on the left panel by selecting a business line, product, geography,
          and risk type. Adjust the inherent risk and control strength sliders, then click{' '}
          <span className="text-cyan-400 font-semibold">"Run Assessment"</span>{' '}
          at the bottom of the form to generate a composite risk score, factor decomposition,
          and AI-generated narrative. You can also load a pre-built scenario to get started quickly.
        </div>
      </div>

      <div className="flex gap-6 h-[calc(100vh-260px)]">
        {/* LEFT PANEL: Scenario Builder */}
        <div className="w-2/5 flex flex-col overflow-hidden">
          {/* Scrollable form area */}
          <div className="flex-1 overflow-y-auto space-y-6 pb-4">
          {/* Scenario Form */}
          <Card className="bg-navy-900 border-slate-700 p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-cyan-400" />
              Scenario Configuration
            </h2>

            <div className="space-y-4">
              {/* Scenario Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-100 mb-2">
                  Scenario Name
                </label>
                <input
                  type="text"
                  value={formData.scenarioName}
                  onChange={(e) => handleFormChange('scenarioName', e.target.value)}
                  className="w-full px-3 py-2 bg-navy-800 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
                  placeholder="Enter scenario name"
                />
              </div>

              {/* Business Line */}
              <div>
                <label className="block text-sm font-semibold text-slate-100 mb-2">
                  Business Line
                </label>
                <select
                  value={formData.businessLine}
                  onChange={(e) => handleFormChange('businessLine', e.target.value)}
                  className="w-full px-3 py-2 bg-navy-800 border border-slate-600 rounded text-white focus:outline-none focus:border-cyan-500"
                >
                  {BUSINESS_LINES.map((line) => (
                    <option key={line} value={line}>
                      {line}
                    </option>
                  ))}
                </select>
              </div>

              {/* Product */}
              <div>
                <label className="block text-sm font-semibold text-slate-100 mb-2">Product</label>
                <select
                  value={formData.product}
                  onChange={(e) => handleFormChange('product', e.target.value)}
                  className="w-full px-3 py-2 bg-navy-800 border border-slate-600 rounded text-white focus:outline-none focus:border-cyan-500"
                >
                  {availableProducts.map((prod) => (
                    <option key={prod} value={prod}>
                      {prod}
                    </option>
                  ))}
                </select>
              </div>

              {/* Geography */}
              <div>
                <label className="block text-sm font-semibold text-slate-100 mb-2">Geography</label>
                <select
                  value={formData.geography}
                  onChange={(e) => handleFormChange('geography', e.target.value)}
                  className="w-full px-3 py-2 bg-navy-800 border border-slate-600 rounded text-white focus:outline-none focus:border-cyan-500"
                >
                  {GEOGRAPHIES.map((geo) => (
                    <option key={geo} value={geo}>
                      {geo}
                    </option>
                  ))}
                </select>
              </div>

              {/* Risk Type */}
              <div>
                <label className="block text-sm font-semibold text-slate-100 mb-2">Risk Type</label>
                <select
                  value={formData.riskType}
                  onChange={(e) => handleFormChange('riskType', e.target.value)}
                  className="w-full px-3 py-2 bg-navy-800 border border-slate-600 rounded text-white focus:outline-none focus:border-cyan-500"
                >
                  {RISK_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Inherent Risk Slider */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-gray-300">Inherent Risk</label>
                  <span className="text-sm font-bold text-cyan-400">{formData.inherentRisk}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={formData.inherentRisk}
                  onChange={(e) => handleFormChange('inherentRisk', parseInt(e.target.value))}
                  className="w-full h-2 bg-gradient-to-r from-green-600 via-yellow-600 to-red-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-xs text-slate-300 mt-1">
                  <span>Low</span>
                  <span>Moderate-Low</span>
                  <span>Moderate</span>
                  <span>Moderate-High</span>
                  <span>High</span>
                </div>
              </div>

              {/* Control Strength Slider */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-gray-300">Control Strength</label>
                  <span className="text-sm font-bold text-cyan-400">{formData.controlStrength}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={formData.controlStrength}
                  onChange={(e) => handleFormChange('controlStrength', parseInt(e.target.value))}
                  className="w-full h-2 bg-gradient-to-r from-red-600 via-yellow-600 to-green-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-xs text-slate-300 mt-1">
                  <span>Weak</span>
                  <span>Below Avg</span>
                  <span>Adequate</span>
                  <span>Strong</span>
                  <span>Robust</span>
                </div>
              </div>

              {/* Loss History */}
              <div>
                <label className="block text-sm font-semibold text-slate-100 mb-2">
                  Loss History (last 12 months, USD)
                </label>
                <input
                  type="number"
                  value={formData.lossHistory}
                  onChange={(e) => handleFormChange('lossHistory', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-navy-800 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
                  placeholder="0"
                />
              </div>

              {/* Additional Factors */}
              <div>
                <label className="block text-sm font-semibold text-slate-100 mb-3">
                  Additional Factors
                </label>
                <div className="space-y-2">
                  {ADDITIONAL_FACTORS_OPTIONS.map((factor) => (
                    <label
                      key={factor.value}
                      className="flex items-center gap-2 cursor-pointer text-slate-200 hover:text-white"
                    >
                      <input
                        type="checkbox"
                        checked={formData.additionalFactors.includes(factor.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            handleFormChange('additionalFactors', [
                              ...formData.additionalFactors,
                              factor.value,
                            ]);
                          } else {
                            handleFormChange(
                              'additionalFactors',
                              formData.additionalFactors.filter((f) => f !== factor.value)
                            );
                          }
                        }}
                        className="w-4 h-4 bg-navy-800 border-slate-500 rounded cursor-pointer accent-cyan-500"
                      />
                      <span className="text-sm">
                        {factor.label}{' '}
                        <span className="text-xs text-cyan-400 font-medium">(+{factor.adjustment})</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

          </Card>

          {/* Pre-built Scenarios */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Pre-built Scenarios</h3>
            <div className="grid grid-cols-1 gap-3">
              {PRE_BUILT_SCENARIOS.map((scenario) => (
                <button
                  key={scenario.name}
                  onClick={() => loadPreBuiltScenario(scenario)}
                  className="p-3 bg-navy-900 border border-slate-700 rounded-lg hover:border-cyan-500 hover:bg-navy-800 transition text-left group"
                >
                  <h4 className="font-semibold text-white group-hover:text-cyan-400 transition">
                    {scenario.name}
                  </h4>
                  <p className="text-sm text-slate-300 mt-1">
                    {scenario.businessLine} • {scenario.riskType}
                  </p>
                </button>
              ))}
            </div>
          </div>
          </div>

          {/* Sticky Run Assessment Button — always visible */}
          <div className="pt-3 border-t border-slate-700 mt-2">
            <RequirePermission permission="workbench:execute">
              <button
                onClick={calculateScores}
                className="w-full px-4 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg transition flex items-center justify-center gap-2 text-base shadow-lg shadow-cyan-600/20"
              >
                <TrendingUp className="w-5 h-5" />
                Run Assessment
              </button>
            </RequirePermission>
          </div>
        </div>

        {/* RIGHT PANEL: Results */}
        <div className="w-3/5 flex flex-col gap-6 overflow-y-auto pb-6">
          {scoringResult ? (
            <>
              {/* Composite Score Card */}
              <Card className={`${getScoreBgColor(scoringResult.compositeScore)} border-0 p-6`}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className={`text-2xl font-bold ${getScoreColor(scoringResult.compositeScore)}`}>
                    Composite Risk Score
                  </h2>
                  <button
                    onClick={handleRegenerate}
                    className="p-2 hover:bg-white/10 rounded transition"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex items-center gap-8">
                  <div className="flex-1">
                    <div
                      className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center border-8 ${
                        scoringResult.compositeScore <= 2
                          ? 'border-green-600 bg-green-600/10'
                          : scoringResult.compositeScore <= 3
                            ? 'border-yellow-600 bg-yellow-600/10'
                            : scoringResult.compositeScore <= 4
                              ? 'border-orange-600 bg-orange-600/10'
                              : 'border-red-600 bg-red-600/10'
                      }`}
                    >
                      <div className="text-center">
                        <div
                          className={`text-5xl font-bold ${getScoreColor(scoringResult.compositeScore)}`}
                        >
                          {scoringResult.compositeScore.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">/5.0</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 space-y-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Rating</p>
                      <p className={`text-lg font-bold ${getScoreColor(scoringResult.compositeScore)}`}>
                        {getRatingLabel(scoringResult.compositeScore)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Residual Risk</p>
                      <p className="text-lg font-bold text-gray-800">
                        {scoringResult.residualRisk.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-xs text-gray-600 pt-2">
                      {new Date(scoringResult.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Score Decomposition */}
              <Card className="bg-navy-900 border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Score Decomposition</h3>
                <div className="space-y-4">
                  {scoringResult.factorContributions.map((factor) => (
                    <div key={factor.name}>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-100 font-medium">{factor.name}</span>
                        <span className="text-slate-300">
                          Weight: {(factor.weight * 100).toFixed(0)}% • Value: {factor.value.toFixed(2)}
                        </span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full"
                          style={{
                            width: `${Math.min((factor.contribution / 0.5) * 100, 100)}%`,
                          }}
                        />
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        Contribution: {(factor.contribution * 100).toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Scoring Logic */}
              <Card className="bg-navy-900 border-slate-700 p-6">
                <button
                  onClick={() => setShowScoringLogic(!showScoringLogic)}
                  className="w-full flex items-center justify-between font-semibold text-white hover:text-blue-400 transition"
                >
                  <span className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Scoring Logic (XAI Explainability)
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 transition-transform ${showScoringLogic ? 'rotate-180' : ''}`}
                  />
                </button>

                {showScoringLogic && (
                  <div className="mt-4 p-3 bg-navy-800/80 rounded text-sm text-slate-200 font-mono text-xs">
                    <p className="mb-3 text-slate-300">
                      Composite = (InherentRisk × 0.30) + ((6 - ControlStrength) × 0.25) +
                      (LossHistoryFactor × 0.15) + (BusinessComplexity × 0.10) +
                      (RegulatoryFactor × 0.10) + (AdditionalFactors × 0.10)
                    </p>
                    <p className="text-slate-400">
                      Where each component is normalized to [0, 1] and the final result is scaled to [1, 5]
                    </p>
                  </div>
                )}
              </Card>

              {/* AI Assessment Narrative — Structured */}
              <Card className="bg-navy-900 border-slate-700 p-0 overflow-hidden">
                {/* Header bar */}
                <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-navy-900 via-navy-800 to-navy-900 border-b border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-cyan-600/15 border border-cyan-500/30 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">AI Risk Assessment</h3>
                      <p className="text-xs text-slate-400">OCC/FDIC-style narrative &bull; Auto-generated</p>
                    </div>
                  </div>
                  <button
                    onClick={handleRegenerate}
                    className="text-sm px-4 py-1.5 bg-cyan-600/15 hover:bg-cyan-600/25 border border-cyan-500/30 text-cyan-400 rounded-lg transition flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Regenerate
                  </button>
                </div>

                <div className="px-6 py-5 space-y-6">
                  {/* Title badge */}
                  <div className="flex items-center gap-2">
                    <div className="h-px flex-1 bg-gradient-to-r from-cyan-500/40 to-transparent" />
                    <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider px-3 py-1 bg-cyan-600/10 rounded-full border border-cyan-500/20">
                      {formData.scenarioName}
                    </span>
                    <div className="h-px flex-1 bg-gradient-to-l from-cyan-500/40 to-transparent" />
                  </div>

                  {/* Section 1: Scenario Overview — Key/Value Grid */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <ClipboardList className="w-4 h-4 text-blue-400" />
                      <h4 className="text-sm font-semibold text-blue-400 uppercase tracking-wide">Scenario Overview</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'Business Line', value: formData.businessLine },
                        { label: 'Product', value: formData.product },
                        { label: 'Geography', value: formData.geography },
                        { label: 'Risk Type', value: formData.riskType },
                      ].map((item) => (
                        <div key={item.label} className="bg-navy-800/60 rounded-lg px-3 py-2 border border-slate-700/50">
                          <span className="text-xs text-slate-400 block">{item.label}</span>
                          <span className="text-sm text-white font-medium">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Section 2: Assessment Ratings — Color-coded Metric Cards */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="w-4 h-4 text-amber-400" />
                      <h4 className="text-sm font-semibold text-amber-400 uppercase tracking-wide">Assessment Ratings</h4>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                      <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/5 border-orange-500/30 rounded-lg px-3 py-2.5 border">
                        <span className="text-xs text-slate-400 block mb-0.5">Inherent Risk</span>
                        <span className="text-base font-bold text-orange-300">{formData.inherentRisk}/5</span>
                      </div>
                      <div className="bg-gradient-to-br from-green-500/20 to-green-600/5 border-green-500/30 rounded-lg px-3 py-2.5 border">
                        <span className="text-xs text-slate-400 block mb-0.5">Control Strength</span>
                        <span className="text-base font-bold text-green-300">{formData.controlStrength}/5</span>
                      </div>
                      <div className="bg-gradient-to-br from-rose-500/20 to-rose-600/5 border-rose-500/30 rounded-lg px-3 py-2.5 border">
                        <span className="text-xs text-slate-400 block mb-0.5">Residual Risk</span>
                        <span className="text-base font-bold text-rose-300">{scoringResult.residualRisk.toFixed(2)}/5</span>
                      </div>
                      <div className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/5 border-cyan-500/30 rounded-lg px-3 py-2.5 border">
                        <span className="text-xs text-slate-400 block mb-0.5">Composite Score</span>
                        <span className="text-base font-bold text-cyan-300">{scoringResult.compositeScore.toFixed(2)}/5</span>
                      </div>
                      <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/5 border-purple-500/30 rounded-lg px-3 py-2.5 border">
                        <span className="text-xs text-slate-400 block mb-0.5">Historical Loss</span>
                        <span className="text-base font-bold text-purple-300">USD {(formData.lossHistory / 1000000).toFixed(2)}M</span>
                      </div>
                      <div className={`bg-gradient-to-br rounded-lg px-3 py-2.5 border ${
                        scoringResult.compositeScore <= 2 ? 'from-green-500/20 to-green-600/5 border-green-500/30' :
                        scoringResult.compositeScore <= 3 ? 'from-yellow-500/20 to-yellow-600/5 border-yellow-500/30' :
                        scoringResult.compositeScore <= 4 ? 'from-orange-500/20 to-orange-600/5 border-orange-500/30' :
                        'from-red-500/20 to-red-600/5 border-red-500/30'
                      }`}>
                        <span className="text-xs text-slate-400 block mb-0.5">Rating</span>
                        <span className={`text-base font-bold ${
                          scoringResult.compositeScore <= 2 ? 'text-green-300' :
                          scoringResult.compositeScore <= 3 ? 'text-yellow-300' :
                          scoringResult.compositeScore <= 4 ? 'text-orange-300' :
                          'text-red-300'
                        }`}>{getRatingLabel(scoringResult.compositeScore)}</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 mt-2.5 leading-relaxed italic">
                      This rating reflects the likelihood of occurrence, potential impact magnitude across financial, reputational, regulatory, and operational dimensions, and the current state of preventive and detective controls.
                    </p>
                  </div>

                  {/* Section 3: Risk Score Driver Analysis */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <BarChart3 className="w-4 h-4 text-emerald-400" />
                      <h4 className="text-sm font-semibold text-emerald-400 uppercase tracking-wide">Risk Score Driver Analysis</h4>
                    </div>
                    <p className="text-sm text-slate-300 mb-3 leading-relaxed">
                      The composite risk score of <span className="text-cyan-400 font-semibold">{scoringResult.compositeScore.toFixed(2)}/5</span> is derived from the following components and their relative contributions:
                    </p>
                    <div className="space-y-1.5 mb-3">
                      {scoringResult.factorContributions
                        .slice()
                        .sort((a, b) => b.contribution - a.contribution)
                        .map((factor, i) => (
                        <div key={i} className="flex items-center gap-3 bg-navy-800/40 rounded-lg px-3 py-2 border border-slate-700/40">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                          <span className="text-sm text-white font-medium flex-1">{factor.name}</span>
                          <span className="text-xs text-slate-400">Value {factor.value.toFixed(1)}/5</span>
                          <span className="text-xs text-slate-500 mx-1">&bull;</span>
                          <span className="text-xs text-slate-400">Wt {(factor.weight * 100).toFixed(0)}%</span>
                          <span className="text-xs text-slate-500 mx-1">&bull;</span>
                          <span className="text-xs text-emerald-400 font-semibold">{(factor.contribution * 100).toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      The key drivers of risk exposure are{' '}
                      {scoringResult.factorContributions
                        .slice()
                        .sort((a, b) => b.contribution - a.contribution)
                        .slice(0, 3)
                        .map((f, i, arr) => (
                          <span key={i}>
                            <span className="text-white font-medium">{f.name}</span>
                            <span className="text-slate-400"> ({(f.contribution * 100).toFixed(1)}%)</span>
                            {i < arr.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      . Historical loss data shows <span className="text-purple-300 font-medium">USD {(formData.lossHistory / 1000000).toFixed(2)}M</span> in realized losses across similar scenarios.
                    </p>
                  </div>

                  {/* Section 4: Residual Risk Profile */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Shield className="w-4 h-4 text-rose-400" />
                      <h4 className="text-sm font-semibold text-rose-400 uppercase tracking-wide">Residual Risk Profile</h4>
                    </div>
                    <div className="bg-gradient-to-br from-rose-500/5 to-transparent rounded-lg px-4 py-3 border border-rose-500/20">
                      <p className="text-sm text-slate-200 leading-relaxed">
                        Following the application of existing controls assessed at <span className="text-green-300 font-semibold">{formData.controlStrength}/5</span> strength,
                        the residual risk profile is{' '}
                        <span className={`font-semibold ${
                          scoringResult.residualRisk >= 4 ? 'text-red-400' :
                          scoringResult.residualRisk >= 3 ? 'text-yellow-300' :
                          'text-green-300'
                        }`}>
                          {scoringResult.residualRisk >= 4 ? 'elevated and requires active management' :
                           scoringResult.residualRisk >= 3 ? 'moderate and within risk appetite' :
                           'low and appropriately managed'}
                        </span>.
                        The institution&apos;s risk appetite threshold for this scenario is 3/5 or lower. Current residual exposure at{' '}
                        <span className="text-white font-semibold">{scoringResult.residualRisk.toFixed(2)}/5</span>{' '}
                        {scoringResult.residualRisk > 3 ? (
                          <span className="text-red-400 font-semibold">exceeds</span>
                        ) : (
                          <span className="text-green-300 font-semibold">remains within</span>
                        )}{' '}
                        this threshold. Control effectiveness represents a{' '}
                        <span className="text-cyan-300 font-semibold">
                          {((formData.inherentRisk - scoringResult.residualRisk) * 20).toFixed(0)}%
                        </span>{' '}
                        risk reduction from inherent baseline.
                      </p>
                    </div>
                  </div>

                  {/* Section 5: Remediation & Monitoring */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <AlertCircle className="w-4 h-4 text-yellow-400" />
                      <h4 className="text-sm font-semibold text-yellow-400 uppercase tracking-wide">Remediation & Monitoring Expectations</h4>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-500/5 to-transparent rounded-lg px-4 py-3 border border-yellow-500/20">
                      <p className="text-sm text-slate-200 leading-relaxed">
                        Management should prioritize control enhancements targeting the highest-impact risk drivers identified above.
                        Quarterly risk reassessment should track inherent and residual trends.
                        The Risk Committee should review this scenario assessment and remediation progress quarterly until residual risk is reduced to approved appetite levels.
                        {scoringResult.residualRisk > 4 && (
                          <span className="text-red-400 font-semibold"> Escalation is required as residual risk exceeds 4/5.</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Export Button */}
              <button
                onClick={() => setShowJsonModal(true)}
                className="w-full px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Export JSON
              </button>
            </>
          ) : (
            <Card className="bg-navy-900 border-slate-700 p-12 flex items-center justify-center h-96">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-cyan-600/10 border-2 border-cyan-600/30 flex items-center justify-center">
                  <Zap className="w-10 h-10 text-cyan-400" />
                </div>
                <p className="text-white text-xl font-semibold mb-2">Assessment Results</p>
                <p className="text-slate-300 text-sm mb-6 max-w-md leading-relaxed">
                  Configure your risk scenario in the left panel — select a business line,
                  product, geography, and risk type — then click the button below to generate
                  a composite risk score with AI-powered analysis.
                </p>
                <RequirePermission permission="workbench:execute">
                  <button
                    onClick={calculateScores}
                    className="px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg transition flex items-center justify-center gap-2 mx-auto text-base shadow-lg shadow-cyan-600/20"
                  >
                    <TrendingUp className="w-5 h-5" />
                    Run Assessment
                  </button>
                </RequirePermission>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* JSON Export Modal */}
      {showJsonModal && scoringResult && (
        <Modal onClose={() => setShowJsonModal(false)} title="Export Assessment Results">
          <div className="space-y-4">
            <div className="bg-navy-950 p-4 rounded text-xs text-slate-200 font-mono max-h-96 overflow-y-auto">
              <pre>
                {JSON.stringify(
                  {
                    scenario: formData,
                    scoring: {
                      compositeScore: scoringResult.compositeScore,
                      residualRisk: scoringResult.residualRisk,
                      factorContributions: scoringResult.factorContributions,
                    },
                    narrative: scoringResult.narrative,
                    metadata: {
                      timestamp: scoringResult.timestamp,
                      engineVersion: '1.0',
                      exportedAt: new Date().toISOString(),
                    },
                  },
                  null,
                  2
                )}
              </pre>
            </div>

            <button
              onClick={handleCopyJson}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
            >
              {copiedToClipboard ? (
                <>
                  <Check className="w-5 h-5" />
                  Copied to Clipboard
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  Copy to Clipboard
                </>
              )}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
