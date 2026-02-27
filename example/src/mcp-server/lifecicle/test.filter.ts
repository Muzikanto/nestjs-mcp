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
      message: (exception as Error).message,
    };
  }
}
