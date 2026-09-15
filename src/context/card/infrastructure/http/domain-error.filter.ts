import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import type { FastifyReply } from 'fastify';
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
    const reply = host.switchToHttp().getResponse<FastifyReply>();

    reply.status(HttpStatus.UNPROCESSABLE_ENTITY).send({
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
