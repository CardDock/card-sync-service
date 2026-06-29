import { CardSetName } from '../../../../../../src/context/card/domain/value-objects/card-set-name.value-object';

describe('CardSetName', () => {
  it('creates with a valid set name', () => {
    const name = CardSetName.create('Legend of Blue Eyes White Dragon');
    expect(name.toPrimitives()).toBe('Legend of Blue Eyes White Dragon');
  });

  it('trims whitespace', () => {
    const name = CardSetName.create('  Metal Raiders  ');
    expect(name.toPrimitives()).toBe('Metal Raiders');
  });

  it('throws when value is empty string', () => {
    expect(() => CardSetName.create('')).toThrow(
      new Error('Card set name is required'),
    );
  });

  it('throws when value is only whitespace', () => {
    expect(() => CardSetName.create('   \t   ')).toThrow(
      new Error('Card set name is required'),
    );
  });
});
