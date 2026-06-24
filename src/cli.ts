#!/usr/bin/env bun
/**
 * Kutti CLI - Main entry point
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import { homedir } from 'os';
import {
  createLoginCommand,
  createLogoutCommand,
  createAuthStatusCommand,
  createProviderCommand,
  createModelsCommand,
  createChatCommand,
  createMemoryCommand,
  createToolsCommand,
  createConfigCommand,
  createHelpCommand,
} from './commands';
import { toolRegistry } from '../core/tools/registry';
import { fileSystemTool } from '../core/tools/filesystem';
import { shellTool } from '../core/tools/shell';

/**
 * Initialize kutti directories and default config
 */
async function initializeKutti() {
  const kuttiDir = path.join(homedir(), '.kutti');
  if (!fs.existsSync(kuttiDir)) {
    fs.mkdirSync(kuttiDir, { recursive: true, mode: 0o700 });
  }
}

/**
 * Register built-in tools
 */
function registerBuiltInTools() {
  toolRegistry.register(fileSystemTool);
  toolRegistry.register(shellTool);
}

/**
 * Main CLI app
 */
async function main() {
  await initializeKutti();
  registerBuiltInTools();

  const program = new Command();

  program
    .name('kutti')
    .description('🚀 Kutti - OpenCode Alternative | Autonomous AI Coding Assistant')
    .version('0.1.0')
    .usage('<command> [options]');

  // Register commands
  program.addCommand(createLoginCommand());
  program.addCommand(createLogoutCommand());
  program.addCommand(createAuthStatusCommand());
  program.addCommand(createProviderCommand());
  program.addCommand(createModelsCommand());
  program.addCommand(createChatCommand());
  program.addCommand(createMemoryCommand());
  program.addCommand(createToolsCommand());
  program.addCommand(createConfigCommand());
  program.addCommand(createHelpCommand());

  // Default help if no args
  if (process.argv.length < 3) {
    program.outputHelp();
  }

  try {
    await program.parseAsync();
  } catch (error) {
    if (error instanceof Error) {
      console.error(chalk.red(`Error: ${error.message}`));
    }
    process.exit(1);
  }
}

main();
