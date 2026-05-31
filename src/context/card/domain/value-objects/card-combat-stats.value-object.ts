import { CardCombatStatsPrimitives } from '../types/card.types';

export class CardCombatStats {
  private constructor(private readonly props: CardCombatStatsPrimitives) {}

  static create(props: Partial<CardCombatStatsPrimitives> = {}): CardCombatStats {
    const normalized: CardCombatStatsPrimitives = {
      atk: CardCombatStats.normalizeNumber(props.atk),
      def: CardCombatStats.normalizeNumber(props.def),
      level: CardCombatStats.normalizeNumber(props.level),
    };

    return new CardCombatStats(normalized);
  }

  toPrimitives(): CardCombatStatsPrimitives {
    return { ...this.props };
  }

  private static normalizeNumber(value: number | null | undefined): number | null {
    if (value == null) {
      return null;
    }

    if (!Number.isFinite(value) || value < 0) {
      throw new Error('Card combat stats must be finite positive numbers or null');
    }

    return value;
  }
}
