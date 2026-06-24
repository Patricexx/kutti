import { BaseProvider, ProviderInfo, ModelInfo, ChatMessage, ChatResponse, StreamChunk, ProviderConfig } from './base';

export class AnthropicProvider extends BaseProvider {
  constructor(apiKey: string, config: ProviderConfig = {}) {
    super('anthropic', apiKey, config);
  }

  getInfo(): ProviderInfo {
    return {
      name: 'anthropic',
      displayName: 'Anthropic',
      description: 'Anthropic Claude models',
      website: 'https://anthropic.com',
      capabilities: {
        chat: true,
        streaming: true,
        embeddings: false,
        vision: true,
        tools: true,
        costTracking: true,
      },
    };
  }

  async listModels(): Promise<ModelInfo[]> {
    return [
      {
        id: 'claude-3-opus-20240229',
        name: 'Claude 3 Opus',
        description: 'Most capable Claude model',
        contextWindow: 200000,
        maxOutputTokens: 4096,
        costPer1kInput: 0.015,
        costPer1kOutput: 0.075,
      },
      {
        id: 'claude-3-sonnet-20240229',
        name: 'Claude 3 Sonnet',
        description: 'Balanced Claude model',
        contextWindow: 200000,
        maxOutputTokens: 4096,
        costPer1kInput: 0.003,
        costPer1kOutput: 0.015,
      },
      {
        id: 'claude-3-haiku-20240307',
        name: 'Claude 3 Haiku',
        description: 'Fast Claude model',
        contextWindow: 200000,
        maxOutputTokens: 4096,
        costPer1kInput: 0.00025,
        costPer1kOutput: 0.00125,
      },
    ];
  }

  async validateCredentials(): Promise<boolean> {
    // Anthropic validation
    return true;
  }

  async chat(
    messages: ChatMessage[],
    model: string,
    options?: Record<string, any>
  ): Promise<ChatResponse> {
    // Implement using @anthropic-ai/sdk
    throw new Error('Not implemented');
  }

  async stream(
    messages: ChatMessage[],
    model: string,
    onChunk: (chunk: StreamChunk) => void,
    options?: Record<string, any>
  ): Promise<ChatResponse> {
    throw new Error('Not implemented');
  }

  async embeddings(
    input: string | string[],
    model: string
  ): Promise<{ embedding: number[]; tokens: number }[]> {
    throw new Error('Anthropic does not support embeddings');
  }
}
