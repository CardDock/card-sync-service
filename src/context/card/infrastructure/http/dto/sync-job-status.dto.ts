import { ApiProperty } from '@nestjs/swagger';

export class SyncJobStatusDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ enum: ['PENDING', 'IN_PROGRESS', 'SUCCESS', 'FAILED'] })
  status: string;

  @ApiProperty({ example: 5000 })
  recordsProcessed: number;

  @ApiProperty({ required: false, example: null })
  errorMessage: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class StartSyncResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  jobId: string;
}
