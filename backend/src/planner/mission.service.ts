import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { Category, MissionStatus } from '@prisma/client';
import { SharedScheduleService } from '../shared-schedule/shared-schedule.service';

export interface MissionDto {
  member_id?: number;
  date: string;
  start_time?: string;
  end_time?: string;
  subject?: string;
  content?: string;
  start_page?: number;
  end_page?: number;
  amount?: number;
}

export interface MissionResultDto {
  start_page?: number;
  end_page?: number;
  amount?: number;
  achievement_rate?: number;
  note?: string;
}

export interface UpdateMissionDto {
  start_time?: string;
  end_time?: string;
  subject?: string;
  content?: string;
  start_page?: number;
  end_page?: number;
  amount?: number;
  status?: string;
  result?: MissionResultDto;
}

export interface MissionResponse {
  id: number;
  planId: number | null;
  routineId: number | null;
  date: string;
  startTime: string;
  endTime: string;
  subject: string;
  content: string;
  startPage: number | null;
  endPage: number | null;
  amount: number | null;
  status: string;
  progress: number;
  result: {
    id: number;
    startPage: number | null;
    endPage: number | null;
    amount: number | null;
    achievementRate: number | null;
    note: string | null;
  } | null;
}

@Injectable()
export class MissionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sharedSchedule: SharedScheduleService,
  ) {}

  private formatTime(date: Date | string | null): string {
    if (!date) return '00:00';
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

  private generateMissionCode(studentId: number, date: Date): string {
    const studentCode = `ST${String(studentId).padStart(5, '0')}`;
    const dateCode = `P${date.getFullYear().toString().slice(-2)}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    return `${studentCode}${dateCode}${random}`;
  }

  private mapToResponse(mission: any, result?: any): MissionResponse {
    return {
      id: Number(mission.id),
      planId: mission.planId ? Number(mission.planId) : null,
      routineId: mission.routineId ? Number(mission.routineId) : null,
      date: mission.date instanceof Date ? mission.date.toISOString().split('T')[0] : mission.date,
      startTime: this.formatTime(mission.startTime),
      endTime: this.formatTime(mission.endTime),
      subject: mission.subject || '',
      content: mission.content || '',
      startPage: mission.startPage,
      endPage: mission.endPage,
      amount: mission.amount,
      status: mission.status || 'pending',
      progress: mission.status === MissionStatus.completed ? 100 : 0,
      result: result
        ? {
            id: Number(result.id),
            startPage: result.amount !== undefined ? (result.startPage ?? null) : null,
            endPage: result.amount !== undefined ? (result.endPage ?? null) : null,
            amount: result.amount ?? null,
            achievementRate: result.achievementRate ? Number(result.achievementRate) : null,
            note: result.note ?? null,
          }
        : null,
    };
  }

  /** 특정 날짜의 미션 목록 조회 (MissionResult 포함) */
  async getMissionsByDate(studentId: number, date: string): Promise<MissionResponse[]> {
    const targetDate = new Date(date);

    const missions = await this.prisma.dailyMission.findMany({
      where: {
        studentId: BigInt(studentId),
        date: targetDate,
      },
      include: {
        missionResults: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { startTime: 'asc' },
    });

    return missions.map((m) => this.mapToResponse(m, m.missionResults?.[0]));
  }

  /** 전체 미션 조회 (날짜 필터 없이) */
  async getAllMissions(studentId: number): Promise<MissionResponse[]> {
    const missions = await this.prisma.dailyMission.findMany({
      where: { studentId: BigInt(studentId) },
      include: {
        missionResults: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });

    return missions.map((m) => this.mapToResponse(m, m.missionResults?.[0]));
  }

  /** 미션 생성 */
  async createMission(dto: MissionDto): Promise<MissionResponse> {
    const studentId = dto.member_id || 1;
    const date = new Date(dto.date);

    const mission = await this.prisma.dailyMission.create({
      data: {
        missionCode: this.generateMissionCode(studentId, date),
        studentId: BigInt(studentId),
        date: date,
        startTime: this.parseTime(dto.start_time),
        endTime: this.parseTime(dto.end_time),
        subject: dto.subject,
        content: dto.content,
        category: Category.study,
        startPage: dto.start_page,
        endPage: dto.end_page,
        amount: dto.amount,
        status: MissionStatus.pending,
      },
    });

    this.sharedSchedule.syncMission(mission);
    return this.mapToResponse(mission);
  }

  /** 미션 수정 (계획 필드 + 결과) */
  async updateMission(id: number, dto: UpdateMissionDto): Promise<MissionResponse | undefined> {
    const existing = await this.prisma.dailyMission.findUnique({
      where: { id: BigInt(id) },
    });
    if (!existing) return undefined;

    const updateData: any = {};

    if (dto.start_time !== undefined) updateData.startTime = this.parseTime(dto.start_time);
    if (dto.end_time !== undefined) updateData.endTime = this.parseTime(dto.end_time);
    if (dto.subject !== undefined) updateData.subject = dto.subject;
    if (dto.content !== undefined) updateData.content = dto.content;
    if (dto.start_page !== undefined) updateData.startPage = dto.start_page;
    if (dto.end_page !== undefined) updateData.endPage = dto.end_page;
    if (dto.amount !== undefined) updateData.amount = dto.amount;
    if (dto.status !== undefined) {
      updateData.status =
        dto.status === 'completed' ? MissionStatus.completed : MissionStatus.pending;
    }

    const mission = await this.prisma.dailyMission.update({
      where: { id: BigInt(id) },
      data: updateData,
    });

    // 결과가 함께 전달되면 MissionResult upsert
    let missionResult = null;
    if (dto.result) {
      missionResult = await this.upsertResult(
        Number(mission.id),
        Number(mission.studentId),
        dto.result,
      );
    } else {
      // 기존 결과 조회
      const existingResult = await this.prisma.missionResult.findFirst({
        where: { missionId: mission.id },
        orderBy: { createdAt: 'desc' },
      });
      missionResult = existingResult;
    }

    this.sharedSchedule.syncMission(mission);
    return this.mapToResponse(mission, missionResult);
  }

  /** 미션 삭제 */
  async deleteMission(id: number): Promise<boolean> {
    try {
      await this.prisma.dailyMission.delete({
        where: { id: BigInt(id) },
      });
      this.sharedSchedule.removeMission(BigInt(id));
      return true;
    } catch {
      return false;
    }
  }

  /** MissionResult upsert */
  async upsertResult(missionId: number, studentId: number, dto: MissionResultDto) {
    const existing = await this.prisma.missionResult.findFirst({
      where: { missionId: BigInt(missionId) },
      orderBy: { createdAt: 'desc' },
    });

    const resultCode = `R${String(missionId).padStart(8, '0')}${String(Math.floor(Math.random() * 100)).padStart(2, '0')}`;

    if (existing) {
      return this.prisma.missionResult.update({
        where: { id: existing.id },
        data: {
          amount: dto.amount,
          achievementRate: dto.achievement_rate !== undefined ? dto.achievement_rate : undefined,
          note: dto.note,
          completedDate: dto.achievement_rate && dto.achievement_rate >= 1 ? new Date() : undefined,
        },
      });
    } else {
      return this.prisma.missionResult.create({
        data: {
          resultCode,
          missionId: BigInt(missionId),
          studentId: BigInt(studentId),
          amount: dto.amount,
          achievementRate: dto.achievement_rate,
          note: dto.note,
          completedDate: dto.achievement_rate && dto.achievement_rate >= 1 ? new Date() : undefined,
        },
      });
    }
  }
}
