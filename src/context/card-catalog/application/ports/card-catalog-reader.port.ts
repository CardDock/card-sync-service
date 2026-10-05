import { CardCatalogDocument } from '../../domain/card-catalog-document';

export abstract class CardCatalogReaderPort {
  abstract findById(id: number): Promise<CardCatalogDocument | null>;
}
