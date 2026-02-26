import { IMcpPrompt, McpPrompt } from "@muzikanto/nestjs-mcp";
import z from "zod";
import { UseGuards, UseInterceptors } from "@nestjs/common";
import { ExampleInterceptor } from "./example.interceptor";
import { ExampleGuard } from "./example.guard";

const schema = {
  chatId: z.string().describe("Telegram chat id"), // строка с описанием
  text: z.string().describe("Message text"), // строка с описанием
};

@UseInterceptors(ExampleInterceptor)
@UseGuards(ExampleGuard)
@McpPrompt()
export class TelegramAutoReplyPrompt implements IMcpPrompt<{
  text: string;
  chatId: number;
}> {
  name = "telegram_auto_reply";
  description =
    "Generate a short, fiendly reply to an incoming Telegram message and send it back to the same chat using teegram.sendMessage tool";

  inputSchema = schema;

  async execute({ text, chatId }: { text: string; chatId: number }) {
    return [
      {
        role: "system",
        content: `You are a friendly Telegram bot. Reply briefly and to the point.`,
      },
      {
        role: "user",
        content: text,
      },
      {
        role: "assistant",
        tool_call: {
          name: "telegram.sendMessage",
          arguments: {
            chatId,
            text: "{{model_output}}",
          },
        },
      },
    ];
  }
}
