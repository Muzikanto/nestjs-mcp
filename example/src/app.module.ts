import { Module } from '@nestjs/common';
import { McpServerModule } from './mcp-server/mcp.module';

@Module({
  imports: [McpServerModule],
})
export class AppModule {}
