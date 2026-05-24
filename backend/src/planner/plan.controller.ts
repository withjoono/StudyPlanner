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

  /** DB 상태 진단 — 특정 userId의 student/plan 현황 확인 */
  @Get('debug')
  @ApiOperation({ summary: '장기 계획 DB 진단 (개발·운영 디버깅용)' })
  async debugPlans(
    @Query('memberId') memberId?: string,
    @Query('member_id') memberIdSnake?: string,
  ) {
    const raw = memberId || memberIdSnake;

    // userId 변형 목록
    const variants: string[] = [];
    if (raw) {
      variants.push(raw);
      if (raw.startsWith('sp_')) variants.push(raw.slice(3));
      else variants.push(`sp_${raw}`);
    }

    // 해당 userId로 조회되는 student 목록
    const students = await this.prisma.student.findMany({
      where: variants.length > 0 ? { userId: { in: variants } } : {},
      select: { id: true, userId: true, name: true, studentCode: true },
    });

    // 각 student의 plan 수
    const planCounts = await Promise.all(
      students.map(async (s) => {
        const count = await this.prisma.longTermPlan.count({ where: { studentId: s.id } });
        return {
          studentId: Number(s.id),
          userId: s.userId,
          name: s.name,
          studentCode: s.studentCode,
          planCount: count,
        };
      }),
    );

    // studentId=1의 plan 수 (구버전 기본값 확인)
    const defaultStudentPlanCount = await this.prisma.longTermPlan.count({
      where: { studentId: BigInt(1) },
    });

    // 전체 plan 수
    const totalPlans = await this.prisma.longTermPlan.count();

    return {
      queriedMemberId: raw,
      variants,
      matchedStudents: planCounts,
      defaultStudentId1PlanCount: defaultStudentPlanCount,
      totalPlansInDb: totalPlans,
    };
  }

  @Get()
  @ApiOperation({ summary: '장기 계획 목록 조회' })
  async getPlans(@Query('memberId') memberId?: string, @Query('member_id') memberIdSnake?: string) {
    const raw = memberId || memberIdSnake;
    const primaryId = await this.resolveStudentId(raw);

    // sp_ prefix 유무 두 variant 모두 조회해 기존 계획이 누락되지 않도록 함
    const studentIds = new Set<number>([primaryId]);
    if (raw && typeof raw === 'string') {
      const variants = raw.startsWith('sp_') ? [raw, raw.slice(3)] : [raw, `sp_${raw}`];
      const others = await this.prisma.student.findMany({
        where: { userId: { in: variants } },
        select: { id: true },
      });
      others.forEach((s) => studentIds.add(Number(s.id)));
    }

    return this.planService.getPlansForStudents([...studentIds]);
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
