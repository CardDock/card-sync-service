import { Module } from '@nestjs/common';
import { CardModule } from '../context/card/card.module';
import { CardImportModule } from '../context/card-import/card-import.module';
import { CardSetsModule } from '../context/card-sets/card-sets.module';

@Module({
  imports: [CardModule, CardImportModule, CardSetsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
