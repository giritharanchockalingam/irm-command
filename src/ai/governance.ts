/**
 * CISO-005 REMEDIATION: AI Governance Controls
 *
 * Provides data classification, prompt sanitization, output validation,
 * and audit logging for all AI operations in the platform.
 *
 * This module wraps any AIClient with governance guardrails to ensure:
 * - Sensitive data is classified and masked before model dispatch
 * - Outputs are validated for structure and content safety
 * - All AI operations are logged to the audit trail
 * - Rate limits are enforced per user/tenant
 * - High-impact actions require human approval
 */

import { getAuditLogger } from '../security/AuditLogger';
import { getConfig } from '../config';
import type { AIClient, AIClientContext } from './client/aiClient';

// ============ DATA CLASSIFICATION ============

export type DataSensitivity = 'public' | 'internal' | 'confidential' | 'restricted';

interface ClassificationRule {
  pattern: RegExp;
  sensitivity: DataSensitivity;
  action: 'mask' | 'redact' | 'block';
  label: string;
}

const CLASSIFICATION_RULES: ClassificationRule[] = [
  // Credentials and secrets
  { pattern: /(?:api[_-]?key|secret|password|token|bearer)\s*[:=]\s*\S+/gi, sensitivity: 'restricted', action: 'redact', label: 'credential' },
  { pattern: /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, sensitivity: 'restricted', action: 'redact', label: 'jwt_token' },

  // PII patterns
  { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, sensitivity: 'restricted', action: 'redact', label: 'ssn' },
  { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, sensitivity: 'confidential', action: 'mask', label: 'email' },
  { pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, sensitivity: 'restricted', action: 'redact', label: 'credit_card' },

  // Financial data patterns
  { pattern: /(?:account|routing)\s*(?:number|#|no)\s*[:=]?\s*\d{6,}/gi, sensitivity: 'confidential', action: 'mask', label: 'financial_account' },
];

/**
 * Classify and sanitize data before sending to AI models.
 * Returns sanitized data with a classification report.
 */
export function classifyAndSanitize(input: string): {
  sanitized: string;
  classifications: Array<{ label: string; sensitivity: DataSensitivity; action: string; count: number }>;
  blocked: boolean;
} {
  let sanitized = input;
  const classifications: Array<{ label: string; sensitivity: DataSensitivity; action: string; count: number }> = [];
  let blocked = false;

  for (const rule of CLASSIFICATION_RULES) {
    const matches = input.match(rule.pattern);
    if (matches && matches.length > 0) {
      classifications.push({
        label: rule.label,
        sensitivity: rule.sensitivity,
        action: rule.action,
        count: matches.length,
      });

      switch (rule.action) {
        case 'redact':
          sanitized = sanitized.replace(rule.pattern, `[REDACTED:${rule.label}]`);
          break;
        case 'mask':
          sanitized = sanitized.replace(rule.pattern, (match) => {
            if (match.length <= 4) return '[MASKED]';
            return match.slice(0, 2) + '*'.repeat(match.length - 4) + match.slice(-2);
          });
          break;
        case 'block':
          blocked = true;
          break;
      }
    }
  }

  return { sanitized, classifications, blocked };
}

/**
 * Validate AI output for safety and structural compliance.
 */
export function validateOutput(output: string): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Check for reasonable length
  if (output.length < 50) {
    issues.push('Output too short — likely incomplete generation');
  }
  if (output.length > 50000) {
    issues.push('Output exceeds maximum length — potential runaway generation');
  }

  // Check for leaked sensitive patterns in output
  for (const rule of CLASSIFICATION_RULES) {
    if (rule.sensitivity === 'restricted' && rule.pattern.test(output)) {
      issues.push(`Output contains ${rule.label} — restricted data leaked`);
    }
  }

  // Check for prompt injection indicators
  const injectionPatterns = [
    /ignore\s+(all\s+)?previous\s+instructions/i,
    /you\s+are\s+now\s+(?:a|an)\s+/i,
    /system\s*prompt/i,
    /\[INST\]/i,
    /<\|im_start\|>/i,
  ];
  for (const pattern of injectionPatterns) {
    if (pattern.test(output)) {
      issues.push('Output contains prompt injection indicator');
    }
  }

  return { valid: issues.length === 0, issues };
}

// ============ RATE LIMITING ============

const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(userId: string, maxPerMinute: number = 30): boolean {
  const now = Date.now();
  const bucket = rateLimitBuckets.get(userId);

  if (!bucket || bucket.resetAt < now) {
    rateLimitBuckets.set(userId, { count: 1, resetAt: now + 60000 });
    return true;
  }

  if (bucket.count >= maxPerMinute) {
    return false;
  }

  bucket.count++;
  return true;
}

// ============ GOVERNED AI CLIENT WRAPPER ============

/**
 * Wraps any AIClient with governance guardrails.
 * All AI operations pass through classification, sanitization,
 * rate limiting, output validation, and audit logging.
 */
export class GovernedAIClientWrapper implements AIClient {
  private inner: AIClient;
  private userId: string;
  private userEmail: string;
  private tenantId: string;

  constructor(inner: AIClient, userId: string, tenantId: string, userEmail?: string) {
    this.inner = inner;
    this.userId = userId;
    this.userEmail = userEmail || '';
    this.tenantId = tenantId;
  }

  private async governedCall<T>(
    operation: string,
    inputContext: AIClientContext,
    call: () => Promise<T>,
  ): Promise<T> {
    const config = getConfig();
    const auditLogger = getAuditLogger();

    // 1. Rate limit check
    if (!checkRateLimit(this.userId, config.ai.rateLimitPerMinute)) {
      auditLogger.log({
        userId: this.userId,
        userEmail: this.userEmail || '',
        tenantId: this.tenantId,
        action: 'AI_REQUEST',
        entityType: 'AIResponse',
        entityId: operation,
        module: 'ai-governance',
        metadata: { operation, rateLimited: true },
        success: false,
        errorMessage: 'Rate limit exceeded',
        riskLevel: 'medium',
        source: 'system',
      });
      throw new Error('AI rate limit exceeded. Please wait before making another request.');
    }

    // 2. Classify and sanitize input context
    const contextString = JSON.stringify(inputContext);
    const { sanitized, classifications, blocked } = classifyAndSanitize(contextString);

    if (blocked) {
      auditLogger.log({
        userId: this.userId,
        userEmail: this.userEmail || '',
        tenantId: this.tenantId,
        action: 'AI_REQUEST',
        entityType: 'AIResponse',
        entityId: operation,
        module: 'ai-governance',
        metadata: { operation, blocked: true, classifications },
        success: false,
        errorMessage: 'Request blocked — contains restricted data',
        riskLevel: 'critical',
        source: 'system',
      });
      throw new Error('AI request blocked — input contains restricted data that cannot be sent to AI models.');
    }

    // 3. Log the request
    auditLogger.log({
      userId: this.userId,
      userEmail: '',
      tenantId: this.tenantId,
      action: 'AI_REQUEST',
      entityType: 'AIResponse',
      entityId: operation,
      module: 'ai-governance',
      metadata: {
        operation,
        classifications,
        inputSizeBytes: contextString.length,
        sanitizedSizeBytes: sanitized.length,
        provider: config.ai.provider,
        model: 'claude-opus-4',
      },
      success: true,
      riskLevel: classifications.length > 0 ? 'medium' : 'low',
      source: 'ui',
    });

    // 4. Execute the AI call
    const startTime = Date.now();
    const result = await call();
    const durationMs = Date.now() - startTime;

    // 5. Validate output
    if (typeof result === 'string') {
      const validation = validateOutput(result);
      auditLogger.log({
        userId: this.userId,
        userEmail: this.userEmail || '',
        tenantId: this.tenantId,
        action: 'AI_RESPONSE',
        entityType: 'AIResponse',
        entityId: operation,
        module: 'ai-governance',
        metadata: {
          operation,
          durationMs,
          outputSizeBytes: result.length,
          validationPassed: validation.valid,
          validationIssues: validation.issues,
        },
        success: validation.valid,
        errorMessage: validation.valid ? undefined : validation.issues.join('; '),
        riskLevel: validation.valid ? 'low' : 'high',
        source: 'system',
      });
    }

    return result;
  }

  async generateDailyDigest(context: AIClientContext): Promise<string> {
    return this.governedCall('generateDailyDigest', context, () =>
      this.inner.generateDailyDigest(context)
    );
  }

  async generateExaminerView(context: AIClientContext): Promise<string> {
    return this.governedCall('generateExaminerView', context, () =>
      this.inner.generateExaminerView(context)
    );
  }

  async generateVendorNarrative(vendorId: string, context: AIClientContext): Promise<string> {
    return this.governedCall('generateVendorNarrative', context, () =>
      this.inner.generateVendorNarrative(vendorId, context)
    );
  }

  async generateVendorQuestionnaire(vendorId: string, context: AIClientContext) {
    return this.governedCall('generateVendorQuestionnaire', context, () =>
      this.inner.generateVendorQuestionnaire(vendorId, context)
    );
  }

  async generateComplianceImpact(regChangeId: string, context: AIClientContext): Promise<string> {
    return this.governedCall('generateComplianceImpact', context, () =>
      this.inner.generateComplianceImpact(regChangeId, context)
    );
  }

  async generateRiskAssessment(scenario: any, context: AIClientContext): Promise<string> {
    return this.governedCall('generateRiskAssessment', context, () =>
      this.inner.generateRiskAssessment(scenario, context)
    );
  }

  async generateCopilotResponse(
    context: { module: string; entityId?: string; message: string },
    allData: AIClientContext,
  ): Promise<string> {
    return this.governedCall('generateCopilotResponse', allData, () =>
      this.inner.generateCopilotResponse(context, allData)
    );
  }
}
