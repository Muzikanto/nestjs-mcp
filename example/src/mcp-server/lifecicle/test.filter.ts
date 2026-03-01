import {
  McpBadRequestException,
  McpUnauthorizedException,
} from '@muzikanto/nestjs-mcp';
import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';

@Catch(McpUnauthorizedException)
export class AuthFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    return {
      isError: true,
      messages: [
        { type: 'text', text: (exception as Error).message || 'No access' },
      ],
    };
  }
}

@Catch(McpBadRequestException)
export class BadRequestFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    return {
      isError: true,
      messages: [
        {
          type: 'text',
          text: (exception as Error).message || 'invalid arguments',
        },
      ],
    };
  }
}

@Catch()
export class TelegramNoChatFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    if (!exception.message.includes('chat not found')) {
      throw exception;
    }
  
    return {
      isError: true,
      messages: [
        { type: 'text', text: 'Failed to sent message. No access to chat' },
      ],
    };
  }
}