import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MissionService, MissionDto, UpdateMissionDto } from './mission.service';

@ApiTags('daily-missions')
@Controller('planner/daily-missions')
export class MissionController {
  constructor(private readonly missionService: MissionService) {}

  @Get()
  @ApiOperation({ summary: '일간 미션 조회 (날짜별 또는 전체)' })
  async getMissions(@Query('member_id') memberId?: number, @Query('date') date?: string) {
    try {
      const studentId = memberId || 1;
      if (date) {
        return this.missionService.getMissionsByDate(studentId, date);
      }
      return this.missionService.getAllMissions(studentId);
    } catch (error) {
      console.error('getMissions error:', error);
      return [];
    }
  }

  @Post()
  @ApiOperation({ summary: '일간 미션 생성' })
  async createMission(@Body() dto: MissionDto) {
    return this.missionService.createMission(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: '일간 미션 수정 (계획 + 결과)' })
  async updateMission(@Param('id') id: number, @Body() dto: UpdateMissionDto) {
    return this.missionService.updateMission(id, dto);
  }

  @Put(':id/progress')
  @ApiOperation({ summary: '미션 진행률 업데이트' })
  async updateProgress(@Param('id') id: number, @Body('progress') progress: number) {
    return this.missionService.updateMission(id, {
      status: progress >= 100 ? 'completed' : 'pending',
      result: {
        achievement_rate: progress / 100,
      },
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: '일간 미션 삭제' })
  async deleteMission(@Param('id') id: number) {
    return this.missionService.deleteMission(id);
  }
}
