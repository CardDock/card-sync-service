import { CardCatalogReaderPort } from '../ports/card-catalog-reader.port';
import {
  CardCatalogNotFoundError,
  InvalidCardCatalogIdError,
} from '../errors/card-catalog.errors';

export class GetCardByIdUseCase {
  constructor(private readonly reader: CardCatalogReaderPort) {}

  async execute(rawId: string): Promise<Record<string, unknown>> {
    const id = parseCardId(rawId);
    const card = await this.reader.findById(id);

    if (!card) {
      throw new CardCatalogNotFoundError(id);
    }

    return card;
  }
}

function parseCardId(rawId: string): number {
  if (!/^\d+$/.test(rawId)) {
    throw new InvalidCardCatalogIdError();
  }

  const id = Number(rawId);
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new InvalidCardCatalogIdError();
  }

  return id;
}
