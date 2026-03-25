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
} from 'lucide-react';
import RiskNarrativeCard from '../components/RiskNarrativeCard';
import { useSecurity, RequirePermission } from '../security/SecurityContext';
import { useThemeStore } from '../store/themeStore';
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
  const isDark = useThemeStore((state) => state.isDark);

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
    <div className={`min-h-screen ${isDark ? 'bg-navy-950 text-gray-100' : 'bg-gray-50 text-slate-900'} p-6`}>
      {/* Page Header with clear explanation */}
      <div className="mb-6">
        <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'} mb-2`}>Risk Scoring Studio</h1>
        <p className="text-cyan-400 text-base font-medium mb-3">
          AI-powered scenario assessment and resilience analysis for G-SIB risk management
        </p>
        <div className={`${isDark ? 'bg-navy-900 border-slate-700 text-slate-200' : 'bg-gray-100 border-gray-300 text-slate-700'} border rounded-lg p-4 text-sm leading-relaxed`}>
          <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>How it works:</span>{' '}
          Configure a risk scenario on the left panel by selecting a business line, product, geography,
          and risk type. Adjust the inherent risk and control strength sliders, then click{' '}
          <span className="text-cyan-400 font-semibold">"Run Assessment"</span>{' '}
          at the bottom of the form to generate a composite risk score, factor decomposition,
          and AI-generated narrative. You can also load a pre-built scenario to get started quickly.
        </div>
      </div>

      <div className="flex gap-6 h-[calc(100vh-280px)]">
        {/* LEFT PANEL: Scenario Builder */}
        <div className="w-2/5 flex flex-col">
          {/* Scrollable form area */}
          <div className="flex-1 overflow-y-auto space-y-6 pb-2 min-h-0">
          {/* Scenario Form */}
          <Card className={`${isDark ? 'bg-navy-900 border-slate-700' : 'bg-white border-gray-200'} border p-6`}>
            <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'} mb-4 flex items-center gap-2`}>
              <Zap className="w-5 h-5 text-cyan-400" />
              Scenario Configuration
            </h2>

            <div className="space-y-4">
              {/* Scenario Name */}
              <div>
                <label className={`block text-sm font-semibold ${isDark ? 'text-slate-100' : 'text-slate-700'} mb-2`}>
                  Scenario Name
                </label>
                <input
                  type="text"
                  value={formData.scenarioName}
                  onChange={(e) => handleFormChange('scenarioName', e.target.value)}
                  className={`w-full px-3 py-2 ${isDark ? 'bg-navy-800 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-300 text-slate-900 placeholder-gray-500'} border rounded focus:outline-none focus:border-cyan-500`}
                  placeholder="Enter scenario name"
                />
              </div>

              {/* Business Line */}
              <div>
                <label className={`block text-sm font-semibold ${isDark ? 'text-slate-100' : 'text-slate-700'} mb-2`}>
                  Business Line
                </label>
                <select
                  value={formData.businessLine}
                  onChange={(e) => handleFormChange('businessLine', e.target.value)}
                  className={`w-full px-3 py-2 ${isDark ? 'bg-navy-800 border-slate-600 text-white' : 'bg-white border-gray-300 text-slate-900'} border rounded focus:outline-none focus:border-cyan-500`}
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
                <label className={`block text-sm font-semibold ${isDark ? 'text-slate-100' : 'text-slate-700'} mb-2`}>Product</label>
                <select
                  value={formData.product}
                  onChange={(e) => handleFormChange('product', e.target.value)}
                  className={`w-full px-3 py-2 ${isDark ? 'bg-navy-800 border-slate-600 text-white' : 'bg-white border-gray-300 text-slate-900'} border rounded focus:outline-none focus:border-cyan-500`}
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
                <label className={`block text-sm font-semibold ${isDark ? 'text-slate-100' : 'text-slate-700'} mb-2`}>Geography</label>
                <select
                  value={formData.geography}
                  onChange={(e) => handleFormChange('geography', e.target.value)}
                  className={`w-full px-3 py-2 ${isDark ? 'bg-navy-800 border-slate-600 text-white' : 'bg-white border-gray-300 text-slate-900'} border rounded focus:outline-none focus:border-cyan-500`}
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
                <label className={`block text-sm font-semibold ${isDark ? 'text-slate-100' : 'text-slate-700'} mb-2`}>Risk Type</label>
                <select
                  value={formData.riskType}
                  onChange={(e) => handleFormChange('riskType', e.target.value)}
                  className={`w-full px-3 py-2 ${isDark ? 'bg-navy-800 border-slate-600 text-white' : 'bg-white border-gray-300 text-slate-900'} border rounded focus:outline-none focus:border-cyan-500`}
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
                  <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>Inherent Risk</label>
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
                <div className={`flex justify-between text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'} mt-1`}>
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
                  <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>Control Strength</label>
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
                <div className={`flex justify-between text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'} mt-1`}>
                  <span>Weak</span>
                  <span>Below Avg</span>
                  <span>Adequate</span>
                  <span>Strong</span>
                  <span>Robust</span>
                </div>
              </div>

              {/* Loss History */}
              <div>
                <label className={`block text-sm font-semibold ${isDark ? 'text-slate-100' : 'text-slate-700'} mb-2`}>
                  Loss History (last 12 months, USD)
                </label>
                <input
                  type="number"
                  value={formData.lossHistory}
                  onChange={(e) => handleFormChange('lossHistory', parseInt(e.target.value) || 0)}
                  className={`w-full px-3 py-2 ${isDark ? 'bg-navy-800 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-300 text-slate-900 placeholder-gray-500'} border rounded focus:outline-none focus:border-cyan-500`}
                  placeholder="0"
                />
              </div>

              {/* Additional Factors */}
              <div>
                <label className={`block text-sm font-semibold ${isDark ? 'text-slate-100' : 'text-slate-700'} mb-3`}>
                  Additional Factors
                </label>
                <div className="space-y-2">
                  {ADDITIONAL_FACTORS_OPTIONS.map((factor) => (
                    <label
                      key={factor.value}
                      className={`flex items-center gap-2 cursor-pointer ${isDark ? 'text-slate-200 hover:text-white' : 'text-slate-700 hover:text-slate-900'}`}
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
                        className={`w-4 h-4 ${isDark ? 'bg-navy-800 border-slate-500' : 'bg-white border-gray-300'} border rounded cursor-pointer accent-cyan-500`}
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
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'} mb-3`}>Pre-built Scenarios</h3>
            <div className="grid grid-cols-1 gap-3">
              {PRE_BUILT_SCENARIOS.map((scenario) => (
                <button
                  key={scenario.name}
                  onClick={() => loadPreBuiltScenario(scenario)}
                  className={`p-3 ${isDark ? 'bg-navy-900 border-slate-700 hover:bg-navy-800' : 'bg-white border-gray-200 hover:bg-gray-50'} border rounded-lg hover:border-cyan-500 transition text-left group`}
                >
                  <h4 className={`font-semibold ${isDark ? 'text-white group-hover:text-cyan-400' : 'text-slate-900 group-hover:text-cyan-600'} transition`}>
                    {scenario.name}
                  </h4>
                  <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'} mt-1`}>
                    {scenario.businessLine} • {scenario.riskType}
                  </p>
                </button>
              ))}
            </div>
          </div>
          </div>

          {/* Sticky Run Assessment Button — always visible at bottom of left panel */}
          <div className={`flex-shrink-0 pt-3 pb-1 border-t ${isDark ? 'border-slate-700 bg-navy-950' : 'border-gray-300 bg-gray-50'}`}>
            <RequirePermission permission="workbench:execute">
              <button
                onClick={calculateScores}
                className="w-full px-4 py-3.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg transition flex items-center justify-center gap-2 text-base shadow-lg shadow-cyan-600/30 active:scale-[0.98]"
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
              <Card className={`${isDark ? 'bg-navy-900 border-slate-700' : 'bg-white border-gray-200'} border p-6`}>
                <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'} mb-4`}>Score Decomposition</h3>
                <div className="space-y-4">
                  {scoringResult.factorContributions.map((factor) => (
                    <div key={factor.name}>
                      <div className="flex justify-between text-sm mb-2">
                        <span className={`font-medium ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{factor.name}</span>
                        <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                          Weight: {(factor.weight * 100).toFixed(0)}% • Value: {factor.value.toFixed(2)}
                        </span>
                      </div>
                      <div className={`w-full ${isDark ? 'bg-slate-700' : 'bg-gray-200'} rounded-full h-2`}>
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full"
                          style={{
                            width: `${Math.min((factor.contribution / 0.5) * 100, 100)}%`,
                          }}
                        />
                      </div>
                      <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'} mt-1`}>
                        Contribution: {(factor.contribution * 100).toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Scoring Logic */}
              <Card className={`${isDark ? 'bg-navy-900 border-slate-700' : 'bg-white border-gray-200'} border p-6`}>
                <button
                  onClick={() => setShowScoringLogic(!showScoringLogic)}
                  className={`w-full flex items-center justify-between font-semibold ${isDark ? 'text-white hover:text-blue-400' : 'text-slate-900 hover:text-blue-600'} transition`}
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
                  <div className={`mt-4 p-3 ${isDark ? 'bg-navy-800/80 text-slate-200' : 'bg-gray-100 text-slate-700'} rounded text-sm font-mono text-xs`}>
                    <p className={`mb-3 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      Composite = (InherentRisk × 0.30) + ((6 - ControlStrength) × 0.25) +
                      (LossHistoryFactor × 0.15) + (BusinessComplexity × 0.10) +
                      (RegulatoryFactor × 0.10) + (AdditionalFactors × 0.10)
                    </p>
                    <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                      Where each component is normalized to [0, 1] and the final result is scaled to [1, 5]
                    </p>
                  </div>
                )}
              </Card>

              {/* AI Assessment Narrative */}
              <RiskNarrativeCard
                scenarioName={formData.scenarioName}
                businessLine={formData.businessLine}
                product={formData.product}
                geography={formData.geography}
                riskType={formData.riskType}
                inherentRisk={formData.inherentRisk}
                controlStrength={formData.controlStrength}
                lossHistory={formData.lossHistory}
                compositeScore={scoringResult.compositeScore}
                residualRisk={scoringResult.residualRisk}
                factorContributions={scoringResult.factorContributions}
                onRegenerate={handleRegenerate}
              />

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
            <Card className={`${isDark ? 'bg-navy-900 border-slate-700' : 'bg-white border-gray-200'} border p-12 flex items-center justify-center h-96`}>
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-cyan-600/10 border-2 border-cyan-600/30 flex items-center justify-center">
                  <Zap className="w-10 h-10 text-cyan-400" />
                </div>
                <p className={`${isDark ? 'text-white' : 'text-slate-900'} text-xl font-semibold mb-2`}>Assessment Results</p>
                <p className={`${isDark ? 'text-slate-300' : 'text-slate-600'} text-sm mb-6 max-w-md leading-relaxed`}>
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
            <div className={`${isDark ? 'bg-navy-950 text-slate-200' : 'bg-gray-100 text-slate-700'} p-4 rounded text-xs font-mono max-h-96 overflow-y-auto`}>
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
