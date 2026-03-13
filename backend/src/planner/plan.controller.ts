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

    // 학생 자동 생성
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
