import { Injectable } from '@nestjs/common';
import type {
  Routine,
  CreateRoutineDto,
  UpdateRoutineDto,
  RoutineCategory,
} from '@gb-planner/shared-types';
import { PrismaService } from '../prisma';
import { Category } from '@prisma/client';
import { SharedScheduleService } from '../shared-schedule/shared-schedule.service';

@Injectable()
export class RoutineService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sharedSchedule: SharedScheduleService,
  ) {}

  private mapToRoutine(routine: any): Routine {
    return {
      id: Number(routine.id),
      title: routine.title || '',
      category: this.mapCategoryToRoutineCategory(routine.category),
      subject: routine.subject || undefined,
      startTime: routine.startTime ? this.formatTime(routine.startTime) : '00:00',
      endTime: routine.endTime ? this.formatTime(routine.endTime) : '00:00',
      days: [
        routine.daySun,
        routine.dayMon,
        routine.dayTue,
        routine.dayWed,
        routine.dayThu,
        routine.dayFri,
        routine.daySat,
      ],
      repeat: routine.isActive,
    };
  }

  private mapCategoryToRoutineCategory(category: Category | null): RoutineCategory {
    if (!category) return 'other';
    const categoryMap: Record<string, RoutineCategory> = {
      study: 'study',
      rest: 'rest',
      other: 'other',
      exercise: 'other',
      activity: 'other',
    };
    return categoryMap[category] || 'other';
  }

  private mapRoutineCategoryToCategory(category?: RoutineCategory): Category | undefined {
    if (!category) return undefined;
    const categoryMap: Record<string, Category> = {
      study: Category.study,
      rest: Category.rest,
      fixed: Category.other, // 'fixed'는 DB에 없으므로 other로 매핑
      other: Category.other,
    };
    return categoryMap[category] || undefined;
  }

  private formatTime(date: Date | string): string {
    if (typeof date === 'string') return date;
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  private parseTime(time?: string): Date | undefined {
    if (!time) return undefined;
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  async getRoutines(studentId?: number): Promise<Routine[]> {
    const routines = await this.prisma.weeklyRoutine.findMany({
      where: studentId ? { studentId: BigInt(studentId) } : undefined,
      orderBy: { startTime: 'asc' },
    });
    return routines.map((r) => this.mapToRoutine(r));
  }

  async getRoutine(id: number): Promise<Routine | undefined> {
    const routine = await this.prisma.weeklyRoutine.findUnique({
      where: { id: BigInt(id) },
    });
    return routine ? this.mapToRoutine(routine) : undefined;
  }

  async createRoutine(dto: CreateRoutineDto, studentId: number = 1): Promise<Routine> {
    const days = dto.days || [false, false, false, false, false, false, false];

    const routine = await this.prisma.weeklyRoutine.create({
      data: {
        studentId: BigInt(studentId),
        title: dto.title,
        category: this.mapRoutineCategoryToCategory(dto.category),
        subject: dto.subject,
        startTime: this.parseTime(dto.startTime),
        endTime: this.parseTime(dto.endTime),
        daySun: days[0] ?? false,
        dayMon: days[1] ?? false,
        dayTue: days[2] ?? false,
        dayWed: days[3] ?? false,
        dayThu: days[4] ?? false,
        dayFri: days[5] ?? false,
        daySat: days[6] ?? false,
        isActive: dto.repeat ?? true,
      },
    });

    // 공유 스케줄에 동기화
    this.sharedSchedule.syncRoutine(routine);

    return this.mapToRoutine(routine);
  }

  async updateRoutine(id: number, dto: UpdateRoutineDto): Promise<Routine | undefined> {
    const existing = await this.prisma.weeklyRoutine.findUnique({
      where: { id: BigInt(id) },
    });

    if (!existing) return undefined;

    const updateData: any = {};

    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.category !== undefined)
      updateData.category = this.mapRoutineCategoryToCategory(dto.category);
    if (dto.subject !== undefined) updateData.subject = dto.subject;
    if (dto.startTime !== undefined) updateData.startTime = this.parseTime(dto.startTime);
    if (dto.endTime !== undefined) updateData.endTime = this.parseTime(dto.endTime);
    if (dto.repeat !== undefined) updateData.isActive = dto.repeat;

    if (dto.days) {
      updateData.daySun = dto.days[0] ?? existing.daySun;
      updateData.dayMon = dto.days[1] ?? existing.dayMon;
      updateData.dayTue = dto.days[2] ?? existing.dayTue;
      updateData.dayWed = dto.days[3] ?? existing.dayWed;
      updateData.dayThu = dto.days[4] ?? existing.dayThu;
      updateData.dayFri = dto.days[5] ?? existing.dayFri;
      updateData.daySat = dto.days[6] ?? existing.daySat;
    }

    const routine = await this.prisma.weeklyRoutine.update({
      where: { id: BigInt(id) },
      data: updateData,
    });

    // 공유 스케줄에 동기화
    this.sharedSchedule.syncRoutine(routine);

    return this.mapToRoutine(routine);
  }

  async deleteRoutine(id: number): Promise<boolean> {
    try {
      await this.prisma.weeklyRoutine.delete({
        where: { id: BigInt(id) },
      });
      // 공유 스케줄에서 제거
      this.sharedSchedule.removeScheduleBySource('routine', String(id));
      return true;
    } catch {
      return false;
    }
  }
}
