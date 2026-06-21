import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterPhysicalCardDto {
  @ApiProperty({
    description: 'External ID of the card from YGOPRODeck',
    example: '46986414',
  })
  externalId: string;

  @ApiPropertyOptional({
    description: 'ID of the specific card print',
    example: null,
    nullable: true,
  })
  cardPrintId?: string | null;

  @ApiProperty({
    description: 'Condition of the physical card',
    example: 'Near Mint',
  })
  condition: string;

  @ApiProperty({
    description: 'Language of the card',
    example: 'English',
  })
  language: string;

  @ApiPropertyOptional({
    description: 'Whether the card is first edition',
    example: true,
  })
  isFirstEdition?: boolean;
}
