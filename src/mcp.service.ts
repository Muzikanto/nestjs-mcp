import { Injectable, OnModuleInit } from '@nestjs/common';
import { IMcpTool } from './decorators/mcp-tool.decorator';
import Ajv from 'ajv';

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
  private ajv = new Ajv();
  
  onModuleInit() {
    // console.log('MCP Service initialized');
  }

   /**
   * Возвращает список зарегистрированных тулз
   */
  listTools() {
    return Array.from(this.tools.values()).map(t => ({
      name: t.name,
      description: t.description || '',
      parameters: t.inputSchema || {},
    }));
  }

  registerTool(name: string, handler: IMcpTool) {
    this.tools.set(name, handler);
  }

  /**
   * Отправить сообщение в MCP "сервер"
   */
  async sendMessage(msg: { type: string; payload: any }) {
    const tool = this.tools.get(msg.type);
  
    if (!tool) {
      return { success: false, error: `Unknown tool: ${msg.type}` };
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
      const result = await tool.execute(msg.payload);
    
      return { success: true, data: result };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}