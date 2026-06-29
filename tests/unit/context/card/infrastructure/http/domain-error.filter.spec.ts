import { HttpStatus } from '@nestjs/common';
import { DomainErrorFilter } from '../../../../../../src/context/card/infrastructure/http/domain-error.filter';
import {
  CardDomainValidationError,
  CardDomainProcessError,
} from '../../../../../../src/context/card/domain/errors';

const buildResponseMock = () => {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  return { status, json };
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
    expect(response.json).toHaveBeenCalledWith(
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

    const jsonArg = response.json.mock.calls[0][0];
    expect(jsonArg.cause).toMatchObject({
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

    const jsonArg = response.json.mock.calls[0][0];
    expect(jsonArg.cause).toMatchObject({
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

    const jsonArg = response.json.mock.calls[0][0];
    expect(jsonArg.cause).toBe('raw string cause');
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

    const jsonArg = response.json.mock.calls[0][0];
    expect(jsonArg.cause).toMatchObject({
      name: 'CardDomainProcessError',
      message: 'Mid error',
    });
    expect(jsonArg.cause.cause).toMatchObject({
      name: 'CardDomainValidationError',
      message: 'Invalid ATK',
    });
  });
});
