/**
 * Configuration management
 */

import * as fs from 'fs';
import * as path from 'path';
import { homedir } from 'os';
import TOML from 'toml';

const CONFIG_DIR = path.join(homedir(), '.kutti');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.toml');

export interface KuttiConfig {
  provider: {
    default: string;
    timeout?: number;
    retries?: number;
  };
  models: {
    default: string;
  };
  memory: {
    enabled: boolean;
    backend: 'sqlite' | 'json';
    path?: string;
  };
  mcp?: {
    enabled: boolean;
    servers?: string[];
  };
  security?: {
    sandboxMode: boolean;
    commandApproval: boolean;
    auditLogging: boolean;
  };
  [key: string]: any;
}

const DEFAULT_CONFIG: KuttiConfig = {
  provider: {
    default: 'openai',
    timeout: 30000,
    retries: 3,
  },
  models: {
    default: 'gpt-4',
  },
  memory: {
    enabled: true,
    backend: 'sqlite',
    path: path.join(CONFIG_DIR, 'memory.db'),
  },
  mcp: {
    enabled: true,
    servers: [],
  },
  security: {
    sandboxMode: false,
    commandApproval: true,
    auditLogging: true,
  },
};

/**
 * Configuration manager
 */
export class ConfigManager {
  private config: KuttiConfig | null = null;

  async load(): Promise<KuttiConfig> {
    if (this.config) {
      return this.config;
    }

    if (!fs.existsSync(CONFIG_FILE)) {
      this.config = { ...DEFAULT_CONFIG };
      await this.save();
      return this.config;
    }

    try {
      const content = fs.readFileSync(CONFIG_FILE, 'utf-8');
      this.config = TOML.parse(content);
      return this.config;
    } catch {
      this.config = { ...DEFAULT_CONFIG };
      return this.config;
    }
  }

  async save(): Promise<void> {
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
    }

    const content = this.serializeToml(this.config || DEFAULT_CONFIG);
    fs.writeFileSync(CONFIG_FILE, content, { encoding: 'utf-8', mode: 0o600 });
  }

  async get(key: string): Promise<any> {
    const config = await this.load();
    const keys = key.split('.');
    let value: any = config;

    for (const k of keys) {
      value = value?.[k];
    }

    return value;
  }

  async set(key: string, value: any): Promise<void> {
    const config = await this.load();
    const keys = key.split('.');
    let current = config;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;
    await this.save();
  }

  private serializeToml(obj: any, prefix = ''): string {
    let result = '';

    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;

      if (value === null || value === undefined) {
        continue;
      }

      if (typeof value === 'object' && !Array.isArray(value)) {
        if (Object.keys(value).length > 0) {
          result += `\n[${fullKey}]\n`;
          for (const [k, v] of Object.entries(value)) {
            result += this.serializeValue(k, v);
          }
        }
      } else if (Array.isArray(value)) {
        result += `${key} = [${value.map((v) => JSON.stringify(v)).join(', ')}]\n`;
      } else {
        result += this.serializeValue(key, value);
      }
    }

    return result;
  }

  private serializeValue(key: string, value: any): string {
    if (typeof value === 'string') {
      return `${key} = "${value}"\n`;
    } else if (typeof value === 'boolean') {
      return `${key} = ${value}\n`;
    } else if (typeof value === 'number') {
      return `${key} = ${value}\n`;
    }
    return '';
  }
}

export const configManager = new ConfigManager();
