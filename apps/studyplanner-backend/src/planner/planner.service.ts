import { Injectable } from '@nestjs/common';
import type {
  PlannerItem,
  CreatePlannerItemDto,
  UpdatePlannerItemDto,
  PlannerItemFilter,
  PlannerPrimaryType,
} from '@gb-planner/shared-types';
import { PrismaService } from '../prisma';
import { Category, MissionStatus } from '@prisma/client';

@Injectable()
export class PlannerService {
  constructor(private readonly prisma: PrismaService) {}

  private mapToPlannerItem(mission: any): PlannerItem {
    return {
      id: Number(mission.id),
      memberId: Number(mission.studentId),
      primaryType: this.mapCategoryToPrimaryType(mission.category),
      title: mission.content || '',
      subject: mission.subject || '',
      startDate: mission.date,
      endDate: mission.date,
      progress: this.getProgressFromStatus(mission.status),
      createdAt: mission.createdAt,
      updatedAt: mission.updatedAt,
    };
  }

  private mapCategoryToPrimaryType(
    category: Category | null,
  ): PlannerPrimaryType | '학습' | '수업' {
    if (category === Category.study) return '학습';
    return '학습';
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

  private getProgressFromStatus(status: MissionStatus): number {
    return status === MissionStatus.completed ? 100 : 0;
  }

  private generateMissionCode(studentId: number, date: Date): string {
    const studentCode = `ST${String(studentId).padStart(5, '0')}`;
    const dateCode = `P${date.getFullYear().toString().slice(-2)}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const random = String(Math.floor(Math.random() * 100)).padStart(2, '0');
    return `${studentCode}${dateCode}${random}`;
  }

  async getItems(filter: PlannerItemFilter): Promise<PlannerItem[]> {
    const where: any = {};

    if (filter.memberId) {
      where.studentId = BigInt(filter.memberId);
    }
    if (filter.startDate) {
      where.date = { gte: new Date(filter.startDate as string) };
    }
    if (filter.endDate) {
      where.date = { ...where.date, lte: new Date(filter.endDate as string) };
    }

    const missions = await this.prisma.dailyMission.findMany({
      where,
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });

    return missions.map((m) => this.mapToPlannerItem(m));
  }

  async getItem(id: number): Promise<PlannerItem | undefined> {
    const mission = await this.prisma.dailyMission.findUnique({
      where: { id: BigInt(id) },
    });
    return mission ? this.mapToPlannerItem(mission) : undefined;
  }

  async createItem(dto: CreatePlannerItemDto, memberId: number = 1): Promise<PlannerItem> {
    const date = new Date(dto.startDate as string);

    const mission = await this.prisma.dailyMission.create({
      data: {
        missionCode: this.generateMissionCode(memberId, date),
        studentId: BigInt(memberId),
        date: date,
        content: dto.title,
        subject: dto.subject,
        category: Category.study,
        status: MissionStatus.pending,
      },
    });

    return this.mapToPlannerItem(mission);
  }

  async updateItem(id: number, dto: UpdatePlannerItemDto): Promise<PlannerItem | undefined> {
    const existing = await this.prisma.dailyMission.findUnique({
      where: { id: BigInt(id) },
    });

    if (!existing) return undefined;

    const updateData: any = {};

    if (dto.title !== undefined) updateData.content = dto.title;
    if (dto.subject !== undefined) updateData.subject = dto.subject;
    if (dto.progress !== undefined) {
      updateData.status = dto.progress >= 100 ? MissionStatus.completed : MissionStatus.pending;
    }

    const mission = await this.prisma.dailyMission.update({
      where: { id: BigInt(id) },
      data: updateData,
    });

    return this.mapToPlannerItem(mission);
  }

  async updateProgress(id: number, progress: number): Promise<PlannerItem | undefined> {
    return this.updateItem(id, { progress });
  }

  async completeItem(id: number): Promise<PlannerItem | undefined> {
    return this.updateItem(id, { progress: 100 });
  }

  async deleteItem(id: number): Promise<boolean> {
    try {
      await this.prisma.dailyMission.delete({
        where: { id: BigInt(id) },
      });
      return true;
    } catch {
      return false;
    }
  }

  async getDashboard(memberId?: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const where: any = {
      date: {
        gte: today,
        lt: tomorrow,
      },
    };

    if (memberId) {
      where.studentId = BigInt(memberId);
    }

    const todayMissions = await this.prisma.dailyMission.findMany({
      where,
      orderBy: { startTime: 'asc' },
    });

    const totalMissions = todayMissions.length;
    const completedMissions = todayMissions.filter(
      (m) => m.status === MissionStatus.completed,
    ).length;

    return {
      totalMissions,
      completedMissions,
      avgAchievement: totalMissions > 0 ? Math.round((completedMissions / totalMissions) * 100) : 0,
      todayMissions: todayMissions.map((m) => ({
        id: Number(m.id),
        subject: m.subject || '',
        title: m.content || '',
        progress: m.status === MissionStatus.completed ? 100 : 0,
      })),
      rank: {
        myRank: 5,
        totalStudents: 30,
        weeklyAchievement: 78,
        dailyAchievement:
          totalMissions > 0 ? Math.round((completedMissions / totalMissions) * 100) : 0,
        monthlyAchievement: 72,
      },
    };
  }

  async getWeeklyProgress(memberId?: number) {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 6);

    const where: any = {
      date: {
        gte: weekAgo,
        lte: today,
      },
    };

    if (memberId) {
      where.studentId = BigInt(memberId);
    }

    const missions = await this.prisma.dailyMission.findMany({
      where,
    });

    // Group by date
    const progressByDay: {
      [key: string]: { total: number; completed: number };
    } = {};

    for (let i = 0; i < 7; i++) {
      const date = new Date(weekAgo);
      date.setDate(date.getDate() + i);
      const key = date.toISOString().split('T')[0];
      progressByDay[key] = { total: 0, completed: 0 };
    }

    missions.forEach((m) => {
      const key = m.date.toISOString().split('T')[0];
      if (progressByDay[key]) {
        progressByDay[key].total++;
        if (m.status === MissionStatus.completed) {
          progressByDay[key].completed++;
        }
      }
    });

    return Object.values(progressByDay).map((day) => ({
      avgProgress: day.total > 0 ? Math.round((day.completed / day.total) * 100) : 0,
    }));
  }

  async getRank(_memberId?: number, _period?: 'D' | 'W' | 'M') {
    // TODO: Implement actual ranking logic
    return {
      myRank: 5,
      totalStudents: 30,
      dailyAchievement: 65,
      weeklyAchievement: 78,
      monthlyAchievement: 72,
    };
  }
}
