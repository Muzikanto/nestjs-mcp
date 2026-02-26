import { ExecutionContext, NestInterceptor, CallHandler, Injectable } from '@nestjs/common';
import { map } from 'rxjs';

@Injectable()
export class ExampleInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    console.log('Before execute');
    
    return next.handle().pipe(
        map((data: unknown) => {
        console.log('After execute', data);
    
        return data; })
      );
  }
}
