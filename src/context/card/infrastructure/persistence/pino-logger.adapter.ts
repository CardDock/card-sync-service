import pino from 'pino';
import { Logger } from '../../domain/ports/logger.port';

export class PinoLoggerAdapter extends Logger {
  private readonly logger: pino.Logger;

  constructor() {
    super();

    const isProduction = process.env.NODE_ENV === 'production';

    this.logger = pino({
      level: process.env.LOG_LEVEL ?? 'info',
      transport: isProduction
        ? undefined
        : {
            target: 'pino-pretty',
            options: { colorize: true, singleLine: true },
          },
    });
  }

  info(meta: Record<string, unknown>, message: string): void {
    this.logger.info(meta, message);
  }

  warn(meta: Record<string, unknown>, message: string): void {
    this.logger.warn(meta, message);
  }

  error(meta: Record<string, unknown>, message: string): void {
    this.logger.error(meta, message);
  }

  debug(meta: Record<string, unknown>, message: string): void {
    this.logger.debug(meta, message);
  }
}
