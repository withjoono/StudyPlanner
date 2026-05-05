import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { BadgeService } from './badge.service';

@ApiTags('badge')
@Controller('badge')
export class BadgeController {
  constructor(private readonly badgeService: BadgeService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 뱃지 목록 (획득 + 미획득 전체 카탈로그)' })
  async getMyBadges(@Req() req: any) {
    const userId = req.user?.sub || req.user?.userId;
    return this.badgeService.getMyBadges(String(userId));
  }

  @Post('acknowledge')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '새 뱃지 확인 처리 (알림 제거)' })
  async acknowledgeBadges(@Req() req: any) {
    const userId = req.user?.sub || req.user?.userId;
    await this.badgeService.acknowledgeNewBadges(String(userId));
    return { success: true };
  }
}
