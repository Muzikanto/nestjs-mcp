# @muzikanto/nestjs-mcp

NestJS MCP (Model Context Protocol) module — allows you to create “tools” (functions) for LLM or HTTP, with automatic detection via decorators, validation, and integration with OpenAI Function Calls.

---

## Features

- Register MCP tools using the `@McpTool()` decorator
- Automatic detection of all providers (tools) in the module
- Input data validation
- HTTP endpoint for calling tools (`POST /mcp`)  
- Endpoint for a list of all tools (`GET /mcp/tools`)  
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
import { PaymentTool } from './tools/payment.tool';

@Module({
  imports: [
    McpModule.forRoot(),
  ],
  providers: [
    PaymentTool,
  ],
})
export class AppModule {}
```

### Create MCP tool

```ts
import { IMcpTool, McpTool } from '../decorators/mcp-tool.decorator';

@McpTool()
export class GetCurrentDate implements IMcpTool<{ country: string; }, { date: string }> {
  name = 'get-date';

  inputSchema = {
    "type": "object",
    "properties": {
      "country": { "type": "string", "description": "Country" }
    },
    "required": ["country"]
  };

  async execute(input: { country: string }) {
    return { date: new Date().toLocaleString() };
  }
}
```

### Calling MCP tools via HTTP

POST /mcp

```json
{
  "type": "get-date",
  "payload": {
    "country": "ru"
  }
}
```

Ответ 
```json
{
  "data": {
    "date": "21/02/2026, 16:17:00"
  }
}
```

### Obtaining all tools

GET /mcp/tool

```json
[
  {
    "name": "get-date",
    "description": "",
    "inputSchema": {
      "country": { "type": "string", "description": "Страна" },
    }
  }
]
```

### Integration with OpenAI Function Calls

```ts
import axios from 'axios';
import OpenAI from 'openai';
import { z } from 'zod';

const MCP_URL = 'http://localhost:3000/mcp';
const MCP_TOOLS_URL = 'http://localhost:3000/mcp/tools';

// Create OpenAI client
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Get all tools
 */
async function listMcpTools() {
  const response = await axios.get(MCP_TOOLS_URL);
  return response.data;
}

/**
 * Request mcp tool
 */
async function callMcpTool(toolName: string, payload: Record<string, any>) {
  const response = await axios.post(
    MCP_URL,
    { type: toolName, payload },
    { headers: { 'Content-Type': 'application/json' } }
  );
  return response.data;
}

/**
 * Example
 */
(async () => {
  const functions = await listMcpTools();

  const completion = await client.chat.completions.create({
    model: 'gpt-4.1-mini',
    messages: [{ role: 'user', content: 'Confirm cart abc123' }],
    functions,
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
