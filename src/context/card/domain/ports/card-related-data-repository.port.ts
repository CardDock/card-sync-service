import { CardSetData } from '../types/card-set.types';
import { CardPrintData } from '../types/card-print.types';

export interface CardRelatedDataRepositoryPort {
  saveCardSets(sets: CardSetData[]): Promise<Map<string, string>>;
  saveArtwork(cardId: string, imageUrl: string): Promise<string>;
  saveCardPrints(artworkId: string, prints: CardPrintData[], setIds: Map<string, string>): Promise<void>;
  findFirstArtworkIdByCardExternalId(externalId: string): Promise<string | null>;
}
