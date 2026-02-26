import { IMcpResource, McpResource } from '@muzikanto/nestjs-mcp';
import { UseGuards, UseInterceptors } from '@nestjs/common';
import { ExampleInterceptor } from './example.interceptor';
import { ExampleGuard } from './example.guard';

@UseInterceptors(ExampleInterceptor)
@UseGuards(ExampleGuard)
@McpResource()
export class TestResource implements IMcpResource<{ userId: string }> {
  name = 'users.get';
  uri = 'users://user/{userId}';
  title = 'Get test user';
  description = 'Get user by id';

  async execute(url: URL, input: { userId: string }) {
    return [{ uri: url.href, text: `Hello ${input.userId}` }];
  }
}
