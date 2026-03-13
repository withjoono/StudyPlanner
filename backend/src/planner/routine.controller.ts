import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RoutineService } from './routine.service';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateRoutineDto, UpdateRoutineDto } from '../types/planner.types';

@ApiTags('routines')
@Controller('planner/routines')
export class RoutineController {
  constructor(
    private readonly routineService: RoutineService,
    private readonly prisma: PrismaService,
  ) {}

  /** memberId → studentId 변환 */
  private async resolveStudentId(memberId?: number | string): Promise<number> {
    if (!memberId) return 1;

    if (typeof memberId === 'number' || /^\d+$/.test(String(memberId))) {
      const id = BigInt(memberId);
      const existing = await this.prisma.student.findFirst({ where: { id } });
      if (existing) return Number(existing.id);
    }

    const userIdStr = String(memberId);
    const byUserId = await this.prisma.student.findFirst({
      where: { userId: userIdStr },
    });
    if (byUserId) return Number(byUserId.id);

    const code = `SP${Date.now()}`;
    const student = await this.prisma.student.create({
      data: {
        studentCode: code,
        userId: userIdStr.startsWith('sp_') ? userIdStr : undefined,
        year: new Date().getFullYear(),
        schoolLevel: 'high',
        name: '학생',
      },
    });
    return Number(student.id);
  }

  @Get()
  @ApiOperation({ summary: '루틴 목록 조회' })
  async getRoutines(@Query('memberId') memberId?: string) {
    const studentId = await this.resolveStudentId(memberId);
    return this.routineService.getRoutines(studentId);
  }

  @Get(':id')
  @ApiOperation({ summary: '루틴 상세 조회' })
  async getRoutine(@Param('id') id: number) {
    return this.routineService.getRoutine(id);
  }

  @Post()
  @ApiOperation({ summary: '루틴 생성' })
  async createRoutine(@Body() dto: CreateRoutineDto & { memberId?: string }) {
    const studentId = await this.resolveStudentId(dto.memberId);
    return this.routineService.createRoutine(dto, studentId);
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
