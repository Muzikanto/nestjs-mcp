import { Injectable } from "@nestjs/common";
import "reflect-metadata";

export type IMcpToolContext = { request: any };

export interface IMcpTool<Payload = any, Result = any> {
  name: string;
  description?: string;
  inputSchema?: object | object[];
  execute(input: Payload, context: IMcpToolContext): Promise<Result>;
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
