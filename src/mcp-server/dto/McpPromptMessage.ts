import { ApiProperty } from "@nestjs/swagger";

export class McpPromptMessageDto {
  @ApiProperty({ type: "string", description: "AI role" })
  role!: string;

  @ApiProperty({
    type: "string",
    description: "Request ai message",
    nullable: true,
  })
  content?: string;

  @ApiProperty({
    type: "object",
    description: "Tool call context",
    nullable: true,
    additionalProperties: false,
  })
  tool_call?: object;
}
