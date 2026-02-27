import { ApiProperty } from "@nestjs/swagger";
import { McpResourceItemDto } from "./McpResourceItem.dto";

export class McpResourceItemsDto {
  @ApiProperty({
    type: McpResourceItemDto,
    isArray: true,
    description: "Resource result list",
  })
  contents!: McpResourceItemDto[];
}
