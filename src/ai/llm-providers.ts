/**
 * Client-side LLM Provider Abstraction with Circuit Breaker
 * Adapted for browser-only operation (IRM Sentinel)
 * Routes to appropriate provider based on complexity, with graceful fallback to local TemplateEngine
 */

/**
 * Available LLM provider types
 */
export type LLMProvider = 'claude' | 'openai' | 'groq' | 'local';

/**
 * Query complexity levels
 */
export type ComplexityLevel = 'simple' | 'medium' | 'complex';

/**
 * LLM Provider configuration
 */
export interface LLMConfig {
  provider: LLMProvider;
  model: string;
  maxTokens: number;
  description: string;
  apiKeyEnvVar: string;
}

/**
 * Circuit breaker state tracking per provider
 */
export interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  isOpen: boolean;
}

/**
 * Provider-specific configurations
 */
export const PROVIDER_CONFIGS: Record<LLMProvider, LLMConfig> = {
  claude: {
    provider: 'claude',
    model: 'claude-sonnet-4-5-20250929',
    maxTokens: 2048,
    description: 'Complex reasoning for multi-domain GRC queries',
    apiKeyEnvVar: 'VITE_ANTHROPIC_API_KEY',
  },
  openai: {
    provider: 'openai',
    model: 'gpt-4o',
    maxTokens: 1024,
    description: 'Medium complexity analysis and synthesis',
    apiKeyEnvVar: 'VITE_OPENAI_API_KEY',
  },
  groq: {
    provider: 'groq',
    model: 'llama-3.3-70b-versatile',
    maxTokens: 1024,
    description: 'Fast simple lookups and definitions',
    apiKeyEnvVar: 'VITE_GROQ_API_KEY',
  },
  local: {
    provider: 'local',
    model: 'template-engine-v1',
    maxTokens: Number.MAX_SAFE_INTEGER,
    description: 'Deterministic local template engine (always available)',
    apiKeyEnvVar: '',
  },
};

/**
 * Circuit Breaker for managing provider availability and failures
 */
export class CircuitBreaker {
  private failureThreshold: number = 3;
  private resetTimeoutMs: number = 30000;
  private states: Map<LLMProvider, CircuitBreakerState> = new Map();

  constructor() {
    // Initialize circuit breaker state for each provider
    const providers: LLMProvider[] = ['claude', 'openai', 'groq', 'local'];
    providers.forEach((provider) => {
      this.states.set(provider, {
        failures: 0,
        lastFailure: 0,
        isOpen: false,
      });
    });
  }

  /**
   * Record a failure for a provider
   */
  recordFailure(provider: LLMProvider): void {
    const state = this.states.get(provider) || {
      failures: 0,
      lastFailure: 0,
      isOpen: false,
    };

    state.failures += 1;
    state.lastFailure = Date.now();

    if (state.failures >= this.failureThreshold) {
      state.isOpen = true;
      console.warn(`Circuit breaker opened for provider: ${provider}`);
    }

    this.states.set(provider, state);
  }

  /**
   * Record a success for a provider
   */
  recordSuccess(provider: LLMProvider): void {
    const state = this.states.get(provider);
    if (state) {
      state.failures = 0;
      state.isOpen = false;
      this.states.set(provider, state);
    }
  }

  /**
   * Check if a provider is available (circuit not open or timeout expired)
   */
  isAvailable(provider: LLMProvider): boolean {
    const state = this.states.get(provider);
    if (!state) {
      return true;
    }

    // If circuit is open, check if reset timeout has expired
    if (state.isOpen) {
      const timeSinceLastFailure = Date.now() - state.lastFailure;
      if (timeSinceLastFailure >= this.resetTimeoutMs) {
        // Reset the circuit
        state.failures = 0;
        state.isOpen = false;
        this.states.set(provider, state);
        return true;
      }
      return false;
    }

    return true;
  }

  /**
   * Get current state of a provider's circuit breaker
   */
  getState(provider: LLMProvider): CircuitBreakerState | undefined {
    return this.states.get(provider);
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    this.states.forEach((state) => {
      state.failures = 0;
      state.isOpen = false;
      state.lastFailure = 0;
    });
  }
}

// Global circuit breaker instance
const circuitBreaker = new CircuitBreaker();

