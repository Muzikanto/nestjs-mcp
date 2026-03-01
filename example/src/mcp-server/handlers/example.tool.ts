import { IMcpTool, IMcpToolResult, McpTool } from '@muzikanto/nestjs-mcp';
import {
  NotImplementedException,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { TestGuard } from '../lifecicle/test.guard';
import { z } from 'zod/v3';
import { TestInterceptor } from '../lifecicle/test.interceptor';
import { BadRequestFilter, AuthFilter, TelegramNoChatFilter } from '../lifecicle/test.filter';
import { Telegraf } from 'telegraf';
import { InjectBot } from 'nestjs-telegraf';

const inputSchema = {
  chatId: z.number().describe('Telegram chat id'), // строка с описанием
  text: z.string().describe('Message text'), // строка с описанием
};

const outputSchema = {
  success: z.boolean().describe('Success'),
};

@UseFilters(AuthFilter, BadRequestFilter, TelegramNoChatFilter)
@UseInterceptors(TestInterceptor)
@UseGuards(TestGuard)
@McpTool()
export class ExampleTool implements IMcpTool<
  { chatId: number; text: string },
  { success: true }
> {
  name = 'telegram.sendMessage';
  title = 'Telegram send';
  description = 'Telegram can sand messages via telegraf';
  inputSchema = inputSchema;
  outputSchema = outputSchema;

  constructor(@InjectBot() protected readonly bot: Telegraf) {}

  async execute(input: {
    chatId: number;
    text: string;
  }): Promise<IMcpToolResult<{ success: true }>> {
    await this.bot.telegram.sendMessage(input.chatId, input.text);

    return {
      structuredContent: { success: true },
      messages: [
        {
          type: 'text',
          text: `Success sent message to user ${input.chatId}. Please wait`,
        },
      ],
    };
  }
}
