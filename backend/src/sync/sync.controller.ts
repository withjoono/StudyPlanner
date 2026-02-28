import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SyncService } from './sync.service';

@ApiTags('sync')
@Controller('sync')
export class SyncController {
    constructor(private readonly syncService: SyncService) { }

    @Get('daily')
    @ApiOperation({ summary: '일간 점수 데이터 (SA 전송용)' })
    async getDailyData(
        @Query('studentId') studentId: number,
        @Query('date') date?: string,
    ) {
        return this.syncService.collectDailyScoreData(studentId, date);
    }

    @Get('weekly')
    @ApiOperation({ summary: '주간 데이터 (SA 전송용)' })
    async getWeeklyData(@Query('studentId') studentId: number) {
        return this.syncService.collectWeeklyData(studentId);
    }

    @Get('streak')
    @ApiOperation({ summary: '스트릭 계산' })
    async getStreak(@Query('studentId') studentId: number) {
        const streak = await this.syncService.calculateStreak(studentId);
        return { studentId, streak };
    }

    @Get('package')
    @ApiOperation({ summary: '종합 동기화 패키지' })
    async getSyncPackage(@Query('studentId') studentId: number) {
        return this.syncService.buildSyncPackage(studentId);
    }
}
