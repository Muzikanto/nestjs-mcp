import { IMcpPrompt, IMcpPromptResult, McpPrompt } from '@muzikanto/nestjs-mcp';
import { UseFilters, UseGuards, UseInterceptors } from '@nestjs/common';
import { z } from 'zod/v3';
import { TestGuard } from '../lifecicle/test.guard';
import { TestInterceptor } from '../lifecicle/test.interceptor';
import { TestFilter } from '../lifecicle/test.filter';

const schema = {
  chatId: z.string().describe('Telegram chat id'), // строка с описанием
  text: z.string().describe('Message text'), // строка с описанием
};

@UseGuards(TestGuard)
@UseInterceptors(TestInterceptor)
@UseFilters(TestFilter)
@McpPrompt()
export class ExamplePrompt implements IMcpPrompt<{
  text: string;
  chatId: number;
}> {
  name = 'telegram_auto_reply';
  title = 'Telegram auto reply';
  description =
    'Generate a short, fiendly reply to an incoming Telegram message and send it back to the same chat using teegram.sendMessage tool';
  inputSchema = schema;

  async execute({ text, chatId }: { text: string; chatId: number }): Promise<IMcpPromptResult> {
    return {
      description: 'Some description',
      messages: [
        {
          role: 'system' as const,
          content: `You are a friendly Telegram bot. Reply briefly and to the point.`,
        },
        {
          role: 'user' as const,
          content: text,
        },
        {
          role: 'assistant' as const,
          tool_call: {
            name: 'telegram.sendMessage',
            arguments: {
              chatId,
              text: '{{model_output}}',
            },
          },
        },
      ],
    };
  }
}
