import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RoutineService } from './routine.service';
import type { CreateRoutineDto, UpdateRoutineDto } from '@gb-planner/shared-types';

@ApiTags('routines')
@Controller('planner/routines')
export class RoutineController {
  constructor(private readonly routineService: RoutineService) {}

  @Get()
  @ApiOperation({ summary: '루틴 목록 조회' })
  async getRoutines() {
    return this.routineService.getRoutines();
  }

  @Get(':id')
  @ApiOperation({ summary: '루틴 상세 조회' })
  async getRoutine(@Param('id') id: number) {
    return this.routineService.getRoutine(id);
  }

  @Post()
  @ApiOperation({ summary: '루틴 생성' })
  async createRoutine(@Body() dto: CreateRoutineDto) {
    return this.routineService.createRoutine(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: '루틴 수정' })
  async updateRoutine(@Param('id') id: number, @Body() dto: UpdateRoutineDto) {
    return this.routineService.updateRoutine(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '루틴 삭제' })
  async deleteRoutine(@Param('id') id: number) {
    return this.routineService.deleteRoutine(id);
  }
}
