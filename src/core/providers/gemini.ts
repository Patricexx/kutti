import { BaseProvider, ProviderInfo, ModelInfo, ChatMessage, ChatResponse, StreamChunk, ProviderConfig } from './base';

export class GeminiProvider extends BaseProvider {
  constructor(apiKey: string, config: ProviderConfig = {}) {
    super('gemini', apiKey, config);
  }

  getInfo(): ProviderInfo {
    return {
      name: 'gemini',
      displayName: 'Google Gemini',
      description: 'Google Gemini AI models',
      website: 'https://google.com/gemini',
      capabilities: {
        chat: true,
        streaming: true,
        embeddings: true,
        vision: true,
        tools: true,
        costTracking: true,
      },
    };
  }

  async listModels(): Promise<ModelInfo[]> {
    return [
      {
        id: 'gemini-2.5-pro',
        name: 'Gemini 2.5 Pro',
        description: 'Latest Gemini model',
        contextWindow: 1000000,
        maxOutputTokens: 8192,
        costPer1kInput: 0.0003,
        costPer1kOutput: 0.0012,
      },
      {
        id: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        description: 'Stable Gemini model',
        contextWindow: 1000000,
        maxOutputTokens: 8192,
        costPer1kInput: 0.0015,
        costPer1kOutput: 0.006,
      },
    ];
  }

  async validateCredentials(): Promise<boolean> {
    return true;
  }

  async chat(
    messages: ChatMessage[],
    model: string,
    options?: Record<string, any>
  ): Promise<ChatResponse> {
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
    throw new Error('Not implemented');
  }
}
