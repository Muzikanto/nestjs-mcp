import { Injectable } from '@nestjs/common';
import { IMcpTool, McpTool } from '../decorators/mcp-tool.decorator';

@McpTool('example')
@Injectable()
export class PaymentTool implements IMcpTool {
  name = 'example';

  static inputSchema = {
    cartId: { type: 'string', description: 'ID корзины' },
  };

  async execute(input: { cartId: string }) {
    return { status: 'confirmed', cartId: input.cartId };
  }
}
