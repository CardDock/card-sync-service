import { Card } from '../../domain/entities/card.entity';
import { CardPrimitives } from '../../domain/types/card.types';
import {
  denormalizeLinkMarkerLabel,
  denormalizeRaceLabel,
  normalizeAttributeLabel,
  normalizeFrameTypeLabel,
  normalizeLinkMarkerLabel,
  normalizeRaceLabel,
} from '../shared/card-field-normalizers';
import { toJsonValue } from '../shared/json-value.mapper';

interface PostgresCardRow {
  id: string;
  external_id: string;
  name: string;
  typeline: string[] | string;
  type: string;
  human_readable_card_type: string;
  frame_type: string;
  desc: string;
  race: string;
  atk: number | null;
  def: number | null;
  level: number | null;
  scale: number | null;
  linkval: number | null;
  linkmarkers: string[] | string | null;
  attribute: string | null;
  raw_data: unknown;
}

interface PersistableCardRecord {
  id: string;
  externalId: string;
  name: string;
  typeline: string[];
  type: string;
  humanReadableCardType: string;
  frameType: string;
  desc: string;
  race: string;
  atk: number | null;
  def: number | null;
  level: number | null;
  scale: number | null;
  linkval: number | null;
  linkmarkers: string[];
  attribute: string | null;
  rawData: CardPrimitives['rawData'];
}

export function mapPostgresRowToCard(row: PostgresCardRow): Card {
  return Card.create({
    id: row.id,
    externalId: row.external_id,
    name: row.name,
    typeline: parsePostgresTextArray(row.typeline),
    type: row.type,
    humanReadableCardType: row.human_readable_card_type,
    frameType: normalizeFrameTypeLabel(row.frame_type),
    desc: row.desc,
    race: normalizeRaceLabel(row.race),
    atk: row.atk,
    def: row.def,
    level: row.level,
    scale: row.scale,
    linkval: row.linkval,
    linkmarkers: parsePostgresTextArray(row.linkmarkers).map(
      normalizeLinkMarkerLabel,
    ),
    attribute: normalizeAttributeLabel(row.attribute),
    rawData: toJsonValue(row.raw_data),
  });
}

function parsePostgresTextArray(
  value: string[] | string | null | undefined,
): string[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value !== 'string') {
    return [];
  }

  const trimmed = value.trim();

  if (trimmed === '' || trimmed === '{}') {
    return [];
  }

  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    const inner = trimmed.slice(1, -1);

    if (inner === '') {
      return [];
    }

    return inner.split(',').map((entry) => {
      const withoutQuotes = entry.replace(/^"|"$/g, '');
      return withoutQuotes.replace(/\\"/g, '"');
    });
  }

  return [trimmed];
}

export function mapCardToPostgresRecord(card: Card): PersistableCardRecord {
  const primitives = card.toPrimitives();

  return {
    id: primitives.id,
    externalId: primitives.externalId,
    name: primitives.name,
    typeline: primitives.typeline,
    type: primitives.type,
    humanReadableCardType: primitives.humanReadableCardType,
    frameType: primitives.frameType,
    desc: primitives.desc,
    race: denormalizeRaceLabel(primitives.race),
    atk: primitives.atk,
    def: primitives.def,
    level: primitives.level,
    scale: primitives.scale,
    linkval: primitives.linkval,
    linkmarkers: primitives.linkmarkers.map(denormalizeLinkMarkerLabel),
    attribute: primitives.attribute,
    rawData: primitives.rawData,
  };
}
