import { BaseProvider, ProviderInfo, ModelInfo, ChatMessage, ChatResponse, StreamChunk, ProviderConfig } from './base';
import * as https from 'https';

interface OpenAIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: OpenAIMessage;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface OpenAIModel {
  id: string;
  object: string;
  owned_by: string;
  permission: Array<any>;
}

export class OpenAIProvider extends BaseProvider {
  private baseUrl = 'https://api.openai.com/v1';
  private models: Map<string, ModelInfo> = new Map();

  constructor(apiKey: string, config: ProviderConfig = {}) {
    super('openai', apiKey, config);
    if (config.baseUrl) {
      this.baseUrl = config.baseUrl;
    }
  }

  getInfo(): ProviderInfo {
    return {
      name: 'openai',
      displayName: 'OpenAI',
      description: 'OpenAI GPT models',
      website: 'https://openai.com',
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
    if (this.models.size > 0) {
      return Array.from(this.models.values());
    }

    const response = await this.fetch('/models', 'GET');
    const data = response as { data: OpenAIModel[] };

    const models: ModelInfo[] = [];
    for (const model of data.data) {
      if (model.id.includes('gpt')) {
        models.push({
          id: model.id,
          name: model.id,
          description: `OpenAI ${model.id}`,
          contextWindow: this.getContextWindow(model.id),
          maxOutputTokens: 4096,
          costPer1kInput: this.getCost(model.id, 'input'),
          costPer1kOutput: this.getCost(model.id, 'output'),
        });
        this.models.set(model.id, models[models.length - 1]);
      }
    }

    return models;
  }

  async validateCredentials(): Promise<boolean> {
    try {
      await this.fetch('/models?limit=1', 'GET');
      return true;
    } catch {
      return false;
    }
  }

  async chat(
    messages: ChatMessage[],
    model: string,
    options?: Record<string, any>
  ): Promise<ChatResponse> {
    const payload = {
      model,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 2048,
    };

    const response = (await this.fetch('/chat/completions', 'POST', payload)) as OpenAIResponse;

    return {
      id: response.id,
      content: response.choices[0].message.content,
      model: response.model,
      provider: this.name,
      tokens: {
        input: response.usage.prompt_tokens,
        output: response.usage.completion_tokens,
        total: response.usage.total_tokens,
      },
      finishReason: response.choices[0].finish_reason as 'stop' | 'length' | 'error',
    };
  }

  async stream(
    messages: ChatMessage[],
    model: string,
    onChunk: (chunk: StreamChunk) => void,
    options?: Record<string, any>
  ): Promise<ChatResponse> {
    const payload = {
      model,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      stream: true,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 2048,
    };

    return new Promise((resolve, reject) => {
      try {
        const req = this.streamRequest('/chat/completions', payload);
        let buffer = '';
        let totalTokens = 0;

        req.on('data', (chunk: Buffer) => {
          buffer += chunk.toString();
          const lines = buffer.split('\n');
          buffer = lines[lines.length - 1];

          for (let i = 0; i < lines.length - 1; i++) {
            const line = lines[i].trim();
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                onChunk({ type: 'done' });
              } else if (data) {
                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content || '';
                  if (content) {
                    onChunk({ type: 'content', delta: content });
                  }
                } catch (e) {
                  // Ignore parse errors
                }
              }
            }
          }
        });

        req.on('end', () => {
          resolve({
            id: 'stream-' + Date.now(),
            content: '',
            model,
            provider: this.name,
            tokens: { input: 0, output: totalTokens, total: totalTokens },
            finishReason: 'stop',
          });
        });

        req.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  async embeddings(
    input: string | string[],
    model: string
  ): Promise<{ embedding: number[]; tokens: number }[]> {
    const inputs = Array.isArray(input) ? input : [input];
    const payload = {
      input: inputs,
      model: model || 'text-embedding-3-small',
    };

    const response = (await this.fetch('/embeddings', 'POST', payload)) as {
      data: Array<{ embedding: number[] }>;
      usage: { total_tokens: number };
    };

    return response.data.map((item) => ({
      embedding: item.embedding,
      tokens: Math.ceil(response.usage.total_tokens / inputs.length),
    }));
  }

  private async fetch(
    endpoint: string,
    method: string = 'GET',
    body?: any
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const url = new URL(this.baseUrl + endpoint);
      const options = {
        hostname: url.hostname,
        path: url.pathname + url.search,
        method,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            if (res.statusCode === 200 || res.statusCode === 201) {
              resolve(JSON.parse(data));
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${data}`));
            }
          } catch (e) {
            reject(e);
          }
        });
      });

      req.on('error', reject);
      if (body) {
        req.write(JSON.stringify(body));
      }
      req.end();
    });
  }

  private streamRequest(endpoint: string, body: any) {
    const url = new URL(this.baseUrl + endpoint);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options);
    req.write(JSON.stringify(body));
    req.end();
    return req;
  }

  private getContextWindow(modelId: string): number {
    const contexts: Record<string, number> = {
      'gpt-4-turbo': 128000,
      'gpt-4': 8192,
      'gpt-3.5-turbo': 4096,
      'gpt-5': 128000,
    };
    return contexts[modelId] || 4096;
  }

  private getCost(modelId: string, type: 'input' | 'output'): number {
    // Placeholder pricing - update with actual
    return type === 'input' ? 0.01 : 0.03;
  }
}
