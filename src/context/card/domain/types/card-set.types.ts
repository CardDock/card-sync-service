import { CardSetName } from '../value-objects/card-set-name.value-object';
import { CardSetCode } from '../value-objects/card-set-code.value-object';

export interface CardSetData {
  name: string;
  code: string | null;
}

export function createCardSetData(
  name: string,
  code: string | null | undefined,
): CardSetData {
  return {
    name: CardSetName.create(name).toPrimitives(),
    code: CardSetCode.create(code).toPrimitives(),
  };
}
