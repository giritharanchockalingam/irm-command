/**
 * MCP Protocol Base Classes & Interfaces
 * Client-side implementation for IRM Command GRC platform
 * Adapted from supply-chain-platform
 */

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, { type: string; description: string; enum?: string[] }>;
    required?: string[];
  };
  domain: 'risk' | 'compliance' | 'vendor' | 'audit' | 'soc2' | 'general';
}

export interface MCPToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

export interface MCPToolResult {
  success: boolean;
  content: string;
  data?: unknown;
}

/**
 * Base class for MCP tool servers
 * All tools operate client-side on in-memory data
 */
export abstract class BaseMCPServer {
  protected tools: Map<string, MCPTool> = new Map();
  protected toolHandlers: Map<string, (args: Record<string, unknown>) => MCPToolResult> = new Map();

  abstract readonly serverName: string;

  /**
   * Register a tool with its handler function
   */
  protected registerTool(
    tool: MCPTool,
    handler: (args: Record<string, unknown>) => MCPToolResult
  ): void {
    this.tools.set(tool.name, tool);
    this.toolHandlers.set(tool.name, handler);
  }

  /**
   * List all available tools
   */
  listTools(): MCPTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get tools filtered by domain
   */
  getToolsByDomain(domain: string): MCPTool[] {
    return Array.from(this.tools.values()).filter((tool) => tool.domain === domain);
  }

  /**
   * Call a tool by name with arguments
   */
  async callTool(call: MCPToolCall): Promise<MCPToolResult> {
    const handler = this.toolHandlers.get(call.name);
    if (!handler) {
      return createErrorResult(`Tool not found: ${call.name}`);
    }

    try {
      return handler(call.arguments);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return createErrorResult(`Tool execution failed: ${message}`);
    }
  }
}

/**
 * Helper function to create a text result
 */
export function createTextResult(text: string, success: boolean = true): MCPToolResult {
  return {
    success,
    content: text,
  };
}

/**
 * Helper function to create a JSON result
 */
export function createJsonResult(data: unknown, success: boolean = true): MCPToolResult {
  return {
    success,
    content: JSON.stringify(data, null, 2),
    data,
  };
}

/**
 * Helper function to create an error result
 */
export function createErrorResult(message: string): MCPToolResult {
  return {
    success: false,
    content: message,
  };
}
