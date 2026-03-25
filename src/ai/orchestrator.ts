/**
 * Client-side AI Orchestrator for IRM Command GRC Platform
 * Adapted from supply-chain-platform pattern for browser-only operation
 * Routes queries by domain detection, complexity estimation, and provider selection
 */

import { TemplateEngine } from './local/templateEngine';
import { searchKnowledge, formatKnowledgeForContext } from './knowledge-service';
import { getIRMToolServer } from './mcp/irm-tools';
import { selectProvider } from './llm-providers';

/**
 * GRC Domain Keywords
 */
const RISK_KEYWORDS = [
  'risk',
  'threat',
  'vulnerability',
  'impact',
  'likelihood',
  'inherent',
  'residual',
  'appetite',
  'mitigation',
  'kri',
  'indicator',
  'loss event',
  'scenario',
];

const COMPLIANCE_KEYWORDS = [
  'compliance',
  'control',
  'framework',
  'sox',
  'gdpr',
  'nist',
  'iso',
  'basel',
  'occ',
  'fdic',
  'regulatory',
  'policy',
  'gap',
  'mapping',
];

const VENDOR_KEYWORDS = [
  'vendor',
  'third party',
  'tprm',
  'supplier',
  'sla',
  'due diligence',
  'concentration',
  'tier',
];

const AUDIT_KEYWORDS = [
  'audit',
  'finding',
  'mra',
  'mria',
  'examiner',
  'examination',
  'evidence',
  'attestation',
  'deficiency',
];

const SOC2_KEYWORDS = [
  'soc 2',
  'soc2',
  'trust services',
  'availability',
  'confidentiality',
  'security criteria',
  'control register',
];

const KNOWLEDGE_KEYWORDS = [
  'how',
  'what is',
  'explain',
  'define',
  'help',
  'guide',
  'procedure',
  'process',
];

/**
 * Domain types detected in GRC context
 */
export type GRCDomain =
  | 'risk'
  | 'compliance'
  | 'vendor'
  | 'audit'
  | 'soc2'
  | 'knowledge';

/**
 * Orchestrator request interface
 */
export interface OrchestratorRequest {
  message: string;
  conversationHistory?: Array<{ role: string; content: string }>;
  context?: {
    currentPage?: string;
    selectedEntityId?: string;
    selectedEntityType?: string;
  };
}

/**
 * Orchestrator response interface
 */
export interface OrchestratorResponse {
  message: string;
  domain: GRCDomain[];
  complexity: 'simple' | 'medium' | 'complex';
  provider: string;
  toolsUsed: string[];
  ragUsed: boolean;
  ragSources?: string[];
  timestamp: Date;
}

/**
 * Detect GRC domains from user message
 * @param message User query
 * @returns Array of detected domains
 */
export function detectDomains(message: string): GRCDomain[] {
  const lowerMessage = message.toLowerCase();
  const domains: GRCDomain[] = [];

  if (RISK_KEYWORDS.some((kw) => lowerMessage.includes(kw))) {
    domains.push('risk');
  }
  if (COMPLIANCE_KEYWORDS.some((kw) => lowerMessage.includes(kw))) {
    domains.push('compliance');
  }
  if (VENDOR_KEYWORDS.some((kw) => lowerMessage.includes(kw))) {
    domains.push('vendor');
  }
  if (AUDIT_KEYWORDS.some((kw) => lowerMessage.includes(kw))) {
    domains.push('audit');
  }
  if (SOC2_KEYWORDS.some((kw) => lowerMessage.includes(kw))) {
    domains.push('soc2');
  }
  if (KNOWLEDGE_KEYWORDS.some((kw) => lowerMessage.includes(kw))) {
    domains.push('knowledge');
  }

  return domains.length > 0 ? domains : ['knowledge'];
}

/**
 * Estimate query complexity based on domain detection and linguistic features
 * @param message User query
 * @param domains Detected domains
 * @returns Complexity level
 */
