# @muzikanto/nestjs-mcp

NestJS MCP (Model Context Protocol) module — позволяет создавать "tools" (функции) для LLM или HTTP, с автоматическим обнаружением через декораторы, валидацией через Zod и интеграцией с OpenAI Function Calls.

---

## Особенности

- Регистрация MCP тулз с помощью декоратора `@McpTool()`  
- Автоматическое обнаружение всех провайдеров (tools) в модуле  
- Валидация входных данных через Zod схемы  
- HTTP endpoint для вызова тулз (`POST /mcp`)  
- Endpoint для списка всех тулз (`GET /mcp/tools`)  
- Легкая интеграция с LLM (OpenAI Function Calls)  
- Полная типизация TypeScript  

---

## Установка

```bash
yarn add @muzikanto/nestjs-mcp
```

Peer dependencies: `@nestjs/common, @nestjs/core, reflect-metadata`

## Использование

### Подключение MCP модуля

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

### Создание MCP tool

```ts
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { McpTool } from '@muzikanto/nestjs-mcp';

@McpTool('paymentTool')
@Injectable()
export class PaymentTool {
  static inputSchema = {
    cartId: { type: 'string', description: 'ID корзины' },
  };

  async execute(input: { cartId: string }) {
    return { status: 'confirmed', cartId: input.cartId };
  }
}
```

### Вызов MCP тулзы через HTTP

POST /mcp

```json
{
  "type": "paymentTool",
  "payload": {
    "cartId": "abc123"
  }
}
```

Ответ 
```json
{
  "success": true,
  "data": {
    "status": "confirmed",
    "cartId": "abc123"
  }
}
```

### Получение всех tool

GET /mcp/tool

```json
[
  {
    "name": "paymentTool",
    "description": "",
    "inputSchema": {
      "shape": {
        "cartId": { "type": "string", "description": "The cart ID to confirm" }
      }
    }
  }
]
```

### Интеграция с OpenAI Function Calls

```ts
import axios from 'axios';
import OpenAI from 'openai';
import { z } from 'zod';

const MCP_URL = 'http://localhost:3000/mcp';
const MCP_TOOLS_URL = 'http://localhost:3000/mcp/tools';

// Создаём клиент OpenAI
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Получение списка всех зарегистрированных MCP тулз
 */
async function listMcpTools() {
  const response = await axios.get(MCP_TOOLS_URL);
  return response.data;
}

/**
 * Вызов MCP тулзы через HTTP
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
 * Пример использования с OpenAI
 */
(async () => {
  // 1️⃣ Получаем список тулз
  const functions = await listMcpTools();

  // 2️⃣ Отправляем запрос в OpenAI
  const completion = await client.chat.completions.create({
    model: 'gpt-4.1-mini',
    messages: [{ role: 'user', content: 'Confirm cart abc123' }],
    functions,
    function_call: 'auto',
  });

  const message = completion.choices[0].message;

  // 3️⃣ Если OpenAI решил вызвать функцию, вызываем соответствующую MCP тулзу
  if (message.function_call) {
    const { name, arguments: argsJson } = message.function_call;
    const args = JSON.parse(argsJson);

    const result = await callMcpTool(name, args);
    console.log('Result from MCP tool:', result);
  }
})();
```# -muzikanto-nestjs-mcp
