/**
 * Authentication session management
 */

import * as fs from 'fs';
import * as path from 'path';
import { homedir } from 'os';

const SESSION_DIR = path.join(homedir(), '.kutti');
const SESSION_FILE = path.join(SESSION_DIR, 'session.json');

export interface AuthSession {
  provider: string;
  model: string;
  authenticated: boolean;
  loginTimestamp: number;
  lastUsedTimestamp: number;
  tokenRefreshAt?: number;
  metadata?: Record<string, any>;
}

/**
 * Session manager
 */
export class SessionManager {
  private session: AuthSession | null = null;

  async load(): Promise<AuthSession | null> {
    if (this.session) {
      return this.session;
    }

    if (!fs.existsSync(SESSION_FILE)) {
      return null;
    }

    try {
      const data = fs.readFileSync(SESSION_FILE, 'utf-8');
      this.session = JSON.parse(data);
      return this.session;
    } catch {
      return null;
    }
  }

  async save(session: AuthSession): Promise<void> {
    if (!fs.existsSync(SESSION_DIR)) {
      fs.mkdirSync(SESSION_DIR, { recursive: true, mode: 0o700 });
    }

    this.session = session;
    fs.writeFileSync(SESSION_FILE, JSON.stringify(session, null, 2), {
      encoding: 'utf-8',
      mode: 0o600,
    });
  }

  async setActiveProvider(provider: string, model: string): Promise<void> {
    const session = await this.load() || {
      provider: 'openai',
      model: 'gpt-4',
      authenticated: false,
      loginTimestamp: 0,
      lastUsedTimestamp: 0,
    };

    session.provider = provider;
    session.model = model;
    session.lastUsedTimestamp = Date.now();
    await this.save(session);
  }

  async getActiveProvider(): Promise<string> {
    const session = await this.load();
    return session?.provider || 'openai';
  }

  async getActiveModel(): Promise<string> {
    const session = await this.load();
    return session?.model || 'gpt-4';
  }

  async clear(): Promise<void> {
    this.session = null;
    if (fs.existsSync(SESSION_FILE)) {
      fs.unlinkSync(SESSION_FILE);
    }
  }
}

export const sessionManager = new SessionManager();
