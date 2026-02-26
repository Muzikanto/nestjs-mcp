import {
  BadRequestException,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  OnModuleInit,
} from "@nestjs/common";
import { IMcpTool, MCP_TOOL_METADATA } from "./decorators/mcp-tool.decorator";
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
import { runGuards } from "./utils/run-guards";
import { ModuleRef } from "@nestjs/core";
import { GUARDS_METADATA } from "@nestjs/common/constants";
import { runInterceptors } from "./utils/run-interceptors";
import {
  catchError,
  EMPTY,
  firstValueFrom,
  from,
  mergeMap,
  of,
  throwError,
} from "rxjs";
import { runFilters } from "./utils/run-fillters";
import {
  McpBadRequestException,
  McpInternalServerErrorException,
  McpNotFoundException,
} from "./exceptions";

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
  private tools = new Map<string, { instance: IMcpTool; metatype: Function }>();
  private prompts = new Map<
    string,
    { instance: IMcpPrompt; metatype: Function }
  >();
  private resources = new Map<
    string,
    { instance: IMcpResource; metatype: Function }
  >();
  private ajv = new Ajv();
  private sessions = new Map<string, SSEServerTransport>();

  constructor(protected readonly moduleRef: ModuleRef) {}

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

  /**
   * Возвращает список зарегистрированных тулз
   */
  listTools() {
    return Array.from(this.tools.values()).map(({ instance: t }) => ({
      name: t.name,
      title: t.title,
      description: t.description,
      inputSchema: t.inputSchema ? zodToJsonSchema(t.inputSchema) : undefined,
    }));
  }

  listPrompts() {
    return Array.from(this.prompts.values()).map(({ instance: t }) => ({
      name: t.name,
      description: t.description,
      title: t.title,
      inputSchema: t.inputSchema ? zodToJsonSchema(t.inputSchema) : undefined,
    }));
  }

  registerTool(
    name: string,
    handler: { instance: IMcpTool; metatype: Function },
  ) {
    this.tools.set(name, handler);
  }

  registerPrompt(
    name: string,
    handler: { instance: IMcpPrompt; metatype: Function },
  ) {
    this.prompts.set(name, handler);
  }

  registerResource(
    name: string,
    handler: { instance: IMcpResource; metatype: Function },
  ) {
    this.resources.set(name, handler);
  }

  async executePrompt(
    name: string,
    payload: object,
    context: ExecutionContext,
  ) {
    if (!this.prompts.has(name)) {
      throw new McpNotFoundException("Not found prompt");
    }

    const { instance: prompt, metatype } = this.prompts.get(name)!;

    try {
      await runGuards(this.moduleRef, metatype, context);

      // Валидация через AJV, если есть inputSchema
      if (prompt.inputSchema) {
        const zodSchema = zodToJsonSchema(prompt.inputSchema);
        const validate = this.ajv.compile(zodSchema);
        const valid = validate(payload);

        if (!valid) {
          throw new McpBadRequestException("Invalid prompt arguments");
        }
      }

      // const result = await prompt.execute(payload);
      const stream = await runInterceptors(
        this.moduleRef,
        metatype,
        context,
        () => {
          return from(prompt.execute(payload));
        },
      );

      return stream.pipe(
        catchError((err) =>
          from(runFilters(this.moduleRef, metatype, err, context)),
        ),
      );
    } catch (err: any) {
      const result = await runFilters(this.moduleRef, metatype, err, context);

      if (result) {
        return of(result);
      }

      // Пробрасываем дальше, чтобы Observable корректно завершился
      return throwError(() => err);
    }
  }

  /**
   * Отправить сообщение в MCP "сервер"
   */
  async executeTool(
    msg: { type: string; payload: any },
    context: ExecutionContext,
  ) {
    if (!this.tools.has(msg.type)) {
      throw new McpNotFoundException("Not found tool");
    }

    const { instance: tool, metatype } = this.tools.get(msg.type)!;

    try {
      await runGuards(this.moduleRef, metatype, context);

      // Валидация через AJV, если есть inputSchema
      if (tool.inputSchema) {
        const zodSchema = zodToJsonSchema(tool.inputSchema);
        const validate = this.ajv.compile(zodSchema);
        const valid = validate(msg.payload);

        if (!valid) {
          throw new McpBadRequestException(
            this.ajv.errorsText(validate.errors),
          );
        }
      }

      // const result = await tool.execute(msg.payload);
      const stream = await runInterceptors(
        this.moduleRef,
        metatype,
        context,
        () => {
          return from(tool.execute(msg.payload));
        },
      );

      return stream.pipe(
        catchError((err) =>
          from(runFilters(this.moduleRef, metatype, err, context)),
        ),
      );
    } catch (err: any) {
      const result = await runFilters(this.moduleRef, metatype, err, context);

      if (result) {
        return of(result);
      }

      // Пробрасываем дальше, чтобы Observable корректно завершился
      return throwError(() => err);
    }
  }

  async executeResource(
    name: string,
    uri: URL,
    vars: Record<string, any>,
    context: ExecutionContext,
  ) {
    if (!this.resources.has(name)) {
      throw new McpNotFoundException("Not found prompt");
    }

    const { instance: resource, metatype } = this.resources.get(name)!;

    try {
      await runGuards(this.moduleRef, metatype, context);

      // const result = await resource.execute(uri, vars);
      const stream = await runInterceptors(
        this.moduleRef,
        metatype,
        context,
        () => {
          return from(resource.execute(uri, vars));
        },
      );

      return stream.pipe(
        catchError((err) =>
          from(runFilters(this.moduleRef, metatype, err, context)),
        ),
      );
    } catch (err: any) {
      const result = await runFilters(this.moduleRef, metatype, err, context);

      if (result) {
        return of(result);
      }

      // Пробрасываем дальше, чтобы Observable корректно завершился
      return throwError(() => err);
    }
  }

  private createServer(context: ExecutionContext): McpServer {
    const server = new McpServer({ version: "1", name: "test" }, {});

    for (const [toolName, { instance: tool }] of this.tools.entries()) {
      server.registerTool(
        tool.name,
        {
          title: tool.title,
          description: tool.description,
          inputSchema: tool.inputSchema,
        },
        async (payload: any) => {
          try {
            // const result = await tool.execute(
            //   { ...payload },
            // );
            const observable = await this.executeTool(
              { type: tool.name, payload },
              context,
            );
            const result = await firstValueFrom(observable);

            return {
              content: [
                { text: JSON.stringify(result), type: "text" as const },
              ],
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

    for (const [promptName, { instance: prompt }] of this.prompts.entries()) {
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
            const observable = await this.executePrompt(
              prompt.name,
              payload,
              context,
            );
            const result = await firstValueFrom(observable);

            const messages = result.map((el: any) => ({
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

    for (const [_, { instance: resource }] of this.resources.entries()) {
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
            // const resources = await resource.execute(url, variables);
            const observable = await this.executeResource(
              resource.name,
              url,
              variables,
              context,
            );
            const result = await firstValueFrom(observable);

            return { contents: result };
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

    return server;
  }
}
