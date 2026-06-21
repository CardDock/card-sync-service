import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CardSetResponseDto {
  @ApiProperty({ description: 'Card set ID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Card set name', example: 'Legend of Blue Eyes White Dragon' })
  name: string;

  @ApiPropertyOptional({ description: 'Card set code', example: 'LOB', nullable: true })
  code: string | null;
}
