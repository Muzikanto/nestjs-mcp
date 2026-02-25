import {
  NestInterceptor,
  ExecutionContext,
  Type,
  CallHandler,
  Injectable,
} from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { from, Observable, of } from "rxjs";
import { INTERCEPTORS_METADATA } from "@nestjs/common/constants";

/**
 * Универсальный helper для запуска массива NestJS Interceptors через DI
 */
export async function runInterceptors(
  moduleRef: ModuleRef,
  metatype: Function,
  context: ExecutionContext,
  nextFn: () => Observable<any>,
): Promise<Observable<any>> {
  const resolveInterceptor = async (
    Interceptor: NestInterceptor | { new (): NestInterceptor },
  ): Promise<NestInterceptor> => {
    if (typeof Interceptor !== "function") {
      return Interceptor;
    }

    try {
      return moduleRef.get<NestInterceptor>(
        Interceptor as Type<NestInterceptor>,
        { strict: false },
      );
    } catch {
      try {
        return await moduleRef.create<NestInterceptor>(
          Interceptor as Type<NestInterceptor>,
        );
      } catch {
        return new (Interceptor as Type<NestInterceptor>)();
      }
    }
  };

  const interceptors: Type<NestInterceptor>[] =
    Reflect.getMetadata(INTERCEPTORS_METADATA, metatype) || [];

  // Применяем interceptors в обратном порядке (как NestJS)
  let handler = nextFn;

  for (const InterceptorClass of interceptors.reverse()) {
    const interceptorInstance = await resolveInterceptor(InterceptorClass);
    const originalHandler = handler;

    handler = () => {
      const result = interceptorInstance.intercept(context, {
        handle: () => originalHandler(),
      } as CallHandler);

      return result instanceof Observable ? result : from(result);
    };
  }

  return handler();
}
