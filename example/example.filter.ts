import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  NotImplementedException,
} from "@nestjs/common";

@Catch(NotImplementedException)
export class ExampleFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    return {
      message: (exception as Error).message,
    };
  }
}
