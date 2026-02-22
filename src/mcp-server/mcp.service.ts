import { Injectable, NotFoundException, OnModuleInit } from "@nestjs/common";
import { IMcpTool, IMcpToolContext } from "./decorators/mcp-tool.decorator";
import Ajv from "ajv";
import { IMcpPrompt } from "./decorators/mcp-prompt.decorator";

export interface McpMessage {
  type: string;
  payload: any;
}

export interface McpResponse {
  success: boolean;
  data?: any;
  error?: string;
}

@Injectable()
export class McpService implements OnModuleInit {
  private tools = new Map<string, IMcpTool>();
  private prompts = new Map<string, IMcpPrompt>();
  private ajv = new Ajv();

  onModuleInit() {
    // console.log('MCP Service initialized');
  }

  /**
   * Возвращает список зарегистрированных тулз
   */
  listTools() {
    return Array.from(this.tools.values()).map((t) => ({
      name: t.name,
      description: t.description || "",
      parameters: t.inputSchema || {},
    }));
  }

  listPrompts() {
    return Array.from(this.prompts.values()).map((t) => ({
      name: t.name,
      description: t.description || "",
    }));
  }

  registerTool(name: string, handler: IMcpTool) {
    this.tools.set(name, handler);
  }

  registerPrompt(name: string, handler: IMcpPrompt) {
    this.prompts.set(name, handler);
  }

  getPrompt(name: string, payload: object) {
    if (!this.prompts.has(name)) {
      throw new NotFoundException("Not found prompt");
    }

    const prompt = this.prompts.get(name)!;

    // Валидация через AJV, если есть inputSchema
    if (prompt.inputSchema) {
      const validate = this.ajv.compile(prompt.inputSchema);
      const valid = validate(payload);

      if (!valid) {
        throw new NotFoundException("Invalid prompt arguments");
      }
    }

    return prompt.execute(payload);
  }

  /**
   * Отправить сообщение в MCP "сервер"
   */
  async sendMessage(
    msg: { type: string; payload: any },
    context: IMcpToolContext,
  ) {
    const tool = this.tools.get(msg.type);

    if (!tool) {
      return { success: false, error: `Unknown tool: "${msg.type}"` };
    }

    // Валидация через AJV, если есть inputSchema
    if (tool.inputSchema) {
      const validate = this.ajv.compile(tool.inputSchema);
      const valid = validate(msg.payload);

      if (!valid) {
        return { success: false, error: this.ajv.errorsText(validate.errors) };
      }
    }

    try {
      const result = await tool.execute(msg.payload, context);

      return { success: true, data: result };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}
