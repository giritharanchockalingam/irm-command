/**
 * AIClient abstraction layer
 * Provides a unified interface for AI-powered narrative generation
 * Supports both local template-based and Claude-governed implementations
 */

export interface AIClientContext {
  risks?: any[];
  controls?: any[];
  issues?: any[];
  vendors?: any[];
  kris?: any[];
  lossEvents?: any[];
  regulatoryChanges?: any[];
  alerts?: any[];
  [key: string]: any;
}

export interface VendorQuestionnaireItem {
  category: string;
  question: string;
}

export interface AIClient {
  /**
   * Generate a daily risk posture digest narrative
   * Returns OCC/FDIC-style executive summary (3-4 paragraphs)
   */
  generateDailyDigest(context: AIClientContext): Promise<string>;

  /**
   * Generate an examiner-style assessment narrative
   * Suitable for inclusion in Report of Examination (ROE)
   */
  generateExaminerView(context: AIClientContext): Promise<string>;

  /**
   * Generate a TPRM assessment narrative for a specific vendor
   */
  generateVendorNarrative(vendorId: string, context: AIClientContext): Promise<string>;

  /**
   * Generate exam-calibrated due diligence questions for a vendor
   * Returns array of category-grouped questions
   */
  generateVendorQuestionnaire(
    vendorId: string,
    context: AIClientContext
  ): Promise<VendorQuestionnaireItem[]>;

  /**
   * Generate regulatory impact analysis narrative
   */
  generateComplianceImpact(
    regChangeId: string,
    context: AIClientContext
  ): Promise<string>;

  /**
   * Generate OCC/FDIC-style risk assessment narrative
   */
  generateRiskAssessment(scenario: any, context: AIClientContext): Promise<string>;

  /**
   * Main copilot response handler
   * Routes context-aware requests to appropriate narratives or FAQ responses
   */
  generateCopilotResponse(
    context: {
      module: string;
      entityId?: string;
      message: string;
    },
    allData: AIClientContext
  ): Promise<string>;
}

// ============================================================================
// LocalTemplateAIClient: Deterministic template-based implementation
// ============================================================================

import { TemplateEngine } from "../local/templateEngine";
import type { Risk, Control, Issue, Vendor, KRI, LossEvent, RegulatorChange } from "../../domain/types";

export class LocalTemplateAIClient implements AIClient {
  private templateEngine: TemplateEngine;

  constructor(context?: {
    risks?: Risk[];
    controls?: Control[];
    issues?: Issue[];
    vendors?: Vendor[];
    kris?: KRI[];
    lossEvents?: LossEvent[];
    regulatoryChanges?: RegulatorChange[];
  }) {
    // Initialize template engine with provided context or empty defaults
    this.templateEngine = new TemplateEngine({
      risks: context?.risks || [],
      controls: context?.controls || [],
      issues: context?.issues || [],
      vendors: context?.vendors || [],
      kris: context?.kris || [],
      lossEvents: context?.lossEvents || [],
      regulatoryChanges: context?.regulatoryChanges || [],
      timestamp: new Date(),
    });
  }

  async generateDailyDigest(context: AIClientContext): Promise<string> {
    return Promise.resolve(
      this.templateEngine.generateDailyDigest(
        context.risks || [],
        context.kris || [],
        context.issues || [],
        context.vendors || [],
        context.lossEvents || []
      )
    );
  }

  async generateExaminerView(context: AIClientContext): Promise<string> {
    return Promise.resolve(
      this.templateEngine.generateExaminerView(
        context.risks || [],
        context.controls || [],
        context.issues || [],
        context.kris || []
      )
    );
  }

  async generateVendorNarrative(
    vendorId: string,
    context: AIClientContext
  ): Promise<string> {
    const vendor = context.vendors?.find((v: any) => v.id === vendorId);
    if (!vendor) {
      return Promise.reject(new Error(`Vendor ${vendorId} not found`));
    }

    return Promise.resolve(
      this.templateEngine.generateVendorNarrative(
        vendor,
        context.controls || [],
        context.alerts || []
      )
    );
  }

