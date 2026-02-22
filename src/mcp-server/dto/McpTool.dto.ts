import { ApiProperty } from "@nestjs/swagger";

export class McpToolDto {
  @ApiProperty({ type: "string", description: "Tool name" })
  name!: string;

  @ApiProperty({
    type: "string",
    description: "Tool description",
    nullable: true,
  })
  description?: string;

  @ApiProperty({
    type: "object",
    description: "Tool validation schema",
    nullable: true,
    additionalProperties: false,
  })
  parameters!: any;
}
