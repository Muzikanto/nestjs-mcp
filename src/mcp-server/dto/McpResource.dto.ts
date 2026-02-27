import { ApiProperty } from "@nestjs/swagger";

export class McpResourceDto {
  @ApiProperty({ type: "string", description: "Resource name" })
  name!: string;

  @ApiProperty({ type: "string", description: "Resource uri" })
  uri!: string;

  @ApiProperty({
    type: "string",
    description: "Resource title",
    nullable: true,
  })
  title?: string;

  @ApiProperty({
    type: "string",
    description: "Resource description",
    nullable: true,
  })
  description?: string;
}
