import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PhysicalCardResponseDto {
  @ApiProperty({ description: 'Internal ID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Artwork ID', example: 'uuid' })
  artworkId: string;

  @ApiPropertyOptional({ description: 'Card print ID', example: null, nullable: true })
  cardPrintId: string | null;

  @ApiProperty({ description: 'Condition', example: 'Near Mint' })
  condition: string;

  @ApiProperty({ description: 'Language', example: 'English' })
  language: string;

  @ApiProperty({ description: 'Whether the card is first edition', example: true })
  isFirstEdition: boolean;
}
