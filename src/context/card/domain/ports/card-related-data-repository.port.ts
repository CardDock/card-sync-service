import { CardSetData } from '../types/card-set.types';
import { CardPrintData } from '../types/card-print.types';

export interface ArtworkResult {
  id: string;
  imageUrl: string;
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

export interface CardRelatedDataRepositoryPort {
  saveCardSets(sets: CardSetData[]): Promise<Map<string, string>>;
  saveArtwork(cardId: string, imageUrl: string): Promise<string>;
  saveCardPrints(artworkId: string, prints: CardPrintData[], setIds: Map<string, string>): Promise<void>;
  findArtworksByCardExternalId(externalId: string): Promise<ArtworkResult[]>;
  findPrintsByCardExternalId(externalId: string): Promise<CardPrintResult[]>;
  findAllCardSets(): Promise<CardSetResult[]>;
}
