import { IMcpResource, McpResource } from '@muzikanto/nestjs-mcp';
import { UseFilters, UseGuards, UseInterceptors } from '@nestjs/common';
import { TestGuard } from '../lifecicle/test.guard';
import { TestInterceptor } from '../lifecicle/test.interceptor';
import { TestFilter } from '../lifecicle/test.filter';

@UseGuards(TestGuard)
@UseInterceptors(TestInterceptor)
@UseFilters(TestFilter)
@McpResource()
export class ExampleWithInitialResource implements IMcpResource<{
  userId: string;
}> {
  name = 'users.find';
  uri = 'users://list';
  title = 'Find all user';

  async execute(url: URL) {
    return [{ uri: url.href, text: 'Hello for all' }];
  }

  async list() {
    return [
      {
        uri: 'users://user/1',
        name: 'list one',
      },
    ];
  }
}
