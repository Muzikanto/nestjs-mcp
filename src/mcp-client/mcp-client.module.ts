import { Module, Provider, Type } from "@nestjs/common";
import { McpClientService } from "./mcp-client.service";
import { MCP_CLIENT_CONFIG } from "../mcp-server/utils/inject-tokens";
import { HttpModule } from "@nestjs/axios";

export interface IMcpClientConfig {
  url: string;
}

@Module({})
export class McpClientModule {
  static forRoot(metadata: {
    useValue?: IMcpClientConfig;
    useExisting?: Type<IMcpClientConfig>;
    useFactory?: (...args: any) => IMcpClientConfig | Promise<IMcpClientConfig>;
  }) {
    const configProvider: Provider<IMcpClientConfig> = {
      provide: MCP_CLIENT_CONFIG,
      ...(metadata.useValue
        ? { useValue: metadata.useValue }
        : metadata.useExisting
          ? { useExisting: metadata.useExisting }
          : { useFactory: metadata.useFactory }),
    } as Provider<IMcpClientConfig>;

    return {
      module: McpClientModule,
      implements: [
        HttpModule.registerAsync({
          inject: [MCP_CLIENT_CONFIG],
          useFactory: (config: IMcpClientConfig) => {
            return { baseUrl: config.url };
          },
        }),
      ],
      providers: [McpClientService, configProvider],
    };
  }
}
