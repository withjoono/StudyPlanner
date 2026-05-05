import { Controller, Get, Post, Delete, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { MyClassService } from './myclass.service';

@ApiTags('myclass')
@Controller('myclass')
export class MyClassController {
  constructor(private readonly myClassService: MyClassService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '내가 속한 마이 클래스 목록' })
  async getMyRooms(@Req() req: any) {
    const userId = req.user?.sub || req.user?.userId;
    return this.myClassService.getMyRooms(String(userId));
  }

  @Get('search')
  @ApiOperation({ summary: '공개 마이 클래스 검색' })
  async searchPublicRooms(@Query('q') query?: string, @Query('subject') subject?: string) {
    return this.myClassService.searchPublicRooms(query, subject);
  }

  @Get('code/:code')
  @ApiOperation({ summary: '초대 코드로 방 정보 조회 (가입 전 미리보기)' })
  async getRoomByCode(@Param('code') code: string) {
    return this.myClassService.getRoomByCode(code);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '마이 클래스 상세 (멤버 목록 포함)' })
  async getRoomDetail(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.sub || req.user?.userId;
    return this.myClassService.getRoomDetail(parseInt(id, 10), String(userId));
  }

  @Get(':id/leaderboard')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '마이 클래스 리더보드 (방 내 멤버 랭킹)' })
  async getRoomLeaderboard(
    @Param('id') id: string,
    @Query('period') period?: 'daily' | 'weekly' | 'monthly',
    @Query('date') date?: string,
    @Req() req?: any,
  ) {
    const userId = req?.user?.sub || req?.user?.userId;
    return this.myClassService.getRoomLeaderboard(
      parseInt(id, 10),
      period || 'weekly',
      date,
      userId ? String(userId) : undefined,
    );
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '마이 클래스 생성' })
  async createRoom(
    @Req() req: any,
    @Body()
    body: {
      name: string;
      description?: string;
      subject?: string;
      isPublic?: boolean;
      weeklyGoal?: number;
    },
  ) {
    const userId = req.user?.sub || req.user?.userId;
    return this.myClassService.createRoom(String(userId), body);
  }

  @Post('join/:code')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '초대 코드로 마이 클래스 가입' })
  async joinRoom(
    @Param('code') code: string,
    @Req() req: any,
    @Body() body: { inviterId?: string },
  ) {
    const userId = req.user?.sub || req.user?.userId;
    return this.myClassService.joinRoom(String(userId), code, body.inviterId);
  }

  @Post(':id/leave')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '마이 클래스 나가기' })
  async leaveRoom(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.sub || req.user?.userId;
    return this.myClassService.leaveRoom(String(userId), parseInt(id, 10));
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '마이 클래스 삭제 (방장만)' })
  async deleteRoom(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.sub || req.user?.userId;
    return this.myClassService.deleteRoom(String(userId), parseInt(id, 10));
  }
}
