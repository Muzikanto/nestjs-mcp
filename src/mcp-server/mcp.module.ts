import {
  CanActivate,
  DynamicModule,
  Global,
  Module,
  ModuleMetadata,
  Provider,
} from "@nestjs/common";
import { DiscoveryModule } from "@nestjs/core";
import { McpService } from "./mcp.service";
import { McpExplorer } from "./mcp.explorer";
import { McpController } from "./mcp.controller";
import { MCP_GUARD } from "./utils/inject-tokens";

type Metadata = Pick<ModuleMetadata, "providers" | "imports" | "exports"> & {
  guard?: Provider<CanActivate>;
};

const publicGuard: CanActivate = { canActivate: () => Promise.resolve(true) };

@Global()
@Module({})
export class McpModule {
  public static forRoot(metadata: Metadata = {}): DynamicModule {
    const guardProvider: Provider<CanActivate> = metadata.guard
      ? { provide: MCP_GUARD, useExisting: metadata.guard }
      : {
          provide: MCP_GUARD,
          useValue: publicGuard,
        };

    return {
      module: McpModule,
      imports: [DiscoveryModule, ...(metadata.imports || [])],
      providers: [
        McpService,
        McpExplorer,
        guardProvider,
        ...(metadata.guard ? [metadata.guard] : []),
        ...(metadata.providers || []),
      ],
      exports: [McpService, ...(metadata.exports || [])],
      controllers: [McpController],
    };
  }
}
