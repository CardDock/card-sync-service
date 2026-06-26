import { ApiProperty } from '@nestjs/swagger';

export class ResolveDiscrepancyDto {
  @ApiProperty({
    description: 'Resolution action',
    enum: ['REVIEWED_LOCAL_WINS', 'REVIEWED_API_WINS', 'RESOLVED'],
    example: 'REVIEWED_API_WINS',
  })
  action: 'REVIEWED_LOCAL_WINS' | 'REVIEWED_API_WINS' | 'RESOLVED';
}
