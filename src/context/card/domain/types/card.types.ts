export type CardFrameType =
  | 'normal'
  | 'effect'
  | 'ritual'
  | 'fusion'
  | 'synchro'
  | 'xyz'
  | 'link'
  | 'spell'
  | 'trap'
  | 'token'
  | 'skill';

export type CardRace =
  | 'Aqua'
  | 'Beast'
  | 'BeastWarrior'
  | 'Cyberse'
  | 'Dinosaur'
  | 'DivineBeast'
  | 'Dragon'
  | 'Fish'
  | 'Fairy'
  | 'Fiend'
  | 'Illusion'
  | 'Insect'
  | 'Machine'
  | 'Plant'
  | 'Psychic'
  | 'Pyro'
  | 'Reptile'
  | 'Rock'
  | 'SeaSerpent'
  | 'Spellcaster'
  | 'Thunder'
  | 'Warrior'
  | 'WingedBeast'
  | 'Wyrm'
  | 'Zombie'
  | 'Normal'
  | 'Field'
  | 'Equip'
  | 'Continuous'
  | 'QuickPlay'
  | 'Ritual'
  | 'Counter';

export type CardAttribute =
  | 'DARK'
  | 'LIGHT'
  | 'EARTH'
  | 'WATER'
  | 'FIRE'
  | 'WIND'
  | 'DIVINE';

export type CardLinkMarker =
  | 'Top'
  | 'Bottom'
  | 'Left'
  | 'Right'
  | 'BottomLeft'
  | 'BottomRight'
  | 'TopLeft'
  | 'TopRight';

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;
export type JsonObject = { [key: string]: JsonValue };
export type JsonArray = JsonValue[];

export type CardResponse = Omit<CardPrimitives, 'rawData'>;

export interface CardPrimitives {
  id: string;
  name: string;
  typeline: string[];
  type: string;
  humanReadableCardType: string;
  frameType: CardFrameType;
  desc: string;
  race: CardRace;
  atk: number | null;
  def: number | null;
  level: number | null;
  scale: number | null;
  linkval: number | null;
  linkmarkers: CardLinkMarker[];
  attribute: CardAttribute | null;
  rawData: JsonValue;
}

export interface CreateCardParams {
  id: string;
  name: string;
  typeline: string[];
  type: string;
  humanReadableCardType: string;
  frameType: CardFrameType;
  desc: string;
  race: CardRace;
  atk?: number | null;
  def?: number | null;
  level?: number | null;
  scale?: number | null;
  linkval?: number | null;
  linkmarkers: CardLinkMarker[];
  attribute?: CardAttribute | null;
  rawData: JsonValue;
}

export interface SyncCardParams {
  id: string;
  name: string;
  typeline: string[];
  type: string;
  humanReadableCardType: string;
  frameType: CardFrameType;
  desc: string;
  race: CardRace;
  atk?: number | null;
  def?: number | null;
  level?: number | null;
  scale?: number | null;
  linkval?: number | null;
  linkmarkers: CardLinkMarker[];
  attribute?: CardAttribute | null;
  rawData: JsonValue;
}
