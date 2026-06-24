/**
 * Tool system - plugin architecture for extensible tools
 */

export interface ToolInput {
  [key: string]: any;
}

export interface ToolOutput {
  success: boolean;
  result?: any;
  error?: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  category: 'filesystem' | 'shell' | 'git' | 'web' | 'memory' | 'custom';
  inputSchema: Record<string, any>;
  execute(input: ToolInput): Promise<ToolOutput>;
}

/**
 * Tool registry
 */
export class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();

  /**
   * Register a tool
   */
  register(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  /**
   * Get tool by name
   */
  get(name: string): ToolDefinition | null {
    return this.tools.get(name) || null;
  }

  /**
   * List all tools
   */
  list(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  /**
   * List tools by category
   */
  listByCategory(category: string): ToolDefinition[] {
    return this.list().filter((t) => t.category === category);
  }

  /**
   * Execute a tool
   */
  async execute(name: string, input: ToolInput): Promise<ToolOutput> {
    const tool = this.get(name);
    if (!tool) {
      return {
        success: false,
        error: `Tool not found: ${name}`,
      };
    }

    try {
      return await tool.execute(input);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

export const toolRegistry = new ToolRegistry();
