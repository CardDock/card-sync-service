import { DomainError } from '../../../../../../src/context/card/domain/errors/domain.error';

describe('DomainError', () => {
  it('creates with all params', () => {
    const error = new DomainError({
      code: 'TEST_ERROR',
      message: 'Something went wrong',
      context: { field: 'name' },
      cause: new Error('Underlying'),
    });

    expect(error.code).toBe('TEST_ERROR');
    expect(error.message).toBe('Something went wrong');
    expect(error.context).toEqual({ field: 'name' });
    expect(error.cause).toEqual(new Error('Underlying'));
    expect(error.name).toBe('DomainError');
  });

  it('defaults context to empty object when not provided', () => {
    const error = new DomainError({
      code: 'NO_CONTEXT',
      message: 'No context',
    });

    expect(error.context).toEqual({});
  });

  it('sets cause as undefined when not provided', () => {
    const error = new DomainError({
      code: 'NO_CAUSE',
      message: 'No cause',
    });

    expect(error.cause).toBeUndefined();
  });

  it('sets name to the constructor name', () => {
    const error = new DomainError({
      code: 'NAME_TEST',
      message: 'Name test',
    });

    expect(error.name).toBe('DomainError');
  });
});
