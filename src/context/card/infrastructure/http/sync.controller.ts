import {
  Controller,
  Get,
  Post,
  HttpCode,
  HttpStatus,
  ConflictException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Logger } from '../../domain/ports/logger.port';
import { SyncJobRepositoryPort } from '../../domain/ports/sync-job-repository.port';
import { SyncTranslationsUseCase } from '../../application/use-cases/sync-translations.use-case';
import {
  SyncJobStatusDto,
  StartSyncResponseDto,
} from './dto/sync-job-status.dto';

@ApiTags('Sync')
@Controller('sync-cards')
export class SyncController {
  constructor(
    private readonly syncJobRepository: SyncJobRepositoryPort,
    private readonly syncTranslationsUseCase: SyncTranslationsUseCase,
    private readonly logger: Logger,
  ) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Start async card translation sync from EDOPro SQLite',
  })
  @ApiResponse({
    status: 202,
    type: StartSyncResponseDto,
    description: 'Sync job started',
  })
  @ApiResponse({
    status: 409,
    description: 'A sync job is already in progress',
  })
  async startSync(): Promise<StartSyncResponseDto> {
    this.logger.info({}, 'Sync cards: checking for in-progress job');

    const inProgress = await this.syncJobRepository.findInProgress();

    if (inProgress) {
      this.logger.warn(
        { jobId: inProgress.id },
        'Sync cards: conflict — job already in progress',
      );
      throw new ConflictException(
        `A sync job is already in progress (id: ${inProgress.id})`,
      );
    }

    const jobId = await this.syncJobRepository.create();

    this.logger.info(
      { jobId },
      'Sync cards: job created, starting async processing',
    );

    setImmediate(() => {
      this.syncTranslationsUseCase.execute(jobId).catch((err) => {
        this.logger.error(
          { jobId, err },
          'Sync cards: async processing crashed',
        );
      });
    });

    return { jobId };
  }

  @Get('status')
  @ApiOperation({ summary: 'Get the status of the last sync job' })
  @ApiResponse({
    status: 200,
    type: SyncJobStatusDto,
    description: 'Last sync job status',
  })
  async getStatus(): Promise<SyncJobStatusDto | null> {
    this.logger.info({}, 'Sync cards status: fetching last job');

    const job = await this.syncJobRepository.findLast();

    if (!job) {
      return null;
    }

    return {
      id: job.id,
      status: job.status,
      recordsProcessed: job.recordsProcessed,
      errorMessage: job.errorMessage,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    };
  }
}
