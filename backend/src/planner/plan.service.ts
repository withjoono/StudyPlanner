import { Injectable } from '@nestjs/common';
import type {
  PlannerPlan,
  CreatePlannerPlanDto,
  UpdatePlannerPlanDto,
} from '../types/planner.types';
import { PrismaService } from '../prisma';
import { Category, MaterialType } from '@prisma/client';
import { SharedScheduleService } from '../shared-schedule/shared-schedule.service';

@Injectable()
export class PlanService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sharedSchedule: SharedScheduleService,
  ) {}

  private mapToPlan(
    plan: any,
  ): PlannerPlan & { isDistributed: boolean; startPage: number | null; endPage: number | null } {
    const total = plan.totalPages || 0;
    const done = plan.donePages || 0;
    const startDate = plan.startDate ? plan.startDate.toISOString().split('T')[0] : '';
    const endDate = plan.endDate ? plan.endDate.toISOString().split('T')[0] : '';

    // 주간 목표 계산
    let weeklyTarget = 0;
    if (startDate && endDate && total > 0) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const nWeeks = Math.max(1, Math.ceil(totalDays / 7));
      weeklyTarget = Math.ceil(total / nWeeks);
    }

    return {
      id: Number(plan.id),
      title: plan.title || '',
      subject: plan.subject || '',
      type: plan.materialType === MaterialType.lecture ? 'lecture' : 'textbook',
      material: plan.materialName || '',
      total,
      done,
      // Frontend-compatible fields
      totalAmount: total,
      completedAmount: done,
      weeklyTarget,
      startDate,
      endDate,
      isDistributed: plan.isDistributed ?? false,
      startPage: plan.startPage ?? null,
      endPage: plan.endPage ?? null,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
    };
  }

  async getPlans(studentId?: number): Promise<PlannerPlan[]> {
    const plans = await this.prisma.longTermPlan.findMany({
      where: studentId ? { studentId: BigInt(studentId) } : undefined,
      orderBy: { startDate: 'asc' },
    });
    return plans.map((p) => this.mapToPlan(p));
  }

  async getPlan(id: number): Promise<PlannerPlan | undefined> {
    const plan = await this.prisma.longTermPlan.findUnique({
      where: { id: BigInt(id) },
    });
    return plan ? this.mapToPlan(plan) : undefined;
  }

  async createPlan(dto: CreatePlannerPlanDto, studentId: number = 1): Promise<PlannerPlan> {
    // Support both frontend (startDate/endDate/totalAmount) and legacy (startDay/endDay/amount) field names
    const startDateStr = dto.startDate || dto.startDay;
    const endDateStr = dto.endDate || dto.endDay;
    const totalAmount = dto.totalAmount ?? dto.amount;
    const doneAmount = dto.completedAmount ?? dto.finished ?? 0;

    const plan = await this.prisma.longTermPlan.create({
      data: {
        studentId: BigInt(studentId),
        title: dto.title,
        subject: dto.subject,
        category: Category.study,
        materialType: dto.type === 'lecture' ? MaterialType.lecture : MaterialType.textbook,
        materialName: dto.material,
        totalPages: totalAmount,
        donePages: doneAmount,
        startDate: startDateStr ? new Date(startDateStr) : null,
        endDate: endDateStr ? new Date(endDateStr) : null,
      },
    });

    // 공유 스케줄에 동기화
    this.sharedSchedule.syncPlan(plan);

    return this.mapToPlan(plan);
  }

  async updatePlan(id: number, dto: UpdatePlannerPlanDto): Promise<PlannerPlan | undefined> {
    const existing = await this.prisma.longTermPlan.findUnique({
      where: { id: BigInt(id) },
    });

    if (!existing) return undefined;

    const updateData: any = {};

    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.subject !== undefined) updateData.subject = dto.subject;
    if (dto.type !== undefined) {
      updateData.materialType =
        dto.type === 'lecture' ? MaterialType.lecture : MaterialType.textbook;
    }
    if (dto.material !== undefined) updateData.materialName = dto.material;
    // Accept both camelCase (local) and snake_case (humps-converted from frontend)
    const totalAmount = (dto as any).total_amount ?? (dto as any).totalAmount ?? dto.amount;
    if (totalAmount !== undefined) updateData.totalPages = totalAmount;
    const completedAmount =
      (dto as any).completed_amount ?? (dto as any).completedAmount ?? dto.done ?? dto.finished;
    if (completedAmount !== undefined) updateData.donePages = completedAmount;
    const startDateStr = (dto as any).start_date ?? (dto as any).startDate ?? dto.startDay;
    if (startDateStr !== undefined) updateData.startDate = new Date(startDateStr);
    const endDateStr = (dto as any).end_date ?? (dto as any).endDate ?? dto.endDay;
    if (endDateStr !== undefined) updateData.endDate = new Date(endDateStr);

    // Check if completed
    const donePages = updateData.donePages ?? existing.donePages;
    const totalPages = updateData.totalPages ?? existing.totalPages;
    if (totalPages !== null && donePages !== null) {
      updateData.isCompleted = donePages >= totalPages;
    }

    const plan = await this.prisma.longTermPlan.update({
      where: { id: BigInt(id) },
      data: updateData,
    });

    // 공유 스케줄에 동기화
    this.sharedSchedule.syncPlan(plan);

    return this.mapToPlan(plan);
  }

  async updateProgress(id: number, done: number): Promise<PlannerPlan | undefined> {
    return this.updatePlan(id, { id, done });
  }

  async deletePlan(id: number): Promise<boolean> {
    try {
      await this.prisma.longTermPlan.delete({
        where: { id: BigInt(id) },
      });
      // 공유 스케줄에서 제거
      this.sharedSchedule.removeScheduleBySource('plan', String(id));
      return true;
    } catch {
      return false;
    }
  }
}
