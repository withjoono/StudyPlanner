import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { GrowthService, ReflectionDto } from './growth.service';

@Controller('growth')
export class GrowthController {
  constructor(private readonly growthService: GrowthService) {}

  // ─────────── 회고 ───────────

  /** 특정 날짜의 회고 조회 */
  @Get('reflections')
  async getReflection(
    @Query('member_id') memberId: string,
    @Query('date') date?: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    if (startDate && endDate) {
      return this.growthService.getReflections(memberId, startDate, endDate);
    }
    const d = date || new Date().toISOString().split('T')[0];
    return this.growthService.getReflection(memberId, d);
  }

  /** 회고 생성/수정 (upsert) */
  @Post('reflections')
  async upsertReflection(@Body() dto: ReflectionDto) {
    return this.growthService.upsertReflection(dto);
  }

  // ─────────── 통계 ───────────

  /** 성장 통계 (streak, 주간비교, 트렌드) */
  @Get('stats')
  async getGrowthStats(@Query('member_id') memberId: string) {
    return this.growthService.getGrowthStats(memberId);
  }

  // ─────────── AI 코칭 ───────────

  /** AI 코칭 분석 */
  @Get('ai-coaching')
  async getAICoaching(@Query('member_id') memberId: string) {
    return this.growthService.getAICoaching(memberId);
  }
}
