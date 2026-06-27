import { Card } from '../entities/card.entity';

export interface CardRepositoryPort {
  save(card: Card): Promise<string>;
  delete(id: string): Promise<void>;

  updateCardFields(
    id: string,
    updates: Partial<{
      name: string;
      typeline: string[];
      type: string;
      humanReadableCardType: string;
      frameType: string;
      desc: string;
      race: string;
      atk: number | null;
      def: number | null;
      level: number | null;
      scale: number | null;
      linkval: number | null;
      linkmarkers: string[];
      attribute: string | null;
    }>,
  ): Promise<void>;

  markAsManuallyEdited(
    id: string,
    updates: Partial<{
      name: string;
      typeline: string[];
      type: string;
      humanReadableCardType: string;
      frameType: string;
      desc: string;
      race: string;
      atk: number | null;
      def: number | null;
      level: number | null;
      scale: number | null;
      linkval: number | null;
      linkmarkers: string[];
      attribute: string | null;
    }>,
  ): Promise<void>;

  clearManualEditFlag(id: string): Promise<void>;
  isManuallyEdited(id: string): Promise<boolean>;
  getManuallyEditedCardIds(): Promise<string[]>;

  batchInsertStubs(rows: { cardId: string }[]): Promise<void>;
}
