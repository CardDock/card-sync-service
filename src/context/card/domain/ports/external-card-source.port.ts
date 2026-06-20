import { SyncCardWithRelatedData } from '../types/sync-card-with-related.types';

export interface ExternalCardSourcePort {
  findByExternalId(externalId: string): Promise<SyncCardWithRelatedData | null>;
  findByName(name: string): Promise<SyncCardWithRelatedData[]>;
}
