import type { CardRace as CardRacePrimitive } from '../types/card.types';
import { CardDomainValidationError } from '../errors';

export class CardRace {
  private static readonly ALLOWED_VALUES = new Set<CardRacePrimitive>([
    'Aqua',
    'Beast',
    'BeastWarrior',
    'Cyberse',
    'Dinosaur',
    'DivineBeast',
    'Dragon',
    'Fish',
    'Fairy',
    'Fiend',
    'Illusion',
    'Insect',
    'Machine',
    'Plant',
    'Psychic',
    'Pyro',
    'Reptile',
    'Rock',
    'SeaSerpent',
    'Spellcaster',
    'Thunder',
    'Warrior',
    'WingedBeast',
    'Wyrm',
    'Zombie',
    'Normal',
    'Field',
    'Equip',
    'Continuous',
    'QuickPlay',
    'Ritual',
    'Counter',
  ]);

  private constructor(private readonly value: CardRacePrimitive) {}

  static create(value: CardRacePrimitive): CardRace {
    if (!CardRace.ALLOWED_VALUES.has(value)) {
      throw new CardDomainValidationError({
        field: 'race',
        value,
        source: 'CardRace.create',
        rule: 'allowed-card-races',
        message: 'Card race is invalid',
      });
    }

    return new CardRace(value);
  }

  toPrimitives(): CardRacePrimitive {
    return this.value;
  }
}
