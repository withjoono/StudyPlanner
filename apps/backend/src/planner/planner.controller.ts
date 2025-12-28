import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PlannerService } from './planner.service';
import type { CreatePlannerItemDto, UpdatePlannerItemDto } from '@gb-planner/shared-types';

@ApiTags('planner')
@Controller('planner')
export class PlannerController {
  constructor(private readonly plannerService: PlannerService) {}

  @Get('items')
  @ApiOperation({ summary: '플래너 아이템 목록 조회' })
  @ApiResponse({ status: 200, description: '성공' })
  async getItems(
    @Query('memberId') memberId?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.plannerService.getItems({ memberId, startDate, endDate });
  }

  @Get('items/:id')
  @ApiOperation({ summary: '플래너 아이템 상세 조회' })
  async getItem(@Param('id') id: number) {
    return this.plannerService.getItem(id);
  }

  @Post('items')
  @ApiOperation({ summary: '플래너 아이템 생성' })
  async createItem(@Body() dto: CreatePlannerItemDto) {
    return this.plannerService.createItem(dto);
  }

  @Put('items/:id')
  @ApiOperation({ summary: '플래너 아이템 수정' })
  async updateItem(@Param('id') id: number, @Body() dto: UpdatePlannerItemDto) {
    return this.plannerService.updateItem(id, dto);
  }

  @Put('items/:id/progress')
  @ApiOperation({ summary: '성취도 업데이트' })
  async updateProgress(@Param('id') id: number, @Body('progress') progress: number) {
    return this.plannerService.updateProgress(id, progress);
  }

  @Put('items/:id/complete')
  @ApiOperation({ summary: '미션 완료 처리' })
  async completeItem(@Param('id') id: number) {
    return this.plannerService.completeItem(id);
  }

  @Delete('items/:id')
  @ApiOperation({ summary: '플래너 아이템 삭제' })
  async deleteItem(@Param('id') id: number) {
    return this.plannerService.deleteItem(id);
  }

  @Get('dashboard')
  @ApiOperation({ summary: '대시보드 데이터 조회' })
  async getDashboard(@Query('memberId') memberId?: number) {
    return this.plannerService.getDashboard(memberId);
  }

  @Get('weekly-progress')
  @ApiOperation({ summary: '주간 성취도 조회' })
  async getWeeklyProgress(@Query('memberId') memberId?: number) {
    return this.plannerService.getWeeklyProgress(memberId);
  }

  @Get('rank')
  @ApiOperation({ summary: '클래스 순위 조회' })
  async getRank(@Query('memberId') memberId?: number, @Query('period') period?: 'D' | 'W' | 'M') {
    return this.plannerService.getRank(memberId, period);
  }
}
