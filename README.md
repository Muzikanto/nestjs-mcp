# @muzikanto/nestjs-mcp

[![npm](https://img.shields.io/npm/v/@muzikanto/nestjs-mcp)](https://www.npmjs.com/package/@muzikanto/nestjs-mcp)
[![downloads](https://img.shields.io/npm/dt/@muzikanto/nestjs-mcp)](<(https://www.npmjs.com/package/@muzikanto/nestjs-mcp)>)
[![GitHub stars](https://img.shields.io/github/stars/Muzikanto/nestjs-mcp?style=social)](https://github.com/Muzikanto/nestjs-mcp)
[![License](https://img.shields.io/npm/l/@muzikanto/nestjs-mcp)](https://github.com/Muzikanto/nestjs-mcp/blob/main/LICENSE)

NestJS MCP (Model Context Protocol) module — allows you to create “tools”, “prompts”, “resources” for LLM or HTTP, with automatic detection via decorators, validation, and integration with OpenAI Function Calls.

---

## Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
  - [Connecting the MCP module](#connecting-the-mcp-module)
  - [Create MCP tool](#create-mcp-tool)
  - [Create MCP prompt](#create-mcp-prompt)
  - [Create MCP resource](#create-mcp-resource)
  - [Dynamic creation](#dynamic-creation)
  - [Calling MCP tools via HTTP](#calling-mcp-tools-via-http)
  - [Calling MCP prompt via HTTP](#obtain-prompt)
  - [Calling MCP resource via HTTP](#obtain-resource)
  - [Obtaining all tools](#obtaining-all-tools)
  - [Obtaining all prompts](#obtaining-all-prompts)
  - [Obtaining all resources](#obtaining-all-resources)
  - [Guards](#guards)
    - [For one](#for-one)
    - [For all](#for-all)
  - [Interceptors](#interceptors)
    - [For one](#for-one-1)
    - [For all](#for-all-1)
  - [Filters](#filters)
  - [Integration with OpenAI Function Calls](#integration-with-openai-function-calls)

## Features

- Register MCP tools using the `@McpTool()` decorator
- Register MCP prompts using the `@McpPrompt()` decorator
- Automatic detection of all providers (tools) in the module
- Input data validation
- SSE endpoints for MCP (`GET /mcp/sse, POST /mcp/messages`)
- Endpoint for calling a tool (`POST /mcp/tools`)
- Endpoint for a list of all tools (`GET /mcp/tools`)
- Endpoint for calling a prompt (`POST /mcp/prompts/:name`)
- Endpoint for a list of all prompts (`GET /mcp/prompts`)
- Easy integration with LLM (OpenAI Function Calls)
- Support http adapters (default fastify)
- Full TypeScript typing
- Support `@UseGuards`, `@UseInterceptors`, `@UseFilters`

---

## Installation

```bash
yarn add @muzikanto/nestjs-mcp
```

Peer dependencies: `@nestjs/common, @nestjs/core, @nestjs/swagger, @nestjs/axios, reflect-metadata`

## Usage

### Connecting the MCP module

```ts
import { Module } from "@nestjs/common";
import { McpModule } from "@muzikanto/nestjs-mcp";
import { TelegramSendMessageTool } from "./tools/telegram-send-message.tool";
import { TelegramAutoReplyPrompt } from "./prompts/telegram-auto-reply.prompt";

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
import { IMcpTool, McpTool } from "@muzikanto/nestjs-mcp";
import { Telegraf } from "telegraf";
import z from "zod/v3";

const schema = {
  chatId: z.number().describe("Telegram chat id"), // строка с описанием
  text: z.string().describe("Message text"), // строка с описанием
};

@McpTool()
export class TelegramSendMessageTool implements IMcpTool<
  { chatId: string; text: string },
  { success: boolean }
> {
  name = "telegram.sendMessage";
  inputSchema = schema;

  constructor(private readonly bot: Telegraf) {}

  async execute(input: { chatId: string; text: string }) {
    await this.bot.telegram.sendMessage(input.chatId, input.text);
    return {
      structuredContent: { success: true },
      messages: [{ type: "text", text: "Success sent to user" }],
    };
  }
}
```

### Calling MCP tools via HTTP

POST /mcp/tools

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
  "structuredContent": {
    "success": true
  },
  "messages": [{ "type": "text", "text": "Success sent to user" }]"
}
```

### Obtaining all tools

GET /mcp/tools

```json
{
  "tools": [
    {
      "name": "telegram.sendMessage",
      "description": "Sent message via Telegram",
      "inputSchema": {
        "type": "object",
        "properties": {
          "chatId": {
            "type": "number",
            "description": "Telegram chat ID"
          },
          "text": {
            "type": "string",
            "description": "Message text"
          }
        },
        "required": ["chatId", "text"]
      }
    }
  ]
}
```

### Create MCP prompt

```ts
import { IMcpPrompt, McpPrompt } from "@muzikanto/nestjs-mcp";
import z from "zod/v3";

const schema = {
  chatId: z.number().describe("Telegram chat id"), // строка с описанием
  text: z.string().describe("Message text"), // строка с описанием
};

@McpPrompt()
export class TelegramAutoReplyPrompt implements IMcpPrompt<{
  text: string;
  chatId: number;
}> {
  name = "telegram_auto_reply";
  description =
    "Generate a short, friendly reply to an incoming Telegram message and send it back to the same chat using telegram.sendMessage tool";
  schema = schema;

  async execute({ text, chatId }: { text: string; chatId: number }) {
    return {
      messages: [
        {
          role: "system",
          content: `You are a friendly Telegram bot. Reply briefly and to the point.`,
        },
        {
          role: "user",
          content: text,
        },
        {
          role: "assistant",
          tool_call: {
            name: "telegram.sendMessage",
            arguments: {
              chatId,
              text: "{{model_output}}",
            },
          },
        },
      ],
    };
  }
}
```

### Obtaining all prompts

GET /mcp/prompts

```json
{
  "prompts": [
    {
      "name": "telegram_auto_reply",
      "description": "Generate a short, friendly reply to an incoming Telegram message and send it back to the same chat using telegram.sendMessage tool",
      "inputSchema": {
        "type": "object",
        "properties": {
          "chatId": {
            "type": "number",
            "description": "Telegram chat ID"
          },
          "text": {
            "type": "string",
            "description": "Message text"
          }
        },
        "required": ["chatId", "text"]
      }
    }
  ]
}
```

### Calling MCP prompt via HTTP

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

### Create MCP resource

```ts
import { IMcpResource, McpResource } from "@muzikanto/nestjs-mcp";

@McpResource()
export class TestResource implements IMcpResource<{ userId: string }> {
  name = "users.get";
  uri = "users://{userId}";
  title = "Get test user";
  description = "Get user by id";

  async execute(uri: string, vars: { userId: string }) {
    return [{ uri, text: `Hello ${vars.userId}` }];
  }
}
```

### Calling MCP resource via HTTP

POST /mcp/resources/users.get

```json
{
  "uri": "users://user/1"
}
```

Response

```json
{
  "contents": [
    {
      "uri": "users://user/1",
      "content": "Hello 1"
    }
  ]
}
```

### Obtaining all resources

GET /mcp/resources

```json
{
  "resources": [
    {
      "name": "users.get",
      "title": "Get user by id",
      "uri": "users://user/{userId}"
    }
  ]
}
```

### Dynamic creation

```ts
import { McpDynamicService } from "@muzikanto/nestjs-mcp";
import { Injectable } from "@nestjs/common";
import { ExampleInterceptor } from "./example.interceptor";
import { ExampleGuard } from "./example.guard";

@Injectable()
export class McpDynamic {
  constructor(protected readonly mcpDynamicService: McpDynamicService) {}

  onModuleInit() {
    this.mcpDynamicService.registerTool({
      name: "dynamic_tool",
      title: "Dynamic tool",
      execute: () =>
        Promise.resolve({
          structuredContent: { text: "test" },
          messages: [{ type: "text" as const, text: "test" }],
        }),
      guards: [ExampleGuard],
      interceptors: [ExampleInterceptor],
    });

    this.mcpDynamicService.registerPrompt({
      name: "dynamic_prompt",
      title: "Dynamic prompt",
      execute: () =>
        Promise.resolve({ messages: [{ role: "assistant", content: "test" }] }),
      guards: [ExampleGuard],
      interceptors: [ExampleInterceptor],
    });

    this.mcpDynamicService.registerResource<{ testId: string }>({
      name: "dynamic_resource",
      title: "Dynamic resource",
      uri: "dynamic://test/{testId}",
      execute: (uri, input) =>
        Promise.resolve([{ uri: uri.href, text: `ID: ${input.testId}` }]),
      guards: [ExampleGuard],
      interceptors: [ExampleInterceptor],
      list: async () => {
        return [
          { uri: "dynamic://test/1", name: "dynamice_1", title: "Dynamic 1" },
        ];
      },
    });
  }
}
```

### Guards

### For one

```ts
import { IMcpTool, McpTool } from "@muzikanto/nestjs-mcp";
import { UseGuards } from "@nestjs/common";
import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Observable } from "rxjs";

@Injectable()
class TestGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    console.log("TestGuard called");
    return true;
  }
}

@UseGuards(TestGuard)
@McpTool()
export class TelegramSendMessageTool implements IMcpTool<
  { chatId: string; text: string },
  { success: boolean }
> {
  name = "telegram.sendMessage";

  async execute() {
    // await this.bot.telegram.sendMessage(input.chatId, input.text);
    return {
      structuredContent: { success: true },
      messages: { type: "text", text: "Success sent" },
    };
  }
}
```

#### For all

```ts
import { McpModule } from "@muzikanto/nestjs-mcp";
import { Module } from "@nestjs/common";
import { TestGuard } from "./other/test.guard";
import { ToolWithoutGuards } from "./test.tool";
import { APP_GUARD } from "@nestjs/core";

@Module({
  imports: [
    McpModule.forRoot({
      providers: [
        ToolWithoutGuards,
        TestGuard,
        { provide: APP_GUARD, useExisting: TestGuard },
      ],
    }),
  ],
})
export class TestModule {}
```

### Interceptors

#### For one

```ts
import { IMcpTool, McpTool } from "@muzikanto/nestjs-mcp";
import {
  ExecutionContext,
  NestInterceptor,
  CallHandler,
  Injectable,
  UseInterceptors,
} from "@nestjs/common";
import { map } from "rxjs";

@Injectable()
export class ExampleInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    console.log("Before execute");

    return next.handle().pipe(
      map((data: unknown) => {
        console.log("After execute", data);

        return data;
      }),
    );
  }
}

@UseInterceptors(ExampleInterceptor)
@McpTool()
export class TelegramSendMessageTool implements IMcpTool<
  { chatId: string; text: string },
  { success: boolean }
> {
  name = "telegram.sendMessage";

  async execute() {
    // await this.bot.telegram.sendMessage(input.chatId, input.text);
    return {
      success: true,
      messagse: [{ type: "text", text: "Success sent" }],
    };
  }
}
```

#### For all

```ts
import { McpModule } from "@muzikanto/nestjs-mcp";
import { Module } from "@nestjs/common";
import { TestInterceptor } from "./other/test.interceptor";
import { ToolWithoutInterceptors } from "./test.tool";
import { APP_INTERCEPTOR } from "@nestjs/core";

@Module({
  imports: [
    McpModule.forRoot({
      providers: [
        ToolWithoutInterceptors,
        TestInterceptor,
        { provide: APP_INTERCEPTOR, useExisting: TestInterceptor },
      ],
    }),
  ],
})
export class TestModule {}
```

### Filters

```ts
import {
  IMcpTool,
  McpTool,
  McpUnauthorizedException,
} from "@muzikanto/nestjs-mcp";
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  UseFilters,
} from "@nestjs/common";

@Catch(NotImplementedException)
class NotImplExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    return {
      isError: true,
      text: (exception as Error).message,
    };
  }
}

@Catch(McpUnauthorizedException)
class AuthExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    return {
      isError: true,
      text: (exception as Error).message,
    };
  }
}

@UseGuards(AuthGuard)
@UseFilters(AuthExceptionFilter, NotImplExceptionFilter)
@McpTool()
export class TelegramSendMessageTool implements IMcpTool<
  { chatId: string; text: string },
  { success: boolean }
> {
  name = "telegram.sendMessage";

  async execute() {
    throw new NotImplementedException();
  }
}
```

### Integration with OpenAI Function Calls

```ts
import axios from "axios";
import OpenAI from "openai";

const MCP_TOOLS_URL = "http://localhost:3000/mcp/tools";
const MCP_TELEGRAM_PROMPT_URL =
  "http://localhost:3000/mcp/prompts/telegram_auto_reply";

// Create OpenAI client
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Get all tools
 */
async function getMcpTools() {
  const response = await axios.get(MCP_TOOLS_URL);
  return response.data.tools.map((el) => ({
    name: el.name,
    description: el.description,
    parameters: el.inputSchema,
  }));
}

/**
 * Get all prompts
 */
async function getMcpPrompt() {
  const response = await axios.post(MCP_TELEGRAM_PROMPT_URL, {
    /* prompt generation arguments */
  });
  return response.data;
}

/**
 * Request mcp tool
 */
async function callMcpTool(toolName: string, payload: Record<string, any>) {
  const response = await axios.post(MCP_TOOLS_URL, { type: toolName, payload });
  return response.data;
}

/**
 * Example
 */
(async () => {
  const toolsResponse = await getMcpTools();
  const promptResponse = await getMcpPrompt();

  const completion = await client.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: promptResponse.messages,
    functions: toolsResponse.tools,
    function_call: "auto",
  });

  const message = completion.choices[0].message;

  if (message.function_call) {
    const { name, arguments: argsJson } = message.function_call;
    const args = JSON.parse(argsJson);

    const { messages, structuredContent } = await callMcpTool(name, args);
    console.log("Result from MCP tool:", messages, structuredContent);
  }
})();
```

## Contributing

Contributions are welcome! Please open issues or submit PRs.

## Changelog

See [CHANGELOG](https://github.com/Muzikanto/nestjs-mcp/blob/main/CHANGELOG.md) for detailed version history and updates.
