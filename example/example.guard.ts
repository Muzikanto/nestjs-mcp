import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Observable } from "rxjs";
import { FastifyRequest } from "fastify";

@Injectable()
export class ExampleGuard implements CanActivate {
  // constructor(/* Inject some modules */) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    console.log("ExampleGuard called", request.headers);
    return true;
  }
}
