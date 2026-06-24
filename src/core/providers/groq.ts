import { BaseProvider, ProviderInfo, ModelInfo, ChatMessage, ChatResponse, StreamChunk, ProviderConfig } from './base';

export class GroqProvider extends BaseProvider {
  constructor(apiKey: string, config: ProviderConfig = {}) {
    super('groq', apiKey, config);
  }

  getInfo(): ProviderInfo {
    return {
      name: 'groq',
      displayName: 'Groq',
      description: 'Groq LLM inference platform',
      website: 'https://groq.com',
      capabilities: {
        chat: true,
        streaming: true,
        embeddings: false,
        vision: false,
        tools: true,
        costTracking: true,
      },
    };
  }

  async listModels(): Promise<ModelInfo[]> {
    return [
      {
        id: 'mixtral-8x7b-32768',
        name: 'Mixtral 8x7B',
        description: 'Fast open-source model',
        contextWindow: 32768,
        maxOutputTokens: 4096,
        costPer1kInput: 0.0002,
        costPer1kOutput: 0.0006,
      },
      {
        id: 'llama2-70b-4096',
        name: 'Llama 2 70B',
        description: 'Meta Llama 2 model',
        contextWindow: 4096,
        maxOutputTokens: 4096,
        costPer1kInput: 0.0004,
        costPer1kOutput: 0.0012,
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
    throw new Error('Groq does not support embeddings');
  }
}
