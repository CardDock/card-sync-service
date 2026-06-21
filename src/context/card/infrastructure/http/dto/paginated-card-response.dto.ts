import { ApiProperty } from '@nestjs/swagger';
import { CardResponseDto } from './card-response.dto';

export class PaginatedCardResponseDto {
  @ApiProperty({ type: [CardResponseDto], description: 'List of cards' })
  items: CardResponseDto[];

  @ApiProperty({ description: 'Total number of matching cards', example: 100 })
  total: number;

  @ApiProperty({ description: 'Current page number', example: 1 })
  page: number;

  @ApiProperty({ description: 'Number of items per page', example: 20 })
  limit: number;
}
