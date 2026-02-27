import { ApiProperty } from "@nestjs/swagger";

export class McpResourceRequestDto {
  @ApiProperty({ type: "string", description: "Resource uri" })
  uri!: string;
}
