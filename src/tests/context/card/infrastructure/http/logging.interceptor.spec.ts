import { of } from 'rxjs';
import { LoggingInterceptor } from '../../../../../context/card/infrastructure/http/logging.interceptor';
import { Logger } from '../../../../../context/card/domain/ports/logger.port';

const buildLoggerMock = (): Logger =>
  ({ info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() }) as unknown as Logger;

const buildExecutionContextMock = (overrides = {}) => ({
  switchToHttp: () => ({
    getRequest: () => ({
      method: 'GET',
      url: '/cards/46986414',
      query: {},
      params: { externalId: '46986414' },
      ...overrides,
    }),
    getResponse: () => ({ statusCode: 200 }),
  }),
  getClass: () => null,
  getHandler: () => null,
});

const buildCallHandlerMock = () => ({
  handle: () => of('test'),
});

describe('LoggingInterceptor', () => {
  it('logs request start and completion', (done) => {
    const logger = buildLoggerMock();
    const interceptor = new LoggingInterceptor(logger);
    const context = buildExecutionContextMock();
    const next = buildCallHandlerMock();

    interceptor.intercept(context as any, next as any).subscribe({
      complete: () => {
        expect(logger.info).toHaveBeenCalledTimes(2);
        expect(logger.info).toHaveBeenNthCalledWith(
          1,
          { method: 'GET', url: '/cards/46986414', query: {}, params: { externalId: '46986414' } },
          'Request started',
        );
        expect(logger.info).toHaveBeenNthCalledWith(
          2,
          expect.objectContaining({ method: 'GET', url: '/cards/46986414', statusCode: 200, duration: expect.any(Number) }),
          'Request completed',
        );
        done();
      },
    });
  });

  it('logs with different request data', (done) => {
    const logger = buildLoggerMock();
    const interceptor = new LoggingInterceptor(logger);
    const context = buildExecutionContextMock({
      method: 'POST',
      url: '/cards/sync',
      query: {},
      params: {},
    });
    const next = buildCallHandlerMock();

    interceptor.intercept(context as any, next as any).subscribe({
      complete: () => {
        expect(logger.info).toHaveBeenNthCalledWith(
          1,
          { method: 'POST', url: '/cards/sync', query: {}, params: {} },
          'Request started',
        );
        done();
      },
    });
  });
});
