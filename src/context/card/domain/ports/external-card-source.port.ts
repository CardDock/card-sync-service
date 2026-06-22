import { SyncCardWithRelatedData } from '../types/sync-card-with-related.types';

export interface ExternalCardSourcePort {
  findById(id: string): Promise<SyncCardWithRelatedData | null>;
  findByName(name: string): Promise<SyncCardWithRelatedData[]>;
}
