import { Controller, Get, Put, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { NotificationService } from './notification.service';

@ApiTags('notification')
@Controller('notification')
export class NotificationController {
    constructor(private readonly notificationService: NotificationService) { }

    @Get('list')
    @ApiOperation({ summary: '알림 목록' })
    async getNotifications(
        @Query('studentId') studentId: number,
        @Query('limit') limit?: string,
    ) {
        return this.notificationService.getNotifications(
            studentId,
            limit ? parseInt(limit, 10) : 20,
        );
    }

    @Get('reminder')
    @ApiOperation({ summary: '학습 리마인더 생성' })
    async createReminder(@Query('studentId') studentId: number) {
        return this.notificationService.createStudyReminder(studentId);
    }

    @Get('streak-warning')
    @ApiOperation({ summary: '스트릭 경고' })
    async createStreakWarning(
        @Query('studentId') studentId: number,
        @Query('streak') streak: string,
    ) {
        return this.notificationService.createStreakWarning(
            studentId,
            parseInt(streak, 10),
        );
    }

    @Put(':id/read')
    @ApiOperation({ summary: '알림 읽음 처리' })
    async markAsRead(@Param('id') id: string) {
        return this.notificationService.markAsRead(parseInt(id, 10));
    }
}
