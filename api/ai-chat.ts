/**
 * Vercel Serverless Function: /api/ai-chat
 *
 * Three-tier LLM provider router with circuit breaker:
 *   Simple  → Groq  (llama-3.3-70b-versatile) — fast, cheap
 *   Medium  → OpenAI (gpt-4o) — balanced
 *   Complex → Claude (claude-sonnet-4-5) — deepest reasoning
 *   Fallback → template engine (client-side, signaled via fallback: true)
 *
 * API keys stay server-side. All responses grounded in real app data.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// ─── Provider Configurations ────────────────────────────────────────────────

type Provider = 'groq' | 'openai' | 'claude';
type Complexity = 'simple' | 'medium' | 'complex';

interface ProviderConfig {
  name: string;
  apiUrl: string;
  model: string;
  maxTokens: number;
  envKey: string;
  buildRequest: (
    system: string,
    messages: Array<{ role: string; content: string }>,
    maxTokens: number,
    apiKey: string
  ) => { url: string; init: RequestInit };
  extractResponse: (data: any) => string;
}

const PROVIDERS: Record<Provider, ProviderConfig> = {
  groq: {
    name: 'Groq (Llama 3.3 70B)',
    apiUrl: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama-3.3-70b-versatile',
    maxTokens: 1024,
    envKey: 'GROQ_API_KEY',
    buildRequest: (system, messages, maxTokens, apiKey) => ({
      url: 'https://api.groq.com/openai/v1/chat/completions',
      init: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'system', content: system }, ...messages],
          max_tokens: maxTokens,
          temperature: 0.3,
        }),
      },
    }),
    extractResponse: (data) =>
      data.choices?.[0]?.message?.content || 'No response generated.',
  },

  openai: {
    name: 'OpenAI (GPT-4o)',
    apiUrl: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4o',
    maxTokens: 1536,
    envKey: 'OPENAI_API_KEY',
    buildRequest: (system, messages, maxTokens, apiKey) => ({
      url: 'https://api.openai.com/v1/chat/completions',
      init: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [{ role: 'system', content: system }, ...messages],
          max_tokens: maxTokens,
          temperature: 0.3,
        }),
      },
    }),
    extractResponse: (data) =>
      data.choices?.[0]?.message?.content || 'No response generated.',
  },

  claude: {
    name: 'Claude (Sonnet 4.5)',
    apiUrl: 'https://api.anthropic.com/v1/messages',
    model: 'claude-sonnet-4-5-20250929',
    maxTokens: 2048,
    envKey: 'ANTHROPIC_API_KEY',
    buildRequest: (system, messages, maxTokens, apiKey) => ({
      url: 'https://api.anthropic.com/v1/messages',
      init: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: maxTokens,
          system,
          messages,
        }),
      },
    }),
    extractResponse: (data) =>
      data.content?.[0]?.text || 'No response generated.',
  },
};

// ─── Complexity → Provider Routing ──────────────────────────────────────────

const COMPLEXITY_ROUTE: Record<Complexity, Provider> = {
  simple: 'groq',
  medium: 'openai',
  complex: 'claude',
};

// Fallback chain: if preferred provider unavailable, try next in line
const FALLBACK_CHAIN: Provider[] = ['groq', 'openai', 'claude'];

// ─── Circuit Breaker (in-memory, per cold-start) ───────────────────────────

const circuitState: Record<
  Provider,
  { failures: number; lastFailure: number; open: boolean }
> = {
  groq: { failures: 0, lastFailure: 0, open: false },
  openai: { failures: 0, lastFailure: 0, open: false },
  claude: { failures: 0, lastFailure: 0, open: false },
};

const FAILURE_THRESHOLD = 3;
const RESET_TIMEOUT_MS = 30_000;

function isCircuitOpen(provider: Provider): boolean {
  const s = circuitState[provider];
  if (!s.open) return false;
  if (Date.now() - s.lastFailure >= RESET_TIMEOUT_MS) {
    s.failures = 0;
    s.open = false;
    return false;
  }
  return true;
}

function recordFailure(provider: Provider) {
  const s = circuitState[provider];
  s.failures++;
  s.lastFailure = Date.now();
  if (s.failures >= FAILURE_THRESHOLD) s.open = true;
}

function recordSuccess(provider: Provider) {
  const s = circuitState[provider];
  s.failures = 0;
  s.open = false;
}

// ─── Domain Detection & Complexity Estimation (server-side mirror) ─────────

const DOMAIN_KEYWORDS: Record<string, string[]> = {
  risk: ['risk', 'threat', 'vulnerability', 'impact', 'likelihood', 'inherent', 'residual', 'appetite', 'mitigation', 'kri', 'indicator', 'loss event', 'scenario', 'stress test'],
  compliance: ['compliance', 'control', 'framework', 'sox', 'gdpr', 'nist', 'iso', 'basel', 'occ', 'fdic', 'regulatory', 'policy', 'gap', 'mapping', 'hipaa', 'nerc'],
  vendor: ['vendor', 'third party', 'tprm', 'supplier', 'sla', 'due diligence', 'concentration', 'tier'],
  audit: ['audit', 'finding', 'mra', 'mria', 'examiner', 'examination', 'evidence', 'attestation', 'deficiency'],
  soc2: ['soc 2', 'soc2', 'trust services', 'availability', 'confidentiality', 'security criteria'],
  knowledge: ['what is', 'what are', 'explain', 'define', 'how does', 'how do', 'meaning', 'help', 'guide'],
};

function detectComplexity(message: string): Complexity {
  const lower = message.toLowerCase();
  let score = 0;

  // Count how many domains are touched
  let domainHits = 0;
  for (const [, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) domainHits++;
  }
  score += Math.max(0, domainHits - 1) * 2;

  // Multi-framework references
  const frameworks = ['nist', 'iso', 'sox', 'gdpr', 'basel', 'coso', 'hipaa', 'nerc', 'occ'];
  const fwCount = frameworks.filter((fw) => lower.includes(fw)).length;
  if (fwCount > 1) score += 3;

  // Analytics / comparison language
  ['compare', 'analysis', 'trend', 'correlation', 'vs', 'benchmark', 'root cause'].forEach((w) => {
    if (lower.includes(w)) score += 2;
  });

  // Complex operations
  ['gap analysis', 'risk assessment', 'what-if', 'scenario', 'stress test', 'impact analysis', 'board pack', 'examiner view', 'daily digest'].forEach((op) => {
    if (lower.includes(op)) score += 3;
  });

  // Message length as a complexity signal
  if (message.length > 300) score += 2;
  if (message.length > 600) score += 2;

  if (score <= 2) return 'simple';
  if (score <= 5) return 'medium';
  return 'complex';
}

// ─── System Prompt (shared across all providers) ───────────────────────────

const SYSTEM_PROMPT = `You are IRM Sentinel AI — an expert GRC (Governance, Risk & Compliance) analyst embedded in an enterprise risk management platform.

CRITICAL RULES — ZERO HALLUCINATION POLICY:
1. ONLY reference data explicitly provided in the <app_data> context. NEVER invent risks, controls, KRIs, vendors, scores, dates, or any other data points.
2. If data is insufficient to answer a question, say so clearly rather than guessing.
3. Use precise numbers from the data — do not round or approximate unless asked.
4. Write in a professional, regulatory-examination tone (OCC/FDIC style for banking, equivalent for other industries).
5. When analyzing KRIs: report actual values, thresholds, breach percentages, and trends exactly as given.
6. When analyzing risks: reference actual risk titles, categories, inherent/residual scores, and owners from the data.
7. When discussing vendors: reference actual vendor names, tiers, criticality levels, SLA status from the data.
8. For conceptual GRC questions (e.g., "What is a KRI?"), provide expert educational answers grounded in industry standards (ISO 31000, COSO ERM, Basel III, OCC guidance, NIST CSF, etc.).
9. Keep responses focused and actionable — executives, board members, and regulators are your audience.
10. Format with clear structure. Use numbered lists for action items.

You have access to the full live state of the client's GRC platform data. Analyze it thoroughly before responding.`;

// ─── Main Handler ──────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { message, conversationHistory, appData, industry, client, complexityHint } = req.body;

    if (!message) return res.status(400).json({ error: 'Message is required' });

    // 1. Determine complexity (use client hint or detect server-side)
    const complexity: Complexity = complexityHint || detectComplexity(message);

    // 2. Build provider routing order
    const preferredProvider = COMPLEXITY_ROUTE[complexity];
    const routingOrder = buildRoutingOrder(preferredProvider);

    // 3. Build grounded context
    const contextBlock = buildContextBlock(appData, industry, client);

    // 4. Build messages
    const messages: Array<{ role: string; content: string }> = [];
    if (conversationHistory && Array.isArray(conversationHistory)) {
      for (const msg of conversationHistory.slice(-10)) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }
    messages.push({
      role: 'user',
      content: `<app_data>\n${contextBlock}\n</app_data>\n\nUser question: ${message}`,
    });

    // 5. Try providers in order with circuit breaker
    for (const provider of routingOrder) {
      const config = PROVIDERS[provider];
      const apiKey = process.env[config.envKey];

      if (!apiKey) {
        console.log(`[Router] ${provider}: no API key (${config.envKey}), skipping`);
        continue;
      }

      if (isCircuitOpen(provider)) {
        console.log(`[Router] ${provider}: circuit breaker open, skipping`);
        continue;
      }

      try {
        console.log(`[Router] Trying ${provider} (${config.model}) for ${complexity} query`);

        const { url, init } = config.buildRequest(SYSTEM_PROMPT, messages, config.maxTokens, apiKey);
        const response = await fetch(url, init);

        if (!response.ok) {
          const errorBody = await response.text();
          console.error(`[Router] ${provider} returned ${response.status}:`, errorBody);
          recordFailure(provider);
          continue; // Try next provider
        }

        const data = await response.json();
        const responseText = config.extractResponse(data);
        recordSuccess(provider);

        console.log(`[Router] Success via ${provider} (${complexity})`);

        return res.status(200).json({
          response: responseText,
          provider: provider,
          providerName: config.name,
          model: config.model,
          complexity,
          usage: data.usage || data.choices?.[0]?.usage || null,
        });
      } catch (error: any) {
        console.error(`[Router] ${provider} failed:`, error.message);
        recordFailure(provider);
        continue; // Try next provider
      }
    }

    // 6. All providers failed — signal client to use template engine
    console.warn('[Router] All providers failed or unavailable, signaling fallback');
    return res.status(200).json({
      fallback: true,
      complexity,
      error: 'All LLM providers unavailable. Using template engine.',
    });
  } catch (error: any) {
    console.error('AI chat handler error:', error);
    return res.status(500).json({
      error: error.message || 'Internal server error',
      fallback: true,
    });
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Build routing order: preferred provider first, then fallbacks in cascade order
 */
