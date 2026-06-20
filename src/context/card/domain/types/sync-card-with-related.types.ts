import { SyncCardParams } from './card.types';
import { CardSetData } from './card-set.types';
import { ArtworkData } from './artwork.types';
import { CardPrintData } from './card-print.types';

export interface SyncCardWithRelatedData {
  card: SyncCardParams;
  cardSets: CardSetData[];
  artworks: ArtworkData[];
  cardPrints: CardPrintData[];
}
