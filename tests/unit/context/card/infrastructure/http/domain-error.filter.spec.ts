import { HttpStatus } from '@nestjs/common';
import { DomainErrorFilter } from '../../../../../../src/context/card/infrastructure/http/domain-error.filter';
import {
  CardDomainValidationError,
  CardDomainProcessError,
} from '../../../../../../src/context/card/domain/errors';

const buildResponseMock = () => {
  const send = jest.fn();
  const status = jest.fn().mockReturnValue({ send });
  return { status, send };
};

const buildHostMock = (response: ReturnType<typeof buildResponseMock>) => ({
  switchToHttp: () => ({
    getResponse: () => response,
  }),
});

describe('DomainErrorFilter', () => {
  it('returns 422 with serialized error', () => {
    const filter = new DomainErrorFilter();
    const response = buildResponseMock();
    const host = buildHostMock(response) as any;

    const error = new CardDomainValidationError({
      field: 'name',
      message: 'Card name is required',
    });

    filter.catch(error, host);

    expect(response.status).toHaveBeenCalledWith(
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response.send).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 422,
        error: 'DomainError',
        code: 'CARD_VALIDATION_ERROR',
        message: 'Card name is required',
        context: expect.objectContaining({ field: 'name' }),
        timestamp: expect.any(String),
      }),
    );
  });

  it('serializes DomainError causes recursively', () => {
    const filter = new DomainErrorFilter();
    const response = buildResponseMock();
    const host = buildHostMock(response) as any;

    const inner = new CardDomainValidationError({
      field: 'race',
      message: 'Invalid race',
    });
    const outer = new CardDomainProcessError({
      stage: 'test',
      message: 'Processing failed',
      cause: inner,
    });

    filter.catch(outer, host);

    const sendArg = response.send.mock.calls[0][0];
    expect(sendArg.cause).toMatchObject({
      name: 'CardDomainValidationError',
      code: 'CARD_VALIDATION_ERROR',
      message: 'Invalid race',
      context: expect.objectContaining({ field: 'race' }),
    });
  });

  it('serializes Error causes with name and message', () => {
    const filter = new DomainErrorFilter();
    const response = buildResponseMock();
    const host = buildHostMock(response) as any;

    const error = new CardDomainProcessError({
      stage: 'test',
      message: 'Something went wrong',
      cause: new Error('Underlying error'),
    });

    filter.catch(error, host);

    const sendArg = response.send.mock.calls[0][0];
    expect(sendArg.cause).toMatchObject({
      name: 'Error',
      message: 'Underlying error',
    });
  });

  it('serializes non-error causes as-is', () => {
    const filter = new DomainErrorFilter();
    const response = buildResponseMock();
    const host = buildHostMock(response) as any;

    const error = new CardDomainProcessError({
      stage: 'test',
      message: 'Something went wrong',
      cause: 'raw string cause',
    });

    filter.catch(error, host);

    const sendArg = response.send.mock.calls[0][0];
    expect(sendArg.cause).toBe('raw string cause');
  });

  it('recursively serializes nested DomainError causes', () => {
    const filter = new DomainErrorFilter();
    const response = buildResponseMock();
    const host = buildHostMock(response) as any;

    const deep = new CardDomainValidationError({
      field: 'atk',
      message: 'Invalid ATK',
    });
    const mid = new CardDomainProcessError({
      stage: 'mid',
      message: 'Mid error',
      cause: deep,
    });
    const top = new CardDomainProcessError({
      stage: 'top',
      message: 'Top error',
      cause: mid,
    });

    filter.catch(top, host);

    const sendArg = response.send.mock.calls[0][0];
    expect(sendArg.cause).toMatchObject({
      name: 'CardDomainProcessError',
      message: 'Mid error',
    });
    expect(sendArg.cause.cause).toMatchObject({
      name: 'CardDomainValidationError',
      message: 'Invalid ATK',
    });
  });
});
