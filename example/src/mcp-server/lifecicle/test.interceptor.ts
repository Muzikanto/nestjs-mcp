import {
  ExecutionContext,
  NestInterceptor,
  CallHandler,
  Injectable,
  Logger,
} from '@nestjs/common';
import { map } from 'rxjs';

@Injectable()
export class TestInterceptor implements NestInterceptor {
  logger = new Logger('TestInterceptor');

  intercept(context: ExecutionContext, next: CallHandler) {
    this.logger.log('Before execute');

    return next.handle().pipe(
      map((data: unknown) => {
        this.logger.log('After execute');
        this.logger.log(data)

        return data;
      }),
    );
  }
}
