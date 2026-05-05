import { Module } from '@nestjs/common';
import { MyClassService } from './myclass.service';
import { MyClassController } from './myclass.controller';
import { PrismaModule } from '../prisma';
import { AcornModule } from '../acorn/acorn.module';

@Module({
  imports: [PrismaModule, AcornModule],
  providers: [MyClassService],
  controllers: [MyClassController],
  exports: [MyClassService],
})
export class MyClassModule {}
