/**
 * Unified request router - abstracts provider selection and credential loading
 */

import { authManager } from '../auth/manager';
import { ChatMessage, ChatResponse, StreamChunk } from '../providers/base';

export interface RouteOptions {
  provider?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  [key: string]: any;
}

/**
 * Unified router for all provider requests
 */
export class UnifiedRouter {
  /**
   * Route chat request to appropriate provider
   */
  async chat(
    messages: ChatMessage[],
    options: RouteOptions = {}
  ): Promise<ChatResponse> {
    const provider = options.provider || (await authManager.getStatus()).activeProvider;
    const model = options.model || (await authManager.getStatus()).activeModel;

    const providerInstance = await authManager.getProvider(provider);

    return await providerInstance.chat(messages, model, options);
  }

  /**
   * Route streaming request to appropriate provider
   */
  async stream(
    messages: ChatMessage[],
    onChunk: (chunk: StreamChunk) => void,
    options: RouteOptions = {}
  ): Promise<ChatResponse> {
    const provider = options.provider || (await authManager.getStatus()).activeProvider;
    const model = options.model || (await authManager.getStatus()).activeModel;

    const providerInstance = await authManager.getProvider(provider);

    return await providerInstance.stream(messages, model, onChunk, options);
  }

  /**
   * Get available models for current provider
   */
  async getModels(provider?: string) {
    const providerName = provider || (await authManager.getStatus()).activeProvider;
    const providerInstance = await authManager.getProvider(providerName);
    return await providerInstance.listModels();
  }

  /**
   * Generate embeddings
   */
  async embeddings(input: string | string[], model?: string, provider?: string) {
    const providerName = provider || (await authManager.getStatus()).activeProvider;
    const providerInstance = await authManager.getProvider(providerName);
    return await providerInstance.embeddings(input, model || 'default');
  }
}

export const router = new UnifiedRouter();
