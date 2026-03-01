import { Update, Ctx, InjectBot, On } from 'nestjs-telegraf';
import { Telegraf, Context } from 'telegraf';
import { McpClientService } from '@muzikanto/nestjs-mcp';
import { OpenAiService } from 'src/openai/openai.service';
import { McpPromptResultDto } from 'node_modules/@muzikanto/nestjs-mcp/dist/mcp-server/dto/McpPrompResult.dto';

@Update()
export class TelegramService {
  private promptsMap = new Map<string, any>();

  constructor(
    @InjectBot() protected readonly bot: Telegraf,
    private readonly mcpClient: McpClientService,
    private readonly openAiService: OpenAiService,
  ) {}

  async onApplicationBootstrap() {
    setTimeout(async () => {
      const commands = await this.loadCommands();

      // сохраняем для быстрого доступа
      commands.forEach((cmd) => {
        this.promptsMap.set(cmd.command, cmd);
      });

      await this.bot.telegram.setMyCommands(commands);
    }, 2000);
  }

  @On('text')
  async handleText(@Ctx() ctx: Context) {
    try {
      const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';

      if (!text.startsWith('/')) {
        const result = await this.openAiService.execute([{
          role: 'user',
          content: text,
        }]);
        
        if (result.content) {
          await ctx.reply(result.content);
        }
        return;
      }

      const commandName = text.split(' ')[0].replace('/', '');
      const commandText = text.split(' ').slice(1).join(' ');

      if (this.promptsMap.has(commandName)) {
        await this.handleCommand(commandName, commandText, ctx);
      }
    } catch (error) {
      console.error(error as Error);
      await ctx.reply('Error: ' + (error as Error).message);
    }
  }

  private async handleCommand(command: string, text: string, ctx: any) {
    const chatId = ctx.update.message.from.id;

    // можно вызвать MCP prompt
    const result = await this.mcpClient.getPromptByName(command, {
      text,
      chatId,
    });
    const promptResult = await this.handlePrompt(result, ctx);

    if (promptResult.content) {
      await ctx.reply(promptResult.content);
    }
  }

  private async handlePrompt(prompt: McpPromptResultDto, ctx: Context) {
    const messages = prompt.messages.map((message) => ({
      role: message.role as 'user' | 'assistant' | 'system',
      content: message.content || '',
      tool_call: message.tool_call || undefined,
    }));
    const result = await this.openAiService.execute(messages);

    return result;
  }

  private async loadCommands() {
    const commands = await this.mcpClient.getAllPrompts();

    return commands.prompts.map((prompt) => ({
      command: prompt.name,
      description: prompt.description || prompt.title || prompt.name,
    }));
  }
}
