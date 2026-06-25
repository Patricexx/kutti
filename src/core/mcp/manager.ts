/**
 * MCP (Model Context Protocol) client and server support
 */

export interface MCPServerConfig {
  name: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

export interface MCPResource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
}

/**
 * MCP Manager - manages MCP servers and resources
 */
export class MCPManager {
  private servers: Map<string, MCPServerConfig> = new Map();
  private resources: Map<string, MCPResource> = new Map();
  private tools: Map<string, MCPTool> = new Map();

  /**
   * Register MCP server
   */
  registerServer(config: MCPServerConfig): void {
    this.servers.set(config.name, config);
  }

  /**
   * List registered servers
   */
  listServers(): MCPServerConfig[] {
    return Array.from(this.servers.values());
  }

  /**
   * Get server by name
   */
  getServer(name: string): MCPServerConfig | null {
    return this.servers.get(name) || null;
  }

  /**
   * Register MCP resource
   */
  registerResource(resource: MCPResource): void {
    this.resources.set(resource.uri, resource);
  }

  /**
   * List resources
   */
  listResources(): MCPResource[] {
    return Array.from(this.resources.values());
  }

  /**
   * Register MCP tool
   */
  registerTool(tool: MCPTool): void {
    this.tools.set(tool.name, tool);
  }

  /**
   * List tools
   */
  listTools(): MCPTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Initialize MCP servers from config
   */
  async initialize(): Promise<void> {
    // Implementation would connect to MCP servers
    // This is a stub for the architecture
  }
}

export const mcpManager = new MCPManager();
