import { Injectable } from '@nestjs/common';
import type {
  PlannerPlan,
  CreatePlannerPlanDto,
  UpdatePlannerPlanDto,
} from '@gb-planner/shared-types';
import { PrismaService } from '../prisma';
import { Category, MaterialType } from '@prisma/client';
import { SharedScheduleService } from '../shared-schedule/shared-schedule.service';

@Injectable()
export class PlanService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sharedSchedule: SharedScheduleService,
  ) {}

  private mapToPlan(plan: any): PlannerPlan {
    return {
      id: Number(plan.id),
      title: plan.title || '',
      subject: plan.subject || '',
      type: plan.materialType === MaterialType.lecture ? 'lecture' : 'textbook',
      material: plan.materialName || '',
      total: plan.totalPages || 0,
      done: plan.donePages || 0,
      startDate: plan.startDate ? plan.startDate.toISOString().split('T')[0] : '',
      endDate: plan.endDate ? plan.endDate.toISOString().split('T')[0] : '',
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
    const plan = await this.prisma.longTermPlan.create({
      data: {
        studentId: BigInt(studentId),
        title: dto.title,
        subject: dto.subject,
        category: Category.study,
        materialType: dto.type === 'lecture' ? MaterialType.lecture : MaterialType.textbook,
        materialName: dto.material,
        totalPages: dto.amount,
        donePages: dto.finished || 0,
        startDate: dto.startDay ? new Date(dto.startDay) : null,
        endDate: dto.endDay ? new Date(dto.endDay) : null,
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
    if (dto.amount !== undefined) updateData.totalPages = dto.amount;
    if (dto.done !== undefined) updateData.donePages = dto.done;
    if (dto.finished !== undefined) updateData.donePages = dto.finished;
    if (dto.startDay !== undefined) updateData.startDate = new Date(dto.startDay);
    if (dto.endDay !== undefined) updateData.endDate = new Date(dto.endDay);

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
