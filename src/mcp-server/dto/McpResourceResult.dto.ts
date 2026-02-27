import { ApiProperty } from "@nestjs/swagger";
import { McpResourceResultItemDto } from "./McpResourceResultItem.dto";

export class McpResourceResultDto {
  @ApiProperty({
    type: McpResourceResultItemDto,
    isArray: true,
    description: "Resource result list",
  })
  contents!: McpResourceResultItemDto[];
}
