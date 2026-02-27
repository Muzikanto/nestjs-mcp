import { McpDynamicService } from '@muzikanto/nestjs-mcp';
import { Injectable } from '@nestjs/common';
import { TestGuard } from './lifecicle/test.guard';
import { TestInterceptor } from './lifecicle/test.interceptor';

@Injectable()
export class DynamicService {
  constructor(protected readonly mcpDynamicService: McpDynamicService) {}

  onModuleInit() {
    this.mcpDynamicService.registerTool({
      name: 'dynamic_tool',
      title: 'Dynamic tool',
      execute: () => Promise.resolve('test'),
      guards: [TestGuard],
      interceptors: [TestInterceptor],
    });

    this.mcpDynamicService.registerPrompt({
      name: 'dynamic_prompt',
      title: 'Dynamic prompt',
      execute: () => Promise.resolve([{ role: 'assistant', content: 'test' }]),
      guards: [TestGuard],
      interceptors: [TestInterceptor],
    });

    this.mcpDynamicService.registerResource<{ testId: string }>({
      name: 'dynamic_resource',
      title: 'Dynamic resource',
      uri: 'dynamic://test/{testId}',
      execute: (uri, input) =>
        Promise.resolve([{ uri: uri.href, text: `ID: ${input.testId}` }]),
      guards: [TestGuard],
      interceptors: [TestInterceptor],
      list: async () => {
        return [{ uri: 'dynamic://test/1', name: 'dynamice_1', title: 'Dynamic 1' }];
      }
    });
  }
}
