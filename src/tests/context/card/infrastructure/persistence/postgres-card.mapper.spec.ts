import { mapPostgresRowToCard } from '../../../../../context/card/infrastructure/persistence/postgres-card.mapper';

describe('mapPostgresRowToCard', () => {
  it('maps linkmarkers when Postgres returns enum[] as string', () => {
    const card = mapPostgresRowToCard({
      id: '2fdd94a4-5188-4ab5-b3e4-8355be70cf9b',
      external_id: '46986414',
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
    });

    expect(card.toPrimitives()).toMatchObject({
      externalId: '46986414',
      frameType: 'link',
      race: 'Cyberse',
      linkmarkers: ['Top', 'BottomLeft', 'BottomRight'],
      typeline: ['Cyberse', 'Link', 'Effect'],
    });
  });

  it('maps linkmarkers when Postgres returns enum[] as string array', () => {
    const card = mapPostgresRowToCard({
      id: '2fdd94a4-5188-4ab5-b3e4-8355be70cf9b',
      external_id: '46986414',
      name: 'Decode Talker',
      typeline: ['Cyberse', 'Link', 'Effect'],
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
      linkmarkers: ['Top', 'Bottom-Left', 'Bottom-Right'],
      attribute: 'DARK',
      raw_data: { id: 46986414 },
    });

    expect(card.toPrimitives().linkmarkers).toEqual([
      'Top',
      'BottomLeft',
      'BottomRight',
    ]);
  });
});
