import { Card } from '../entities/card.entity';

export interface CardRepositoryPort {
  save(card: Card): Promise<void>;
}
