# @muzikanto/nestjs-mcp

[![npm](https://img.shields.io/npm/v/@muzikanto/nestjs-mcp)](https://www.npmjs.com/package/@muzikanto/nestjs-mcp)
[![downloads](https://img.shields.io/npm/dt/@muzikanto/nestjs-mcp)]((https://www.npmjs.com/package/@muzikanto/nestjs-mcp))
[![GitHub stars](https://img.shields.io/github/stars/Muzikanto/nestjs-mcp?style=social)](https://github.com/Muzikanto/nestjs-mcp)
[![License](https://img.shields.io/npm/l/@muzikanto/nestjs-mcp)](https://github.com/Muzikanto/nestjs-mcp/blob/main/LICENSE)

NestJS MCP (Model Context Protocol) module — allows you to create “tools” (functions) for LLM or HTTP, with automatic detection via decorators, validation, and integration with OpenAI Function Calls.

---

## Contents
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
  - [Connecting the MCP module](#connecting-the-mcp-module)
  - [Create MCP tool](#create-mcp-tool)
  - [Create MCP prompt](#create-mcp-prompt)
  - [Calling MCP tools via HTTP](#calling-mcp-tools-via-http)
  - [Obtaining all tools](#obtaining-all-tools)
  - [Obtaining all prompts](#obtaining-all-prompts)
  - [Obtain prompt](#obtain-prompt)
  - [Auth guard](#auth-guard)
  - [Integration with OpenAI Function Calls](#integration-with-openai-function-calls)

## Features

- Register MCP tools using the `@McpTool()` decorator
- Register MCP prompts using the `@McpPrompt()` decorator
- Automatic detection of all providers (tools) in the module
- Input data validation
- HTTP endpoint for MCP (`GET /mcp`, `POST /mcp/messages`)  
- HTTP endpoint for calling tools (`POST /mcp/toos`)  
- Endpoint for a list of all tools (`GET /mcp/tools`)  
- Endpoint for a list of all prompts (`GET /mcp/prompts`)  
- Endpoint for prompt (`POST /mcp/prompts/:name`)  
- Easy integration with LLM (OpenAI Function Calls)  
- Full TypeScript typing  

---

## Installation

```bash
yarn add @muzikanto/nestjs-mcp
```

Peer dependencies: `@nestjs/common, @nestjs/core, reflect-metadata`

## Usage

### Connecting the MCP module

```ts
import { Module } from '@nestjs/common';
import { McpModule } from '@muzikanto/nestjs-mcp';
import { TelegramSendMessageTool } from './tools/telegram-send-message.tool';
import { TelegramAutoReplyPrompt } from './prompts/telegram-auto-reply.prompt';

@Module({
  imports: [
    McpModule.forRoot({
      providers: [TelegramSendMessageTool, TelegramAutoReplyPrompt],
    }),
  ],
})
export class AppModule {}
```

### Create MCP tool

```ts
import { IMcpTool, McpTool } from '@muzikanto/nestjs-mcp';
import { Telegraf } from 'telegraf';

@McpTool()
export class TelegramSendMessageTool implements IMcpTool<
  { chatId: string; text: string },
  { success: boolean }
> {
  name = 'telegram.sendMessage';

  inputSchema = {
    type: "object",
    properties: {
      chatId: {
        type: "number",
        description: "Telegram chat id"
      },
      text: {
        type: "string",
        description: "Message text"
      }
    },
    required: ["chatId", "text"]
  };

  constructor(private readonly bot: Telegraf) {}

  async execute(input: { chatId: string; text: string }) {
    await this.bot.telegram.sendMessage(input.chatId, input.text);
    return { success: true };
  }
}
```

### Calling MCP tools via HTTP

POST /mcp

```json
{
  "type": "telegram.sendMessage",
  "payload": {
    "chatId": "...",
    "text": "Hi, how are you ?"
  }
}
```

Ответ 
```json
{
  "data": {
    "success": true
  }
}
```

### Obtaining all tools

GET /mcp/tool

```json
[
  {
    "name": "telegram.sendMessage",
    "description": "Sent message via Telegram",
    "inputSchema": {
      "chatId": {
        "type": "number",
        "description": "Telegram chat ID"
      },
      "text": {
        "type": "string",
        "description": "Message text"
      }
    }
  }
]
```

### Create MCP prompt

```ts
import { IMcpPrompt, McpPrompt } from '@muzikanto/nestjs-mcp';

@McpPrompt()
export class TelegramAutoReplyPrompt implements IMcpPrompt<{ text: string; chatId: number; }> {
  name = 'telegram_auto_reply';
  description = 'Generate a short, fiendly reply to an incoming Telegram message and send it back to the same chat using teegram.sendMessage tool';

  async execute({ text, chatId }: { text: string; chatId: number }) {
    return [
      {
        role: "system",
        content: `You are a friendly Telegram bot. Reply briefly and to the point.`
      },
      {
        role: "user",
        content: text
      },
      {
        role: "assistant",
        tool_call: {
          name: "telegram.sendMessage",
          arguments: {
            chatId,
            text: "{{model_output}}"
          }
        }
      }
    ];
  }
}
```

### Obtaining all prompts

GET /mcp/prompts

```json
[
  {
    "name": "telegram_auto_reply",
    "description": "Generate a short, fiendly reply to an incoming Telegram message and send it back to the same chat using teegram.sendMessage tool"
  }
]
```

### Obtain prompt

POST /mcp/prompts/telegram_auto_reply

```json
{
  "text": "Hi. How are you ?",
  "chatId": 100000000
}
```

Response
```json
{
  "messages": [
      {
        "role": "system",
        "content": "You are a friendly Telegram bot. Reply briefly and to the point."
      },
      {
        "role": "user",
        "content": "Hi. How are you ?"
      },
      {
        "role": "assistant",
        "tool_call": {
          "name": "telegram.sendMessage",
          "arguments": {
            "chatId": 100000000,
            "text": "{{model_output}}"
          }
        }
      }
    ]
}
```

### Auth guard
```ts
import { McpModule } from '@muzikanto/nestjs-mcp';
import { Module, CanActivate, ExecutionContext, Injectable } from "@nestjs/common";

@Injectable()
export class TestGuard implements CanActivate {
    canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest();
      const authHeader = request.headers['authorization'];
    
      return true;
    }
}

@Module({
  imports: [
    McpModule.forRoot({
      guard: TestGuard
    }),
  ],
})
export class AppModule {}
```

### Integration with OpenAI Function Calls

```ts
import axios from 'axios';
import OpenAI from 'openai';

const MCP_TOOLS_URL = 'http://localhost:3000/mcp/tools';
const MCP_TELEGRAM_PROMPT_URL = 'http://localhost:3000/mcp/prompts/telegram_auto_reply';

// Create OpenAI client
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Get all tools
 */
async function getMcpTools() {
  const response = await axios.get(MCP_TOOLS_URL);
  return response.data;
}

/**
 * Get all prompts
 */
async function getMcpPrompt() {
  const response = await axios.post(MCP_TELEGRAM_PROMPT_URL, {/* propmpt generation arguments */});
  return response.data;
}

/**
 * Request mcp tool
 */
async function callMcpTool(toolName: string, payload: Record<string, any>) {
  const response = await axios.post(
    MCP_TOOLS_URL,
    { type: toolName, payload },
    { headers: { 'Content-Type': 'application/json' } }
  );
  return response.data;
}

/**
 * Example
 */
(async () => {
  const toolsResponse = await getMcpTools();
  const promptResponse = await getMcpPrompt();

  const completion = await client.chat.completions.create({
    model: 'gpt-4.1-mini',
    messages: promptResponse.messages,
    functions: toolsResponse.tools,
    function_call: 'auto',
  });

  const message = completion.choices[0].message;

  if (message.function_call) {
    const { name, arguments: argsJson } = message.function_call;
    const args = JSON.parse(argsJson);

    const result = await callMcpTool(name, args);
    console.log('Result from MCP tool:', result);
  }
})();
```

## Contributing
Contributions are welcome! Please open issues or submit PRs.

## Changelog
See [CHANGELOG](https://github.com/Muzikanto/nestjs-mcp/blob/main/CHANGELOG.md) for detailed version history and updates.
