/**
 * Memory system - session and persistent memory
 */

import * as fs from 'fs';
import * as path from 'path';
import { homedir } from 'os';

const MEMORY_DIR = path.join(homedir(), '.kutti', 'memory');

export interface Memory {
  id: string;
  content: string;
  timestamp: number;
  tags?: string[];
  metadata?: Record<string, any>;
}

/**
 * Memory manager
 */
export class MemoryManager {
  private sessionMemory: Memory[] = [];

  /**
   * Add to session memory
   */
  addSession(content: string, tags: string[] = []): void {
    this.sessionMemory.push({
      id: `session-${Date.now()}-${Math.random()}`,
      content,
      timestamp: Date.now(),
      tags,
    });
  }

  /**
   * Get session memory
   */
  getSession(): Memory[] {
    return this.sessionMemory;
  }

  /**
   * Clear session memory
   */
  clearSession(): void {
    this.sessionMemory = [];
  }

  /**
   * Save to persistent memory
   */
  async savePersistent(
    content: string,
    tags: string[] = [],
    metadata?: Record<string, any>
  ): Promise<string> {
    if (!fs.existsSync(MEMORY_DIR)) {
      fs.mkdirSync(MEMORY_DIR, { recursive: true });
    }

    const id = `mem-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const memory: Memory = {
      id,
      content,
      timestamp: Date.now(),
      tags,
      metadata,
    };

    const filePath = path.join(MEMORY_DIR, `${id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(memory, null, 2));

    return id;
  }

  /**
   * Search persistent memory
   */
  async searchPersistent(query: string): Promise<Memory[]> {
    if (!fs.existsSync(MEMORY_DIR)) {
      return [];
    }

    const results: Memory[] = [];
    const files = fs.readdirSync(MEMORY_DIR);

    for (const file of files) {
      if (!file.endsWith('.json')) continue;

      const filePath = path.join(MEMORY_DIR, file);
      try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        if (
          data.content.includes(query) ||
          data.tags?.some((tag: string) => tag.includes(query))
        ) {
          results.push(data);
        }
      } catch {
        // Ignore parse errors
      }
    }

    return results;
  }

  /**
   * List all persistent memories
   */
  async listPersistent(): Promise<Memory[]> {
    if (!fs.existsSync(MEMORY_DIR)) {
      return [];
    }

    const memories: Memory[] = [];
    const files = fs.readdirSync(MEMORY_DIR);

    for (const file of files) {
      if (!file.endsWith('.json')) continue;

      const filePath = path.join(MEMORY_DIR, file);
      try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        memories.push(data);
      } catch {
        // Ignore parse errors
      }
    }

    return memories.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Delete persistent memory
   */
  async deletePersistent(id: string): Promise<boolean> {
    const filePath = path.join(MEMORY_DIR, `${id}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  }
}

export const memoryManager = new MemoryManager();
