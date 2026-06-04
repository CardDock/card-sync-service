import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { DomainError } from '../../domain/errors';

function serializeErrorCause(cause: unknown): unknown {
  if (cause instanceof DomainError) {
    return {
      name: cause.name,
      code: cause.code,
      message: cause.message,
      context: cause.context,
      cause: serializeErrorCause(cause.cause),
    };
  }

  if (cause instanceof Error) {
    return {
      name: cause.name,
      message: cause.message,
    };
  }

  return cause;
}

@Catch(DomainError)
export class DomainErrorFilter implements ExceptionFilter {
  catch(exception: DomainError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    response.status(HttpStatus.UNPROCESSABLE_ENTITY).json({
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      error: 'DomainError',
      code: exception.code,
      message: exception.message,
      context: exception.context,
      cause: serializeErrorCause(exception.cause),
      timestamp: new Date().toISOString(),
    });
  }
}
