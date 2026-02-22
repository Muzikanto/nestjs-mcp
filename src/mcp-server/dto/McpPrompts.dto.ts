import { ApiProperty } from "@nestjs/swagger";
import { McpPromptDto } from "./McpPrompt.dto";

export class McpPromptsDto {
  @ApiProperty({
    type: McpPromptDto,
    isArray: true,
    description: "Prompts list",
  })
  prompts!: McpPromptDto[];
}
