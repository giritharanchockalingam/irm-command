import { Risk, Control, Vendor, Issue, KRI, LossEvent, RegulatoryChange, MonitoringAlert } from '../../domain/types';
import { TemplateEngine } from '../local/templateEngine';
import { getConfig } from '../../config';
import { getAuditLogger } from '../../security/AuditLogger';
import { getTelemetry } from '../../telemetry';

// Structured context for every AI call
export interface AICallContext {
  userId: string;
  tenantId: string;
  module: string;
  action: string;
  entityType?: string;
  entityId?: string;
  timestamp: Date;
}

// AI client interface - the boundary between IRM Command and the AI layer
export interface AIGovernanceClient {
  generateDailyDigest(
    context: AICallContext,
    data: {
      risks: Risk[];
      kris: KRI[];
      issues: Issue[];
      vendors: Vendor[];
      lossEvents: LossEvent[];
    }
  ): Promise<string>;
  generateExaminerView(
    context: AICallContext,
    data: {
      risks: Risk[];
      controls: Control[];
      issues: Issue[];
      kris: KRI[];
    }
  ): Promise<string>;
  generateVendorNarrative(
    context: AICallContext,
    vendor: Vendor,
    controls: Control[],
    alerts: MonitoringAlert[]
  ): Promise<string>;
  generateVendorQuestionnaire(
    context: AICallContext,
    vendor: Vendor
  ): Promise<Array<{ category: string; question: string }>>;
  generateComplianceImpact(
    context: AICallContext,
    regChange: RegulatoryChange,
    controls: Control[],
    risks: Risk[]
  ): Promise<string>;
  generateRiskAssessment(context: AICallContext, scenario: Record<string, unknown>): Promise<string>;
  generateCopilotResponse(context: AICallContext, message: string): Promise<string>;
}

// Implementation 1: Local deterministic templates (current prototype)
export class LocalTemplateAIClient implements AIGovernanceClient {
  private engine = new TemplateEngine();

  async generateDailyDigest(
    context: AICallContext,
    data: {
      risks: Risk[];
      kris: KRI[];
      issues: Issue[];
      vendors: Vendor[];
      lossEvents: LossEvent[];
    }
  ): Promise<string> {
    this.logAICall(context, 'generateDailyDigest');
    return this.engine.generateDailyDigest(
      data.risks,
      data.kris,
      data.issues,
      data.vendors,
      data.lossEvents
    );
  }

  async generateExaminerView(
    context: AICallContext,
    data: {
      risks: Risk[];
      controls: Control[];
      issues: Issue[];
      kris: KRI[];
    }
  ): Promise<string> {
    this.logAICall(context, 'generateExaminerView');
    return this.engine.generateExaminerView(data.risks, data.controls, data.issues, data.kris);
  }

  async generateVendorNarrative(
    context: AICallContext,
    vendor: Vendor,
    controls: Control[],
    alerts: MonitoringAlert[]
  ): Promise<string> {
    this.logAICall(context, 'generateVendorNarrative');
    return this.engine.generateVendorNarrative(vendor, controls, alerts);
  }

  async generateVendorQuestionnaire(
    context: AICallContext,
    vendor: Vendor
  ): Promise<Array<{ category: string; question: string }>> {
    this.logAICall(context, 'generateVendorQuestionnaire');
    return this.engine.generateVendorQuestionnaire(vendor);
  }

  async generateComplianceImpact(
    context: AICallContext,
    regChange: RegulatoryChange,
    controls: Control[],
    risks: Risk[]
  ): Promise<string> {
    this.logAICall(context, 'generateComplianceImpact');
    return this.engine.generateComplianceImpact(regChange, controls, risks);
  }

  async generateRiskAssessment(
    context: AICallContext,
    scenario: Record<string, unknown>
  ): Promise<string> {
    this.logAICall(context, 'generateRiskAssessment');
    return this.engine.generateRiskAssessment(scenario);
  }

  async generateCopilotResponse(context: AICallContext, message: string): Promise<string> {
    this.logAICall(context, 'generateCopilotResponse');
    return this.engine.generateCopilotResponse(message);
  }

