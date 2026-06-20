import { PhysicalCardCondition } from '../value-objects/physical-card-condition.value-object';
import { PhysicalCardLanguage } from '../value-objects/physical-card-language.value-object';
import type {
  CreatePhysicalCardParams,
  PhysicalCardPrimitives,
} from '../types/physical-card.types';

export class PhysicalCard {
  private constructor(
    private readonly id: string,
    private readonly artworkId: string,
    private readonly cardPrintId: string | null,
    private readonly condition: PhysicalCardCondition,
    private readonly language: PhysicalCardLanguage,
    private readonly isFirstEdition: boolean,
  ) {}

  static create(params: CreatePhysicalCardParams): PhysicalCard {
    return new PhysicalCard(
      params.id ?? crypto.randomUUID(),
      params.artworkId,
      params.cardPrintId ?? null,
      PhysicalCardCondition.create(params.condition),
      PhysicalCardLanguage.create(params.language),
      params.isFirstEdition ?? false,
    );
  }

  toPrimitives(): PhysicalCardPrimitives {
    return {
      id: this.id,
      artworkId: this.artworkId,
      cardPrintId: this.cardPrintId,
      condition: this.condition.toPrimitives(),
      language: this.language.toPrimitives(),
      isFirstEdition: this.isFirstEdition,
    };
  }
}
