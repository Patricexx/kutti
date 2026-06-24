/**
 * Base provider interface - all providers must implement this contract
 */

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatResponse {
  id: string;
  content: string;
  model: string;
  provider: string;
  tokens: {
    input: number;
    output: number;
    total: number;
  };
  finishReason: 'stop' | 'length' | 'error';
}

export interface StreamChunk {
  type: 'content' | 'done' | 'error';
  content?: string;
  delta?: string;
  error?: string;
}

export interface ModelInfo {
  id: string;
  name: string;
  description: string;
  contextWindow: number;
  maxOutputTokens: number;
  costPer1kInput: number;
  costPer1kOutput: number;
}

export interface ProviderCapabilities {
  chat: boolean;
  streaming: boolean;
  embeddings: boolean;
  vision: boolean;
  tools: boolean;
  costTracking: boolean;
}

export interface ProviderInfo {
  name: string;
  displayName: string;
  description: string;
  website: string;
  capabilities: ProviderCapabilities;
}

export interface ProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
  retries?: number;
  [key: string]: any;
}

/**
 * Abstract base class all providers must extend
 */
export abstract class BaseProvider {
  protected name: string;
  protected apiKey: string;
  protected config: ProviderConfig;

  constructor(name: string, apiKey: string, config: ProviderConfig = {}) {
    this.name = name;
    this.apiKey = apiKey;
    this.config = config;
  }

  /**
   * Get provider metadata
   */
  abstract getInfo(): ProviderInfo;

  /**
   * List available models
   */
  abstract listModels(): Promise<ModelInfo[]>;

  /**
   * Validate credentials are valid
   */
  abstract validateCredentials(): Promise<boolean>;

  /**
   * Send chat message and get response
   */
  abstract chat(
    messages: ChatMessage[],
    model: string,
    options?: Record<string, any>
  ): Promise<ChatResponse>;

  /**
   * Stream chat response
   */
  abstract stream(
    messages: ChatMessage[],
    model: string,
    onChunk: (chunk: StreamChunk) => void,
    options?: Record<string, any>
  ): Promise<ChatResponse>;

  /**
   * Generate embeddings
   */
  abstract embeddings(
    input: string | string[],
    model: string
  ): Promise<{ embedding: number[]; tokens: number }[]>;

  /**
   * Refresh authentication token (for OAuth providers)
   */
  async refreshToken?(): Promise<boolean>;

  /**
   * Get provider name
   */
  getName(): string {
    return this.name;
  }

  /**
   * Check if provider is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.apiKey;
  }
}

export abstract class StreamableProvider extends BaseProvider {
  /**
   * Streaming with server-sent events
   */
  async *streamAsyncIterator(
    messages: ChatMessage[],
    model: string,
    options?: Record<string, any>
  ): AsyncGenerator<StreamChunk> {
    let done = false;
    const chunks: StreamChunk[] = [];

    await this.stream(messages, model, (chunk) => {
      chunks.push(chunk);
    }, options);

    for (const chunk of chunks) {
      yield chunk;
    }
  }
}
