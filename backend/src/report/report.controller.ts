import { Controller, Get, Post, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ReportService } from './report.service';

@ApiTags('report')
@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post('weekly/:studentId')
  @ApiOperation({ summary: '주간 리포트 수동 생성' })
  async generateWeeklyReport(
    @Param('studentId') studentId: number,
    @Query('weekStart') weekStart?: string,
  ) {
    const date = weekStart ? new Date(weekStart) : undefined;
    return this.reportService.generateWeeklyReport(+studentId, date);
  }

  @Get('weekly/:studentId')
  @ApiOperation({ summary: '주간 리포트 조회' })
  async getWeeklyReport(
    @Param('studentId') studentId: number,
    @Query('weekStart') weekStart?: string,
  ) {
    const date = weekStart ? new Date(weekStart) : undefined;
    return this.reportService.getWeeklyReport(+studentId, date);
  }

  @Get('history/:studentId')
  @ApiOperation({ summary: '리포트 히스토리 조회' })
  async getReportHistory(@Param('studentId') studentId: number, @Query('limit') limit?: number) {
    return this.reportService.getReportHistory(+studentId, limit ? +limit : 12);
  }
}
