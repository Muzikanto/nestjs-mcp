import { HttpService } from "@nestjs/axios";
import { Inject, Injectable } from "@nestjs/common";
import { McpToolsDto } from "../mcp-server/dto/McpTools.dto";
import { McpPromptsDto } from "../mcp-server/dto/McpPrompts.dto";
import { McpPromptMessagesDto } from "../mcp-server/dto/McpPromptMessages.dto";

@Injectable()
export class McpClientService {
  constructor(private readonly httpService: HttpService) {}

  // Получить все инструменты
  async getAllTools(): Promise<McpToolsDto> {
    const response = await this.httpService.get("/mcp/tools").toPromise();
    return response.data;
  }

  // Получить все подсказки
  async getAllPrompts(): Promise<McpPromptsDto> {
    const response = await this.httpService.get("/mcp/prompts").toPromise();
    return response.data;
  }

  // Получить подсказку по имени
  async getPromptByName<Payload = any>(
    promptName: string,
    params: Payload,
  ): Promise<McpPromptMessagesDto> {
    const response = await this.httpService
      .post(`/mcp/prompts/${promptName}`, params)
      .toPromise();
    return response.data;
  }

  // Вызвать инструмент MCP
  async callMcpTool<Payload = any, Result = any>(
    toolName: string,
    payload: Payload,
  ): Promise<Result> {
    const response = await this.httpService
      .post(
        "/mcp/tools",
        { type: toolName, payload },
        { headers: { "Content-Type": "application/json" } },
      )
      .toPromise();
    return response.data;
  }
}
