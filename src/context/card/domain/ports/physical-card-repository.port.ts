import { PhysicalCard } from '../entities/physical-card.entity';

export interface PhysicalCardRepositoryPort {
  save(physicalCard: PhysicalCard): Promise<PhysicalCard>;
}
