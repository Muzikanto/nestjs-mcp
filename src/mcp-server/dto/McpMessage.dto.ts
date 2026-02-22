import { ApiProperty } from "@nestjs/swagger";
import { McpMessage } from "../mcp.service";

export class McpMessageDto implements McpMessage {
  @ApiProperty({ type: "string", description: "Tool name" })
  type!: string;

  @ApiProperty({ description: "Tool handler payload" })
  payload!: any;
}
