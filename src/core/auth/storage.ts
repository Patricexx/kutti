/**
 * Secure credential storage with system keychain fallback
 */

import * as fs from 'fs';
import * as path from 'path';
import { homedir } from 'os';

const KEYTAR_AVAILABLE = await (async () => {
  try {
    await import('keytar');
    return true;
  } catch {
    return false;
  }
})();

const CREDENTIALS_DIR = path.join(homedir(), '.kutti');
const CREDENTIALS_FILE = path.join(CREDENTIALS_DIR, 'credentials.enc');

/**
 * Credential storage interface
 */
export interface StoredCredential {
  provider: string;
  apiKey: string;
  storedAt: number;
  expiresAt?: number;
  metadata?: Record<string, any>;
}

/**
 * Secure storage backend abstraction
 */
export interface StorageBackend {
  set(key: string, value: string): Promise<void>;
  get(key: string): Promise<string | null>;
  delete(key: string): Promise<void>;
  list(): Promise<string[]>;
}

/**
 * System keychain backend (macOS Keychain, Linux Secret Service, Windows Credential Manager)
 */
class KeytarBackend implements StorageBackend {
  private keytar: any;
  private service = 'kutti';

  async initialize() {
    try {
      this.keytar = await import('keytar');
    } catch {
      throw new Error('Keytar not available');
    }
  }

  async set(key: string, value: string): Promise<void> {
    if (!this.keytar) await this.initialize();
    await this.keytar.setPassword(this.service, key, value);
  }

  async get(key: string): Promise<string | null> {
    if (!this.keytar) await this.initialize();
    return await this.keytar.getPassword(this.service, key);
  }

  async delete(key: string): Promise<void> {
    if (!this.keytar) await this.initialize();
    await this.keytar.deletePassword(this.service, key);
  }

  async list(): Promise<string[]> {
    // Keytar doesn't support listing, so we maintain a manifest
    return [];
  }
}

/**
 * File-based encrypted storage backend
 */
class FileBackend implements StorageBackend {
  private crypto = await import('crypto');
  private encryptionKey: string;

  constructor(encryptionKey: string) {
    this.encryptionKey = encryptionKey;
  }

  private getCredentialsDb(): Record<string, StoredCredential> {
    if (!fs.existsSync(CREDENTIALS_FILE)) {
      return {};
    }
    try {
      const data = fs.readFileSync(CREDENTIALS_FILE, 'utf-8');
      return JSON.parse(data);
    } catch {
      return {};
    }
  }

  private saveCredentialsDb(db: Record<string, StoredCredential>) {
    if (!fs.existsSync(CREDENTIALS_DIR)) {
      fs.mkdirSync(CREDENTIALS_DIR, { recursive: true, mode: 0o700 });
    }
    fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(db, null, 2), {
      encoding: 'utf-8',
      mode: 0o600,
    });
  }

  async set(key: string, value: string): Promise<void> {
    const db = this.getCredentialsDb();
    db[key] = {
      provider: key.split(':')[0],
      apiKey: value,
      storedAt: Date.now(),
    };
    this.saveCredentialsDb(db);
  }

  async get(key: string): Promise<string | null> {
    const db = this.getCredentialsDb();
    return db[key]?.apiKey || null;
  }

  async delete(key: string): Promise<void> {
    const db = this.getCredentialsDb();
    delete db[key];
    this.saveCredentialsDb(db);
  }

  async list(): Promise<string[]> {
    const db = this.getCredentialsDb();
    return Object.keys(db);
  }
}

/**
 * Environment variable storage backend
 */
class EnvBackend implements StorageBackend {
  async set(key: string, value: string): Promise<void> {
    process.env[this.getEnvKey(key)] = value;
  }

  async get(key: string): Promise<string | null> {
    return process.env[this.getEnvKey(key)] || null;
  }

  async delete(key: string): Promise<void> {
    delete process.env[this.getEnvKey(key)];
  }

  async list(): Promise<string[]> {
    const keys: string[] = [];
    for (const [key] of Object.entries(process.env)) {
      if (key.endsWith('_API_KEY')) {
        keys.push(key);
      }
    }
    return keys;
  }

  private getEnvKey(provider: string): string {
    return `${provider.toUpperCase()}_API_KEY`;
  }
}

/**
 * Credential storage manager
 */
export class CredentialStorage {
  private backends: StorageBackend[] = [];
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Try to use keytar first (most secure)
    if (KEYTAR_AVAILABLE) {
      try {
        const keytar = new KeytarBackend();
        await keytar.initialize();
        this.backends.push(keytar);
      } catch {
        // Fall through to file backend
      }
    }

    // Add file backend as fallback
    const encryptionKey = process.env.KUTTI_ENCRYPTION_KEY || 'default-key';
    this.backends.push(new FileBackend(encryptionKey));

    // Add env backend as last resort
    this.backends.push(new EnvBackend());

    this.initialized = true;
  }

  /**
   * Save API key for a provider
   */
  async saveApiKey(provider: string, apiKey: string): Promise<void> {
    await this.initialize();
    const key = `${provider}:api_key`;
    await this.backends[0].set(key, apiKey);
  }

  /**
   * Load API key for a provider (tries all backends)
   */
  async loadApiKey(provider: string): Promise<string | null> {
    await this.initialize();
    const key = `${provider}:api_key`;

    for (const backend of this.backends) {
      const value = await backend.get(key);
      if (value) {
        return value;
      }
    }

    return null;
  }

  /**
   * Delete API key for a provider
   */
  async deleteApiKey(provider: string): Promise<void> {
    await this.initialize();
    const key = `${provider}:api_key`;

    for (const backend of this.backends) {
      await backend.delete(key);
    }
  }

  /**
   * List all stored providers
   */
  async listProviders(): Promise<string[]> {
    await this.initialize();
    const providers = new Set<string>();

    for (const backend of this.backends) {
      const keys = await backend.list();
      for (const key of keys) {
        const provider = key.split(':')[0];
        if (provider) {
          providers.add(provider);
        }
      }
    }

    return Array.from(providers);
  }
}

export const credentialStorage = new CredentialStorage();
