export interface CardCombatStatsPrimitives {
  atk: number | null;
  def: number | null;
  level: number | null;
}

export interface CardClassificationPrimitives {
  race: string | null;
  attribute: string | null;
  archetype: string | null;
}

export interface CardPrimitives {
  id: string;
  externalId: number;
  name: string;
  type: string;
  description: string;
  combatStats: CardCombatStatsPrimitives;
  classification: CardClassificationPrimitives;
  lastSyncedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCardParams {
  id?: string;
  externalId: number;
  name: string;
  type: string;
  description: string;
  combatStats?: Partial<CardCombatStatsPrimitives>;
  classification?: Partial<CardClassificationPrimitives>;
  lastSyncedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SyncCardParams {
  externalId: number;
  name: string;
  type: string;
  description: string;
  combatStats?: Partial<CardCombatStatsPrimitives>;
  classification?: Partial<CardClassificationPrimitives>;
}
