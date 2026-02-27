import { ToolAnnotations } from "@modelcontextprotocol/sdk/types.js";
import { Injectable } from "@nestjs/common";
import "reflect-metadata";

import type * as z3 from "zod/v3";

type AnySchema = z3.ZodTypeAny;
type ZodRawShapeCompat = Record<string, AnySchema>;

export type IMcpToolResult<Result extends Record<string, unknown>> = {
  structuredContent?: Result;
  messages: Array<{ type: "text"; text: string }>;
  isError?: boolean;
};

export interface IMcpTool<
  Payload = any,
  Result extends Record<string, unknown> = Record<string, unknown>,
> {
  name: string;
  title?: string;
  description?: string;
  inputSchema?: ZodRawShapeCompat;
  outputSchema?: ZodRawShapeCompat;
  annotations?: ToolAnnotations;
  _meta?: Record<string, unknown>;
  execute(input: Payload): Promise<IMcpToolResult<Result>>;
}

export const MCP_TOOL_METADATA = "mcp:tool-class";

/**
 * Декоратор класса для MCP тулзы
 */
export const McpTool = (): ClassDecorator => {
  return (target: Function) => {
    Injectable()(target);
    Reflect.defineMetadata(MCP_TOOL_METADATA, {}, target);
  };
};
