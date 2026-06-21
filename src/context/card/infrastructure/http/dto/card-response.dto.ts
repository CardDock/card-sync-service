import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CardResponseDto {
  @ApiProperty({ description: 'Internal ID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'External ID from YGOPRODeck', example: '46986414' })
  externalId: string;

  @ApiProperty({ description: 'Card name', example: 'Dark Magician' })
  name: string;

  @ApiProperty({ description: 'Card typeline', example: ['Spellcaster', 'Normal'] })
  typeline: string[];

  @ApiProperty({ description: 'Card type', example: 'Normal Monster' })
  type: string;

  @ApiProperty({ description: 'Human readable card type', example: 'Normal Monster' })
  humanReadableCardType: string;

  @ApiProperty({ description: 'Frame type', example: 'normal' })
  frameType: string;

  @ApiProperty({ description: 'Card description', example: 'The ultimate wizard...' })
  desc: string;

  @ApiProperty({ description: 'Card race', example: 'Spellcaster' })
  race: string;

  @ApiPropertyOptional({ description: 'ATK value', example: 2500, nullable: true })
  atk: number | null;

  @ApiPropertyOptional({ description: 'DEF value', example: 2100, nullable: true })
  def: number | null;

  @ApiPropertyOptional({ description: 'Level/Rank', example: 7, nullable: true })
  level: number | null;

  @ApiPropertyOptional({ description: 'Pendulum scale', example: null, nullable: true })
  scale: number | null;

  @ApiPropertyOptional({ description: 'Link value', example: null, nullable: true })
  linkval: number | null;

  @ApiProperty({ description: 'Link markers', example: [] })
  linkmarkers: string[];

  @ApiPropertyOptional({ description: 'Card attribute', example: 'DARK', nullable: true })
  attribute: string | null;

  @ApiProperty({ description: 'Raw data from external source' })
  rawData: Record<string, unknown>;
}
