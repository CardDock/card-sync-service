import {
  denormalizeRaceLabel,
  denormalizeLinkMarkerLabel,
  normalizeRaceLabel,
  normalizeLinkMarkerLabel,
  normalizeFrameTypeLabel,
  normalizeAttributeLabel,
} from '../../../../../../src/context/card/infrastructure/shared/card-field-normalizers';

describe('card-field-normalizers', () => {
  describe('race label', () => {
    it('normalizes Fish race', () => {
      expect(normalizeRaceLabel('Fish')).toBe('Fish');
    });

    it('denormalizes Fish race', () => {
      expect(denormalizeRaceLabel('Fish')).toBe('Fish');
    });

    it('normalizes hyphenated Beast-Warrior to BeastWarrior', () => {
      expect(normalizeRaceLabel('Beast-Warrior')).toBe('BeastWarrior');
    });

    it('denormalizes BeastWarrior to Beast-Warrior', () => {
      expect(denormalizeRaceLabel('BeastWarrior')).toBe('Beast-Warrior');
    });

    it('normalizes "Sea Serpent" to SeaSerpent', () => {
      expect(normalizeRaceLabel('Sea Serpent')).toBe('SeaSerpent');
    });

    it('denormalizes SeaSerpent to "Sea Serpent"', () => {
      expect(denormalizeRaceLabel('SeaSerpent')).toBe('Sea Serpent');
    });

    it('normalizes "Quick-Play" to QuickPlay', () => {
      expect(normalizeRaceLabel('Quick-Play')).toBe('QuickPlay');
    });

    it('normalizes "Winged Beast" to WingedBeast', () => {
      expect(normalizeRaceLabel('Winged Beast')).toBe('WingedBeast');
    });

    it('throws for unsupported race', () => {
      expect(() => normalizeRaceLabel('UnknownRace')).toThrow(
        new Error('Unsupported card race: UnknownRace'),
      );
    });
  });

  describe('link marker label', () => {
    it('normalizes Bottom-Left to BottomLeft', () => {
      expect(normalizeLinkMarkerLabel('Bottom-Left')).toBe('BottomLeft');
    });

    it('normalizes Bottom-Right to BottomRight', () => {
      expect(normalizeLinkMarkerLabel('Bottom-Right')).toBe('BottomRight');
    });

    it('normalizes Top-Left to TopLeft', () => {
      expect(normalizeLinkMarkerLabel('Top-Left')).toBe('TopLeft');
    });

    it('normalizes Top-Right to TopRight', () => {
      expect(normalizeLinkMarkerLabel('Top-Right')).toBe('TopRight');
    });

    it('passes through already-normalized Top', () => {
      expect(normalizeLinkMarkerLabel('Top')).toBe('Top');
    });

    it('denormalizes BottomLeft to Bottom-Left', () => {
      expect(denormalizeLinkMarkerLabel('BottomLeft')).toBe('Bottom-Left');
    });

    it('throws for unsupported link marker', () => {
      expect(() => normalizeLinkMarkerLabel('Diagonal')).toThrow(
        new Error('Unsupported card link marker: Diagonal'),
      );
    });
  });

  describe('frame type label', () => {
    it('normalizes normal', () => {
      expect(normalizeFrameTypeLabel('normal')).toBe('normal');
    });

    it('normalizes effect', () => {
      expect(normalizeFrameTypeLabel('effect')).toBe('effect');
    });

    it('normalizes xyz', () => {
      expect(normalizeFrameTypeLabel('xyz')).toBe('xyz');
    });

    it('throws for unsupported frame type', () => {
      expect(() => normalizeFrameTypeLabel('ritual_equip')).toThrow(
        new Error('Unsupported card frame type: ritual_equip'),
      );
    });
  });

  describe('attribute label', () => {
    it('normalizes DARK', () => {
      expect(normalizeAttributeLabel('DARK')).toBe('DARK');
    });

    it('normalizes DIVINE', () => {
      expect(normalizeAttributeLabel('DIVINE')).toBe('DIVINE');
    });

    it('returns null for null input', () => {
      expect(normalizeAttributeLabel(null)).toBeNull();
    });

    it('returns null for undefined input', () => {
      expect(normalizeAttributeLabel(undefined)).toBeNull();
    });

    it('throws for unsupported attribute', () => {
      expect(() => normalizeAttributeLabel('CHIMERA')).toThrow(
        new Error('Unsupported card attribute: CHIMERA'),
      );
    });
  });
});
