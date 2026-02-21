import { IMcpTool, McpTool } from '../decorators/mcp-tool.decorator';

@McpTool()
export class GetCurrentDate implements IMcpTool<{ country: string; }, { date: string }> {
  name = 'get-date';

  inputSchema = {
    country: { type: 'string', description: 'Страна' },
  };

  async execute(input: { country: string }) {
    return { date: new Date().toLocaleString() };
  }
}
