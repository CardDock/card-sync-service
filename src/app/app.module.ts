import { Module } from '@nestjs/common';
import { CardModule } from '../context/card/card.module';

@Module({
  imports: [CardModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
