import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddPrintDto {
  @ApiProperty({
    description: 'Card set name',
    example: 'Legend of Blue Eyes White Dragon',
  })
  setName: string;

  @ApiProperty({ description: 'Set code', example: 'LOB-001' })
  setCode: string;

  @ApiProperty({ description: 'Rarity', example: 'Ultra Rare' })
  rarity: string;

  @ApiPropertyOptional({
    description: 'Rarity code',
    example: 'UR',
    nullable: true,
  })
  rarityCode?: string | null;

  @ApiPropertyOptional({
    description: 'Set price',
    example: 12.5,
    nullable: true,
  })
  setPrice?: number | null;
}
