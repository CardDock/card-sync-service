import { SyncCardParams } from '../../domain/types/card.types';
import { SyncCardWithRelatedData } from '../../domain/types/sync-card-with-related.types';
import { createCardSetData, CardSetData } from '../../domain/types/card-set.types';
import { createArtworkData, ArtworkData } from '../../domain/types/artwork.types';
import { createCardPrintData, CardPrintData } from '../../domain/types/card-print.types';
import {
  normalizeAttributeLabel,
  normalizeFrameTypeLabel,
  normalizeLinkMarkerLabel,
  normalizeRaceLabel,
} from '../shared/card-field-normalizers';
import { toJsonValue } from '../shared/json-value.mapper';

export interface YgoProDeckCardSetDto {
  set_name: string;
  set_code: string;
  set_rarity: string;
  set_rarity_code: string;
  set_price: string;
}

export interface YgoProDeckCardImageDto {
  id: number;
  image_url: string;
  image_url_small: string;
  image_url_cropped: string;
}

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
  card_sets?: YgoProDeckCardSetDto[];
  card_images?: YgoProDeckCardImageDto[];
  [key: string]: unknown;
}

export interface YgoProDeckResponse {
  data?: YgoProDeckCardDto[];
}

function extractSetCodePrefix(setCode: string): string | null {
  const parts = setCode.split('-');
  return parts.length > 1 ? parts[0] : null;
}

function collectCardSets(cardSets: YgoProDeckCardSetDto[] | undefined): CardSetData[] {
  const seen = new Set<string>();
  const sets: CardSetData[] = [];

  for (const cs of cardSets ?? []) {
    if (!seen.has(cs.set_name)) {
      seen.add(cs.set_name);
      sets.push(createCardSetData(cs.set_name, extractSetCodePrefix(cs.set_code)));
    }
  }

  return sets;
}

function collectCardPrints(
  cardSets: YgoProDeckCardSetDto[] | undefined,
): CardPrintData[] {
  return (cardSets ?? []).map((cs) =>
    createCardPrintData(cs.set_name, cs.set_code, cs.set_rarity, cs.set_rarity_code, cs.set_price),
  );
}

function collectArtworks(
  cardImages: YgoProDeckCardImageDto[] | undefined,
): ArtworkData[] {
  return (cardImages ?? []).map((ci) => createArtworkData(ci.image_url));
}

export function mapYgoProDeckResponseToSyncCardParams(
  response: YgoProDeckResponse,
): SyncCardWithRelatedData | null {
  const [card] = response.data ?? [];

  if (!card) {
    return null;
  }

  const cleanedCard = { ...card };
  delete cleanedCard.card_sets;
  delete cleanedCard.card_images;

  const cardParams: SyncCardParams = {
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
    rawData: toJsonValue(cleanedCard),
  };

  return {
    card: cardParams,
    cardSets: collectCardSets(card.card_sets),
    artworks: collectArtworks(card.card_images),
    cardPrints: collectCardPrints(card.card_sets),
  };
}
