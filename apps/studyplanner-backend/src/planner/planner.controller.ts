import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PlannerService } from './planner.service';
import { PrismaService } from '../prisma/prisma.service';
import type { CreatePlannerItemDto, UpdatePlannerItemDto } from '@gb-planner/shared-types';

@ApiTags('planner')
@Controller('planner')
export class PlannerController {
  constructor(
    private readonly plannerService: PlannerService,
    private readonly prisma: PrismaService,
  ) {}

  /** 사용자 ID prefix 기반 교육과정 판별 */
  private getCurriculum(userId: string): '2015' | '2022' {
    const idBody = userId.startsWith('sp_') ? userId.substring(3) : userId;
    const prefix = idBody.substring(0, 4).toUpperCase();
    if (['26H3', '26H4', '26H0'].includes(prefix)) return '2015';
    return '2022';
  }

  @Get('subjects')
  @ApiOperation({ summary: '사용 가능한 교과/과목 목록 (사용자 ID 기반)' })
  async getSubjects(@Query('userId') userId?: string) {
    const curriculum = this.getCurriculum(userId || '');
    const tableName = curriculum === '2015' ? 'hub_2015_kyokwa_subject' : 'hub_2022_kyokwa_subject';

    const subjects = (await this.prisma.$queryRawUnsafe(`
      SELECT id, kyokwa, kyokwa_code, classification, classification_code,
             subject_name, subject_code, evaluation_method
      FROM ${tableName}
      ORDER BY kyokwa_code, classification_code, subject_code
    `)) as any[];

    // 교과별 그룹핑
    const grouped: Record<string, { kyokwa: string; kyokwaCode: string; subjects: any[] }> = {};
    for (const s of subjects) {
      const key = s.kyokwa_code || 'etc';
      if (!grouped[key]) {
        grouped[key] = { kyokwa: s.kyokwa, kyokwaCode: key, subjects: [] };
      }
      grouped[key].subjects.push({
        id: s.id,
        subjectName: s.subject_name,
        subjectCode: s.subject_code,
        classification: s.classification,
        classificationCode: s.classification_code,
        evaluationMethod: s.evaluation_method,
      });
    }

    return {
      curriculum,
      groups: Object.values(grouped),
    };
  }

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
