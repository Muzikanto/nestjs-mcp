import {
  CanActivate,
  ExecutionContext,
  Type,
  UnauthorizedException,
} from "@nestjs/common";
import { GUARDS_METADATA, MODULE_METADATA } from "@nestjs/common/constants";
import { ModuleRef } from "@nestjs/core";
import { McpUnauthorizedException } from "../exceptions";

/**
 * Универсальный helper для проверки массивов NestJS Guards
 */
export async function runGuards(
  moduleRef: ModuleRef,
  metatype: Function,
  context: ExecutionContext,
) {
  const resolveGuard = async (
    Guard: CanActivate | { new (): CanActivate },
  ): Promise<CanActivate> => {
    if (typeof Guard !== "function") {
      return Guard;
    }

    try {
      return moduleRef.get<CanActivate>(Guard, { strict: false });
    } catch {
      try {
        return await moduleRef.create<CanActivate>(Guard);
      } catch {
        return new Guard();
      }
    }
  };

  const guards = Reflect.getMetadata(GUARDS_METADATA, metatype) || [];

  for (const Guard of guards) {
    const guardInstance = await resolveGuard(Guard);

    const can = await guardInstance.canActivate(context);
    if (!can) {
      throw new McpUnauthorizedException("Guard blocked execution");
    }
  }
}
