import { Injectable } from "@nestjs/common";
import "reflect-metadata";

import type * as z3 from "zod/v3";

type AnySchema = z3.ZodTypeAny;
type ZodRawShapeCompat = Record<string, AnySchema>;

export interface IMcpTool<Payload = any, Result = any> {
  name: string;
  title?: string;
  description?: string;
  inputSchema?: ZodRawShapeCompat;
  execute(input: Payload): Promise<Result>;
}

export const MCP_TOOL_METADATA = "mcp:tool-class";

/**
 * Декоратор класса для MCP тулзы
 */
export const McpTool = () => {
  return (target: any) => {
    Injectable()(target);
    Reflect.defineMetadata(MCP_TOOL_METADATA, {}, target);
  };
};
