import {
  ConflictException,
  Controller,
  Body,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { GetCardImportStatusUseCase } from '../application/use-cases/get-card-import-status.use-case';
import { CardImportSourcePort } from '../application/ports/card-import-source.port';
import { StartCardImportUseCase } from '../application/use-cases/start-card-import.use-case';

@Controller('card-imports')
export class CardImportController {
  constructor(
    private readonly startImport: StartCardImportUseCase,
    private readonly getStatus: GetCardImportStatusUseCase,
    private readonly source: CardImportSourcePort,
  ) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async start() {
    const process = await this.startImport.execute();
    if (!process)
      throw new ConflictException('A card import process is already running');
    return process;
  }

  @Get('snapshots')
  async snapshots() {
    return this.source.list();
  }

  @Post('rollback')
  @HttpCode(HttpStatus.ACCEPTED)
  async rollback(@Body() body: { snapshotId?: string }) {
    if (!body?.snapshotId) {
      throw new NotFoundException('snapshotId is required');
    }
    const process = await this.startImport.execute(body.snapshotId);
    if (!process)
      throw new ConflictException('A card import process is already running');
    return process;
  }

  @Get(':processId')
  async status(@Param('processId') processId: string) {
    const process = await this.getStatus.execute(processId);
    if (!process) throw new NotFoundException('Import process not found');
    return process;
  }
}
