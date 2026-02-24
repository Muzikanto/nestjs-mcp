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
import { McpService } from "./mcp.service";
import { McpMessageDto } from "./dto/McpMessage.dto";
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
} from "@nestjs/swagger";
import { McpToolsDto } from "./dto/McpTools.dto";
import { McpPromptsDto } from "./dto/McpPrompts.dto";
import { McpPromptMessagesDto } from "./dto/McpPromptMessages.dto";
import { Context } from "./utils/context.decorator";
import { MCP_GUARD } from "./utils/inject-tokens";
import { IRequest, IResponse } from "./utils/http-adapter";
import { IMcpConfig, InjectMcpConfig } from "./config";

@Controller("mcp")
export class McpController {
  constructor(
    private readonly service: McpService,
    @Inject(MCP_GUARD) private readonly guard: CanActivate,
    @InjectMcpConfig() private readonly config: IMcpConfig,
  ) {}

  @Get("sse")
  @ApiOperation({
    summary: "Request tool sse",
  })
  async handleSse(@Req() rawReq: any, @Res() rawRes: any) {
    const request = this.config.httpAdapter.getRequest(rawReq);
    const response = this.config.httpAdapter.getResponse(rawRes);
    await this.service.handleSse(request, response);
  }

  @Post("messages")
  @ApiOperation({
    summary: "Handle sse",
  })
  async handleSseMessages(@Req() rawReq: any, @Res() rawRes: any) {
    const request = this.config.httpAdapter.getRequest(rawReq);
    const response = this.config.httpAdapter.getResponse(rawRes);
    await this.service.handleSseMessage(request, response);
  }

  @Post("/tools")
  @Header("Content-Type", "application/json")
  @ApiOperation({
    summary: "Request tool",
  })
  @ApiResponse({
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
  ) {
    await this.checkGuard(context);

    return this.service.sendMessage(body, { request });
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
    type: McpPromptMessagesDto,
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
  ): Promise<McpPromptMessagesDto> {
    await this.checkGuard(context);

    const messages = await this.service.getPrompt(name, body);
    return {
      messages,
    };
  }

  private async checkGuard(context: ExecutionContext) {
    if (!(await this.guard.canActivate(context))) {
      throw new ForbiddenException();
    }
  }
}
