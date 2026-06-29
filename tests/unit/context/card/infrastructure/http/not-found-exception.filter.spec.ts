import { NotFoundException } from '@nestjs/common';
import { NotFoundExceptionFilter } from '../../../../../../src/context/card/infrastructure/http/not-found-exception.filter';
import { buildLoggerMock } from '../../../../../helpers';

const buildResponseMock = () => {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  return { status, json };
};

const buildRequestMock = (overrides = {}) => ({
  method: 'GET',
  url: '/cards/46986414',
  query: { language: 'es' },
  params: { id: '46986414' },
  ...overrides,
});

const buildHostMock = (
  response: ReturnType<typeof buildResponseMock>,
  request: ReturnType<typeof buildRequestMock>,
) => ({
  switchToHttp: () => ({
    getResponse: () => response,
    getRequest: () => request,
  }),
});

describe('NotFoundExceptionFilter', () => {
  it('returns 404 with message from exception when message is a string', () => {
    const logger = buildLoggerMock();
    const filter = new NotFoundExceptionFilter(logger);
    const response = buildResponseMock();
    const request = buildRequestMock();
    const host = buildHostMock(response, request) as any;

    const exception = new NotFoundException('Card not found');
    filter.catch(exception, host);

    expect(response.status).toHaveBeenCalledWith(404);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 404,
        error: 'ResourceNotFound',
        code: 'CARD_NOT_FOUND',
        message: 'Card not found',
        timestamp: expect.any(String),
      }),
    );
  });

  it('extracts message from exception response object when message is nested', () => {
    const logger = buildLoggerMock();
    const filter = new NotFoundExceptionFilter(logger);
    const response = buildResponseMock();
    const request = buildRequestMock();
    const host = buildHostMock(response, request) as any;

    const exception = new NotFoundException({
      message: 'Card with id 123 not found',
    });
    filter.catch(exception, host);

    expect(response.status).toHaveBeenCalledWith(404);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Card with id 123 not found',
      }),
    );
  });

  it('falls back to "Not Found" when exception response object has no message', () => {
    const logger = buildLoggerMock();
    const filter = new NotFoundExceptionFilter(logger);
    const response = buildResponseMock();
    const request = buildRequestMock();
    const host = buildHostMock(response, request) as any;

    const exception = new NotFoundException({ code: 'SOME_CODE' });
    filter.catch(exception, host);

    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Not Found',
      }),
    );
  });

  it('logs a warning with request details', () => {
    const logger = buildLoggerMock();
    const filter = new NotFoundExceptionFilter(logger);
    const response = buildResponseMock();
    const request = buildRequestMock();
    const host = buildHostMock(response, request) as any;

    const exception = new NotFoundException('Not found');
    filter.catch(exception, host);

    expect(logger.warn).toHaveBeenCalledWith(
      {
        method: 'GET',
        url: '/cards/46986414',
        query: { language: 'es' },
        params: { id: '46986414' },
        statusCode: 404,
        message: 'Not found',
        error: 'ResourceNotFound',
      },
      'Not found',
    );
  });
});
