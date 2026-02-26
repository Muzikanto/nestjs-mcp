import { HttpException, HttpStatus } from "@nestjs/common";

export class McpException extends HttpException {
  constructor(
    message: string,
    status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    options?: { cause?: unknown },
  ) {
    super(
      { message, ...(options?.cause ? { cause: options.cause } : {}) },
      status,
    );
  }
}

export class McpBadRequestException extends McpException {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, HttpStatus.BAD_REQUEST, options);
  }
}

export class McpNotFoundException extends McpException {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, HttpStatus.NOT_FOUND, options);
  }
}

export class McpInternalServerErrorException extends McpException {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR, options);
  }
}

export class McpUnauthorizedException extends McpException {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, HttpStatus.UNAUTHORIZED, options);
  }
}

export class McpNotImplementedException extends McpException {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, HttpStatus.NOT_IMPLEMENTED, options);
  }
}
