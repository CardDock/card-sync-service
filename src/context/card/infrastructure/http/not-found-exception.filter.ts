import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  NotFoundException,
} from '@nestjs/common';
import { Response } from 'express';
import { Logger } from '../../domain/ports/logger.port';

@Catch(NotFoundException)
export class NotFoundExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: Logger) {}

  catch(exception: NotFoundException, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
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

    response.status(status).json({
      statusCode: status,
      error: 'ResourceNotFound',
      code: 'CARD_NOT_FOUND',
      message,
      timestamp: new Date().toISOString(),
    });
  }
}
