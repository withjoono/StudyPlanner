import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { NeisController } from './neis.controller';
import { NeisService } from './neis.service';
import { PrismaModule } from '../prisma';

@Module({
  imports: [HttpModule, PrismaModule],
  controllers: [NeisController],
  providers: [NeisService],
})
export class NeisModule {}
