import { ApiProperty } from "@nestjs/swagger";
import { McpPromptMessageDto } from "./McpPromptMessage";

export class McpPromptMessagesDto {
  @ApiProperty({
    type: McpPromptMessageDto,
    isArray: true,
    description: "Messages list",
  })
  messages!: McpPromptMessageDto[];
}
