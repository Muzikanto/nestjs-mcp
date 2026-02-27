import { ExecutionContext, Injectable, OnModuleInit } from "@nestjs/common";
import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { IRequest, IResponse } from "../utils/http-adapter";
import { ModuleRef } from "@nestjs/core";
import { firstValueFrom } from "rxjs";
import { McpInternalServerErrorException } from "../exceptions";
import { IMcpConfig, InjectMcpConfig } from "../config";
import { McpService } from "./mcp.service";

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
export class McpSseService implements OnModuleInit {
  private sessions = new Map<string, SSEServerTransport>();

  constructor(
    @InjectMcpConfig() protected readonly config: IMcpConfig,
    protected readonly moduleRef: ModuleRef,
    protected readonly service: McpService,
  ) {}

  onModuleInit() {
    // console.log('MCP Service initialized');
  }

  public async handleSse(
    _: IRequest,
    res: IResponse,
    context: ExecutionContext,
  ) {
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

      const server = this.createServer(context);
      await server.connect(transport);
    } catch (e) {
      res.send(500, "Failed to initialize session");
    }
  }

  public async handleSseMessage(req: IRequest, res: IResponse) {
    const sessionId = (req.query as any).sessionId as string;
    const transport = this.sessions.get(sessionId);

    if (transport) {
      await transport.handlePostMessage(req.original, res.original, req.body);
    } else {
      res.send(500, "Failed to handle message");
    }
  }

  private createServer(context: ExecutionContext): McpServer {
    const server = new McpServer(
      {
        version: this.config.version || "1",
        name: this.config.name || "MCP server",
      },
      {},
    );

    this.registerTools(server, context);
    this.registerPrompts(server, context);
    this.registerResources(server, context);

    return server;
  }

  private registerTools(server: McpServer, context: ExecutionContext): void {
    for (const [toolName, { instance: tool }] of this.service.tools.entries()) {
      server.registerTool(
        tool.name,
        {
          title: tool.title,
          description: tool.description,
          inputSchema: tool.inputSchema,
          outputSchema: tool.outputSchema,
          annotations: tool.annotations,
          _meta: tool._meta,
        },
        async (payload: any) => {
          try {
            // const result = await tool.execute(
            //   { ...payload },
            // );
            const observable = await this.service.executeTool(
              { type: tool.name, payload },
              context,
            );
            const result = await firstValueFrom(observable);

            return {
              content: result.messages,
              structuredContent: result.structuredContent,
              isError: result.isError,
            };
          } catch (e) {
            throw new McpInternalServerErrorException(
              `Faild to execute tool ${tool.name}`,
              {
                cause: e,
              },
            );
          }
        },
      );
    }
  }

  private registerPrompts(server: McpServer, context: ExecutionContext): void {
    for (const [
      promptName,
      { instance: prompt },
    ] of this.service.prompts.entries()) {
      server.registerPrompt(
        prompt.name,
        {
          title: prompt.title,
          description: prompt.description,
          argsSchema: prompt.inputSchema,
        },
        async (payload) => {
          try {
            // const result = await prompt.execute({ ...params });
            const observable = await this.service.executePrompt(
              prompt.name,
              payload,
              context,
            );
            const result = await firstValueFrom(observable);

            const messages = result.messages.map((el: any) => ({
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

            return { messages: messages, description: result.description };
          } catch (e) {
            throw new McpInternalServerErrorException(
              `Faild to execute tool ${prompt.name}`,
              {
                cause: e,
              },
            );
          }
        },
      );
    }
  }

  private registerResources(
    server: McpServer,
    context: ExecutionContext,
  ): void {
    for (const [
      _,
      { instance: resource },
    ] of this.service.resources.entries()) {
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
          annotations: resource.annotations,
          _meta: resource._meta,
        },
        async (url: URL, variables: any) => {
          try {
            // const resources = await resource.execute(url, variables);
            const observable = await this.service.executeResource(
              resource.name,
              url,
              variables,
              context,
            );
            const result = await firstValueFrom(observable);

            return result
          } catch (e) {
            throw new McpInternalServerErrorException(
              `Faild to execute tool ${prompt.name}`,
              {
                cause: e,
              },
            );
          }
        },
      );
    }
  }
}
