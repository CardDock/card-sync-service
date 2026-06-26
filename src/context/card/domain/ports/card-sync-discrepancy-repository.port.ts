export type DiscrepancyStatus =
  | 'PENDING'
  | 'REVIEWED_LOCAL_WINS'
  | 'REVIEWED_API_WINS'
  | 'RESOLVED';

export interface CardSyncDiscrepancyRecord {
  id: string;
  cardId: string;
  fieldName: string;
  localValue: unknown;
  apiValue: unknown;
  status: DiscrepancyStatus;
  createdAt: Date;
  updatedAt: Date;
}

export abstract class CardSyncDiscrepancyRepositoryPort {
  abstract upsert(
    cardId: string,
    fieldName: string,
    localValue: unknown,
    apiValue: unknown,
  ): Promise<void>;

  abstract findByCardId(cardId: string): Promise<CardSyncDiscrepancyRecord[]>;

  abstract findAll(
    status?: DiscrepancyStatus,
    page?: number,
    limit?: number,
  ): Promise<{
    items: CardSyncDiscrepancyRecord[];
    total: number;
    page: number;
    limit: number;
  }>;

  abstract updateStatus(id: string, status: DiscrepancyStatus): Promise<void>;

  abstract deleteByCardIdAndFieldName(
    cardId: string,
    fieldName: string,
  ): Promise<void>;
}
