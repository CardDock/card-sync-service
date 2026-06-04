import { Card } from '../entities/card.entity';

export interface CardQueryRepositoryPort {
  findByExternalId(externalId: string): Promise<Card | null>;
}
