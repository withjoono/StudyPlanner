import { Injectable } from '@nestjs/common';
import type {
  Routine,
  CreateRoutineDto,
  UpdateRoutineDto,
  RoutineCategory,
} from '../types/planner.types';
import { PrismaService } from '../prisma';
import { Category } from '@prisma/client';
import { SharedScheduleService } from '../shared-schedule/shared-schedule.service';

@Injectable()
export class RoutineService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sharedSchedule: SharedScheduleService,
  ) {}

  private mapToRoutine(
    routine: any,
  ): Routine & { majorCategory?: string; startDate?: string; endDate?: string } {
    return {
      id: Number(routine.id),
      title: routine.title || '',
      category: this.mapCategoryToRoutineCategory(routine.category),
      majorCategory: this.mapCategoryToMajorCategory(routine.category, routine.subCategory),
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
      startDate: routine.startDate ? this.formatDate(routine.startDate) : undefined,
      endDate: routine.endDate ? this.formatDate(routine.endDate) : undefined,
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

  /** majorCategory(프론트) → Category + subCategory 매핑 */
  private mapMajorCategoryToCategory(majorCategory?: string): {
    category: Category;
    subCategory: string;
  } {
    switch (majorCategory) {
      case 'class':
        return { category: Category.study, subCategory: 'class' };
      case 'self_study':
        return { category: Category.study, subCategory: 'self_study' };
      case 'exercise':
        return { category: Category.exercise, subCategory: 'exercise' };
      case 'schedule':
        return { category: Category.other, subCategory: 'schedule' };
      default:
        return { category: Category.other, subCategory: majorCategory || 'other' };
    }
  }

  /** Category + subCategory → majorCategory(프론트) 역매핑 */
  private mapCategoryToMajorCategory(
    category: Category | null,
    subCategory?: string | null,
  ): string {
    // subCategory가 있으면 직접 매핑
    if (subCategory) {
      if (['class', 'self_study', 'exercise', 'schedule'].includes(subCategory)) return subCategory;
    }
    // subCategory가 없으면 category에서 유추
    switch (category) {
      case 'study':
        return 'self_study';
      case 'exercise':
        return 'exercise';
      case 'rest':
        return 'schedule';
      default:
        return 'schedule';
    }
  }

  private formatTime(date: Date | string): string {
    if (typeof date === 'string') return date;
    // UTC 기반으로 시간을 추출 (Prisma @db.Time은 1970-01-01T{HH:MM}Z 형식)
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  private parseTime(time?: string): Date | undefined {
    if (!time) return undefined;
    const [hours, minutes] = time.split(':').map(Number);
    // UTC 기반으로 Date 생성 — 서버 타임존과 무관하게 동작
    return new Date(Date.UTC(1970, 0, 1, hours, minutes, 0, 0));
  }

  private formatDate(date: Date | string): string {
    if (typeof date === 'string') return date.split('T')[0];
    return date.toISOString().split('T')[0];
  }

  private parseDate(dateStr?: string): Date | undefined {
    if (!dateStr) return undefined;
    return new Date(dateStr + 'T00:00:00Z');
  }

  /**
   * 프론트엔드 Axios 인터셉터(humps)가 camelCase → snake_case로 변환하므로
   * 양쪽 형식을 모두 처리할 수 있도록 정규화
   */
  private normalizeRoutineDto(dto: any): any {
    return {
      title: dto.title,
      category: dto.category,
      majorCategory: dto.majorCategory ?? dto.major_category,
      subject: dto.subject,
      startTime: dto.startTime ?? dto.start_time,
      endTime: dto.endTime ?? dto.end_time,
      repeat: dto.repeat,
      days: dto.days,
      startDate: dto.startDate ?? dto.start_date,
      endDate: dto.endDate ?? dto.end_date,
      color: dto.color,
      memberId: dto.memberId ?? dto.member_id,
    };
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

  async createRoutine(rawDto: any, studentId: number = 1): Promise<Routine> {
    const dto = this.normalizeRoutineDto(rawDto);
    const days = dto.days || [false, false, false, false, false, false, false];

    // majorCategory가 있으면 category/subCategory로 변환, 없으면 기존 category 사용
    let category: Category | undefined;
    let subCategory: string | undefined;
    if (dto.majorCategory) {
      const mapped = this.mapMajorCategoryToCategory(dto.majorCategory);
      category = mapped.category;
      subCategory = mapped.subCategory;
    } else {
      category = this.mapRoutineCategoryToCategory(dto.category);
    }

    const routine = await this.prisma.weeklyRoutine.create({
      data: {
        studentId: BigInt(studentId),
        title: dto.title,
        category,
        subCategory,
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
        startDate: this.parseDate(dto.startDate),
        endDate: this.parseDate(dto.endDate),
      },
    });

    // 공유 스케줄에 동기화
    this.sharedSchedule.syncRoutine(routine);

    return this.mapToRoutine(routine);
  }

  async updateRoutine(id: number, rawDto: any): Promise<Routine | undefined> {
    const dto = this.normalizeRoutineDto(rawDto);
    const existing = await this.prisma.weeklyRoutine.findUnique({
      where: { id: BigInt(id) },
    });

    if (!existing) return undefined;

    const updateData: any = {};

    if (dto.title !== undefined) updateData.title = dto.title;

    // majorCategory가 있으면 category/subCategory로 변환
    if (dto.majorCategory !== undefined) {
      const mapped = this.mapMajorCategoryToCategory(dto.majorCategory);
      updateData.category = mapped.category;
      updateData.subCategory = mapped.subCategory;
    } else if (dto.category !== undefined) {
      updateData.category = this.mapRoutineCategoryToCategory(dto.category);
    }

    if (dto.subject !== undefined) updateData.subject = dto.subject;
    if (dto.startTime !== undefined) updateData.startTime = this.parseTime(dto.startTime);
    if (dto.endTime !== undefined) updateData.endTime = this.parseTime(dto.endTime);
    if (dto.repeat !== undefined) updateData.isActive = dto.repeat;
    if (dto.startDate !== undefined) updateData.startDate = this.parseDate(dto.startDate);
    if (dto.endDate !== undefined) updateData.endDate = this.parseDate(dto.endDate);

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
