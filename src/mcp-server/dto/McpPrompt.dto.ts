import { ApiProperty } from "@nestjs/swagger";

export class McpPromptDto {
  @ApiProperty({ type: "string", description: "Propmt name" })
  name!: string;

  @ApiProperty({
    type: "string",
    description: "Propmt description",
    nullable: true,
  })
  description?: string;
}
