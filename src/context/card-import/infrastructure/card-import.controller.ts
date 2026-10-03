import {
  ConflictException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { GetCardImportStatusUseCase } from '../application/use-cases/get-card-import-status.use-case';
import { StartCardImportUseCase } from '../application/use-cases/start-card-import.use-case';

@Controller('card-imports')
export class CardImportController {
  constructor(
    private readonly startImport: StartCardImportUseCase,
    private readonly getStatus: GetCardImportStatusUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async start() {
    const process = await this.startImport.execute();
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