export function estimateComplexity(
  message: string,
  domains: GRCDomain[]
): 'simple' | 'medium' | 'complex' {
  let score = 0;
  const lowerMessage = message.toLowerCase();

  // Domain count scoring
  score += Math.max(0, domains.length - 1) * 2;

  // Multi-framework reference scoring
  const frameworks = ['nist', 'iso', 'sox', 'gdpr', 'basel', 'coso'];
  const frameworkCount = frameworks.filter((fw) =>
    lowerMessage.includes(fw)
  ).length;
  if (frameworkCount > 1) {
    score += 3;
  }

  // Analytics/comparison words scoring
  const analyticsWords = ['compare', 'analysis', 'trend', 'correlation', 'vs'];
  analyticsWords.forEach((word) => {
    if (lowerMessage.includes(word)) {
      score += 2;
    }
  });

  // Complex operations scoring
  const complexOps = [
    'gap analysis',
    'risk assessment',
    'what-if',
    'root cause',
    'impact',
    'scenario',
  ];
  complexOps.forEach((op) => {
    if (lowerMessage.includes(op)) {
      score += 3;
    }
  });

  // Determine complexity level
  if (score <= 2) {
    return 'simple';
  } else if (score <= 5) {
    return 'medium';
  } else {
    return 'complex';
  }
}

/**
 * Main orchestration function
 * Routes the query through domain detection, complexity estimation, and provider selection
 * @param request Orchestrator request
 * @returns Orchestrator response
 */
export async function orchestrate(
  request: OrchestratorRequest
): Promise<OrchestratorResponse> {
  const { message, conversationHistory, context } = request;
  const timestamp = new Date();

  // Step 1: Detect domains
  const domains = detectDomains(message);

  // Step 2: Estimate complexity
  const complexity = estimateComplexity(message, domains);

  // Step 3: Select provider (routing decision)
  const provider = selectProvider(complexity);

  // Step 4: Determine tools and RAG usage
  const toolsUsed: string[] = [];
  let ragUsed = false;
  let ragSources: string[] | undefined;

  const requiresRAG = domains.includes('knowledge');

  // Step 5: RAG knowledge service call if needed
  if (requiresRAG) {
    try {
      const results = searchKnowledge(message);
      if (results && results.length > 0) {
        ragUsed = true;
        ragSources = results.map((r) => r.section.title);
      }
    } catch (error) {
      console.warn('Knowledge service query failed:', error);
    }
  }

  // Step 6: Route to MCP tool server for data operations
  if (
    domains.includes('risk') ||
    domains.includes('compliance') ||
    domains.includes('vendor') ||
    domains.includes('audit') ||
    domains.includes('soc2')
  ) {
    try {
      const irmToolServer = getIRMToolServer();
      const availableTools = irmToolServer.listTools().map((t) => t.name);
      toolsUsed.push(...availableTools.slice(0, 3)); // Use relevant tools
    } catch (error) {
      console.warn('IRM tools initialization failed:', error);
    }
  }

  // Step 7: Generate response using TemplateEngine
  // Provider decision tells us which model would be used in production
  // For now, we use the local TemplateEngine for all responses
  const templateEngine = new TemplateEngine();
  const primaryDomain = domains[0] || 'knowledge';
  const moduleMap: Record<string, string> = {
    risk: 'dashboard',
    compliance: 'compliance',
    vendor: 'tprm',
    audit: 'dashboard',
    soc2: 'control-register',
    knowledge: 'general',
  };
  const module = moduleMap[primaryDomain] || 'general';

  // Build context string from RAG results if available
  let knowledgeContext = '';
  if (ragUsed && ragSources && ragSources.length > 0) {
    const results = searchKnowledge(message);
    knowledgeContext = formatKnowledgeForContext(results.map((r) => r.section));
  }

  const generatedMessage = templateEngine.generateCopilotResponse({
    module,
    message: knowledgeContext ? `${message}\n\n[Knowledge Context]\n${knowledgeContext}` : message,
  });

  // Step 8: Compile and return response with full metadata
  return {
    message: generatedMessage || message,
    domain: domains,
    complexity,
    provider,
    toolsUsed,
    ragUsed,
    ragSources,
    timestamp,
  };
}

