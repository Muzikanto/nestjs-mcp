import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const Context = createParamDecorator(
  (data: unknown, context: ExecutionContext) => context,
);
