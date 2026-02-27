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
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
} from "@nestjs/swagger";
import { Context } from "../utils/context.decorator";
import { MCP_GUARD } from "../utils/inject-tokens";
import { IMcpConfig, InjectMcpConfig } from "../config";
import { firstValueFrom } from "rxjs";
import { McpSseService } from "../services/mcp.sse.service";

@Controller("mcp")
export class McpSseController {
  constructor(
    private readonly service: McpSseService,
    @Inject(MCP_GUARD) private readonly guard: CanActivate,
    @InjectMcpConfig() private readonly config: IMcpConfig,
  ) {}

  @Get("sse")
  @ApiOperation({
    summary: "Request tool sse",
  })
  async handleSse(
    @Req() rawReq: any,
    @Res() rawRes: any,
    @Context() context: ExecutionContext,
  ) {
    await this.checkGuard(context);

    const request = this.config.httpAdapter.getRequest(rawReq);
    const response = this.config.httpAdapter.getResponse(rawRes);
    await this.service.handleSse(request, response, context);
  }

  @Post("messages")
  @ApiOperation({
    summary: "Handle sse",
  })
  async handleSseMessages(
    @Req() rawReq: any,
    @Res() rawRes: any,
    @Context() context: ExecutionContext,
  ) {
    await this.checkGuard(context);

    const request = this.config.httpAdapter.getRequest(rawReq);
    const response = this.config.httpAdapter.getResponse(rawRes);
    await this.service.handleSseMessage(request, response);
  }

  private async checkGuard(context: ExecutionContext) {
    if (!(await this.guard.canActivate(context))) {
      throw new ForbiddenException();
    }
  }
}
