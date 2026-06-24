/**
 * CLI command definitions
 */

import { Command } from 'commander';
import { authManager } from '../core/auth/manager';
import { configManager } from '../core/config/manager';
import { memoryManager } from '../core/memory/manager';
import { router } from '../core/router';
import { toolRegistry } from '../core/tools/registry';
import chalk from 'chalk';

/**
 * Login command - authenticate with a provider
 */
export function createLoginCommand(): Command {
  return new Command('login')
    .description('Login to an AI provider')
    .argument('<provider>', 'Provider name (openai, anthropic, groq, gemini, etc.)')
    .option('-k, --key <apiKey>', 'API key (will prompt if not provided)')
    .action(async (provider, options) => {
      let apiKey = options.key;

      if (!apiKey) {
        const readline = await import('readline');
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
        });

        apiKey = await new Promise((resolve) => {
          rl.question(`Enter API key for ${provider}: `, (answer) => {
            rl.close();
            resolve(answer);
          });
        });
      }

      const result = await authManager.login({
        provider,
        apiKey,
        saveSession: true,
      });

      if (result.success) {
        console.log(chalk.green(`✓ ${result.message}`));
      } else {
        console.error(chalk.red(`✗ ${result.message}`));
        process.exit(1);
      }
    });
}

/**
 * Logout command - logout from a provider
 */
export function createLogoutCommand(): Command {
  return new Command('logout')
    .description('Logout from an AI provider')
    .argument('<provider>', 'Provider name')
    .action(async (provider) => {
      const result = await authManager.logout(provider);

      if (result.success) {
        console.log(chalk.green(`✓ ${result.message}`));
      } else {
        console.error(chalk.red(`✗ ${result.message}`));
        process.exit(1);
      }
    });
}

/**
 * Auth status command
 */
export function createAuthStatusCommand(): Command {
  return new Command('auth')
    .description('Show authentication status')
    .action(async () => {
      const status = await authManager.getStatus();

      console.log(chalk.blue('\n📊 Authentication Status\n'));
      console.log(`Active Provider: ${chalk.cyan(status.activeProvider)}`);
      console.log(`Active Model: ${chalk.cyan(status.activeModel)}`);
      console.log(`\nAuthenticated Providers:`);

      if (status.authenticatedProviders.length === 0) {
        console.log(chalk.gray('  (none)'));
      } else {
        status.authenticatedProviders.forEach((p) => {
          console.log(`  • ${p}`);
        });
      }
      console.log();
    });
}

/**
 * Provider switch command
 */
export function createProviderCommand(): Command {
  const cmd = new Command('provider')
    .description('Manage providers')
    .addCommand(
      new Command('use')
        .description('Switch to a provider')
        .argument('<provider>', 'Provider name')
        .option('-m, --model <model>', 'Model to use')
        .action(async (provider, options) => {
          const result = await authManager.switchProvider(provider, options.model);

          if (result.success) {
            console.log(chalk.green(`✓ ${result.message}`));
          } else {
            console.error(chalk.red(`✗ ${result.message}`));
            process.exit(1);
          }
        })
    )
    .addCommand(
      new Command('list')
        .description('List available providers')
        .action(async () => {
          const status = await authManager.getStatus();
          console.log(chalk.blue('\n📦 Available Providers\n'));
          status.authenticatedProviders.forEach((p) => {
            const marker = p === status.activeProvider ? '●' : '○';
            console.log(`  ${marker} ${p}`);
          });
          console.log();
        })
    );

  return cmd;
}

/**
 * Models command - list available models
 */
export function createModelsCommand(): Command {
  return new Command('models')
    .description('List available models')
    .option('-p, --provider <provider>', 'Provider to list models for')
    .action(async (options) => {
      try {
        const models = await router.getModels(options.provider);

        console.log(chalk.blue('\n🤖 Available Models\n'));
        console.log(
          chalk.gray(
            'ID'.padEnd(30) +
              'Name'.padEnd(25) +
              'Context'.padEnd(10) +
              'Input Cost'
          )
        );
        console.log(chalk.gray('─'.repeat(85)));

        models.forEach((model) => {
          console.log(
            model.id.padEnd(30) +
              (model.name || model.id).padEnd(25) +
              `${model.contextWindow}`.padEnd(10) +
              `$${model.costPer1kInput}`
          );
        });
        console.log();
      } catch (error) {
        console.error(chalk.red(`✗ Error: ${error instanceof Error ? error.message : String(error)}`));
        process.exit(1);
      }
    });
}

/**
 * Chat command
 */
