import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ScoringService } from './scoring.service';

@ApiTags('scoring')
@Controller('scoring')
export class ScoringController {
  constructor(private readonly scoringService: ScoringService) {}

  @Post('calculate')
  @ApiOperation({ summary: '미션 점수 계산' })
  async calculateScore(
    @Body()
    body: {
      pages: number;
      subject: string;
      difficulty?: number;
      quizScore?: number;
      studyMinutes?: number;
    },
  ) {
    return {
      score: this.scoringService.calculateMissionScore({
        ...body,
        difficulty: body.difficulty || 3,
      }),
    };
  }

  @Get('daily')
  @ApiOperation({ summary: '일간 종합 점수 조회' })
  async getDailyScore(
    @Query('studentId') studentId: number,
    @Query('date') date?: string,
  ) {
    const targetDate = date ? new Date(date) : new Date();
    return this.scoringService.calculateDailyScore(studentId, targetDate);
  }

  @Get('weekly')
  @ApiOperation({ summary: '주간 점수 조회' })
  async getWeeklyScore(
    @Query('studentId') studentId: number,
    @Query('date') date?: string,
  ) {
    const targetDate = date ? new Date(date) : new Date();
    return this.scoringService.getWeeklyScores(studentId, targetDate);
  }
}
