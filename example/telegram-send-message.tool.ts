import { IMcpTool, McpTool } from '@muzikanto/nestjs-mcp';
// @ts-ignore
import { Telegraf } from 'telegraf';
import z from 'zod';
import { UseGuards, UseInterceptors } from '@nestjs/common';
import { ExampleInterceptor } from './example.interceptor';
import { ExampleGuard } from './example.guard';

const schema = {
  chatId: z.string().describe('Telegram chat id'),  // строка с описанием
  text: z.string().describe('Message text'),  // строка с описанием
};

@UseInterceptors(ExampleInterceptor)
@UseGuards(ExampleGuard)
@McpTool()
export class TelegramSendMessageTool implements IMcpTool<
  { chatId: string; text: string },
  { success: boolean }
> {
  name = 'telegram.sendMessage';

  inputSchema = schema;

  constructor(private readonly bot: Telegraf) {}

  async execute(input: { chatId: string; text: string }) {
    await this.bot.telegram.sendMessage(input.chatId, input.text);
    return { success: true };
  }
}