export function createChatCommand(): Command {
  return new Command('chat')
    .description('Start an interactive chat session')
    .option('-p, --provider <provider>', 'Override provider')
    .option('-m, --model <model>', 'Override model')
    .option('-t, --temperature <temp>', 'Temperature (0-2)', '0.7')
    .action(async (options) => {
      console.log(chalk.blue('\n💬 Kutti Chat\n'));
      console.log(chalk.gray('Type your message and press Enter. Type "exit" to quit.\n'));

      const readline = await import('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      const messages: any[] = [];

      const askQuestion = () => {
        rl.question(chalk.cyan('You: '), async (input) => {
          if (input.toLowerCase() === 'exit') {
            console.log(chalk.blue('\nGoodbye!\n'));
            rl.close();
            process.exit(0);
          }

          messages.push({ role: 'user', content: input });

          try {
            const response = await router.chat(messages, {
              provider: options.provider,
              model: options.model,
              temperature: parseFloat(options.temperature),
            });

            messages.push({ role: 'assistant', content: response.content });
            console.log(chalk.green(`Assistant: ${response.content}\n`));
          } catch (error) {
            console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}\n`));
          }

          askQuestion();
        });
      };

      askQuestion();
    });
}

/**
 * Memory commands
 */
export function createMemoryCommand(): Command {
  const cmd = new Command('memory')
    .description('Manage persistent memory')
    .addCommand(
      new Command('add')
        .description('Add to persistent memory')
        .argument('<content>', 'Content to remember')
        .option('-t, --tags <tags>', 'Tags (comma-separated)')
        .action(async (content, options) => {
          const tags = options.tags ? options.tags.split(',').map((t: string) => t.trim()) : [];
          const id = await memoryManager.savePersistent(content, tags);
          console.log(chalk.green(`✓ Saved to memory: ${chalk.cyan(id)}\n`));
        })
    )
    .addCommand(
      new Command('search')
        .description('Search persistent memory')
        .argument('<query>', 'Search query')
        .action(async (query) => {
          const results = await memoryManager.searchPersistent(query);
          console.log(chalk.blue(`\n📚 Search Results (${results.length})\n`));
          results.forEach((mem) => {
            console.log(`${chalk.gray(mem.id)}`);
            console.log(`  ${mem.content.substring(0, 100)}...`);
            if (mem.tags?.length) {
              console.log(`  Tags: ${mem.tags.join(', ')}\n`);
            }
          });
        })
    )
    .addCommand(
      new Command('list')
        .description('List all persistent memories')
        .action(async () => {
          const memories = await memoryManager.listPersistent();
          console.log(chalk.blue(`\n📚 Persistent Memory (${memories.length})\n`));
          memories.forEach((mem) => {
            console.log(`${chalk.gray(mem.id)}`);
            console.log(`  ${mem.content.substring(0, 100)}...\n`);
          });
        })
    )
    .addCommand(
      new Command('delete')
        .description('Delete from persistent memory')
        .argument('<id>', 'Memory ID')
        .action(async (id) => {
          const deleted = await memoryManager.deletePersistent(id);
          if (deleted) {
            console.log(chalk.green(`✓ Memory deleted\n`));
          } else {
            console.log(chalk.red(`✗ Memory not found\n`));
          }
        })
    );

  return cmd;
}

/**
 * Tools command - list and manage tools
 */
export function createToolsCommand(): Command {
  return new Command('tools')
    .description('List available tools')
    .action(async () => {
      const tools = toolRegistry.list();
      console.log(chalk.blue('\n🔧 Available Tools\n'));

      const categories = new Set(tools.map((t) => t.category));
      for (const category of categories) {
        console.log(chalk.yellow(`${category.toUpperCase()}:`))
        const categoryTools = toolRegistry.listByCategory(category);
        categoryTools.forEach((tool) => {
          console.log(`  • ${tool.name}: ${tool.description}`);
        });
        console.log();
      }
    });
}

/**
 * Config command
 */
export function createConfigCommand(): Command {
  const cmd = new Command('config')
    .description('Manage configuration')
    .addCommand(
      new Command('get')
        .description('Get config value')
        .argument('<key>', 'Config key (dot-separated)')
        .action(async (key) => {
          const value = await configManager.get(key);
          console.log(JSON.stringify(value, null, 2));
        })
    )
    .addCommand(
      new Command('set')
        .description('Set config value')
        .argument('<key>', 'Config key')
        .argument('<value>', 'Config value')
        .action(async (key, value) => {
          await configManager.set(key, value);
          console.log(chalk.green(`✓ Config updated\n`));
        })
    );

  return cmd;
}

/**
 * Help/Info command
 */
export function createHelpCommand(): Command {
  return new Command('help')
    .description('Show help information')
    .action(() => {
      console.log(chalk.blue('\n🚀 Kutti - OpenCode Alternative\n'));
      console.log(chalk.gray('Commands:'));
      console.log(chalk.cyan('  login <provider>        ') + 'Login to a provider');
      console.log(chalk.cyan('  logout <provider>       ') + 'Logout from a provider');
      console.log(chalk.cyan('  auth                    ') + 'Show auth status');
      console.log(chalk.cyan('  provider <action>       ') + 'Manage providers');
      console.log(chalk.cyan('  models                  ') + 'List available models');
      console.log(chalk.cyan('  chat                    ') + 'Start interactive chat');
      console.log(chalk.cyan('  memory <action>         ') + 'Manage persistent memory');
      console.log(chalk.cyan('  tools                   ') + 'List available tools');
      console.log(chalk.cyan('  config <action>         ') + 'Manage configuration');
      console.log();
    });
}
