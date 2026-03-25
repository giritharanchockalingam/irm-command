/**
 * AI Service — Client-side service that calls the /api/ai-chat
 * three-tier LLM router with full GRC data context for grounded responses.
 *
 * Routing:
 *   Simple  → Groq  (llama-3.3-70b) — fast definitions, lookups
 *   Medium  → OpenAI (gpt-4o) — analysis, synthesis
 *   Complex → Claude (claude-sonnet-4-5) — deep reasoning, multi-domain
 *   Fallback → TemplateEngine (local, always available)
 *
 * The complexity is detected both client-side (for UI hints) and server-side
 * (for authoritative routing). Client sends a hint; server makes final decision.
 */

import { getDataAccess } from '../data/DataAccessLayer';
import { useIndustryStore } from '../store/industryStore';
import { useClientStore } from '../store/clientStore';
import { detectDomains, estimateComplexity } from './orchestrator';
import { TemplateEngine } from './local/templateEngine';

export type AIProvider = 'groq' | 'openai' | 'claude' | 'template';
export type Complexity = 'simple' | 'medium' | 'complex';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIServiceResponse {
  response: string;
  source: AIProvider;
  providerName?: string;
  model?: string;
  complexity?: Complexity;
}

const templateEngine = new TemplateEngine();

/**
 * Gather the full GRC data snapshot from the DataAccessLayer
 */
function gatherAppData() {
  const dal = getDataAccess();
  return {
    risks: dal.getRisks(),
    controls: dal.getControls(),
    kris: dal.getKRIs(),
    issues: dal.getIssues(),
    vendors: dal.getVendors(),
    lossEvents: dal.getLossEvents(),
    regulatoryChanges: dal.getRegulatoryChanges(),
    monitoringAlerts: dal.getMonitoringAlerts(),
  };
}

/**
 * Get current industry and client context
 */
function getContext() {
  const { config: industryConfig, industryId } = useIndustryStore.getState();
  const { activeClient } = useClientStore.getState();
  return {
    industry: {
      id: industryId,
      name: industryConfig.name,
      shortName: industryConfig.shortName,
    },
    client: activeClient
      ? { id: activeClient.id, name: activeClient.name, shortName: activeClient.shortName }
      : null,
  };
}

/**
 * Client-side complexity estimation (mirrors server logic).
 * Used for UI hints like "Routing to Groq..." before response arrives.
 */
export function estimateQueryComplexity(message: string): Complexity {
  const domains = detectDomains(message);
  return estimateComplexity(message, domains);
}

/**
 * Map complexity to expected provider (for UI pre-display)
 */
export function getExpectedProvider(complexity: Complexity): { provider: AIProvider; label: string } {
  switch (complexity) {
    case 'simple':
      return { provider: 'groq', label: 'Groq (Llama 3.3 70B)' };
    case 'medium':
      return { provider: 'openai', label: 'OpenAI (GPT-4o)' };
    case 'complex':
      return { provider: 'claude', label: 'Claude (Sonnet 4.5)' };
  }
}

/**
 * Send a message to the three-tier AI router.
 * Falls back to template engine if all providers are unavailable.
 */
export async function sendChatMessage(
  message: string,
  conversationHistory: ChatMessage[] = [],
  options?: {
    module?: string;
    entityId?: string;
  }
): Promise<AIServiceResponse> {
  const appData = gatherAppData();
  const { industry, client } = getContext();
  const complexityHint = estimateQueryComplexity(message);

  try {
    const response = await fetch('/api/ai-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        conversationHistory: conversationHistory.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        appData,
        industry,
        client,
        complexityHint,
      }),
    });

    const data = await response.json();

    // Server signals fallback (all providers down or no keys)
    if (data.fallback) {
      return fallbackToTemplate(message, options, data.complexity || complexityHint);
    }

    if (!response.ok) {
      console.warn('AI router returned error, falling back:', data.error);
      return fallbackToTemplate(message, options, complexityHint);
    }

    return {
      response: data.response,
      source: data.provider || 'claude',
      providerName: data.providerName,
      model: data.model,
      complexity: data.complexity || complexityHint,
    };
  } catch (error) {
    console.warn('AI router unreachable, falling back to template engine:', error);
    return fallbackToTemplate(message, options, complexityHint);
  }
}

/**
 * Generate a specific narrative type using the AI router.
 * These always route as "complex" since they need deep analysis.
 */
export async function generateNarrative(
  type: 'daily-digest' | 'examiner-view' | 'vendor-narrative' | 'risk-assessment' | 'compliance-impact' | 'board-pack',
  additionalContext?: string
): Promise<AIServiceResponse> {
  const prompts: Record<string, string> = {
    'daily-digest':
      'Generate a comprehensive daily risk posture summary in OCC/FDIC examination style. Cover: aggregate risk profile, KRI status with specific breach details, third-party risk highlights, open findings status, and loss event trends. Be specific — cite actual data points.',
    'examiner-view':
      'Generate a formal regulatory examination narrative suitable for a Report of Examination (ROE). Cover: risk profile rating, control environment assessment, management findings (MRAs/MRIAs), KRI monitoring effectiveness, and supervisory expectations. Use formal regulatory language.',
    'vendor-narrative':
      'Generate a third-party risk management assessment covering: vendor portfolio risk distribution, critical/high-risk vendor details, SLA performance issues, contract expiry concerns, and recommended actions. Reference specific vendors by name.',
    'risk-assessment':
      'Generate a comprehensive risk assessment narrative covering: top risk exposures by category, residual risk trends, control effectiveness gaps, emerging risk factors, and recommended mitigations. Reference specific risks by name and score.',
    'compliance-impact':
      'Analyze the current regulatory change landscape. For each pending change, assess: impact on existing controls, compliance gaps created, implementation timeline, resource requirements, and risk to the organization if not addressed.',
    'board-pack':
      'Generate an executive board pack outline covering: risk appetite utilization, top 5 risks, KRI dashboard summary, compliance program status, third-party risk highlights, loss event summary, and strategic risk outlook. Format for C-suite/Board consumption.',
  };

  const message = prompts[type] + (additionalContext ? `\n\nAdditional context: ${additionalContext}` : '');
  return sendChatMessage(message);
}

/**
 * Fallback to template engine when all LLM providers are unavailable
 */
function fallbackToTemplate(
  message: string,
  options?: { module?: string; entityId?: string },
  complexity?: Complexity
): AIServiceResponse {
  const response = templateEngine.generateCopilotResponse({
    module: options?.module || 'dashboard',
    entityId: options?.entityId,
    message,
  });

  return {
    response,
    source: 'template',
    providerName: 'Template Engine (Local)',
    complexity,
  };
}
