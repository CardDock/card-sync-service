import {
  CardAttribute,
  CardFrameType,
  CardLinkMarker,
  CardRace,
} from '../../domain/types/card.types';
import { CardDomainValidationError } from '../../domain/errors';

const RACE_BY_EXTERNAL_LABEL: Record<string, CardRace> = {
  Aqua: 'Aqua',
  Beast: 'Beast',
  'Beast-Warrior': 'BeastWarrior',
  BeastWarrior: 'BeastWarrior',
  Cyberse: 'Cyberse',
  Dinosaur: 'Dinosaur',
  'Divine-Beast': 'DivineBeast',
  DivineBeast: 'DivineBeast',
  Dragon: 'Dragon',
  Fish: 'Fish',
  Fairy: 'Fairy',
  Fiend: 'Fiend',
  Illusion: 'Illusion',
  Insect: 'Insect',
  Machine: 'Machine',
  Plant: 'Plant',
  Psychic: 'Psychic',
  Pyro: 'Pyro',
  Reptile: 'Reptile',
  Rock: 'Rock',
  'Sea Serpent': 'SeaSerpent',
  SeaSerpent: 'SeaSerpent',
  Spellcaster: 'Spellcaster',
  Thunder: 'Thunder',
  Warrior: 'Warrior',
  'Winged Beast': 'WingedBeast',
  WingedBeast: 'WingedBeast',
  Wyrm: 'Wyrm',
  Zombie: 'Zombie',
  Normal: 'Normal',
  Field: 'Field',
  Equip: 'Equip',
  Continuous: 'Continuous',
  'Quick-Play': 'QuickPlay',
  QuickPlay: 'QuickPlay',
  Ritual: 'Ritual',
  Counter: 'Counter',
};

const EXTERNAL_LABEL_BY_RACE: Record<CardRace, string> = {
  Aqua: 'Aqua',
  Beast: 'Beast',
  BeastWarrior: 'Beast-Warrior',
  Cyberse: 'Cyberse',
  Dinosaur: 'Dinosaur',
  DivineBeast: 'Divine-Beast',
  Dragon: 'Dragon',
  Fish: 'Fish',
  Fairy: 'Fairy',
  Fiend: 'Fiend',
  Illusion: 'Illusion',
  Insect: 'Insect',
  Machine: 'Machine',
  Plant: 'Plant',
  Psychic: 'Psychic',
  Pyro: 'Pyro',
  Reptile: 'Reptile',
  Rock: 'Rock',
  SeaSerpent: 'Sea Serpent',
  Spellcaster: 'Spellcaster',
  Thunder: 'Thunder',
  Warrior: 'Warrior',
  WingedBeast: 'Winged Beast',
  Wyrm: 'Wyrm',
  Zombie: 'Zombie',
  Normal: 'Normal',
  Field: 'Field',
  Equip: 'Equip',
  Continuous: 'Continuous',
  QuickPlay: 'Quick-Play',
  Ritual: 'Ritual',
  Counter: 'Counter',
};

const LINK_MARKER_BY_EXTERNAL_LABEL: Record<string, CardLinkMarker> = {
  Top: 'Top',
  Bottom: 'Bottom',
  Left: 'Left',
  Right: 'Right',
  'Bottom-Left': 'BottomLeft',
  BottomLeft: 'BottomLeft',
  'Bottom-Right': 'BottomRight',
  BottomRight: 'BottomRight',
  'Top-Left': 'TopLeft',
  TopLeft: 'TopLeft',
  'Top-Right': 'TopRight',
  TopRight: 'TopRight',
};

const EXTERNAL_LABEL_BY_LINK_MARKER: Record<CardLinkMarker, string> = {
  Top: 'Top',
  Bottom: 'Bottom',
  Left: 'Left',
  Right: 'Right',
  BottomLeft: 'Bottom-Left',
  BottomRight: 'Bottom-Right',
  TopLeft: 'Top-Left',
  TopRight: 'Top-Right',
};

const FRAME_TYPE_BY_LABEL: Record<string, CardFrameType> = {
  normal: 'normal',
  effect: 'effect',
  ritual: 'ritual',
  fusion: 'fusion',
  synchro: 'synchro',
  xyz: 'xyz',
  link: 'link',
  spell: 'spell',
  trap: 'trap',
  token: 'token',
  skill: 'skill',
};

const ATTRIBUTE_BY_LABEL: Record<string, CardAttribute> = {
  DARK: 'DARK',
  LIGHT: 'LIGHT',
  EARTH: 'EARTH',
  WATER: 'WATER',
  FIRE: 'FIRE',
  WIND: 'WIND',
  DIVINE: 'DIVINE',
};

export function normalizeRaceLabel(value: string): CardRace {
  const normalized = RACE_BY_EXTERNAL_LABEL[value];

  if (!normalized) {
    throw new CardDomainValidationError({
      field: 'race',
      value,
      source: 'normalizeRaceLabel',
      rule: 'supported-external-race-label',
      message: `Unsupported card race: ${value}`,
    });
  }

  return normalized;
}

export function denormalizeRaceLabel(value: CardRace): string {
  return EXTERNAL_LABEL_BY_RACE[value];
}

export function normalizeLinkMarkerLabel(value: string): CardLinkMarker {
  const normalized = LINK_MARKER_BY_EXTERNAL_LABEL[value];

  if (!normalized) {
    throw new CardDomainValidationError({
      field: 'linkmarkers',
      value,
      source: 'normalizeLinkMarkerLabel',
      rule: 'supported-external-link-marker-label',
      message: `Unsupported card link marker: ${value}`,
    });
  }

  return normalized;
}

export function denormalizeLinkMarkerLabel(value: CardLinkMarker): string {
  return EXTERNAL_LABEL_BY_LINK_MARKER[value];
}

export function normalizeFrameTypeLabel(value: string): CardFrameType {
  const normalized = FRAME_TYPE_BY_LABEL[value];

  if (!normalized) {
    throw new CardDomainValidationError({
      field: 'frameType',
      value,
      source: 'normalizeFrameTypeLabel',
      rule: 'supported-external-frame-type-label',
      message: `Unsupported card frame type: ${value}`,
    });
  }

  return normalized;
}

export function normalizeAttributeLabel(
  value: string | null | undefined,
): CardAttribute | null {
  if (value == null) {
    return null;
  }

  const normalized = ATTRIBUTE_BY_LABEL[value];

  if (!normalized) {
    throw new CardDomainValidationError({
      field: 'attribute',
      value,
      source: 'normalizeAttributeLabel',
      rule: 'supported-external-attribute-label',
      message: `Unsupported card attribute: ${value}`,
    });
  }

  return normalized;
}
