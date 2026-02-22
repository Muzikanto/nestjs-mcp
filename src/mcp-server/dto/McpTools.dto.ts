import { ApiProperty } from "@nestjs/swagger";
import { McpToolDto } from "./McpTool.dto";

export class McpToolsDto {
  @ApiProperty({ type: McpToolDto, isArray: true, description: "Tools list" })
  tools!: McpToolDto[];
}
