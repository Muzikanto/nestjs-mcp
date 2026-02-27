import { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import {
  Resource,
  ServerNotification,
  ServerRequest,
  ToolAnnotations,
} from "@modelcontextprotocol/sdk/types.js";
import { Injectable } from "@nestjs/common";
import "reflect-metadata";

export type IMcpResourceResult = {
  uri: string;
  text: string;
};

export type IMcpResourceListItem = {
  name: string;
  uri: string;
  title?: string;
  description?: string;
};

export interface IMcpResource<Payload = any> {
  name: string;
  uri: string;
  title?: string;
  description?: string;
  annotations?: Resource["annotations"];
  _meta?: Resource["_meta"];
  execute(url: URL, input: Payload): Promise<IMcpResourceResult[]>;
  list?(
    extra: RequestHandlerExtra<ServerRequest, ServerNotification>,
  ): Promise<IMcpResourceListItem[]>;
}

export const MCP_RESOURCE_METADATA = "mcp:resource-class";

/**
 * Декоратор класса для MCP resource
 */
export const McpResource = () => {
  return (target: any) => {
    Injectable()(target);
    Reflect.defineMetadata(MCP_RESOURCE_METADATA, {}, target);
  };
};
