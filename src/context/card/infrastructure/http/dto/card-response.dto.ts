import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CardImageUrlsDto {
  @ApiProperty({
    description: 'Full card image (artwork + frame + name)',
    example: 'media/cards/46986414.jpg?variant=normal',
  })
  full: string;

  @ApiProperty({
    description: 'Small card image (lower resolution)',
    example: 'media/cards/46986414.jpg?variant=small',
  })
  small: string;

  @ApiProperty({
    description: 'Cropped image (only the inner artwork, no frame)',
    example: 'media/cards/46986414.jpg?variant=cropped',
  })
  cropped: string;
}

export class CardPrintInResponseDto {
  @ApiProperty({ description: 'Print ID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Card set ID', example: 'uuid' })
  cardSetId: string;

  @ApiProperty({
    description: 'Card set name',
    example: 'Legend of Blue Eyes White Dragon',
  })
  cardSetName: string;

  @ApiPropertyOptional({
    description: 'Card set code',
    example: 'LOB',
    nullable: true,
  })
  cardSetCode: string | null;

  @ApiProperty({ description: 'Set code of the print', example: 'LOB-000' })
  setCode: string;

  @ApiProperty({ description: 'Rarity', example: 'Ultra Rare' })
  rarity: string;

  @ApiPropertyOptional({
    description: 'Rarity code',
    example: 'ur',
    nullable: true,
  })
  rarityCode: string | null;

  @ApiPropertyOptional({
    description: 'Market price',
    example: 12.5,
    nullable: true,
  })
  setPrice: number | null;

  @ApiProperty({
    description: 'Image variants of the artwork used by this print',
    type: CardImageUrlsDto,
  })
  imageUrls: CardImageUrlsDto;
}

export class CardResponseDto {
  @ApiProperty({ description: 'Card ID (YGOPRODeck ID)', example: '46986414' })
  id: string;

  @ApiProperty({ description: 'Card name', example: 'Dark Magician' })
  name: string;

  @ApiProperty({
    description: 'Card typeline',
    example: ['Spellcaster', 'Normal'],
  })
  typeline: string[];

  @ApiProperty({ description: 'Card type', example: 'Normal Monster' })
  type: string;

  @ApiProperty({
    description: 'Human readable card type',
    example: 'Normal Monster',
  })
  humanReadableCardType: string;

  @ApiProperty({ description: 'Frame type', example: 'normal' })
  frameType: string;

  @ApiProperty({
    description: 'Card description',
    example: 'The ultimate wizard...',
  })
  desc: string;

  @ApiProperty({ description: 'Card race', example: 'Spellcaster' })
  race: string;

  @ApiPropertyOptional({
    description: 'ATK value',
    example: 2500,
    nullable: true,
  })
  atk: number | null;

  @ApiPropertyOptional({
    description: 'DEF value',
    example: 2100,
    nullable: true,
  })
  def: number | null;

  @ApiPropertyOptional({
    description: 'Level/Rank',
    example: 7,
    nullable: true,
  })
  level: number | null;

  @ApiPropertyOptional({
    description: 'Pendulum scale',
    example: null,
    nullable: true,
  })
  scale: number | null;

  @ApiPropertyOptional({
    description: 'Link value',
    example: null,
    nullable: true,
  })
  linkval: number | null;

  @ApiProperty({ description: 'Link markers', example: [] })
  linkmarkers: string[];

  @ApiPropertyOptional({
    description: 'Card attribute',
    example: 'DARK',
    nullable: true,
  })
  attribute: string | null;

  @ApiProperty({
    type: [CardPrintInResponseDto],
    description:
      'Prints (set+rarity variants) with the image URL of the artwork used by each print',
  })
  prints: CardPrintInResponseDto[];
}
