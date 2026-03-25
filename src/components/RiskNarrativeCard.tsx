import React from 'react';
import { RotateCcw, FileText, Shield, BarChart3, AlertTriangle, Crosshair, Layers } from 'lucide-react';
import { Card } from './ui/Card';

interface FactorContribution {
  name: string;
  weight: number;
  value: number;
  contribution: number;
}

interface RiskNarrativeCardProps {
  scenarioName: string;
  businessLine: string;
  product: string;
  geography: string;
  riskType: string;
  inherentRisk: number;
  controlStrength: number;
  lossHistory: number;
  compositeScore: number;
  residualRisk: number;
  factorContributions: FactorContribution[];
  onRegenerate: () => void;
}

function getRatingLabel(score: number): string {
  if (score <= 2) return 'Satisfactory';
  if (score <= 2.5) return 'Satisfactory-Watchlist';
  if (score <= 3.5) return 'Needs Improvement';
  if (score <= 4.5) return 'Unsatisfactory';
  return 'Critically Deficient';
}

function getRatingColor(score: number): string {
  if (score <= 2) return 'text-green-400';
  if (score <= 3) return 'text-yellow-400';
  if (score <= 4) return 'text-orange-400';
  return 'text-red-400';
}

function SectionHeader({ icon, label, color }: { icon: React.ReactNode; label: string; color: string }) {
  return (
    <div className="flex items-center gap-2 mb-3 pt-1">
      <span className={color}>{icon}</span>
      <h4 className={`text-xs font-bold uppercase tracking-widest ${color}`}>{label}</h4>
      <div className="flex-1 h-px bg-slate-700/60" />
    </div>
  );
}

