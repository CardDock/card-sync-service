import { Card } from '../entities/card.entity';

export interface CardListFilters {
  name?: string;
  type?: string;
  race?: string;
  attribute?: string;
  frameType?: string;
  atkMin?: number;
  atkMax?: number;
  defMin?: number;
  defMax?: number;
  level?: number;
  linkval?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface CardQueryRepositoryPort {
  findById(id: string): Promise<Card | null>;
  findByName(name: string): Promise<Card[]>;
  findAll(
    filters: CardListFilters,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<Card>>;
}
