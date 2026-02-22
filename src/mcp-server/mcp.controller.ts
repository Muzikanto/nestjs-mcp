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

@Controller("mcp")
export class McpController {
  constructor(
    private readonly service: McpService,
    @Inject(MCP_GUARD) private readonly guard: CanActivate,
  ) {}

  @Get("/")
  @ApiOperation({
    summary: "Request mcp info",
  })
  @ApiResponse({
    status: 200,
    description: "Mcp info result",
  })
  async handleMcp(@Query() query: any) {
    return {
      jsonrpc: query.jsonrpc,
      id: query.id,
      result: {
        name: "nestjs-mcp",
        version: "1.0.0",
        capabilities: ["http"],
      },
    };
  }

  @Post("/messages")
  @ApiOperation({
    summary: "Request mcp protocol",
  })
  @ApiResponse({
    status: 200,
    description: "Mcp protocol result",
  })
  async handleMessages(@Body() body: any, @Request() request: Request, @Context() context: ExecutionContext) {
    try {
      await this.checkGuard(context);

      if (body.method === "tools/call") {
        const result = await this.service.sendMessage(
          { type: body.params.name, payload: body.params.arguments },
          { request },
        );

        return {
          jsonrpc: body.jsonrpc,
          id: body.id,
          result,
        };
      }
      if (body.method === "tools/list") {
        const tools = await this.service.listTools();

        return {
          jsonrpc: body.jsonrpc,
          id: body.id,
          result: {
            tools: tools.map((el) => ({
              name: el.name,
              description: el.description,
              inputSchema: el.parameters,
            })),
          },
        };
      }
      if (body.method === "prompts/list") {
        const prompts = await this.service.listPrompts();

        return {
          jsonrpc: body.jsonrpc,
          id: body.id,
          result: {
            prompts: prompts.map((el) => ({
              name: el.name,
              description: el.description,
            })),
          },
        };
      }
      if (body.method === "prompts/run") {
        const messages = await this.service.getPrompt(
          body.params.name,
          body.params.arguments,
        );

        return {
          jsonrpc: body.jsonrpc,
          id: body.id,
          result: {
            messages,
          },
        };
      }
    } catch (e) {
      return {
        jsonrpc: body.jsonrpc,
        id: body.id,
        error: {
          code: -32000,
          message: (e as Error).message,
        },
      };
    }

    return {
      jsonrpc: body.jsonrpc,
      id: body.id,
    };
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