/**
 * Select the appropriate LLM provider based on complexity level
 * @param complexity Query complexity level
 * @returns Selected provider
 */
export function selectProvider(complexity: ComplexityLevel): LLMProvider {
  switch (complexity) {
    case 'simple':
      return 'groq';
    case 'medium':
      return 'openai';
    case 'complex':
      return 'claude';
    default:
      return 'local';
  }
}

/**
 * Get configuration for a specific provider
 * @param provider Provider type
 * @returns Provider configuration
 */
export function getProviderConfig(provider: LLMProvider): LLMConfig {
  return PROVIDER_CONFIGS[provider];
}

/**
 * Get fallback chain for a preferred provider
 * Fallback order: preferred -> local
 * @param preferred Preferred provider
 * @returns Ordered list of providers to try
 */
export function getFallbackChain(preferred: LLMProvider): LLMProvider[] {
  const primaryOrder: LLMProvider[] = ['claude', 'openai', 'groq'];

  // If preferred is not in primary order (e.g., already 'local'), return just local
  if (!primaryOrder.includes(preferred)) {
    return ['local'];
  }

  // Get all providers and reorder with preferred first
  const all: LLMProvider[] = [...primaryOrder, 'local'];
  const fallback = all.filter((p) => p !== preferred);

  return [preferred, ...fallback];
}

/**
 * Check if a provider is configured (has API key available)
 * In browser context, only 'local' is always configured
 * External providers would need backend API integration
 * @param provider Provider type
 * @returns True if provider is configured
 */
export function isProviderConfigured(provider: LLMProvider): boolean {
  // In browser-only mode, only 'local' provider is always available
  if (provider === 'local') {
    return true;
  }

  // External providers would check for API keys via environment variables
  // In a real scenario with backend, this would check if the provider is enabled
  // For now, all external providers return false (not configured in browser)
  const config = getProviderConfig(provider);
  const apiKey =
    typeof window !== 'undefined'
      ? (window as any)[config.apiKeyEnvVar] ||
        import.meta.env[config.apiKeyEnvVar]
      : null;

  return !!apiKey;
}

/**
 * Stub function to call an LLM provider
 * In production, this would make actual API calls
 * For now, returns null and logs fallback chain
 * @param provider Provider to call
 * @param prompt Message prompt
 * @param maxTokens Token limit
 * @returns Promise with response or null (fallback to TemplateEngine)
 */
export async function callLLM(
  provider: LLMProvider,
  prompt: string,
  maxTokens?: number
): Promise<string | null> {
  // Check if provider is available (circuit breaker)
  if (!circuitBreaker.isAvailable(provider)) {
    console.warn(
      `Provider ${provider} circuit breaker is open, using fallback`
    );
    return null;
  }

  // Check if provider is configured
  if (!isProviderConfigured(provider)) {
    console.debug(
      `Provider ${provider} is not configured, attempting fallback chain`
    );

    // Get fallback chain and try next provider
    const chain = getFallbackChain(provider);
    if (chain.length > 1) {
      const nextProvider = chain[1];
      console.debug(`Falling back to provider: ${nextProvider}`);
      return callLLM(nextProvider, prompt, maxTokens);
    }

    // Ultimate fallback to local
    console.debug('All external providers unavailable, using local engine');
    return null;
  }

  try {
    const config = getProviderConfig(provider);
    const tokens = maxTokens || config.maxTokens;

    // Log provider selection attempt
    console.debug(
      `Attempting to call ${provider} (${config.model}) with ${tokens} max tokens`
    );

    // Stub: In production, this would make actual API calls
    // For now, return null to use TemplateEngine
    console.debug(
      `[Stub] Would call ${provider} API for prompt: "${prompt.substring(0, 50)}..."`
    );

    // Record success (stub call is considered successful)
    circuitBreaker.recordSuccess(provider);

    return null; // Caller will use TemplateEngine as fallback
  } catch (error) {
    console.error(`Error calling provider ${provider}:`, error);
    circuitBreaker.recordFailure(provider);

    // Try fallback chain
    const chain = getFallbackChain(provider);
    if (chain.length > 1) {
      const nextProvider = chain[1];
      console.debug(`Provider ${provider} failed, falling back to ${nextProvider}`);
      return callLLM(nextProvider, prompt, maxTokens);
    }

    return null;
  }
}

