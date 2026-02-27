import { McpModule } from '@muzikanto/nestjs-mcp';
import { Module } from '@nestjs/common';
import { ExamplePrompt } from './handlers/example.prompt';
import { ExampleResource } from './handlers/example.resource';
import { ExampleTool } from './handlers/example.tool';
import { ExampleWithInitialResource } from './handlers/example-with-initial.resource';
import { DynamicService } from './dynamic.service';

@Module({
  imports: [
    McpModule.forRoot({
      providers: [
        ExampleWithInitialResource,
        ExampleTool,
        ExampleResource,
        ExamplePrompt,
        DynamicService,
      ],
    }),
  ],
})
export class McpServerModule {}
