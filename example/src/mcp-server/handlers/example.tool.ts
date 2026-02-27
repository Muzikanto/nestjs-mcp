import { IMcpTool, McpTool } from '@muzikanto/nestjs-mcp';
import {
  NotImplementedException,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { TestGuard } from '../lifecicle/test.guard';
import z from 'zod/v3';
import { TestInterceptor } from '../lifecicle/test.interceptor';
import { TestFilter } from '../lifecicle/test.filter';

const schema = {
  chatId: z.string().describe('Telegram chat id'), // строка с описанием
  text: z.string().describe('Message text'), // строка с описанием
};

@UseFilters(TestFilter)
@UseInterceptors(TestInterceptor)
@UseGuards(TestGuard)
@McpTool()
export class ExampleTool implements IMcpTool<
  { chatId: string; text: string },
  { input: any }
> {
  name = 'telegram.sendMessage';
  title = 'Telegram send';
  description = 'Telegram can sand messages via telegraf';

  inputSchema = schema;

  async execute(input: {
    chatId: string;
    text: string;
  }): Promise<{ input: any }> {
    // throw new NotImplementedException();
    return { input };
  }
}
