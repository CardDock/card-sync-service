import { CardSetData } from '../types/card-set.types';
import { CardPrintData } from '../types/card-print.types';
import { CardPrintWithArtwork } from '../types/card.types';

export interface ArtworkResult {
  id: string;
  imageUrl: string;
  imageUrlSmall: string;
  imageUrlCropped: string;
}

export interface CardPrintResult {
  id: string;
  cardSetId: string;
  cardSetName: string;
  cardSetCode: string | null;
  setCode: string;
  rarity: string;
  rarityCode: string | null;
  setPrice: number | null;
}

export interface CardSetResult {
  id: string;
  name: string;
  code: string | null;
}

export abstract class CardRelatedDataRepositoryPort {
  abstract saveCardSets(sets: CardSetData[]): Promise<Map<string, string>>;
  abstract saveArtwork(
    cardId: string,
    imageUrl: string,
    imageUrlSmall: string,
    imageUrlCropped: string,
  ): Promise<string>;
  abstract saveCardPrints(
    artworkId: string,
    prints: CardPrintData[],
    setIds: Map<string, string>,
  ): Promise<void>;
  abstract findArtworksByCardId(cardId: string): Promise<ArtworkResult[]>;
  abstract findPrintsByCardId(cardId: string): Promise<CardPrintResult[]>;
  abstract findPrintsWithArtworkByCardId(
    cardId: string,
  ): Promise<CardPrintWithArtwork[]>;
  abstract findAllCardSets(): Promise<CardSetResult[]>;
  abstract deleteByCardId(cardId: string): Promise<void>;
  abstract findFirstArtworkIdByCardId(cardId: string): Promise<string | null>;
}
