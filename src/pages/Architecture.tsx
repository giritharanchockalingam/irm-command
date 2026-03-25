import React, { useState } from 'react';
import {
  Layers,
  Shield,
  Database,
  Brain,
  Globe,
  Server,
  Lock,
  Zap,
  ChevronDown,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { useThemeStore } from '../store/themeStore';

// ============================================================================
// TYPES
// ============================================================================

interface PhaseData {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: 'implemented' | 'in-progress' | 'planned';
  content: React.ReactNode;
}

type DiagramTab = 'business' | 'application' | 'data' | 'technology';

interface IntegrationItem {
  name: string;
  status: 'active' | 'planned' | 'stub';
  category: string;
}

// ============================================================================
// SVG DIAGRAMS
// ============================================================================

/**
 * Diagram 1: GRC Business Domain — Risk Management Value Stream
 */
function BusinessDomainDiagram({ isDark }: { isDark: boolean }) {
  const bg = isDark ? '#0f172a' : '#f8fafc';
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const textColor = isDark ? '#e2e8f0' : '#1e293b';
  const subtextColor = isDark ? '#94a3b8' : '#64748b';
  const borderColor = isDark ? '#334155' : '#e2e8f0';

  return (
    <svg viewBox="0 0 1000 360" className="w-full h-auto" role="img" aria-label="GRC Business Domain Value Stream">
      <defs>
        <linearGradient id="grcGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
        <linearGradient id="grcGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
        <linearGradient id="grcGrad3" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#f97316" />
        </linearGradient>
        <filter id="shadow1">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
        </filter>
        <marker id="arrowBlue" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#3b82f6" />
        </marker>
        <marker id="arrowPurple" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#8b5cf6" />
        </marker>
      </defs>

      {/* Background */}
      <rect width="1000" height="360" rx="12" fill={bg} stroke={borderColor} strokeWidth="1" />

      {/* Title */}
      <text x="500" y="30" textAnchor="middle" fill={textColor} fontSize="16" fontWeight="bold">GRC Business Domain — Risk Management Value Stream</text>

      {/* Main flow boxes */}
      {[
        { x: 20, label: 'Risk\nIdentification', sub: 'Emerging risks,\nscenarios' },
        { x: 180, label: 'Risk\nAssessment', sub: 'Likelihood ×\nImpact scoring' },
        { x: 340, label: 'Control\nMapping', sub: 'Link controls\nto risks' },
        { x: 500, label: 'Control\nTesting', sub: 'Evidence &\neffectiveness' },
        { x: 660, label: 'Issue\nManagement', sub: 'MRA/MRIA\ntracking' },
        { x: 820, label: 'Reporting &\nEscalation', sub: 'Board & CRO\nnarratives' },
      ].map((box, i) => (
        <g key={i} filter="url(#shadow1)">
          <rect x={box.x} y="55" width="150" height="80" rx="8" fill="url(#grcGrad1)" />
          {box.label.split('\n').map((line, li) => (
            <text key={li} x={box.x + 75} y={80 + li * 16} textAnchor="middle" fill="white" fontSize="13" fontWeight="600">{line}</text>
          ))}
          {box.sub.split('\n').map((line, li) => (
            <text key={li} x={box.x + 75} y={112 + li * 13} textAnchor="middle" fill="rgba(255,255,255,0.75)" fontSize="10">{line}</text>
          ))}
        </g>
      ))}

      {/* Flow arrows */}
      {[170, 330, 490, 650, 810].map((x, i) => (
        <line key={i} x1={x} y1="95" x2={x + 10} y2="95" stroke="#3b82f6" strokeWidth="2" markerEnd="url(#arrowBlue)" />
      ))}

      {/* AI Orchestrator (bottom center) */}
      <g filter="url(#shadow1)">
        <rect x="300" y="170" width="400" height="70" rx="10" fill="url(#grcGrad2)" />
        <text x="500" y="195" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">AI Orchestrator — IRM Command Center</text>
        <text x="500" y="215" textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="11">Domain Detection → MCP Tools (18) → RAG Grounding → Multi-LLM Routing</text>
        <text x="500" y="230" textAnchor="middle" fill="rgba(255,255,255,0.65)" fontSize="10">Claude · OpenAI · Groq · Local Fallback</text>
      </g>

      {/* Connecting lines from flow to orchestrator */}
      {[95, 255, 415, 575, 735, 895].map((x, i) => (
        <line key={i} x1={x} y1="135" x2={x > 500 ? 700 : 300 + (x / 4)} y2="170" stroke="#8b5cf6" strokeWidth="1" strokeDasharray="4,3" opacity="0.5" />
      ))}

      {/* Bottom row: Compliance / TPRM / Audit */}
      {[
        { x: 80, label: 'Compliance Engine', sub: '5 frameworks · Gap analysis', color: 'url(#grcGrad3)' },
        { x: 380, label: 'TPRM Module', sub: '10 vendors · SLA monitoring', color: 'url(#grcGrad3)' },
        { x: 680, label: 'Audit & SOC 2', sub: '15 controls · SIEM logging', color: 'url(#grcGrad3)' },
      ].map((box, i) => (
        <g key={i} filter="url(#shadow1)">
          <rect x={box.x} y="275" width="240" height="60" rx="8" fill={box.color} />
          <text x={box.x + 120} y="300" textAnchor="middle" fill="white" fontSize="13" fontWeight="600">{box.label}</text>
          <text x={box.x + 120} y="318" textAnchor="middle" fill="rgba(255,255,255,0.75)" fontSize="10">{box.sub}</text>
        </g>
      ))}

      {/* Arrows from orchestrator to bottom */}
      <line x1="400" y1="240" x2="200" y2="275" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4,3" markerEnd="url(#arrowBlue)" />
      <line x1="500" y1="240" x2="500" y2="275" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4,3" markerEnd="url(#arrowBlue)" />
      <line x1="600" y1="240" x2="800" y2="275" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4,3" markerEnd="url(#arrowBlue)" />
    </svg>
  );
}

/**
 * Diagram 2: Application Architecture — AI Orchestration Pipeline
 */
function ApplicationArchDiagram({ isDark }: { isDark: boolean }) {
  const bg = isDark ? '#0f172a' : '#f8fafc';
  const textColor = isDark ? '#e2e8f0' : '#1e293b';
  const borderColor = isDark ? '#334155' : '#e2e8f0';

  return (
    <svg viewBox="0 0 1000 420" className="w-full h-auto" role="img" aria-label="Application Architecture">
      <defs>
        <linearGradient id="appGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
        <linearGradient id="appGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
        <linearGradient id="appGrad3" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <linearGradient id="appGrad4" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
        <filter id="shadow2">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
        </filter>
      </defs>

      <rect width="1000" height="420" rx="12" fill={bg} stroke={borderColor} strokeWidth="1" />
      <text x="500" y="30" textAnchor="middle" fill={textColor} fontSize="16" fontWeight="bold">Platform Application Architecture</text>

      {/* Tier 1: Client / React SPA */}
      <g filter="url(#shadow2)">
        <rect x="50" y="50" width="900" height="60" rx="8" fill="url(#appGrad1)" />
        <text x="500" y="75" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">React 18 + TypeScript SPA (Vite)</text>
        <text x="500" y="95" textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="11">Dashboard · TPRM · Compliance · AI Command Center · Exceptions · Architecture · SOC 2 Controls</text>
      </g>

      {/* Tier 2: Modules */}
      {[
        { x: 50, w: 215, label: 'Risk Module', sub: '15 risks · Heat map\nKRI monitor · Scenarios' },
        { x: 280, w: 215, label: 'Compliance Module', sub: '37 controls · 5 frameworks\nGap analysis · Reg changes' },
        { x: 510, w: 215, label: 'TPRM Module', sub: '10 vendors · SLA tracking\nConcentration risk' },
        { x: 740, w: 210, label: 'AI Command Center', sub: 'Voice input · Chat UI\nTool metadata · RAG display' },
      ].map((m, i) => (
        <g key={i} filter="url(#shadow2)">
          <rect x={m.x} y="130" width={m.w} height="75" rx="8" fill="url(#appGrad2)" />
          <text x={m.x + m.w / 2} y="152" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">{m.label}</text>
          {m.sub.split('\n').map((line, li) => (
            <text key={li} x={m.x + m.w / 2} y={168 + li * 14} textAnchor="middle" fill="rgba(255,255,255,0.75)" fontSize="10">{line}</text>
          ))}
        </g>
      ))}

      {/* Tier 3: AI Orchestrator */}
      <g filter="url(#shadow2)">
        <rect x="50" y="225" width="900" height="55" rx="8" fill="url(#appGrad3)" />
        <text x="500" y="248" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">AI Orchestrator</text>
        <text x="500" y="266" textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="11">Domain Detection (6 domains) → Complexity Estimation → Provider Selection → RAG Grounding → MCP Tools → Response</text>
      </g>

      {/* Tier 4: Sub-systems */}
      {[
        { x: 50, w: 200, label: 'MCP Tool Server', sub: '18 GRC tools\n5 domains', grad: 'url(#appGrad4)' },
        { x: 265, w: 200, label: 'RAG Knowledge Service', sub: '22 sections\nTF-IDF scoring', grad: 'url(#appGrad4)' },
        { x: 480, w: 200, label: 'Template Engine', sub: 'Deterministic responses\nFAQ + Quick Actions', grad: 'url(#appGrad4)' },
        { x: 695, w: 255, label: 'Auth / RBAC / Audit', sub: '6 roles · 29 permissions\nSIEM logging · SOC 2', grad: 'url(#appGrad4)' },
      ].map((m, i) => (
        <g key={i} filter="url(#shadow2)">
          <rect x={m.x} y="300" width={m.w} height="55" rx="8" fill={m.grad} />
          <text x={m.x + m.w / 2} y="320" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">{m.label}</text>
          {m.sub.split('\n').map((line, li) => (
            <text key={li} x={m.x + m.w / 2} y={335 + li * 13} textAnchor="middle" fill="rgba(255,255,255,0.75)" fontSize="10">{line}</text>
          ))}
        </g>
      ))}

      {/* Tier 5: LLM Providers */}
      <g filter="url(#shadow2)">
        <rect x="50" y="375" width="900" height="35" rx="6" fill={isDark ? '#1e293b' : '#e2e8f0'} stroke={borderColor} />
        <text x="175" y="397" textAnchor="middle" fill="#8b5cf6" fontSize="12" fontWeight="bold">Claude (Complex)</text>
        <text x="400" y="397" textAnchor="middle" fill="#3b82f6" fontSize="12" fontWeight="bold">OpenAI GPT-4 (Medium)</text>
        <text x="620" y="397" textAnchor="middle" fill="#f59e0b" fontSize="12" fontWeight="bold">Groq Mixtral (Simple)</text>
        <text x="840" y="397" textAnchor="middle" fill="#64748b" fontSize="12" fontWeight="bold">Local Fallback</text>
      </g>

      {/* Connecting arrows between tiers */}
      {[160, 390, 620, 845].map((x, i) => (
        <line key={`t1-${i}`} x1={x} y1="110" x2={x} y2="130" stroke={isDark ? '#475569' : '#94a3b8'} strokeWidth="1.5" />
      ))}
      {[500].map((x, i) => (
        <React.Fragment key={`t2-${i}`}>
          <line x1={x} y1="205" x2={x} y2="225" stroke={isDark ? '#475569' : '#94a3b8'} strokeWidth="1.5" />
          <line x1={x} y1="280" x2={x} y2="300" stroke={isDark ? '#475569' : '#94a3b8'} strokeWidth="1.5" />
        </React.Fragment>
      ))}
    </svg>
  );
}

/**
 * Diagram 3: GRC Data Model — Entity Relationships
 */
function DataModelDiagram({ isDark }: { isDark: boolean }) {
  const bg = isDark ? '#0f172a' : '#f8fafc';
  const textColor = isDark ? '#e2e8f0' : '#1e293b';
  const borderColor = isDark ? '#334155' : '#e2e8f0';

  const entityStyle = (color: string) => ({
    fill: color,
  });

  const entities = [
    // Row 1: Core Risk entities
    { x: 30, y: 55, w: 160, h: 85, label: 'risks', fields: ['id: RSK-XXX', 'inherentScore: number', 'residualScore: number', 'category: RiskCategory', 'controlIds: string[]'], color: '#ef4444' },
    { x: 220, y: 55, w: 160, h: 85, label: 'controls', fields: ['id: CTL-XXX', 'framework: Framework', 'effectiveness: string', 'status: ControlStatus', 'riskIds: string[]'], color: '#3b82f6' },
    { x: 410, y: 55, w: 160, h: 85, label: 'vendors', fields: ['id: VND-XXX', 'tier: VendorTier', 'criticality: string', 'residualRisk: number', 'slaStatus: SLAStatus'], color: '#8b5cf6' },
    // Row 2: Operational entities
    { x: 30, y: 175, w: 160, h: 85, label: 'issues', fields: ['id: ISS-XXX', 'severity: SeverityLevel', 'mraType: MRAType', 'status: IssueStatus', 'dueDate: Date'], color: '#f59e0b' },
    { x: 220, y: 175, w: 160, h: 85, label: 'kris', fields: ['id: KRI-XXX', 'currentValue: number', 'threshold: number', 'breachLevel: string', 'trend: up|down|stable'], color: '#10b981' },
    { x: 410, y: 175, w: 160, h: 85, label: 'loss_events', fields: ['id: LSS-XXX', 'amount: number (USD)', 'category: RiskCategory', 'status: string', 'rootCause: string'], color: '#ec4899' },
    // Row 3: Governance entities
    { x: 30, y: 295, w: 160, h: 85, label: 'regulatory_changes', fields: ['id: REG-XXX', 'source: RegSource', 'impactLevel: string', 'effectiveDate: Date', 'affectedFrameworks[]'], color: '#06b6d4' },
    { x: 220, y: 295, w: 160, h: 85, label: 'audit_events', fields: ['action: AuditAction', 'entityType: string', 'userId: string', 'tenantId: string', 'riskLevel: string'], color: '#64748b' },
    { x: 410, y: 295, w: 160, h: 85, label: 'monitoring_alerts', fields: ['id: ALT-XXX', 'type: AlertType', 'severity: SeverityLevel', 'vendorId?: string', 'acknowledged: bool'], color: '#a855f7' },
  ];

  // Knowledge/AI section on right
  const aiEntities = [
    { x: 640, y: 55, w: 170, h: 85, label: 'knowledge_base', fields: ['22 document sections', 'docType: framework|policy', 'keywords: string[]', 'TF-IDF search scoring', 'GRC domain coverage'], color: '#059669' },
    { x: 830, y: 55, w: 150, h: 85, label: 'mcp_tools', fields: ['18 registered tools', '5 GRC domains', 'JSON-RPC 2.0 style', 'Typed input schemas', 'Structured results'], color: '#7c3aed' },
    { x: 640, y: 175, w: 170, h: 85, label: 'soc2_controls', fields: ['15 TSC controls', 'Security: CC1-CC7', 'Availability: A1.1-A1.4', 'Confidentiality: C1.1-C1.3', 'Evidence tracking'], color: '#0891b2' },
    { x: 830, y: 175, w: 150, h: 85, label: 'llm_providers', fields: ['Claude (complex)', 'OpenAI (medium)', 'Groq (simple)', 'Circuit breaker', 'Fallback chain'], color: '#be185d' },
  ];

  return (
    <svg viewBox="0 0 1000 400" className="w-full h-auto" role="img" aria-label="GRC Data Model">
      <defs>
        <filter id="shadow3">
          <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.15" />
        </filter>
      </defs>

      <rect width="1000" height="400" rx="12" fill={bg} stroke={borderColor} strokeWidth="1" />
      <text x="500" y="30" textAnchor="middle" fill={textColor} fontSize="16" fontWeight="bold">GRC Data Model — Domain Entities & AI Services</text>

      {/* Separator line */}
      <line x1="610" y1="45" x2="610" y2="390" stroke={borderColor} strokeWidth="1" strokeDasharray="6,4" />
      <text x="310" y="48" textAnchor="middle" fill={isDark ? '#64748b' : '#94a3b8'} fontSize="10">DOMAIN DATA</text>
      <text x="790" y="48" textAnchor="middle" fill={isDark ? '#64748b' : '#94a3b8'} fontSize="10">AI / KNOWLEDGE</text>

      {/* Domain entities */}
      {[...entities, ...aiEntities].map((ent, i) => (
        <g key={i} filter="url(#shadow3)">
          <rect x={ent.x} y={ent.y} width={ent.w} height={ent.h} rx="6" fill={isDark ? '#1e293b' : '#ffffff'} stroke={ent.color} strokeWidth="2" />
          <rect x={ent.x} y={ent.y} width={ent.w} height="22" rx="6" fill={ent.color} />
          <rect x={ent.x} y={ent.y + 16} width={ent.w} height="6" fill={ent.color} />
          <text x={ent.x + ent.w / 2} y={ent.y + 16} textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">{ent.label}</text>
          {ent.fields.map((field, fi) => (
            <text key={fi} x={ent.x + 8} y={ent.y + 36 + fi * 12} fill={isDark ? '#94a3b8' : '#64748b'} fontSize="9">{field}</text>
          ))}
        </g>
      ))}

      {/* Relationship lines */}
      {/* risks <-> controls */}
      <line x1="190" y1="95" x2="220" y2="95" stroke="#ef4444" strokeWidth="1.5" />
      {/* controls <-> vendors */}
      <line x1="380" y1="95" x2="410" y2="95" stroke="#3b82f6" strokeWidth="1.5" />
      {/* risks -> issues */}
      <line x1="110" y1="140" x2="110" y2="175" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4,3" />
      {/* risks -> kris */}
      <line x1="190" y1="140" x2="300" y2="175" stroke="#10b981" strokeWidth="1.5" strokeDasharray="4,3" />
      {/* risks -> loss_events */}
      <line x1="160" y1="140" x2="490" y2="175" stroke="#ec4899" strokeWidth="1" strokeDasharray="4,3" opacity="0.5" />
      {/* controls -> regulatory_changes */}
      <line x1="300" y1="260" x2="110" y2="295" stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="4,3" />
      {/* audit_events (logs everything) */}
      <line x1="300" y1="295" x2="300" y2="260" stroke="#64748b" strokeWidth="1" strokeDasharray="3,3" opacity="0.4" />
      {/* vendors -> monitoring_alerts */}
      <line x1="490" y1="260" x2="490" y2="295" stroke="#a855f7" strokeWidth="1.5" strokeDasharray="4,3" />
    </svg>
  );
}

/**
 * Diagram 4: Technology Platform Decomposition
 */
function TechnologyDiagram({ isDark }: { isDark: boolean }) {
  const bg = isDark ? '#0f172a' : '#f8fafc';
  const textColor = isDark ? '#e2e8f0' : '#1e293b';
  const borderColor = isDark ? '#334155' : '#e2e8f0';

  const tiers = [
    { y: 50, h: 50, label: 'Client (Browser)', items: 'React 18 · TypeScript · Vite SPA · Tailwind CSS · Zustand State', grad: 'url(#techGrad1)' },
    { y: 115, h: 50, label: 'Edge / CDN', items: 'Vercel Edge Network · Global CDN · Automatic HTTPS · Asset Optimization', grad: 'url(#techGrad2)' },
    { y: 180, h: 50, label: 'Auth & Security', items: 'OIDC/SAML SSO · MFA · RBAC (6 roles, 29 perms) · Session Mgmt · SOC 2 Controls', grad: 'url(#techGrad3)' },
    { y: 245, h: 50, label: 'AI Services', items: 'Orchestrator · MCP Server (18 tools) · RAG (22 sections) · Circuit Breaker · Multi-LLM', grad: 'url(#techGrad4)' },
    { y: 310, h: 50, label: 'Observability', items: 'Audit Logger · SIEM Sink · Telemetry · Security Metrics · Performance Tracker', grad: 'url(#techGrad5)' },
    { y: 375, h: 50, label: 'Data Layer (Planned)', items: 'PostgreSQL · pgvector · Redis · Multi-tenant Isolation · Encrypted at Rest', grad: 'url(#techGrad6)' },
  ];

  return (
    <svg viewBox="0 0 1000 450" className="w-full h-auto" role="img" aria-label="Technology Platform Decomposition">
      <defs>
        <linearGradient id="techGrad1" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#06b6d4" /><stop offset="100%" stopColor="#0ea5e9" /></linearGradient>
        <linearGradient id="techGrad2" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#3b82f6" /><stop offset="100%" stopColor="#6366f1" /></linearGradient>
        <linearGradient id="techGrad3" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#ef4444" /><stop offset="100%" stopColor="#f43f5e" /></linearGradient>
        <linearGradient id="techGrad4" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#8b5cf6" /><stop offset="100%" stopColor="#a855f7" /></linearGradient>
        <linearGradient id="techGrad5" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#f59e0b" /><stop offset="100%" stopColor="#f97316" /></linearGradient>
        <linearGradient id="techGrad6" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#10b981" /><stop offset="100%" stopColor="#059669" /></linearGradient>
        <filter id="shadow4">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
        </filter>
      </defs>

      <rect width="1000" height="450" rx="12" fill={bg} stroke={borderColor} strokeWidth="1" />
      <text x="500" y="30" textAnchor="middle" fill={textColor} fontSize="16" fontWeight="bold">Technology Platform Decomposition</text>

      {tiers.map((tier, i) => (
        <g key={i} filter="url(#shadow4)">
          <rect x="50" y={tier.y} width="900" height={tier.h} rx="8" fill={tier.grad} />
          <text x="120" y={tier.y + 22} fill="white" fontSize="13" fontWeight="bold">{tier.label}</text>
          <text x="120" y={tier.y + 40} fill="rgba(255,255,255,0.8)" fontSize="11">{tier.items}</text>
        </g>
      ))}

      {/* Connecting arrows between tiers */}
      {[100, 165, 230, 295, 360].map((y, i) => (
        <g key={i}>
          <line x1="500" y1={y} x2="500" y2={y + 15} stroke={isDark ? '#475569' : '#94a3b8'} strokeWidth="2" />
          <polygon points={`495,${y + 15} 505,${y + 15} 500,${y + 20}`} fill={isDark ? '#475569' : '#94a3b8'} />
        </g>
      ))}
    </svg>
  );
}

// ============================================================================
// INTEGRATIONS CATALOG
// ============================================================================

const INTEGRATIONS: IntegrationItem[] = [
  { name: 'React 18', status: 'active', category: 'Frontend' },
  { name: 'TypeScript', status: 'active', category: 'Frontend' },
  { name: 'Vite', status: 'active', category: 'Frontend' },
  { name: 'Tailwind CSS', status: 'active', category: 'Frontend' },
  { name: 'Zustand', status: 'active', category: 'Frontend' },
  { name: 'React Router v6', status: 'active', category: 'Frontend' },
  { name: 'Lucide Icons', status: 'active', category: 'Frontend' },
  { name: 'Claude (Anthropic)', status: 'stub', category: 'AI / LLM' },
  { name: 'OpenAI GPT-4', status: 'stub', category: 'AI / LLM' },
  { name: 'Groq (Mixtral)', status: 'stub', category: 'AI / LLM' },
  { name: 'MCP Protocol', status: 'active', category: 'AI / LLM' },
  { name: 'RAG Knowledge Service', status: 'active', category: 'AI / LLM' },
  { name: 'Web Speech API', status: 'active', category: 'AI / LLM' },
  { name: 'Vercel', status: 'planned', category: 'Infrastructure' },
  { name: 'PostgreSQL', status: 'planned', category: 'Infrastructure' },
  { name: 'pgvector', status: 'planned', category: 'Infrastructure' },
  { name: 'Redis', status: 'planned', category: 'Infrastructure' },
  { name: 'OIDC SSO (Okta)', status: 'stub', category: 'Auth & Security' },
  { name: 'SAML (Entra ID)', status: 'stub', category: 'Auth & Security' },
  { name: 'RBAC Engine', status: 'active', category: 'Auth & Security' },
  { name: 'Audit Logger', status: 'active', category: 'Auth & Security' },
  { name: 'SIEM Sink', status: 'active', category: 'Auth & Security' },
  { name: 'SOC 2 Controls', status: 'active', category: 'Compliance' },
  { name: 'Basel III', status: 'active', category: 'Compliance' },
  { name: 'SOX', status: 'active', category: 'Compliance' },
  { name: 'GDPR', status: 'active', category: 'Compliance' },
  { name: 'NIST CSF', status: 'active', category: 'Compliance' },
  { name: 'ISO 27001', status: 'active', category: 'Compliance' },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const Architecture: React.FC = () => {
  const isDark = useThemeStore((state) => state.isDark);
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set(['preliminary']));
  const [activeDiagram, setActiveDiagram] = useState<DiagramTab>('business');
  const [integrationFilter, setIntegrationFilter] = useState<string>('all');

  const togglePhase = (phaseId: string) => {
    const newSet = new Set(expandedPhases);
    if (newSet.has(phaseId)) {
      newSet.delete(phaseId);
    } else {
      newSet.add(phaseId);
    }
    setExpandedPhases(newSet);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'implemented':
        return isDark ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-700';
      case 'in-progress':
        return isDark ? 'bg-amber-900/30 text-amber-300' : 'bg-amber-100 text-amber-700';
      case 'planned':
        return isDark ? 'bg-slate-700/30 text-slate-300' : 'bg-slate-100 text-slate-700';
      default:
        return '';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'implemented': return '✓';
      case 'in-progress': return '◐';
      case 'planned': return '○';
      default: return '';
    }
  };

  const getIntegrationStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return isDark ? 'bg-green-900/40 text-green-300 border-green-700' : 'bg-green-50 text-green-700 border-green-200';
      case 'stub':
        return isDark ? 'bg-amber-900/40 text-amber-300 border-amber-700' : 'bg-amber-50 text-amber-700 border-amber-200';
      case 'planned':
        return isDark ? 'bg-slate-700/40 text-slate-300 border-slate-600' : 'bg-slate-50 text-slate-600 border-slate-200';
      default:
        return '';
    }
  };

  const phases: PhaseData[] = [
    {
      id: 'preliminary',
      title: 'Preliminary: Architecture Framework',
      description: 'Foundation & guiding principles',
      icon: <Shield className="w-5 h-5" />,
      status: 'implemented',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className={`font-semibold mb-2 ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>Principles</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Security-first architecture</li>
              <li>Multi-tenant isolation</li>
              <li>Regulatory compliance by design</li>
              <li>AI-governed decision making</li>
            </ul>
          </div>
          <div>
            <h4 className={`font-semibold mb-2 ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>Standards & Frameworks</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>SOC 2 Type II compliance</li>
              <li>ISO 27001 information security</li>
              <li>NIST Cybersecurity Framework (CSF)</li>
              <li>OWASP Top 10 threat mitigation</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'phase-a',
      title: 'Phase A: Architecture Vision',
      description: 'Strategic direction & goals',
      icon: <Brain className="w-5 h-5" />,
      status: 'implemented',
      content: (
        <div className="space-y-3 text-sm">
          <div><p className="font-semibold mb-1">Single-Pane GRC Command Center</p><p className={isDark ? 'text-slate-400' : 'text-slate-600'}>Unified dashboard for G-SIB banks to manage risk, compliance, and regulatory requirements</p></div>
          <div><p className="font-semibold mb-1">AI-Augmented Risk Intelligence</p><p className={isDark ? 'text-slate-400' : 'text-slate-600'}>Multi-LLM orchestration with MCP tools, RAG grounding, and circuit breaker failover</p></div>
          <div><p className="font-semibold mb-1">Real-Time Regulatory Compliance Monitoring</p><p className={isDark ? 'text-slate-400' : 'text-slate-600'}>Continuous monitoring against 5 frameworks with automated gap analysis and KRI breach alerting</p></div>
        </div>
      ),
    },
    {
      id: 'phase-b',
      title: 'Phase B: Business Architecture',
      description: 'Domains, roles & processes',
      icon: <Layers className="w-5 h-5" />,
      status: 'implemented',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className={`font-semibold mb-2 text-sm ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>5 GRC Domains</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Risk Management</li><li>Compliance</li><li>Third-Party Risk (TPRM)</li><li>Audit & Assurance</li><li>AI Governance</li>
            </ul>
          </div>
          <div>
            <h4 className={`font-semibold mb-2 text-sm ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>6 User Roles</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Chief Risk Officer</li><li>Risk Administrator</li><li>Compliance Officer</li><li>TPRM Analyst</li><li>Internal Auditor</li><li>Examiner (read-only)</li>
            </ul>
          </div>
          <div>
            <h4 className={`font-semibold mb-2 text-sm ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>Key Processes</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Risk assessment & scoring</li><li>Control testing & evidence</li><li>Vendor due diligence</li><li>Regulatory change mgmt</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'phase-c',
      title: 'Phase C: Information Systems Architecture',
      description: 'Data + Application architecture',
      icon: <Database className="w-5 h-5" />,
      status: 'implemented',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className={`font-semibold mb-2 text-sm ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>Data Architecture</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>9 core domain entities (Risk, Control, Vendor, Issue, KRI, LossEvent, RegChange, Alert, Scenario)</li>
              <li>Multi-tenant isolation via tenantId</li>
              <li>SIEM-ready structured audit trail</li>
              <li>22-section RAG knowledge base</li>
            </ul>
          </div>
          <div>
            <h4 className={`font-semibold mb-2 text-sm ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>Application Architecture</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>AI Orchestrator: domain detection → complexity → provider → RAG → MCP → response</li>
              <li>18 MCP tools across 5 domains</li>
              <li>Circuit breaker with 3-failure threshold</li>
              <li>Web Speech API voice input</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'phase-d',
      title: 'Phase D: Technology Architecture',
      description: 'Infrastructure & platform stack',
      icon: <Server className="w-5 h-5" />,
      status: 'in-progress',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className={`font-semibold mb-2 text-sm ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>Current Stack</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>React 18 + TypeScript + Vite SPA</li><li>Tailwind CSS + Lucide Icons</li><li>Zustand state management</li><li>React Router v6 lazy routes</li>
            </ul>
          </div>
          <div>
            <h4 className={`font-semibold mb-2 text-sm ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>Planned Infrastructure</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Vercel Edge for deployment</li><li>PostgreSQL + pgvector</li><li>Redis for sessions/caching</li><li>Kubernetes for scaling</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'phase-e',
      title: 'Phase E: Opportunities & Solutions',
      description: 'Future enhancements',
      icon: <Zap className="w-5 h-5" />,
      status: 'planned',
      content: (
        <div className="space-y-3 text-sm">
          <div><p className="font-semibold mb-1">Real-Time Regulatory Feed</p><p className={isDark ? 'text-slate-400' : 'text-slate-600'}>Automated OCC/FDIC bulletin ingestion and impact analysis</p></div>
          <div><p className="font-semibold mb-1">Predictive Risk Scoring</p><p className={isDark ? 'text-slate-400' : 'text-slate-600'}>ML models for risk escalation forecasting</p></div>
          <div><p className="font-semibold mb-1">Automated Control Testing</p><p className={isDark ? 'text-slate-400' : 'text-slate-600'}>AI-driven test case generation and evidence collection</p></div>
          <div><p className="font-semibold mb-1">Cross-Framework Gap Analysis</p><p className={isDark ? 'text-slate-400' : 'text-slate-600'}>Automated mapping across SOX, COSO, NIST, ISO frameworks</p></div>
        </div>
      ),
    },
    {
      id: 'phase-f',
      title: 'Phase F: Migration Planning',
      description: 'Roadmap & implementation phases',
      icon: <Globe className="w-5 h-5" />,
      status: 'in-progress',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={`p-3 rounded ${isDark ? 'bg-green-900/20 border border-green-800' : 'bg-green-50 border border-green-200'}`}>
            <p className={`font-semibold text-sm mb-1 ${isDark ? 'text-green-300' : 'text-green-700'}`}>Phase 1 (Current): Browser Prototype</p>
            <p className="text-sm">React SPA with seed data, no backend API</p>
          </div>
          <div className={`p-3 rounded ${isDark ? 'bg-amber-900/20 border border-amber-800' : 'bg-amber-50 border border-amber-200'}`}>
            <p className={`font-semibold text-sm mb-1 ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>Phase 2: API Backend</p>
            <p className="text-sm">Supabase PostgreSQL, RESTful API</p>
          </div>
          <div className={`p-3 rounded ${isDark ? 'bg-slate-700/30 border border-slate-600' : 'bg-slate-100 border border-slate-200'}`}>
            <p className={`font-semibold text-sm mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Phase 3: Enterprise Auth</p>
            <p className="text-sm">OIDC/SAML SSO, MFA, SCIM</p>
          </div>
          <div className={`p-3 rounded ${isDark ? 'bg-slate-700/30 border border-slate-600' : 'bg-slate-100 border border-slate-200'}`}>
            <p className={`font-semibold text-sm mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Phase 4: Production</p>
            <p className="text-sm">SOC 2 audit, pen testing, load testing</p>
          </div>
        </div>
      ),
    },
  ];

  const diagramTabs: { key: DiagramTab; label: string }[] = [
    { key: 'business', label: 'Business Domain' },
    { key: 'application', label: 'Application Architecture' },
    { key: 'data', label: 'Data Model' },
    { key: 'technology', label: 'Technology Stack' },
  ];

  const categories = ['all', ...new Set(INTEGRATIONS.map((i) => i.category))];
  const filteredIntegrations = integrationFilter === 'all' ? INTEGRATIONS : INTEGRATIONS.filter((i) => i.category === integrationFilter);

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
      {/* Header */}
      <div className={`${isDark ? 'bg-gradient-to-r from-slate-900 to-slate-800' : 'bg-gradient-to-r from-blue-600 to-blue-700'} text-white py-8 px-4`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Layers className="w-8 h-8" />
            <h1 className="text-3xl font-bold">IRM Command Architecture</h1>
          </div>
          <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-blue-100'}`}>
            TOGAF ADM-based architecture framework for enterprise GRC platform
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-10">
        {/* ===================== ARCHITECTURE DIAGRAMS ===================== */}
        <section>
          <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            Architecture Diagrams
          </h2>

          {/* Diagram Tabs */}
          <div className={`flex flex-wrap gap-2 mb-4 p-1 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
            {diagramTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveDiagram(tab.key)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeDiagram === tab.key
                    ? isDark
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-blue-700 shadow-sm'
                    : isDark
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Active Diagram */}
          <div className={`rounded-xl border overflow-hidden ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
            {activeDiagram === 'business' && <BusinessDomainDiagram isDark={isDark} />}
            {activeDiagram === 'application' && <ApplicationArchDiagram isDark={isDark} />}
            {activeDiagram === 'data' && <DataModelDiagram isDark={isDark} />}
            {activeDiagram === 'technology' && <TechnologyDiagram isDark={isDark} />}
          </div>
        </section>

        {/* ===================== TOGAF ADM PHASES ===================== */}
        <section>
          <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            TOGAF ADM Phases
          </h2>

          <div className="space-y-3">
            {phases.map((phase) => (
              <div
                key={phase.id}
                className={`rounded-lg border overflow-hidden transition-all ${
                  isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                }`}
              >
                <button
                  onClick={() => togglePhase(phase.id)}
                  className={`w-full p-4 flex items-center justify-between transition-colors ${
                    isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 text-left">
                    <div className={`p-2 rounded ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
                      {phase.icon}
                    </div>
                    <div>
                      <h3 className={`font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{phase.title}</h3>
                      <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{phase.description}</p>
                    </div>
                    <span className={`ml-auto px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(phase.status)}`}>
                      {getStatusIcon(phase.status)} {phase.status.replace('-', ' ')}
                    </span>
                  </div>
                  <div className="ml-2">
                    {expandedPhases.has(phase.id) ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  </div>
                </button>

                {expandedPhases.has(phase.id) && (
                  <div className={`px-6 py-4 border-t ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-100 bg-slate-50'}`}>
                    {phase.content}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ===================== INTEGRATION CATALOG ===================== */}
        <section>
          <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            Integration Catalog
          </h2>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Filter className={`w-4 h-4 mt-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setIntegrationFilter(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  integrationFilter === cat
                    ? isDark
                      ? 'bg-blue-600 text-white border-blue-500'
                      : 'bg-blue-600 text-white border-blue-600'
                    : isDark
                    ? 'bg-slate-800 text-slate-300 border-slate-600 hover:border-slate-500'
                    : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'
                }`}
              >
                {cat === 'all' ? 'All' : cat}
              </button>
            ))}
          </div>

          {/* Integration Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {filteredIntegrations.map((item, i) => (
              <div
                key={i}
                className={`px-3 py-2 rounded-lg border text-center text-sm ${getIntegrationStatusColor(item.status)}`}
              >
                <p className="font-medium">{item.name}</p>
                <p className="text-xs opacity-70">{item.status}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ===================== LEGEND ===================== */}
        <div className={`p-4 rounded-lg border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
          <h3 className={`font-semibold mb-3 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Legend</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full bg-green-500"></span>
              <span>Implemented / Active — production ready</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full bg-amber-500"></span>
              <span>In Progress / Stub — interface defined, needs backend</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full bg-slate-500"></span>
              <span>Planned — future roadmap item</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Architecture;
