import {
  Controller,
  Post,
  Body,
  Header,
  Get,
  Param,
  Request,
  ExecutionContext,
  Inject,
  CanActivate,
  ForbiddenException,
  Query,
  Req,
  Res,
} from "@nestjs/common";
import { McpService } from "../services/mcp.service";
import { McpMessageDto } from "../dto/McpMessage.dto";
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
} from "@nestjs/swagger";
import { McpToolsDto } from "../dto/McpTools.dto";
import { McpPromptsDto } from "../dto/McpPrompts.dto";
import { McpPromptResultDto } from "../dto/McpPrompResult.dto";
import { Context } from "../utils/context.decorator";
import { MCP_GUARD } from "../utils/inject-tokens";
import { IMcpConfig, InjectMcpConfig } from "../config";
import { firstValueFrom, observable } from "rxjs";
import { McpResourceDto } from "../dto/McpResource.dto";
import { McpResourcesDto } from "../dto/McpResources.dto";
import { McpResourceResultDto } from "../dto/McpResourceResult.dto";
import { McpResourceRequestDto } from "../dto/McpResourceRequest.dto";
import { extractResourceParams } from "../utils/uri";
import { McpToolResultDto } from "../dto/McpToolResult.dto";

@Controller("mcp")
export class McpController {
  constructor(
    private readonly service: McpService,
    @Inject(MCP_GUARD) private readonly guard: CanActivate,
    @InjectMcpConfig() private readonly config: IMcpConfig,
  ) {}

  @Post("/tools")
  @Header("Content-Type", "application/json")
  @ApiOperation({
    summary: "Request tool",
  })
  @ApiResponse({
    type: McpToolResultDto,
    status: 200,
    description: "Tool execution result",
  })
  @ApiBadRequestResponse({
    description: "Invalid request body",
  })
  @ApiForbiddenResponse({
    description: "No access to method",
  })
  async handleTool(
    @Body() body: McpMessageDto,
    @Request() request: any,
    @Context() context: ExecutionContext,
  ): Promise<McpToolResultDto> {
    await this.checkGuard(context);

    const observable = await this.service.executeTool(body, context);
    const result = await firstValueFrom(observable);
    return result;
  }

  @Get("tools")
  @ApiOperation({
    summary: "Get tool list",
  })
  @ApiResponse({
    status: 200,
    description: "Tools list",
    type: McpToolsDto,
  })
  @ApiForbiddenResponse({
    description: "No access to method",
  })
  async getTools(@Context() context: ExecutionContext): Promise<McpToolsDto> {
    await this.checkGuard(context);

    const tools = this.service.listTools();
    return { tools };
  }

  @Get("prompts")
  @ApiOperation({
    summary: "Get prompt list",
  })
  @ApiResponse({
    status: 200,
    description: "Prompts list",
    type: McpPromptsDto,
  })
  @ApiForbiddenResponse({
    description: "No access to method",
  })
  async getPrompts(
    @Context() context: ExecutionContext,
  ): Promise<McpPromptsDto> {
    await this.checkGuard(context);

    const prompts = this.service.listPrompts();
    return { prompts };
  }

  @Post("prompts/:name")
  @ApiOperation({
    summary: "Generate messages by prompt name",
  })
  @ApiBody({
    description: "Any body structure",
    type: Object, // Указываем, что тело может быть любым объектом
  })
  @ApiResponse({
    status: 200,
    description: "Prompt messages",
    type: McpPromptResultDto,
  })
  @ApiNotFoundResponse({
    description: "Not found prompt",
  })
  @ApiBadRequestResponse({
    description: "Invalid prompt arguments",
  })
  @ApiForbiddenResponse({
    description: "No access to method",
  })
  async getPrompt(
    @Param("name") name: string,
    @Body() body: object,
    @Context() context: ExecutionContext,
  ): Promise<McpPromptResultDto> {
    await this.checkGuard(context);

    const observable = await this.service.executePrompt(name, body, context);
    const result = await firstValueFrom(observable);
    return result;
  }

  @Get("resources/templates")
  @ApiOperation({
    summary: "Get resources templates list",
  })
  @ApiResponse({
    status: 200,
    description: "Resources templates list",
    type: McpResourcesDto,
  })
  @ApiForbiddenResponse({
    description: "No access to method",
  })
  async getResources(
    @Context() context: ExecutionContext,
  ): Promise<McpResourcesDto> {
    await this.checkGuard(context);

    const resources = this.service.listResources();
    return { resources };
  }

  @Post("resources/templates/:name")
  @ApiOperation({
    summary: "Get resource template result",
  })
  @ApiBody({
    description: "Any body structure",
    type: Object, // Указываем, что тело может быть любым объектом
  })
  @ApiResponse({
    status: 200,
    description: "Resource template result",
    type: McpResourceResultDto,
  })
  @ApiNotFoundResponse({
    description: "Not found resource template",
  })
  @ApiForbiddenResponse({
    description: "No access to method",
  })
  async executeResource(
    @Param("name") name: string,
    @Body() body: McpResourceRequestDto,
    @Context() context: ExecutionContext,
  ): Promise<McpResourceResultDto> {
    await this.checkGuard(context);

    const url = new URL(body.uri);
    const resource = this.service.resources.get(name);
    const params = resource
      ? extractResourceParams(resource.instance.uri, body.uri)
      : {};

    const observable = await this.service.executeResource(
      name,
      url,
      params,
      context,
    );
    const result = await firstValueFrom(observable);

    return result;
  }

  private async checkGuard(context: ExecutionContext) {
    if (!(await this.guard.canActivate(context))) {
      throw new ForbiddenException();
    }
  }
}
