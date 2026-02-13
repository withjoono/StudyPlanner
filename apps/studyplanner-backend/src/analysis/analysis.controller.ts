import { Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AnalysisService } from './analysis.service';

@ApiTags('analysis')
@Controller('analysis')
export class AnalysisController {
    constructor(private readonly analysisService: AnalysisService) { }

    @Post('weekly-report')
    @ApiOperation({ summary: '주간 리포트 생성' })
    async generateWeeklyReport(@Query('studentId') studentId: number) {
        return this.analysisService.generateWeeklyReport(studentId);
    }

    @Get('weekly-reports')
    @ApiOperation({ summary: '주간 리포트 목록' })
    async getWeeklyReports(
        @Query('studentId') studentId: number,
        @Query('limit') limit?: number,
    ) {
        return this.analysisService.getWeeklyReports(studentId, limit);
    }
}