  async generateVendorQuestionnaire(
    vendorId: string,
    context: AIClientContext
  ): Promise<VendorQuestionnaireItem[]> {
    const vendor = context.vendors?.find((v: any) => v.id === vendorId);
    if (!vendor) {
      return Promise.reject(new Error(`Vendor ${vendorId} not found`));
    }

    return Promise.resolve(
      this.templateEngine.generateVendorQuestionnaire(vendor)
    );
  }

  async generateComplianceImpact(
    regChangeId: string,
    context: AIClientContext
  ): Promise<string> {
    const regChange = context.regulatoryChanges?.find(
      (r: any) => r.id === regChangeId
    );
    if (!regChange) {
      return Promise.reject(
        new Error(`Regulatory change ${regChangeId} not found`)
      );
    }

    return Promise.resolve(
      this.templateEngine.generateComplianceImpact(
        regChange,
        context.controls || [],
        context.risks || []
      )
    );
  }

  async generateRiskAssessment(
    scenario: any,
    context: AIClientContext
  ): Promise<string> {
    return Promise.resolve(this.templateEngine.generateRiskAssessment(scenario));
  }

  async generateCopilotResponse(
    context: {
      module: string;
      entityId?: string;
      message: string;
    },
    allData: AIClientContext
  ): Promise<string> {
    return Promise.resolve(
      this.templateEngine.generateCopilotResponse(context, allData)
    );
  }
}

// ============================================================================
// ClaudeGovernedAIClient: Blueprint for Claude-integrated implementation
// ============================================================================

/**
 * ClaudeGovernedAIClient demonstrates the planned architecture for
 * Claude-integrated narrative generation.
 *
 * This implementation is currently a stub showing the API structure.
 * When enabled, it will delegate narrative generation to Claude API calls
 * with appropriate governance controls:
 *
 * - Prompt engineering for regulatory tone (OCC/FDIC/Basel III)
 * - Context windowing to manage token usage
 * - Semantic validation to ensure outputs match expected structure
 * - Audit logging of all AI-generated content
 * - Human review workflows for sensitive narratives
 * - Caching of frequently-requested narratives
 *
 * Future implementation considerations:
 * - Integration with Claude API (claude-opus-4 or similar)
 * - Rate limiting and quota management
 * - Streaming support for real-time narrative generation
 * - Fine-tuning on regulatory corpora
 * - Multi-turn dialogue for iterative refinement
 * - Fallback to LocalTemplateAIClient on API failure
 */
export class ClaudeGovernedAIClient implements AIClient {
  private apiKey?: string;
  private model: string = "claude-opus-4";
  private fallbackClient: LocalTemplateAIClient;

  constructor(options?: {
    apiKey?: string;
    model?: string;
    fallbackContext?: AIClientContext;
  }) {
    this.apiKey = options?.apiKey;
    this.model = options?.model || this.model;
    this.fallbackClient = new LocalTemplateAIClient(
      options?.fallbackContext as any
    );
  }

  /**
   * Future implementation will call Claude API with:
   * - Regulatory domain instructions
   * - Current risk context
   * - Governance guardrails
   * - Output validation
   */
  async generateDailyDigest(context: AIClientContext): Promise<string> {
    // Stub: Currently falls back to template client
    console.warn(
      "ClaudeGovernedAIClient.generateDailyDigest not yet implemented, using fallback"
    );
    return this.fallbackClient.generateDailyDigest(context);
  }

  async generateExaminerView(context: AIClientContext): Promise<string> {
    // Stub: Currently falls back to template client
    console.warn(
      "ClaudeGovernedAIClient.generateExaminerView not yet implemented, using fallback"
    );
    return this.fallbackClient.generateExaminerView(context);
  }

  async generateVendorNarrative(
    vendorId: string,
    context: AIClientContext
  ): Promise<string> {
    // Stub: Currently falls back to template client
    console.warn(
      "ClaudeGovernedAIClient.generateVendorNarrative not yet implemented, using fallback"
    );
    return this.fallbackClient.generateVendorNarrative(vendorId, context);
  }

