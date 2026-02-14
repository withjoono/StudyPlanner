import { Controller, Get, Post, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ScoringService } from './scoring.service';

@ApiTags('scoring')
@Controller('scoring')
export class ScoringController {
  constructor(private readonly scoringService: ScoringService) {}

  @Post('calculate/:studentId')
  @ApiOperation({ summary: '일간 성과 점수 재계산' })
  async calculateDailyScore(@Param('studentId') studentId: number, @Query('date') date?: string) {
    const targetDate = date ? new Date(date) : undefined;
    return this.scoringService.calculateDailyScore(+studentId, targetDate);
  }

  @Get('daily/:studentId')
  @ApiOperation({ summary: '일간 점수 조회 (기간)' })
  async getDailyScores(@Param('studentId') studentId: number, @Query('days') days?: number) {
    return this.scoringService.getDailyScores(+studentId, days ? +days : 30);
  }

  @Get('today/:studentId')
  @ApiOperation({ summary: '오늘 점수 요약' })
  async getTodayScore(@Param('studentId') studentId: number) {
    return this.scoringService.getTodayScore(+studentId);
  }
}
