import { ExecutionContext, Injectable, OnModuleInit } from "@nestjs/common";
import { IMcpTool, IMcpToolResult } from "../decorators/mcp-tool.decorator";
import Ajv from "ajv";
import {
  IMcpPrompt,
  IMcpPromptResult,
} from "../decorators/mcp-prompt.decorator";
import { zodToJsonSchema } from "../utils/zod";
import {
  IMcpResource,
  IMcpResourceResult,
} from "../decorators/mcp-resource.decorator";
import { runGuards } from "../utils/run-guards";
import { ModuleRef } from "@nestjs/core";
import { runInterceptors } from "../utils/run-interceptors";
import { catchError, from, Observable, of, throwError } from "rxjs";
import { runFilters } from "../utils/run-fillters";
import { McpBadRequestException, McpNotFoundException } from "../exceptions";
import { IMcpConfig, InjectMcpConfig } from "../config";

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
  public tools = new Map<string, { instance: IMcpTool; metatype: Function }>();
  public prompts = new Map<
    string,
    { instance: IMcpPrompt; metatype: Function }
  >();
  public resources = new Map<
    string,
    { instance: IMcpResource; metatype: Function }
  >();
  private ajv = new Ajv();

  constructor(
    @InjectMcpConfig() protected readonly config: IMcpConfig,
    protected readonly moduleRef: ModuleRef,
  ) {}

  onModuleInit() {
    // console.log('MCP Service initialized');
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
      outputSchema: t.outputSchema
        ? zodToJsonSchema(t.outputSchema)
        : undefined,
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

  listResources() {
    return Array.from(this.resources.values()).map(({ instance: t }) => ({
      name: t.name,
      description: t.description,
      title: t.title,
      uri: t.uri,
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
  ): Promise<Observable<IMcpPromptResult>> {
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
          throw new McpBadRequestException(
            "Invalid prompt arguments",
            validate.errors || [],
          );
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
  ): Promise<Observable<IMcpToolResult<Record<string, unknown>>>> {
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
            "Invalid tool arguments",
            validate.errors || [],
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
  ): Promise<Observable<IMcpResourceResult>> {
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
}
