import { Injectable, NotFoundException, OnModuleInit } from "@nestjs/common";
import { IMcpTool, IMcpToolContext } from "./decorators/mcp-tool.decorator";
import Ajv from "ajv";
import { IMcpPrompt } from "./decorators/mcp-prompt.decorator";
import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { zodToJsonSchema } from "./utils/zod";
import { IRequest, IResponse } from "./utils/http-adapter";
import { IMcpResource } from "./decorators/mcp-resource.decorator";
import { IMcpConfig, InjectMcpConfig } from "./config";

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
  private resources = new Map<string, IMcpResource>();
  private ajv = new Ajv();
  private sessions = new Map<string, SSEServerTransport>();

  onModuleInit() {
    // console.log('MCP Service initialized');
  }

  public async handleSse(_: IRequest, res: IResponse) {
    try {
      const transport = new SSEServerTransport(
        "/api/mcp/messages",
        res.original,
      );
      const sessionId = transport.sessionId;

      this.sessions.set(sessionId, transport);

      res.original.on("close", () => {
        this.sessions.delete(sessionId);
      });

      const server = this.createServer();
      await server.connect(transport);
    } catch (e) {
      res.status(500).send("Failed to initialize session");
    }
  }

  public async handleSseMessage(req: IRequest, res: IResponse) {
    const sessionId = (req.query as any).sessionId as string;
    const transport = this.sessions.get(sessionId);

    if (transport) {
      await transport.handlePostMessage(req.original, res.original, req.body);
    } else {
      res.status(500).send("Failed to handle message");
    }
  }

  /**
   * Возвращает список зарегистрированных тулз
   */
  listTools() {
    return Array.from(this.tools.values()).map((t) => ({
      name: t.name,
      title: t.title,
      description: t.description,
      inputSchema: t.inputSchema ? zodToJsonSchema(t.inputSchema) : undefined,
    }));
  }

  listPrompts() {
    return Array.from(this.prompts.values()).map((t) => ({
      name: t.name,
      description: t.description,
      title: t.title,
      inputSchema: t.inputSchema ? zodToJsonSchema(t.inputSchema) : undefined,
    }));
  }

  registerTool(name: string, handler: IMcpTool) {
    this.tools.set(name, handler);
  }

  registerPrompt(name: string, handler: IMcpPrompt) {
    this.prompts.set(name, handler);
  }

  registerResource(name: string, handler: IMcpResource) {
    this.resources.set(name, handler);
  }

  getPrompt(name: string, payload: object) {
    if (!this.prompts.has(name)) {
      throw new NotFoundException("Not found prompt");
    }

    const prompt = this.prompts.get(name)!;

    // Валидация через AJV, если есть inputSchema
    if (prompt.inputSchema) {
      const zodSchema = zodToJsonSchema(prompt.inputSchema);
      const validate = this.ajv.compile(zodSchema);
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
      const zodSchema = zodToJsonSchema(tool.inputSchema);
      const validate = this.ajv.compile(zodSchema);
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

  private createServer(): McpServer {
    const server = new McpServer({ version: "1", name: "test" }, {});

    for (const [toolName, tool] of this.tools.entries()) {
      server.registerTool(
        tool.name,
        {
          title: tool.title,
          description: tool.description,
          inputSchema: tool.inputSchema,
        },
        async (params: any) => {
          try {
            const result = await tool.execute(
              { ...params },
              { request: undefined },
            );

            return {
              content: [
                { text: JSON.stringify(result), type: "text" as const },
              ],
            };
          } catch (e) {
            console.error(e);
            throw new Error(`Faild to execute tool ${tool.name}`);
          }
        },
      );
    }

    for (const [promptName, prompt] of this.prompts.entries()) {
      server.registerPrompt(
        prompt.name,
        {
          title: prompt.title,
          description: prompt.description,
          argsSchema: prompt.inputSchema,
        },
        async (params) => {
          try {
            const openaiMessage = await prompt.execute({ ...params });
            const messages = openaiMessage.map((el) => ({
              role: (el.role === "system" ? "assistant" : el.role) as
                | "user"
                | "assistant",
              content: el.tool_call
                ? {
                    type: "text" as const,
                    text: `call tool ${JSON.stringify(el.tool_call)}`,
                  }
                : { type: "text" as const, text: el.content as string },
            }));

            return { messages: messages };
          } catch (e) {
            throw new Error(`Faild to execute tool ${prompt.name}`);
          }
        },
      );
    }

    for (const [_, resource] of this.resources.entries()) {
      const resourceList = resource.list;

      server.registerResource(
        resource.name,
        new ResourceTemplate(resource.uri, {
          list: resourceList
            ? async (extra) => {
                return {
                  resources: await resourceList(extra),
                };
              }
            : undefined,
        }),
        {
          title: resource.title,
          description: resource.description,
        },
        async (url: URL, variables: any) => {
          try {
            const resources = await resource.execute(url, variables);

            return { contents: resources };
          } catch (e) {
            throw new Error(`Faild to execute tool ${prompt.name}`);
          }
        },
      );
    }

    return server;
  }
}
