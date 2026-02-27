import { ApiProperty } from "@nestjs/swagger";

export class McpResourceResultItemDto {
  @ApiProperty({ type: "string", description: "Resource uri" })
  uri!: string;

  @ApiProperty({
    type: "string",
    description: "Resource text",
    nullable: true,
  })
  text!: string;
}
