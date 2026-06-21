import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CardPrintResponseDto {
  @ApiProperty({ description: 'Print ID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Card set ID', example: 'uuid' })
  cardSetId: string;

  @ApiProperty({ description: 'Card set name', example: 'Legend of Blue Eyes White Dragon' })
  cardSetName: string;

  @ApiPropertyOptional({ description: 'Card set code', example: 'LOB', nullable: true })
  cardSetCode: string | null;

  @ApiProperty({ description: 'Set code of the print', example: 'LOB-000' })
  setCode: string;

  @ApiProperty({ description: 'Rarity', example: 'Ultra Rare' })
  rarity: string;

  @ApiPropertyOptional({ description: 'Rarity code', example: 'ur', nullable: true })
  rarityCode: string | null;

  @ApiPropertyOptional({ description: 'Market price', example: 12.5, nullable: true })
  setPrice: number | null;
}
