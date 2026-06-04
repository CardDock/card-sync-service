import {
  denormalizeRaceLabel,
  normalizeRaceLabel,
} from '../../../../../context/card/infrastructure/shared/card-field-normalizers';

describe('card-field-normalizers', () => {
  describe('race label', () => {
    it('normalizes Fish race', () => {
      expect(normalizeRaceLabel('Fish')).toBe('Fish');
    });

    it('denormalizes Fish race', () => {
      expect(denormalizeRaceLabel('Fish')).toBe('Fish');
    });

    it('throws for unsupported race', () => {
      expect(() => normalizeRaceLabel('UnknownRace')).toThrow(
        new Error('Unsupported card race: UnknownRace'),
      );
    });
  });
});
