import {
  CardPrimitives,
  CreateCardParams,
  SyncCardParams,
} from '../types/card.types';
import { CardClassification } from '../value-objects/card-classification.value-object';
import { CardCombatStats } from '../value-objects/card-combat-stats.value-object';
import { CardCreatedAt } from '../value-objects/card-created-at.value-object';
import { CardDescription } from '../value-objects/card-description.value-object';
import { CardExternalId } from '../value-objects/card-external-id.value-object';
import { CardId } from '../value-objects/card-id.value-object';
import { CardLastSyncedAt } from '../value-objects/card-last-synced-at.value-object';
import { CardName } from '../value-objects/card-name.value-object';
import { CardType } from '../value-objects/card-type.value-object';
import { CardUpdatedAt } from '../value-objects/card-updated-at.value-object';

export class Card {
  private constructor(private props: CardPrimitives) {}

  static create(params: CreateCardParams): Card {
    const now = new Date();
    const id = CardId.create(params.id);
    const externalId = CardExternalId.create(params.externalId);
    const name = CardName.create(params.name);
    const type = CardType.create(params.type);
    const description = CardDescription.create(params.description);
    const combatStats = CardCombatStats.create(params.combatStats);
    const classification = CardClassification.create(params.classification);
    const lastSyncedAt = CardLastSyncedAt.create(params.lastSyncedAt ?? now);
    const createdAt = CardCreatedAt.create(params.createdAt ?? now);
    const updatedAt = CardUpdatedAt.create(params.updatedAt ?? now);

    return new Card({
      id: id.toPrimitives(),
      externalId: externalId.toPrimitives(),
      name: name.toPrimitives(),
      type: type.toPrimitives(),
      description: description.toPrimitives(),
      combatStats: combatStats.toPrimitives(),
      classification: classification.toPrimitives(),
      lastSyncedAt: lastSyncedAt.toPrimitives(),
      createdAt: createdAt.toPrimitives(),
      updatedAt: updatedAt.toPrimitives(),
    });
  }

  syncFromSource(params: SyncCardParams): void {
    const now = new Date();
    const externalId = CardExternalId.create(params.externalId);
    const name = CardName.create(params.name);
    const type = CardType.create(params.type);
    const description = CardDescription.create(params.description);
    const combatStats = CardCombatStats.create(params.combatStats);
    const classification = CardClassification.create(params.classification);
    const lastSyncedAt = CardLastSyncedAt.create(now);
    const updatedAt = CardUpdatedAt.create(now);

    this.props = {
      ...this.props,
      externalId: externalId.toPrimitives(),
      name: name.toPrimitives(),
      type: type.toPrimitives(),
      description: description.toPrimitives(),
      combatStats: combatStats.toPrimitives(),
      classification: classification.toPrimitives(),
      lastSyncedAt: lastSyncedAt.toPrimitives(),
      updatedAt: updatedAt.toPrimitives(),
    };
  }

  toPrimitives(): CardPrimitives {
    return {
      ...this.props,
      combatStats: { ...this.props.combatStats },
      classification: { ...this.props.classification },
    };
  }
}
