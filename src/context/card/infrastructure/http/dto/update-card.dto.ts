import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCardDto {
  @ApiPropertyOptional({ description: 'Card name', example: 'Dark Magician' })
  name?: string;

  @ApiPropertyOptional({
    description: 'Card typeline',
    example: ['Spellcaster', 'Normal'],
  })
  typeline?: string[];

  @ApiPropertyOptional({ description: 'Card type', example: 'Normal Monster' })
  type?: string;

  @ApiPropertyOptional({
    description: 'Human readable card type',
    example: 'Normal Monster',
  })
  humanReadableCardType?: string;

  @ApiPropertyOptional({ description: 'Frame type', example: 'normal' })
  frameType?: string;

  @ApiPropertyOptional({
    description: 'Card description',
    example: 'The ultimate wizard in terms of attack and defense.',
  })
  desc?: string;

  @ApiPropertyOptional({ description: 'Card race', example: 'Spellcaster' })
  race?: string;

  @ApiPropertyOptional({
    description: 'ATK value',
    example: 2500,
    nullable: true,
  })
  atk?: number | null;

  @ApiPropertyOptional({
    description: 'DEF value',
    example: 2100,
    nullable: true,
  })
  def?: number | null;

  @ApiPropertyOptional({
    description: 'Level/Rank',
    example: 7,
    nullable: true,
  })
  level?: number | null;

  @ApiPropertyOptional({
    description: 'Pendulum scale',
    example: null,
    nullable: true,
  })
  scale?: number | null;

  @ApiPropertyOptional({
    description: 'Link value',
    example: null,
    nullable: true,
  })
  linkval?: number | null;

  @ApiPropertyOptional({ description: 'Link markers', example: [] })
  linkmarkers?: string[];

  @ApiPropertyOptional({
    description: 'Card attribute',
    example: 'DARK',
    nullable: true,
  })
  attribute?: string | null;
}
