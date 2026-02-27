import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  UnauthorizedException,
} from '@nestjs/common';

@Catch(UnauthorizedException)
export class TestFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    return {
      isError: true,
      messages: [{ type: 'text', text: (exception as Error).message || 'Internal server error' }],
    };
  }
}
