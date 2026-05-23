import { Module } from '@nestjs/common';
import { TeacherGroupController } from './teacher-group.controller';
import { TeacherGroupService } from './teacher-group.service';
import { PrismaModule } from '../prisma';

@Module({
  imports: [PrismaModule],
  controllers: [TeacherGroupController],
  providers: [TeacherGroupService],
  exports: [TeacherGroupService],
})
export class TeacherGroupModule {}
