import { IMcpTool, McpTool } from '../decorators/mcp-tool.decorator';

@McpTool()
export class GetCurrentDate implements IMcpTool<{ country: string; }, { date: string }> {
  name = 'get-date';

  inputSchema = {
    "type": "object",
    "properties": {
      "country": { "type": "string", "description": "Country" }
    },
    "required": ["country"]
  };

  async execute(input: { country: string }) {
    return { date: new Date().toLocaleString() };
  }
}
