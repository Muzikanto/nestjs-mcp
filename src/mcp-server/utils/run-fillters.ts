import { ExceptionFilter, ArgumentsHost, Type } from "@nestjs/common";
import {
  EXCEPTION_FILTERS_METADATA,
  FILTER_CATCH_EXCEPTIONS,
} from "@nestjs/common/constants";
import { ModuleRef } from "@nestjs/core";

export async function runFilters(
  moduleRef: ModuleRef,
  metatype: Function,
  exception: unknown,
  host: ArgumentsHost,
) {
  const resolveFilter = async (
    Filter: ExceptionFilter | Type<ExceptionFilter>,
  ): Promise<ExceptionFilter> => {
    if (typeof Filter !== "function") {
      return Filter;
    }

    try {
      return moduleRef.get<ExceptionFilter>(Filter, { strict: false });
    } catch {
      try {
        return await moduleRef.create<ExceptionFilter>(Filter);
      } catch {
        return new Filter();
      }
    }
  };

  const filters: Array<Type<ExceptionFilter> | ExceptionFilter> =
    Reflect.getMetadata(EXCEPTION_FILTERS_METADATA, metatype) || [];

  for (const Filter of filters) {
    const filterInstance = await resolveFilter(Filter);
    const filterExceptions = (Reflect.getMetadata(
      FILTER_CATCH_EXCEPTIONS,
      Filter,
    ) ) as Function[] | undefined;

    if (!filterExceptions) {
      continue;
    }

    if (
      filterExceptions.length > 0 &&
      !filterExceptions.some((ex) => (exception as Error) instanceof ex)
    ) {
      continue;
    }

    // ВАЖНО: filter сам обрабатывает exception
    const result = await filterInstance.catch(exception, host);

    // Nest прекращает выполнение после первого подходящего filter
    return result;
  }

  // если фильтров нет — пробрасываем ошибку дальше
  throw exception;
}