  private logAICall(context: AICallContext, method: string): void {
    getAuditLogger().log({
      userId: context.userId,
      userEmail: '',
      tenantId: context.tenantId,
      action: 'AI_REQUEST',
      entityType: 'AIResponse',
      entityId: `${method}-${Date.now()}`,
      module: context.module,
      metadata: {
        method,
        action: context.action,
        entityType: context.entityType,
        entityId: context.entityId,
      },
      success: true,
    });
    getTelemetry().trackEvent('ai_call', { method, module: context.module });
  }
}

// Implementation 2: Stub for future Claude governed service
export class StubGovernedAIClient implements AIGovernanceClient {
  private fallback = new LocalTemplateAIClient();

  // Simulates a governed API call shape
  // In production, this would call: POST /api/ai/{method} with context + data
  // The governance service would then: enforce policies, build prompt, call Claude, post-process, return

  async generateDailyDigest(
    context: AICallContext,
    data: {
      risks: Risk[];
      kris: KRI[];
      issues: Issue[];
      vendors: Vendor[];
      lossEvents: LossEvent[];
    }
  ): Promise<string> {
    getTelemetry().trackEvent('governed_ai_call', {
      method: 'generateDailyDigest',
      simulated: true,
    });
    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, 200));
    // Fall back to local for now
    return this.fallback.generateDailyDigest(context, data);
  }

  async generateExaminerView(
    context: AICallContext,
    data: {
      risks: Risk[];
      controls: Control[];
      issues: Issue[];
      kris: KRI[];
    }
  ): Promise<string> {
    getTelemetry().trackEvent('governed_ai_call', {
      method: 'generateExaminerView',
      simulated: true,
    });
    await new Promise(resolve => setTimeout(resolve, 200));
    return this.fallback.generateExaminerView(context, data);
  }

  async generateVendorNarrative(
    context: AICallContext,
    vendor: Vendor,
    controls: Control[],
    alerts: MonitoringAlert[]
  ): Promise<string> {
    getTelemetry().trackEvent('governed_ai_call', {
      method: 'generateVendorNarrative',
      simulated: true,
    });
    await new Promise(resolve => setTimeout(resolve, 200));
    return this.fallback.generateVendorNarrative(context, vendor, controls, alerts);
  }

  async generateVendorQuestionnaire(
    context: AICallContext,
    vendor: Vendor
  ): Promise<Array<{ category: string; question: string }>> {
    getTelemetry().trackEvent('governed_ai_call', {
      method: 'generateVendorQuestionnaire',
      simulated: true,
    });
    await new Promise(resolve => setTimeout(resolve, 200));
    return this.fallback.generateVendorQuestionnaire(context, vendor);
  }

  async generateComplianceImpact(
    context: AICallContext,
    regChange: RegulatoryChange,
    controls: Control[],
    risks: Risk[]
  ): Promise<string> {
    getTelemetry().trackEvent('governed_ai_call', {
      method: 'generateComplianceImpact',
      simulated: true,
    });
    await new Promise(resolve => setTimeout(resolve, 200));
    return this.fallback.generateComplianceImpact(context, regChange, controls, risks);
  }

  async generateRiskAssessment(
    context: AICallContext,
    scenario: Record<string, unknown>
  ): Promise<string> {
    getTelemetry().trackEvent('governed_ai_call', {
      method: 'generateRiskAssessment',
      simulated: true,
    });
    await new Promise(resolve => setTimeout(resolve, 200));
    return this.fallback.generateRiskAssessment(context, scenario);
  }

  async generateCopilotResponse(context: AICallContext, message: string): Promise<string> {
    getTelemetry().trackEvent('governed_ai_call', {
      method: 'generateCopilotResponse',
      simulated: true,
    });
    await new Promise(resolve => setTimeout(resolve, 200));
    return this.fallback.generateCopilotResponse(context, message);
  }
}

// Factory
export function createAIClient(): AIGovernanceClient {
  const config = getConfig();
  if (config.features.enableGovernedAI && config.ai.provider === 'claude-governed') {
    return new StubGovernedAIClient();
  }
  return new LocalTemplateAIClient();
}

// Singleton
let client: AIGovernanceClient | null = null;
export function getAIClient(): AIGovernanceClient {
  if (!client) client = createAIClient();
  return client;
}
