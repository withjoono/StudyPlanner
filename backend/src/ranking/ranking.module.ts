import { Module } from '@nestjs/common';
import { RankingService } from './ranking.service';
import { RankingController } from './ranking.controller';
import { PrismaModule } from '../prisma';

@Module({
  imports: [PrismaModule],
  providers: [RankingService],
  controllers: [RankingController],
  exports: [RankingService],
})
export class RankingModule {}
