import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PlanService } from './plan.service';
import type { CreatePlannerPlanDto, UpdatePlannerPlanDto } from '@gb-planner/shared-types';

@ApiTags('plans')
@Controller('planner/plans')
export class PlanController {
  constructor(private readonly planService: PlanService) {}

  @Get()
  @ApiOperation({ summary: '장기 계획 목록 조회' })
  async getPlans() {
    return this.planService.getPlans();
  }

  @Get(':id')
  @ApiOperation({ summary: '장기 계획 상세 조회' })
  async getPlan(@Param('id') id: number) {
    return this.planService.getPlan(id);
  }

  @Post()
  @ApiOperation({ summary: '장기 계획 생성' })
  async createPlan(@Body() dto: CreatePlannerPlanDto) {
    return this.planService.createPlan(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: '장기 계획 수정' })
  async updatePlan(@Param('id') id: number, @Body() dto: UpdatePlannerPlanDto) {
    return this.planService.updatePlan(id, dto);
  }

  @Put(':id/progress')
  @ApiOperation({ summary: '진행률 업데이트' })
  async updateProgress(@Param('id') id: number, @Body('done') done: number) {
    return this.planService.updateProgress(id, done);
  }

  @Delete(':id')
  @ApiOperation({ summary: '장기 계획 삭제' })
  async deletePlan(@Param('id') id: number) {
    return this.planService.deletePlan(id);
  }
}
