import {
  Controller,
  Get,
  Post,
  Param,
  HttpCode,
  HttpStatus,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
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

  @Post(':language')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Start async translation sync for a language from EDOPro SQLite',
  })
  @ApiParam({
    name: 'language',
    example: 'es',
    description: 'Language code (es, en, etc.)',
  })
  @ApiResponse({
    status: 202,
    type: StartSyncResponseDto,
    description: 'Sync job started',
  })
  @ApiResponse({
    status: 409,
    description: 'A sync job is already in progress for this language',
  })
  async startSync(
    @Param('language') language: string,
  ): Promise<StartSyncResponseDto> {
    this.logger.info({ language }, 'Sync cards: checking for in-progress job');

    const inProgress = await this.syncJobRepository.findInProgress(language);

    if (inProgress) {
      this.logger.warn(
        { jobId: inProgress.id, language },
        'Sync cards: conflict — job already in progress',
      );
      throw new ConflictException(
        `A sync job is already in progress for language "${language}" (id: ${inProgress.id})`,
      );
    }

    const jobId = await this.syncJobRepository.create(language);

    this.logger.info(
      { jobId, language },
      'Sync cards: job created, starting async processing',
    );

    setImmediate(() => {
      this.syncTranslationsUseCase.execute(jobId, language).catch((err) => {
        this.logger.error(
          { jobId, language, err },
          'Sync cards: async processing crashed',
        );
      });
    });

    return { jobId, language };
  }

  @Get('status/:language')
  @ApiOperation({
    summary: 'Get the status of the last sync job for a language',
  })
  @ApiParam({ name: 'language', example: 'es', description: 'Language code' })
  @ApiResponse({
    status: 200,
    type: SyncJobStatusDto,
    description: 'Last sync job status for the language',
  })
  async getStatus(
    @Param('language') language: string,
  ): Promise<SyncJobStatusDto | null> {
    this.logger.info({ language }, 'Sync cards status: fetching last job');

    const job = await this.syncJobRepository.findLast(language);

    if (!job) {
      throw new NotFoundException(
        `No sync job found for language "${language}"`,
      );
    }

    return {
      id: job.id,
      status: job.status,
      language: job.language,
      recordsProcessed: job.recordsProcessed,
      errorMessage: job.errorMessage,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    };
  }
}
