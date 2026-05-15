import { Controller, Get, Post, Query, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { NeisService } from './neis.service';

@ApiTags('neis')
@Controller('neis')
@UseGuards(AuthGuard('jwt'))
export class NeisController {
  constructor(private readonly neisService: NeisService) {}

  @Get('schedule')
  @ApiOperation({ summary: '학교 행사 일정 조회 (atptCode·schulCode 기반, DB 캐시)' })
  async getSchedule(
    @Query('atpt_code') atptCode: string,
    @Query('schul_code') schulCode: string,
    @Query('year') year: string,
    @Query('month') month?: string,
  ) {
    if (!atptCode || !schulCode || !year) return [];
    return this.neisService.getSchedule(
      atptCode,
      schulCode,
      parseInt(year),
      month ? parseInt(month) : undefined,
    );
  }

  @Post('schedule/refresh')
  @ApiOperation({ summary: '학교 행사 강제 새로고침' })
  async refreshSchedule(@Body() body: any) {
    const atptCode = body.atptCode || body.atpt_code;
    const schulCode = body.schulCode || body.schul_code;
    const year = parseInt(body.year);
    if (!atptCode || !schulCode || !year) return [];

    // 캐시 삭제 후 재조회
    const school = await this.neisService['findOrCreateSchool'](atptCode, schulCode);
    await this.neisService['prisma'].neisSchedule.deleteMany({
      where: { schoolId: school, year },
    });
    return this.neisService.getSchedule(atptCode, schulCode, year);
  }

  @Get('timetable')
  @ApiOperation({ summary: '시간표 조회 (studentProfile의 school_level·grade 기반)' })
  async getTimetable(
    @Query('atpt_code') atptCode: string,
    @Query('schul_code') schulCode: string,
    @Query('date') date: string,
    @Query('school_level') schoolLevel?: string,
    @Query('grade') grade?: string,
    @Query('class_nm') classNm?: string,
  ) {
    if (!atptCode || !schulCode || !date) return [];
    return this.neisService.getTimetable(atptCode, schulCode, date, schoolLevel, grade, classNm);
  }
}
