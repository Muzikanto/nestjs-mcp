import { ApiProperty } from "@nestjs/swagger";

export class McpResourceItemDto {
  @ApiProperty({ type: "string", description: "Resource uri" })
  uri!: string;

  @ApiProperty({
    type: "string",
    description: "Resource text",
    nullable: true,
  })
  text!: string;
}
