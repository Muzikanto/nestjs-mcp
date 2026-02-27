import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { FastifyRequest } from 'fastify';

@Injectable()
export class TestGuard implements CanActivate {
  logger = new Logger('TestGuard');

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    this.logger.log('TestGuard called', request.url);

    return true;
  }
}
