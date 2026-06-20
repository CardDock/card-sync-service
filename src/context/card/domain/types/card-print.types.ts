import { CardPrintSetCode } from '../value-objects/card-print-set-code.value-object';
import { CardPrintRarity } from '../value-objects/card-print-rarity.value-object';
import { CardPrintRarityCode } from '../value-objects/card-print-rarity-code.value-object';
import { CardPrintSetPrice } from '../value-objects/card-print-set-price.value-object';

export interface CardPrintData {
  setName: string;
  setCode: string;
  rarity: string;
  rarityCode: string | null;
  setPrice: number | null;
}

export function createCardPrintData(
  setName: string,
  setCode: string,
  rarity: string,
  rarityCode: string | null | undefined,
  setPrice: number | string | null | undefined,
): CardPrintData {
  return {
    setName: setName.trim(),
    setCode: CardPrintSetCode.create(setCode).toPrimitives(),
    rarity: CardPrintRarity.create(rarity).toPrimitives(),
    rarityCode: CardPrintRarityCode.create(rarityCode).toPrimitives(),
    setPrice: CardPrintSetPrice.create(setPrice).toPrimitives(),
  };
}
