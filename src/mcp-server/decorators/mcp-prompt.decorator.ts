import { Injectable } from "@nestjs/common";
import "reflect-metadata";

export type IMcpPromptMessage = {
  role: string;
  content?: string;
  tool_call?: { name: string; arguments: object };
};

export interface IMcpPrompt<
  Payload = any,
  Result extends IMcpPromptMessage[] = IMcpPromptMessage[],
> {
  name: string;
  description?: string;
  inputSchema?: object | object[];
  execute(input: Payload): Promise<Result>;
}

export const MCP_PROMPT_METADATA = "mcp:prompt-class";

/**
 * Декоратор класса для MCP prompt
 */
export const McpPrompt = () => {
  return (target: any) => {
    Injectable()(target);
    Reflect.defineMetadata(MCP_PROMPT_METADATA, {}, target);
  };
};
