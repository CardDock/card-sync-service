import { SyncCardParams } from '../types/card.types';

export interface ExternalCardSourcePort {
  findByExternalId(externalId: string): Promise<SyncCardParams | null>;
}
