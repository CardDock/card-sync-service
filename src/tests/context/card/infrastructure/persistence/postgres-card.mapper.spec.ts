import {
  mapPostgresRowToCard,
  mapCardToPostgresRecord,
} from '../../../../../context/card/infrastructure/persistence/postgres-card.mapper';
import { Card } from '../../../../../context/card/domain/entities/card.entity';

const buildMinimalRow = (overrides: Record<string, unknown> = {}) => ({
  id: '46986414',
  name: 'Decode Talker',
  typeline: '{Cyberse,Link,Effect}',
  type: 'Link Monster',
  human_readable_card_type: 'Link Monster',
  frame_type: 'link',
  desc: 'A test card.',
  race: 'Cyberse',
  atk: 2300,
  def: null,
  level: null,
  scale: null,
  linkval: 3,
  linkmarkers: '{Top,Bottom-Left,Bottom-Right}',
  attribute: 'DARK',
  raw_data: { id: 46986414 },
  manually_edited: false,
  manually_edited_at: null,
  ...overrides,
});

describe('mapPostgresRowToCard', () => {
  it('maps linkmarkers when Postgres returns enum[] as string', () => {
    const card = mapPostgresRowToCard(buildMinimalRow());

    expect(card.toPrimitives()).toMatchObject({
      id: '46986414',
      frameType: 'link',
      race: 'Cyberse',
      linkmarkers: ['Top', 'BottomLeft', 'BottomRight'],
      typeline: ['Cyberse', 'Link', 'Effect'],
    });
  });

  it('maps linkmarkers when Postgres returns enum[] as string array', () => {
    const card = mapPostgresRowToCard(
      buildMinimalRow({
        typeline: ['Cyberse', 'Link', 'Effect'],
        linkmarkers: ['Top', 'Bottom-Left', 'Bottom-Right'],
      }),
    );

    expect(card.toPrimitives().linkmarkers).toEqual([
      'Top',
      'BottomLeft',
      'BottomRight',
    ]);
  });

  it('handles null attribute', () => {
    const card = mapPostgresRowToCard(buildMinimalRow({ attribute: null }));

    expect(card.toPrimitives().attribute).toBeNull();
  });

  it('handles non-array non-string typeline as empty array', () => {
    const card = mapPostgresRowToCard(
      buildMinimalRow({ typeline: null, linkmarkers: null }),
    );

    expect(card.toPrimitives().typeline).toEqual([]);
    expect(card.toPrimitives().linkmarkers).toEqual([]);
  });

  it('handles empty string typeline as empty array', () => {
    const card = mapPostgresRowToCard(
      buildMinimalRow({ typeline: '', linkmarkers: '' }),
    );

    expect(card.toPrimitives().typeline).toEqual([]);
    expect(card.toPrimitives().linkmarkers).toEqual([]);
  });

  it('handles {} typeline as empty array', () => {
    const card = mapPostgresRowToCard(
      buildMinimalRow({ typeline: '{}', linkmarkers: '{}' }),
    );

    expect(card.toPrimitives().typeline).toEqual([]);
    expect(card.toPrimitives().linkmarkers).toEqual([]);
  });

  it('handles single bare value not wrapped in braces', () => {
    const card = mapPostgresRowToCard(
      buildMinimalRow({
        typeline: 'Spellcaster',
        linkmarkers: 'Top',
      }),
    );

    expect(card.toPrimitives().typeline).toEqual(['Spellcaster']);
    expect(card.toPrimitives().linkmarkers).toEqual(['Top']);
  });

  it('maps all scalar fields correctly', () => {
    const card = mapPostgresRowToCard(buildMinimalRow());

    const primitives = card.toPrimitives();
    expect(primitives.id).toBe('46986414');
    expect(primitives.name).toBe('Decode Talker');
    expect(primitives.type).toBe('Link Monster');
    expect(primitives.humanReadableCardType).toBe('Link Monster');
    expect(primitives.frameType).toBe('link');
    expect(primitives.desc).toBe('A test card.');
    expect(primitives.race).toBe('Cyberse');
    expect(primitives.atk).toBe(2300);
    expect(primitives.def).toBeNull();
    expect(primitives.level).toBeNull();
    expect(primitives.scale).toBeNull();
    expect(primitives.linkval).toBe(3);
    expect(primitives.rawData).toEqual({ id: 46986414 });
  });

  it('splits Postgres array by comma ignoring inner quotes', () => {
    const card = mapPostgresRowToCard(
      buildMinimalRow({ typeline: '{"Cyberse","Link, Effect"}' }),
    );

    expect(card.toPrimitives().typeline).toEqual(['Cyberse', 'Link', 'Effect']);
  });
});

describe('mapCardToPostgresRecord', () => {
  it('maps a Card entity to postgres-compatible record', () => {
    const card = Card.create({
      id: '46986414',
      name: 'Decode Talker',
      typeline: ['Cyberse', 'Link', 'Effect'],
      type: 'Link Monster',
      humanReadableCardType: 'Link Monster',
      frameType: 'link',
      desc: 'A test card.',
      race: 'Cyberse',
      atk: 2300,
      def: null,
      level: null,
      scale: null,
      linkval: 3,
      linkmarkers: ['Top', 'BottomLeft', 'BottomRight'],
      attribute: 'DARK',
      rawData: { id: 46986414 },
    });

    const record = mapCardToPostgresRecord(card);

    expect(record).toMatchObject({
      id: '46986414',
      name: 'Decode Talker',
      typeline: ['Cyberse', 'Link', 'Effect'],
      type: 'Link Monster',
      humanReadableCardType: 'Link Monster',
      frameType: 'link',
      desc: 'A test card.',
      race: 'Cyberse',
      atk: 2300,
      def: null,
      level: null,
      scale: null,
      linkval: 3,
      linkmarkers: ['Top', 'Bottom-Left', 'Bottom-Right'],
      attribute: 'DARK',
      rawData: { id: 46986414 },
    });
  });
});
