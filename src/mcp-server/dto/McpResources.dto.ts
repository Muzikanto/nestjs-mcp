import { ApiProperty } from "@nestjs/swagger";
import { McpPromptDto } from "./McpPrompt.dto";
import { McpResourceDto } from "./McpResource.dto";

export class McpResourcesDto {
  @ApiProperty({
    type: McpResourceDto,
    isArray: true,
    description: "Resources list",
  })
  resources!: McpResourceDto[];
}
