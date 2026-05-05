import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RankingService } from './ranking.service';
import { LeaderboardQueryDto } from './dto/leaderboard-query.dto';

@ApiTags('ranking')
@Controller('ranking')
export class RankingController {
  constructor(private readonly rankingService: RankingService) {}

  @Get('leaderboard')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '내가 속한 그룹의 학습 랭킹 리더보드' })
  async getLeaderboard(@Req() req: any, @Query() query: LeaderboardQueryDto) {
    const userId = req.user?.sub || req.user?.userId;
    const authHeader = req.headers.authorization;
    const result = await this.rankingService.getMyLeaderboard(
      String(userId),
      query.period || 'weekly',
      query.date,
      query.groupId,
      authHeader,
    );
    return result || { leaderboard: [], myRank: null, totalMembers: 0, availableGroups: [] };
  }

  @Get('my-stats')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 순위 요약 (대시보드 배지용)' })
  async getMyStats(@Req() req: any) {
    const userId = req.user?.sub || req.user?.userId;
    return this.rankingService.getMyRankSummary(String(userId));
  }
}
