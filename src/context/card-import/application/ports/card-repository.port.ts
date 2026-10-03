import { ImportableCard } from './card-import-source.port';

export abstract class CardRepositoryPort {
  abstract upsertMany(
    cards: ImportableCard[],
  ): Promise<{ succeeded: number; failed: number }>;
}
