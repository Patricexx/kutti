import { BaseProvider, ProviderInfo, ModelInfo, ChatMessage, ChatResponse, StreamChunk, ProviderConfig } from './base';
import { OpenAIProvider } from './openai';
import { AnthropicProvider } from './anthropic';
import { GroqProvider } from './groq';
import { GeminiProvider } from './gemini';

/**
 * Global provider registry
 */
class ProviderRegistry {
  private providers: Map<string, typeof BaseProvider> = new Map();
  private instances: Map<string, BaseProvider> = new Map();

  constructor() {
    // Register built-in providers
    this.register('openai', OpenAIProvider);
    this.register('anthropic', AnthropicProvider);
    this.register('groq', GroqProvider);
    this.register('gemini', GeminiProvider);
  }

  /**
   * Register a provider class
   */
  register(name: string, providerClass: typeof BaseProvider): void {
    this.providers.set(name.toLowerCase(), providerClass);
  }

  /**
   * Get provider instance by name
   */
  get(
    name: string,
    apiKey: string,
    config?: ProviderConfig
  ): BaseProvider | null {
    const key = `${name}:${apiKey}`;
    if (this.instances.has(key)) {
      return this.instances.get(key)!;
    }

    const ProviderClass = this.providers.get(name.toLowerCase());
    if (!ProviderClass) {
      return null;
    }

    const instance = new ProviderClass(apiKey, config);
    this.instances.set(key, instance);
    return instance;
  }

  /**
   * List all registered provider names
   */
  list(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Check if provider is registered
   */
  has(name: string): boolean {
    return this.providers.has(name.toLowerCase());
  }

  /**
   * Clear instance cache
   */
  clearCache(): void {
    this.instances.clear();
  }
}

export const providerRegistry = new ProviderRegistry();
