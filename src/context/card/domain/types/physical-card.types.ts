export interface CreatePhysicalCardParams {
  id?: string;
  artworkId: string;
  cardPrintId?: string | null;
  condition: string;
  language: string;
  isFirstEdition?: boolean;
}

export interface PhysicalCardPrimitives {
  id: string;
  artworkId: string;
  cardPrintId: string | null;
  condition: string;
  language: string;
  isFirstEdition: boolean;
}
