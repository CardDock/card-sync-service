import { toJsonValue } from '../../../../../../src/context/card/infrastructure/shared/json-value.mapper';

describe('toJsonValue', () => {
  it('returns null for null input', () => {
    expect(toJsonValue(null)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(toJsonValue(undefined)).toBeNull();
  });

  it('returns a string as-is', () => {
    expect(toJsonValue('hello')).toBe('hello');
  });

  it('returns a number as-is', () => {
    expect(toJsonValue(42)).toBe(42);
  });

  it('clones an object via JSON', () => {
    const input = { a: 1, b: { c: 2 } };
    const result = toJsonValue(input);
    expect(result).toEqual(input);
    input.a = 99;
    expect((result as Record<string, unknown>).a).toBe(1);
  });

  it('returns an array as-is', () => {
    expect(toJsonValue([1, 2, 3])).toEqual([1, 2, 3]);
  });
});
