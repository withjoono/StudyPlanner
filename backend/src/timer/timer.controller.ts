import { Controller, Get, Post, Put, Query, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TimerService } from './timer.service';

@ApiTags('timer')
@Controller('timer')
export class TimerController {
    constructor(private readonly timerService: TimerService) { }

    @Post('start')
    @ApiOperation({ summary: '포모도로 타이머 시작' })
    async startSession(
        @Body() body: { studentId: number; missionId?: number; targetMin?: number; subject?: string },
    ) {
        return this.timerService.startSession(body);
    }

    @Put(':id/end')
    @ApiOperation({ summary: '타이머 세션 종료' })
    async endSession(@Param('id') id: number) {
        return this.timerService.endSession(id);
    }

    @Get('active')
    @ApiOperation({ summary: '진행 중인 세션 조회' })
    async getActiveSession(@Query('studentId') studentId: number) {
        return this.timerService.getActiveSession(studentId);
    }

    @Get('today')
    @ApiOperation({ summary: '오늘 세션 목록' })
    async getTodaySessions(@Query('studentId') studentId: number) {
        return this.timerService.getTodaySessions(studentId);
    }

    @Get('stats')
    @ApiOperation({ summary: '오늘 통계' })
    async getTodayStats(@Query('studentId') studentId: number) {
        return this.timerService.getTodayStats(studentId);
    }
}
