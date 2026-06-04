import { SyncCardParams } from '../../domain/types/card.types';
import {
  normalizeAttributeLabel,
  normalizeFrameTypeLabel,
  normalizeLinkMarkerLabel,
  normalizeRaceLabel,
} from '../shared/card-field-normalizers';
import { toJsonValue } from '../shared/json-value.mapper';

export interface YgoProDeckCardDto {
  id: number;
  name: string;
  typeline?: string[];
  type: string;
  humanReadableCardType?: string;
  frameType: string;
  desc: string;
  race: string;
  atk?: number;
  def?: number;
  level?: number;
  scale?: number;
  linkval?: number;
  linkmarkers?: string[];
  attribute?: string;
  [key: string]: unknown;
}

export interface YgoProDeckResponse {
  data?: YgoProDeckCardDto[];
}

export function mapYgoProDeckResponseToSyncCardParams(
  response: YgoProDeckResponse,
): SyncCardParams | null {
  const [card] = response.data ?? [];

  if (!card) {
    return null;
  }

  return {
    externalId: String(card.id),
    name: card.name,
    typeline: card.typeline ?? [],
    type: card.type,
    humanReadableCardType: card.humanReadableCardType ?? card.type,
    frameType: normalizeFrameTypeLabel(card.frameType),
    desc: card.desc,
    race: normalizeRaceLabel(card.race),
    atk: card.atk ?? null,
    def: card.def ?? null,
    level: card.level ?? null,
    scale: card.scale ?? null,
    linkval: card.linkval ?? null,
    linkmarkers: (card.linkmarkers ?? []).map(normalizeLinkMarkerLabel),
    attribute: normalizeAttributeLabel(card.attribute),
    rawData: toJsonValue(card),
  };
}