function buildRoutingOrder(preferred: Provider): Provider[] {
  const order: Provider[] = [preferred];
  // Add remaining providers in fallback chain order
  for (const p of FALLBACK_CHAIN) {
    if (!order.includes(p)) order.push(p);
  }
  return order;
}

/**
 * Serialize the app's live GRC data into a structured context block
 * so the LLM can reference actual data — zero hallucination.
 */
function buildContextBlock(appData: any, industry: any, client: any): string {
  const sections: string[] = [];

  if (industry) {
    sections.push(`INDUSTRY: ${industry.name || industry.id} (${industry.shortName || industry.id})`);
  }
  if (client) {
    sections.push(`CLIENT: ${client.name} (${client.shortName || client.id})`);
  }

  if (!appData) return sections.join('\n');

  // Risks
  if (appData.risks?.length) {
    const risks = appData.risks;
    const critical = risks.filter((r: any) => r.inherentScore >= 15).length;
    const high = risks.filter((r: any) => r.inherentScore >= 10 && r.inherentScore < 15).length;
    sections.push(`\nRISKS (${risks.length} total, ${critical} critical, ${high} high):`);
    risks.forEach((r: any, i: number) => {
      sections.push(`  ${i + 1}. [${r.id}] ${r.title} | Category: ${r.category} | Status: ${r.status} | Inherent: ${r.inherentScore} | Residual: ${r.residualScore} | Impact: ${r.impact}/5 | Likelihood: ${r.likelihood}/5 | Owner: ${r.owner}`);
    });
  }

  // KRIs
  if (appData.kris?.length) {
    const kris = appData.kris;
    const breached = kris.filter((k: any) => k.breachLevel === 'Breach' || k.breachLevel === 'Critical').length;
    const warning = kris.filter((k: any) => k.breachLevel === 'Warning').length;
    sections.push(`\nKEY RISK INDICATORS (${kris.length} total, ${breached} breached, ${warning} warning):`);
    kris.forEach((k: any, i: number) => {
      const pctOver = k.threshold ? (((k.currentValue - k.threshold) / k.threshold) * 100).toFixed(0) : 'N/A';
      sections.push(`  ${i + 1}. ${k.name} | Value: ${k.currentValue} ${k.unit || ''} | Threshold: ${k.threshold} | Breach: ${k.breachLevel} | Trend: ${k.trend} | ${pctOver}% over threshold | Category: ${k.riskCategory}`);
    });
  }

  // Controls
  if (appData.controls?.length) {
    const controls = appData.controls;
    const effective = controls.filter((c: any) => c.effectiveness === 'Effective').length;
    const partial = controls.filter((c: any) => c.effectiveness === 'Partially Effective').length;
    const ineffective = controls.filter((c: any) => c.effectiveness === 'Ineffective').length;
    sections.push(`\nCONTROLS (${controls.length} total, ${effective} effective, ${partial} partial, ${ineffective} ineffective):`);
    controls.forEach((c: any, i: number) => {
      sections.push(`  ${i + 1}. [${c.id}] ${c.title} | Framework: ${c.framework} | Type: ${c.controlType} | Effectiveness: ${c.effectiveness} | Status: ${c.implementationStatus} | Owner: ${c.owner}`);
    });
  }

  // Issues
  if (appData.issues?.length) {
    const issues = appData.issues;
    const open = issues.filter((i: any) => i.status === 'Open').length;
    const overdue = issues.filter((i: any) => i.status === 'Overdue').length;
    const mras = issues.filter((i: any) => i.mraType === 'MRA').length;
    const mrias = issues.filter((i: any) => i.mraType === 'MRIA').length;
    sections.push(`\nISSUES & FINDINGS (${issues.length} total, ${open} open, ${overdue} overdue, ${mras} MRAs, ${mrias} MRIAs):`);
    issues.forEach((iss: any, i: number) => {
      sections.push(`  ${i + 1}. [${iss.id}] ${iss.title} | Severity: ${iss.severity} | Status: ${iss.status} | Type: ${iss.mraType || 'Finding'} | Source: ${iss.source} | Due: ${iss.dueDate}`);
    });
  }

  // Vendors
  if (appData.vendors?.length) {
    const vendors = appData.vendors;
    sections.push(`\nVENDORS (${vendors.length} total):`);
    vendors.forEach((v: any, i: number) => {
      sections.push(`  ${i + 1}. ${v.name} | Tier: ${v.tier} | Criticality: ${v.criticality} | Residual Risk: ${v.residualRisk}/5 | SLA: ${v.slaStatus} | Contract Expiry: ${v.contractExpiry}`);
    });
  }

  // Loss events
  if (appData.lossEvents?.length) {
    const losses = appData.lossEvents;
    const totalAmount = losses.reduce((s: number, e: any) => s + (e.amount || 0), 0);
    sections.push(`\nLOSS EVENTS (${losses.length} total, USD ${(totalAmount / 1_000_000).toFixed(2)}M aggregate):`);
    losses.forEach((e: any, i: number) => {
      sections.push(`  ${i + 1}. ${e.title || e.description} | Category: ${e.category} | Amount: USD ${e.amount?.toLocaleString()} | Date: ${e.date} | Status: ${e.status}`);
    });
  }

  // Regulatory changes
  if (appData.regulatoryChanges?.length) {
    const regs = appData.regulatoryChanges;
    sections.push(`\nREGULATORY CHANGES (${regs.length}):`);
    regs.forEach((r: any, i: number) => {
      sections.push(`  ${i + 1}. ${r.title} | Source: ${r.source} | Impact: ${r.impactLevel} | Effective: ${r.effectiveDate} | Status: ${r.status}`);
    });
  }

  return sections.join('\n');
}
