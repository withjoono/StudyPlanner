import { Controller, Get, Post, Delete, Query, Body, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { NeisService } from './neis.service';

@ApiTags('neis')
@Controller('neis')
@UseGuards(AuthGuard('jwt'))
export class NeisController {
  constructor(private readonly neisService: NeisService) {}

  @Get('schools')
  @ApiOperation({ summary: '학교 검색 (NEIS API)' })
  async searchSchools(@Query('q') q: string) {
    if (!q || q.length < 2) return [];
    return this.neisService.searchSchools(q);
  }

  @Get('my-school')
  @ApiOperation({ summary: '연결된 학교 조회' })
  async getLinkedSchool(@Req() req: any) {
    return this.neisService.getLinkedSchool(req.user.sub);
  }

  @Post('my-school')
  @ApiOperation({ summary: '학교 연결 저장' })
  async linkSchool(@Req() req: any, @Body() body: any) {
    return this.neisService.linkSchool(req.user.sub, body);
  }

  @Delete('my-school')
  @ApiOperation({ summary: '학교 연결 해제' })
  async unlinkSchool(@Req() req: any) {
    return this.neisService.unlinkSchool(req.user.sub);
  }

  @Get('schedule')
  @ApiOperation({ summary: '학교 행사 일정 조회 (월별 캐시)' })
  async getSchedule(@Req() req: any, @Query('year') year: string, @Query('month') month?: string) {
    return this.neisService.getSchedule(
      req.user.sub,
      parseInt(year),
      month ? parseInt(month) : undefined,
    );
  }

  @Post('schedule/refresh')
  @ApiOperation({ summary: '학교 행사 강제 새로고침' })
  async refreshSchedule(@Req() req: any, @Body() body: any) {
    const year = body.year || body.year;
    return this.neisService.refreshSchedule(req.user.sub, parseInt(year));
  }

  @Get('timetable')
  @ApiOperation({ summary: '시간표 조회' })
  async getTimetable(
    @Req() req: any,
    @Query('date') date: string,
    @Query('grade') grade?: string,
    @Query('class_nm') classNm?: string,
  ) {
    return this.neisService.getTimetable(req.user.sub, date, grade, classNm);
  }
}
