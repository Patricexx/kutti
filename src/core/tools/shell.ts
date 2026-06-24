/**
 * Built-in shell execution tool
 */

import { spawn } from 'child_process';
import { ToolDefinition, ToolOutput } from './registry';

export const shellTool: ToolDefinition = {
  name: 'shell',
  description: 'Execute shell commands',
  category: 'shell',
  inputSchema: {
    command: { type: 'string' },
    args: { type: 'array', items: { type: 'string' } },
    cwd: { type: 'string' },
    timeout: { type: 'number' },
  },
  async execute(input) {
    const { command, args = [], cwd, timeout = 30000 } = input;

    return new Promise((resolve) => {
      try {
        const proc = spawn(command, args, {
          cwd: cwd || process.cwd(),
          shell: true,
        });

        let stdout = '';
        let stderr = '';

        proc.stdout?.on('data', (data) => {
          stdout += data.toString();
        });

        proc.stderr?.on('data', (data) => {
          stderr += data.toString();
        });

        const timer = setTimeout(() => {
          proc.kill();
          resolve({
            success: false,
            error: `Command timeout after ${timeout}ms`,
          });
        }, timeout);

        proc.on('close', (code) => {
          clearTimeout(timer);
          resolve({
            success: code === 0,
            result: { stdout, stderr, code },
            error: code !== 0 ? stderr : undefined,
          });
        });
      } catch (error) {
        resolve({
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });
  },
};
