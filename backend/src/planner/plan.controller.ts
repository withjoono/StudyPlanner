import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PlanService } from './plan.service';
import { PrismaService } from '../prisma/prisma.service';
import type { CreatePlannerPlanDto, UpdatePlannerPlanDto } from '../types/planner.types';

@ApiTags('plans')
@Controller('planner/plans')
export class PlanController {
  constructor(
    private readonly planService: PlanService,
    private readonly prisma: PrismaService,
  ) {}

  /** memberId → studentId 변환 (숫자 ID 또는 문자열 userId) */
  private async resolveStudentId(memberId?: number | string): Promise<number> {
    if (!memberId) return 1;

    // 숫자형 member_id
    if (typeof memberId === 'number' || /^\d+$/.test(String(memberId))) {
      const id = BigInt(memberId);
      const existing = await this.prisma.student.findFirst({ where: { id } });
      if (existing) return Number(existing.id);
    }

    // 문자열 userId ("sp_S26H208011")
    const userIdStr = String(memberId);
    const byUserId = await this.prisma.student.findFirst({
      where: { userId: userIdStr },
    });
    if (byUserId) return Number(byUserId.id);

    // sp_ 없이 들어온 Hub raw ID 재시도 ("S26H208011" → "sp_S26H208011")
    if (!userIdStr.startsWith('sp_')) {
      const withPrefix = await this.prisma.student.findFirst({
        where: { userId: `sp_${userIdStr}` },
      });
      if (withPrefix) return Number(withPrefix.id);
    }

    // 학생 자동 생성 — User FK 제약 위반 방지: User 먼저 upsert
    const code = `SP${Date.now()}`;
    const normalizedUserId = userIdStr.startsWith('sp_') ? userIdStr : `sp_${userIdStr}`;
    const hubId = normalizedUserId.replace(/^sp_/, '');
    await this.prisma.user.upsert({
      where: { id: normalizedUserId },
      create: {
        id: normalizedUserId,
        email: `${hubId}@hub.local`,
        name: hubId,
        role: 'student',
        hubUserId: hubId,
      },
      update: {},
    });
    // Student도 upsert — auth/me와의 경쟁 조건 또는 중복 생성 방지
    const student = await this.prisma.student.upsert({
      where: { userId: normalizedUserId },
      create: {
        studentCode: code,
        userId: normalizedUserId,
        year: new Date().getFullYear(),
        schoolLevel: 'high',
        name: '학생',
      },
      update: {},
    });
    return Number(student.id);
  }

  @Get()
  @ApiOperation({ summary: '장기 계획 목록 조회' })
  async getPlans(@Query('memberId') memberId?: string, @Query('member_id') memberIdSnake?: string) {
    const studentId = await this.resolveStudentId(memberId || memberIdSnake);
    return this.planService.getPlans(studentId);
  }

  @Get(':id')
  @ApiOperation({ summary: '장기 계획 상세 조회' })
  async getPlan(@Param('id') id: number) {
    return this.planService.getPlan(id);
  }

  @Post()
  @ApiOperation({ summary: '장기 계획 생성' })
  async createPlan(@Body() body: any) {
    // Frontend humps interceptor converts camelCase → snake_case
    // Accept both naming conventions
    const memberId = body.memberId || body.member_id;
    const studentId = await this.resolveStudentId(memberId);

    const dto: CreatePlannerPlanDto = {
      title: body.title,
      subject: body.subject,
      type: body.type,
      material: body.material,
      // Accept both camelCase and snake_case
      startDate: body.startDate || body.start_date,
      endDate: body.endDate || body.end_date,
      startDay: body.startDay || body.start_day,
      endDay: body.endDay || body.end_day,
      totalAmount: body.totalAmount ?? body.total_amount,
      completedAmount: body.completedAmount ?? body.completed_amount,
      weeklyTarget: body.weeklyTarget ?? body.weekly_target,
      amount: body.amount,
      finished: body.finished,
    };

    return this.planService.createPlan(dto, studentId);
  }

  @Put(':id')
  @ApiOperation({ summary: '장기 계획 수정' })
  async updatePlan(@Param('id') id: number, @Body() dto: UpdatePlannerPlanDto) {
    return this.planService.updatePlan(id, dto);
  }

  @Put(':id/progress')
  @ApiOperation({ summary: '진행률 업데이트' })
  async updateProgress(@Param('id') id: number, @Body('done') done: number) {
    return this.planService.updateProgress(id, done);
  }

  @Delete(':id')
  @ApiOperation({ summary: '장기 계획 삭제' })
  async deletePlan(@Param('id') id: number) {
    return this.planService.deletePlan(id);
  }
}
