import {
  CardPrimitives,
  CreateCardParams,
  SyncCardParams,
} from '../types/card.types';
import { CardAttribute } from '../value-objects/card-attribute.value-object';
import { CardAtk } from '../value-objects/card-atk.value-object';
import { CardDescription } from '../value-objects/card-description.value-object';
import { CardDef } from '../value-objects/card-def.value-object';
import { CardFrameType } from '../value-objects/card-frame-type.value-object';
import { CardHumanReadableCardType } from '../value-objects/card-human-readable-card-type.value-object';
import { CardId } from '../value-objects/card-id.value-object';
import { CardLevel } from '../value-objects/card-level.value-object';
import { CardLinkmarkers } from '../value-objects/card-linkmarkers.value-object';
import { CardLinkval } from '../value-objects/card-linkval.value-object';
import { CardName } from '../value-objects/card-name.value-object';
import { CardRace } from '../value-objects/card-race.value-object';
import { CardRawData } from '../value-objects/card-raw-data.value-object';
import { CardScale } from '../value-objects/card-scale.value-object';
import { CardTypeline } from '../value-objects/card-typeline.value-object';
import { CardType } from '../value-objects/card-type.value-object';

export class Card {
  private constructor(private props: CardPrimitives) {}

  static create(params: CreateCardParams): Card {
    const id = CardId.create(params.id);
    const name = CardName.create(params.name);
    const type = CardType.create(params.type);
    const humanReadableCardType = CardHumanReadableCardType.create(
      params.humanReadableCardType,
    );
    const desc = CardDescription.create(params.desc);
    const frameType = CardFrameType.create(params.frameType);
    const race = CardRace.create(params.race);
    const typeline = CardTypeline.create(params.typeline);
    const atk = CardAtk.create(params.atk);
    const def = CardDef.create(params.def);
    const level = CardLevel.create(params.level);
    const scale = CardScale.create(params.scale);
    const linkval = CardLinkval.create(params.linkval);
    const linkmarkers = CardLinkmarkers.create(params.linkmarkers);
    const attribute = CardAttribute.create(params.attribute);
    const rawData = CardRawData.create(params.rawData);

    return new Card({
      id: id.toPrimitives(),
      name: name.toPrimitives(),
      typeline: typeline.toPrimitives(),
      type: type.toPrimitives(),
      humanReadableCardType: humanReadableCardType.toPrimitives(),
      frameType: frameType.toPrimitives(),
      desc: desc.toPrimitives(),
      race: race.toPrimitives(),
      atk: atk.toPrimitives(),
      def: def.toPrimitives(),
      level: level.toPrimitives(),
      scale: scale.toPrimitives(),
      linkval: linkval.toPrimitives(),
      linkmarkers: linkmarkers.toPrimitives(),
      attribute: attribute.toPrimitives(),
      rawData: rawData.toPrimitives(),
    });
  }

  syncFromSource(params: SyncCardParams): void {
    const id = CardId.create(params.id);
    const name = CardName.create(params.name);
    const type = CardType.create(params.type);
    const humanReadableCardType = CardHumanReadableCardType.create(
      params.humanReadableCardType,
    );
    const desc = CardDescription.create(params.desc);
    const frameType = CardFrameType.create(params.frameType);
    const race = CardRace.create(params.race);
    const typeline = CardTypeline.create(params.typeline);
    const atk = CardAtk.create(params.atk);
    const def = CardDef.create(params.def);
    const level = CardLevel.create(params.level);
    const scale = CardScale.create(params.scale);
    const linkval = CardLinkval.create(params.linkval);
    const linkmarkers = CardLinkmarkers.create(params.linkmarkers);
    const attribute = CardAttribute.create(params.attribute);
    const rawData = CardRawData.create(params.rawData);

    this.props = {
      ...this.props,
      id: id.toPrimitives(),
      name: name.toPrimitives(),
      typeline: typeline.toPrimitives(),
      type: type.toPrimitives(),
      humanReadableCardType: humanReadableCardType.toPrimitives(),
      frameType: frameType.toPrimitives(),
      desc: desc.toPrimitives(),
      race: race.toPrimitives(),
      atk: atk.toPrimitives(),
      def: def.toPrimitives(),
      level: level.toPrimitives(),
      scale: scale.toPrimitives(),
      linkval: linkval.toPrimitives(),
      linkmarkers: linkmarkers.toPrimitives(),
      attribute: attribute.toPrimitives(),
      rawData: rawData.toPrimitives(),
    };
  }

  toPrimitives(): CardPrimitives {
    return {
      ...this.props,
      typeline: [...this.props.typeline],
      linkmarkers: [...this.props.linkmarkers],
      rawData: CardRawData.create(this.props.rawData).toPrimitives(),
    };
  }
}
