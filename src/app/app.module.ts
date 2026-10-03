import { Module } from '@nestjs/common';
import { CardModule } from '../context/card/card.module';
import { CardImportModule } from '../context/card-import/card-import.module';

@Module({
  imports: [CardModule, CardImportModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
