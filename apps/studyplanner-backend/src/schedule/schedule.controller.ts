import { Controller, Get, Post, Put, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ScheduleService } from './schedule.service';

@ApiTags('schedule')
@Controller('schedule')
export class ScheduleController {
    constructor(private readonly scheduleService: ScheduleService) { }

    @Put('reschedule')
    @ApiOperation({ summary: '미션 날짜 이전' })
    async rescheduleMission(
        @Body() body: { missionId: number; newDate: string; newOrder?: number },
    ) {
        return this.scheduleService.rescheduleMission(body);
    }

    @Post('carry-over')
    @ApiOperation({ summary: '미완료 미션 다음날 이전' })
    async carryOver(
        @Query('studentId') studentId: number,
        @Query('date') date?: string,
    ) {
        return this.scheduleService.carryOverIncompleteMissions(studentId, date);
    }

    @Put('reorder')
    @ApiOperation({ summary: '미션 순서 재정렬 (DnD)' })
    async reorderMissions(
        @Body() body: { studentId: number; date: string; missionIds: number[] },
    ) {
        return this.scheduleService.reorderMissions(body);
    }

    @Get('day')
    @ApiOperation({ summary: '특정 날 미션 목록' })
    async getDayMissions(
        @Query('studentId') studentId: number,
        @Query('date') date: string,
    ) {
        return this.scheduleService.getDayMissions(studentId, date);
    }
}
