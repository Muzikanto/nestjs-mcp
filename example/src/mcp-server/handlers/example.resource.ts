import { IMcpResource, McpResource } from '@muzikanto/nestjs-mcp';
import { UseFilters, UseGuards, UseInterceptors } from '@nestjs/common';
import { TestGuard } from '../lifecicle/test.guard';
import { TestInterceptor } from '../lifecicle/test.interceptor';
import { TestFilter } from '../lifecicle/test.filter';

@UseGuards(TestGuard)
@UseInterceptors(TestInterceptor)
@UseFilters(TestFilter)
@McpResource()
export class ExampleResource implements IMcpResource<{ userId: string }> {
  name = 'users.get';
  uri = 'users://user/{userId}';
  title = 'Get test user';
  description = 'Get user by id';

  async execute(url: URL, input: { userId: string }) {
    return [{ uri: url.href, text: `Hello ${input.userId}` }];
  }
}
