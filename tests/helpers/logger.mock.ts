import { Logger } from '../../src/context/card/domain/ports/logger.port';

export const buildLoggerMock = (): Logger =>
  ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }) as unknown as Logger;