  async generateVendorQuestionnaire(
    vendorId: string,
    context: AIClientContext
  ): Promise<VendorQuestionnaireItem[]> {
    // Stub: Currently falls back to template client
    console.warn(
      "ClaudeGovernedAIClient.generateVendorQuestionnaire not yet implemented, using fallback"
    );
    return this.fallbackClient.generateVendorQuestionnaire(vendorId, context);
  }

  async generateComplianceImpact(
    regChangeId: string,
    context: AIClientContext
  ): Promise<string> {
    // Stub: Currently falls back to template client
    console.warn(
      "ClaudeGovernedAIClient.generateComplianceImpact not yet implemented, using fallback"
    );
    return this.fallbackClient.generateComplianceImpact(regChangeId, context);
  }

  async generateRiskAssessment(
    scenario: any,
    context: AIClientContext
  ): Promise<string> {
    // Stub: Currently falls back to template client
    console.warn(
      "ClaudeGovernedAIClient.generateRiskAssessment not yet implemented, using fallback"
    );
    return this.fallbackClient.generateRiskAssessment(scenario, context);
  }

  async generateCopilotResponse(
    context: {
      module: string;
      entityId?: string;
      message: string;
    },
    allData: AIClientContext
  ): Promise<string> {
    // Stub: Currently falls back to template client
    console.warn(
      "ClaudeGovernedAIClient.generateCopilotResponse not yet implemented, using fallback"
    );
    return this.fallbackClient.generateCopilotResponse(context, allData);
  }

  /**
   * When implemented, this method will handle Claude API communication
   * with governance guardrails.
   *
   * Pseudocode for future implementation:
   *
   * private async callClaudeWithGovernance(prompt: string, context: AIClientContext): Promise<string> {
   *   // 1. Validate API key and rate limits
   *   if (!this.apiKey) throw new Error("Claude API key not configured");
   *   if (!this.checkRateLimit()) throw new Error("API rate limit exceeded");
   *
   *   // 2. Build system prompt with regulatory domain instructions
   *   const systemPrompt = `You are a GRC expert assisting with regulatory narratives.
   *     Generate content in OCC/FDIC exam style. Reference specific data. Be concise.`;
   *
   *   // 3. Call Claude API
   *   const response = await fetch("https://api.anthropic.com/v1/messages", {
   *     method: "POST",
   *     headers: { "x-api-key": this.apiKey },
   *     body: JSON.stringify({
   *       model: this.model,
   *       max_tokens: 2048,
   *       system: systemPrompt,
   *       messages: [{ role: "user", content: prompt }]
   *     })
   *   });
   *
   *   // 4. Validate semantic structure
   *   const result = await response.json();
   *   const narrative = result.content[0].text;
   *   if (!this.validateNarrativeStructure(narrative)) {
   *     console.error("Claude output failed validation, using fallback");
   *     return this.fallbackClient.generateDailyDigest(context);
   *   }
   *
   *   // 5. Audit log the generation
   *   await this.auditLog("narrative_generated", { model: this.model, prompt: prompt });
   *
   *   return narrative;
   * }
   *
   * private validateNarrativeStructure(text: string): boolean {
   *   // Check for required sections, regulatory tone, data references
   *   return text.length > 300 && text.includes("risk") && text.includes("control");
   * }
   *
   * private async auditLog(event: string, data: any): Promise<void> {
   *   // Log all AI-generated content for compliance audit trail
   *   console.log(`[AUDIT] ${event}`, data);
   * }
   */
}

/**
 * Factory function to create appropriate AIClient based on configuration
 */
export function createAIClient(options?: {
  provider?: "local" | "claude";
  apiKey?: string;
  model?: string;
  context?: AIClientContext;
}): AIClient {
  const provider = options?.provider || "local";

  if (provider === "claude") {
    return new ClaudeGovernedAIClient({
      apiKey: options?.apiKey,
      model: options?.model,
      fallbackContext: options?.context,
    });
  }

  return new LocalTemplateAIClient(options?.context as any);
}
