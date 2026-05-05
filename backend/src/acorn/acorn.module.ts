import { Module } from '@nestjs/common';
import { AcornService } from './acorn.service';
import { AcornController } from './acorn.controller';
import { PrismaModule } from '../prisma';

@Module({
  imports: [PrismaModule],
  providers: [AcornService],
  controllers: [AcornController],
  exports: [AcornService],
})
export class AcornModule {}
