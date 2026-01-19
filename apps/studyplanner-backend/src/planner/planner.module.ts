import { Module } from '@nestjs/common';
import { PlannerController } from './planner.controller';
import { PlannerService } from './planner.service';
import { RoutineController } from './routine.controller';
import { RoutineService } from './routine.service';
import { PlanController } from './plan.controller';
import { PlanService } from './plan.service';

@Module({
  controllers: [PlannerController, RoutineController, PlanController],
  providers: [PlannerService, RoutineService, PlanService],
  exports: [PlannerService, RoutineService, PlanService],
})
export class PlannerModule {}
