import { Module } from '@nestjs/common';
import { MentoringController } from './mentoring.controller';
import { MentoringService } from './mentoring.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MentoringController],
  providers: [MentoringService],
  exports: [MentoringService],
})
export class MentoringModule {}
