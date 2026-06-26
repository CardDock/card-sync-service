import { ApiProperty } from '@nestjs/swagger';
import { DiscrepancyResponseDto } from './discrepancy-response.dto';

export class PaginatedDiscrepancyResponseDto {
  @ApiProperty({
    type: [DiscrepancyResponseDto],
    description: 'List of discrepancies',
  })
  items: DiscrepancyResponseDto[];

  @ApiProperty({
    description: 'Total number of matching discrepancies',
    example: 5,
  })
  total: number;

  @ApiProperty({ description: 'Current page number', example: 1 })
  page: number;

  @ApiProperty({ description: 'Number of items per page', example: 20 })
  limit: number;
}