export default function RiskNarrativeCard(props: RiskNarrativeCardProps) {
  const {
    scenarioName, businessLine, product, geography, riskType,
    inherentRisk, controlStrength, lossHistory,
    compositeScore, residualRisk, factorContributions, onRegenerate,
  } = props;

  const sortedFactors = [...factorContributions].sort((a, b) => b.contribution - a.contribution);
  const topDrivers = sortedFactors.slice(0, 3);
  const lossInMillions = (lossHistory / 1000000).toFixed(2);
  const riskReduction = Math.round((inherentRisk - residualRisk) * 20);

  const residualLabel = residualRisk >= 4
    ? 'elevated and requires active management'
    : residualRisk >= 3
      ? 'moderate and within risk appetite'
      : 'low and appropriately managed';

  return (
    <Card className="bg-navy-900 border-slate-700 overflow-hidden p-0">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-700 bg-navy-800/50">
        <div className="flex items-center gap-2.5">
          <FileText className="w-5 h-5 text-cyan-400" />
          <div>
            <h3 className="text-base font-semibold text-white leading-tight">AI Risk Assessment</h3>
            <p className="text-[11px] text-slate-500">OCC/FDIC-style narrative</p>
          </div>
        </div>
        <button
          onClick={onRegenerate}
          className="text-xs px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition flex items-center gap-1"
        >
          <RotateCcw className="w-3 h-3" />
          Regenerate
        </button>
      </div>

      <div className="p-5 space-y-5">

        {/* ── Scenario Overview ── */}
        <SectionHeader icon={<Layers className="w-3.5 h-3.5" />} label="Scenario Overview" color="text-blue-400" />
        <div className="grid grid-cols-2 gap-1.5 -mt-2">
          <div className="bg-navy-800/50 rounded px-3 py-1.5 border border-slate-700/40">
            <div className="text-[10px] text-slate-500 uppercase">Business Line</div>
            <div className="text-sm text-white">{businessLine}</div>
          </div>
          <div className="bg-navy-800/50 rounded px-3 py-1.5 border border-slate-700/40">
            <div className="text-[10px] text-slate-500 uppercase">Product</div>
            <div className="text-sm text-white">{product}</div>
          </div>
          <div className="bg-navy-800/50 rounded px-3 py-1.5 border border-slate-700/40">
            <div className="text-[10px] text-slate-500 uppercase">Geography</div>
            <div className="text-sm text-white">{geography}</div>
          </div>
          <div className="bg-navy-800/50 rounded px-3 py-1.5 border border-slate-700/40">
            <div className="text-[10px] text-slate-500 uppercase">Risk Type</div>
            <div className="text-sm text-white">{riskType}</div>
          </div>
        </div>

        {/* ── Assessment Ratings ── */}
        <SectionHeader icon={<Crosshair className="w-3.5 h-3.5" />} label="Assessment Ratings" color="text-amber-400" />
        <div className="grid grid-cols-3 gap-1.5 -mt-2">
          <div className="bg-orange-500/10 rounded px-3 py-2 border border-orange-500/20 text-center">
            <div className="text-[10px] text-slate-400">Inherent Risk</div>
            <div className="text-lg font-bold text-orange-300">{inherentRisk}/5</div>
          </div>
          <div className="bg-green-500/10 rounded px-3 py-2 border border-green-500/20 text-center">
            <div className="text-[10px] text-slate-400">Control Strength</div>
            <div className="text-lg font-bold text-green-300">{controlStrength}/5</div>
          </div>
          <div className="bg-rose-500/10 rounded px-3 py-2 border border-rose-500/20 text-center">
            <div className="text-[10px] text-slate-400">Residual Risk</div>
            <div className="text-lg font-bold text-rose-300">{residualRisk.toFixed(1)}/5</div>
          </div>
          <div className="bg-cyan-500/10 rounded px-3 py-2 border border-cyan-500/20 text-center">
            <div className="text-[10px] text-slate-400">Composite Score</div>
            <div className="text-lg font-bold text-cyan-300">{compositeScore.toFixed(2)}</div>
          </div>
          <div className="bg-purple-500/10 rounded px-3 py-2 border border-purple-500/20 text-center">
            <div className="text-[10px] text-slate-400">Historical Loss</div>
            <div className="text-lg font-bold text-purple-300">${lossInMillions}M</div>
          </div>
          <div className={`rounded px-3 py-2 border text-center ${
            compositeScore <= 2 ? 'bg-green-500/10 border-green-500/20' :
            compositeScore <= 3 ? 'bg-yellow-500/10 border-yellow-500/20' :
            compositeScore <= 4 ? 'bg-orange-500/10 border-orange-500/20' :
            'bg-red-500/10 border-red-500/20'
          }`}>
            <div className="text-[10px] text-slate-400">Rating</div>
            <div className={`text-sm font-bold ${getRatingColor(compositeScore)}`}>{getRatingLabel(compositeScore)}</div>
          </div>
        </div>

        {/* ── Risk Score Drivers ── */}
        <SectionHeader icon={<BarChart3 className="w-3.5 h-3.5" />} label="Risk Score Drivers" color="text-emerald-400" />
        <div className="space-y-1 -mt-2">
          {sortedFactors.map((f, i) => {
            const pct = Math.round(f.contribution * 100);
            const barWidth = Math.max(4, Math.min(pct * 3, 100));
            return (
              <div key={i} className="flex items-center gap-3 py-1.5 px-3 rounded bg-navy-800/30 border border-slate-700/30">
                <span className="text-sm text-white font-medium w-40 shrink-0">{f.name}</span>
                <div className="flex-1 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: barWidth + '%' }}
                  />
                </div>
                <span className="text-xs text-emerald-400 font-semibold w-10 text-right">{pct}%</span>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Key drivers: {topDrivers.map(f => f.name).join(', ')}.
          Historical losses of ${lossInMillions}M inform the inherent risk baseline.
        </p>

        {/* ── Residual Risk Profile ── */}
        <SectionHeader icon={<Shield className="w-3.5 h-3.5" />} label="Residual Risk Profile" color="text-rose-400" />
        <div className="bg-rose-500/5 rounded-lg px-4 py-3 border border-rose-500/15 -mt-2">
          <p className="text-sm text-slate-200 leading-relaxed">
            Following the application of existing controls assessed at{' '}
            <span className="text-green-300 font-semibold">{controlStrength}/5</span> strength,
            the residual risk profile is{' '}
            <span className={`font-semibold ${residualRisk >= 4 ? 'text-red-400' : residualRisk >= 3 ? 'text-yellow-300' : 'text-green-300'}`}>
              {residualLabel}
            </span>.
            Current residual exposure at{' '}
            <span className="text-white font-semibold">{residualRisk.toFixed(2)}/5</span>{' '}
            {residualRisk > 3 ? (
              <span className="text-red-400 font-semibold">exceeds</span>
            ) : (
              <span className="text-green-300 font-semibold">remains within</span>
            )}{' '}
            the 3/5 appetite threshold.
            Control effectiveness represents a{' '}
            <span className="text-cyan-300 font-semibold">{riskReduction}%</span>{' '}
            risk reduction from inherent baseline.
          </p>
        </div>

        {/* ── Remediation & Monitoring ── */}
        <SectionHeader icon={<AlertTriangle className="w-3.5 h-3.5" />} label="Remediation & Monitoring" color="text-yellow-400" />
        <div className="bg-yellow-500/5 rounded-lg px-4 py-3 border border-yellow-500/15 -mt-2">
          <p className="text-sm text-slate-200 leading-relaxed">
            Management should prioritize control enhancements targeting the highest-impact risk drivers.
            Quarterly risk reassessment should track inherent and residual trends.
            The Risk Committee should review this scenario and remediation progress quarterly
            until residual risk is reduced to approved appetite levels.
            {residualRisk > 4 ? (
              <span className="text-red-400 font-semibold"> Immediate escalation is required as residual risk exceeds 4/5.</span>
            ) : null}
          </p>
        </div>

      </div>
    </Card>
  );
}
