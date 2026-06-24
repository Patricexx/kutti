/**
 * Built-in filesystem tool
 */

import * as fs from 'fs';
import * as path from 'path';
import { ToolDefinition, ToolOutput } from './registry';

export const fileSystemTool: ToolDefinition = {
  name: 'filesystem',
  description: 'Read, write, and manage files',
  category: 'filesystem',
  inputSchema: {
    action: { type: 'string', enum: ['read', 'write', 'delete', 'list'] },
    path: { type: 'string' },
    content: { type: 'string' },
  },
  async execute(input) {
    const { action, filePath, content } = input;

    try {
      switch (action) {
        case 'read': {
          const data = fs.readFileSync(filePath, 'utf-8');
          return { success: true, result: data };
        }
        case 'write': {
          const dir = path.dirname(filePath);
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          fs.writeFileSync(filePath, content, 'utf-8');
          return { success: true, result: `File written: ${filePath}` };
        }
        case 'delete': {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
          return { success: true, result: `File deleted: ${filePath}` };
        }
        case 'list': {
          const files = fs.readdirSync(filePath);
          return { success: true, result: files };
        }
        default:
          return { success: false, error: `Unknown action: ${action}` };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
};
