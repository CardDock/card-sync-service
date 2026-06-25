import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SetTranslationDto {
  @ApiProperty({ description: 'Translated card name', example: 'Mago Oscuro' })
  name: string;

  @ApiProperty({
    description: 'Translated card description',
    example: 'El mago definitivo en términos de ataque y defensa.',
  })
  desc: string;

  @ApiPropertyOptional({
    description: 'Translated card type',
    example: 'Monstruo Normal',
  })
  type?: string | null;

  @ApiPropertyOptional({
    description: 'Translated human readable card type',
    example: 'Monstruo Normal',
  })
  humanReadableCardType?: string | null;

  @ApiPropertyOptional({
    description: 'Translated race',
    example: 'Lanzador de Conjuros',
  })
  race?: string | null;
}
