import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { TeacherGroupService } from './teacher-group.service';

@ApiTags('teacher-group')
@Controller('teacher-group')
export class TeacherGroupController {
  constructor(private readonly teacherGroupService: TeacherGroupService) {}

  @Get('leaderboard')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: '담당 선생님 그룹 리더보드 (선생님 점수·학습시간·분량 비교)',
  })
  async getLeaderboard(
    @Req() req: any,
    @Query('period') period?: 'daily' | 'weekly' | 'monthly',
    @Query('date') date?: string,
  ) {
    const userId = req.user?.sub || req.user?.userId;
    return this.teacherGroupService.getLeaderboard(String(userId), period || 'weekly', date);
  }
}
