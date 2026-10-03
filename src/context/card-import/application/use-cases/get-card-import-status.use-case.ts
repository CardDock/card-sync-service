import { Injectable } from '@nestjs/common';
import { ImportProcessRepositoryPort } from '../ports/import-process-repository.port';

@Injectable()
export class GetCardImportStatusUseCase {
  constructor(
    private readonly processRepository: ImportProcessRepositoryPort,
  ) {}

  execute(processId: string) {
    return this.processRepository.findById(processId);
  }
}
