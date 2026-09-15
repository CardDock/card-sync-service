import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  NotFoundException,
} from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { Logger } from '../../domain/ports/logger.port';

@Catch(NotFoundException)
export class NotFoundExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: Logger) {}

  catch(exception: NotFoundException, host: ArgumentsHost): void {
    const reply = host.switchToHttp().getResponse<FastifyReply>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();
    const message =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : ((exceptionResponse as Record<string, unknown>).message ??
          'Not Found');
    const request = host.switchToHttp().getRequest();
    const { method, url, query, params } = request;

    this.logger.warn(
      {
        method,
        url,
        query,
        params,
        statusCode: status,
        message,
        error: 'ResourceNotFound',
      },
      'Not found',
    );

    reply.status(status).send({
      statusCode: status,
      error: 'ResourceNotFound',
      code: 'CARD_NOT_FOUND',
      message,
      timestamp: new Date().toISOString(),
    });
  }
}
