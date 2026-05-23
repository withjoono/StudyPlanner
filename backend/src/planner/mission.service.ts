import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { Category, MissionStatus } from '@prisma/client';
import { SharedScheduleService } from '../shared-schedule/shared-schedule.service';
import { ScoringService } from '../scoring/scoring.service';

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
  study_minutes?: number;
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
    studyMinutes: number | null;
  } | null;
}

@Injectable()
export class MissionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sharedSchedule: SharedScheduleService,
    private readonly scoringService: ScoringService,
  ) {}

  /** member_id(숫자 ID 또는 Hub userId)로 학생 조회, 없으면 자동 생성 */
  async getOrCreateStudent(memberId: number | string): Promise<bigint> {
    // 숫자형 member_id인 경우
    if (typeof memberId === 'number' || /^\d+$/.test(String(memberId))) {
      const id = BigInt(memberId);
      const existing = await this.prisma.student.findFirst({ where: { id } });
      if (existing) return existing.id;
    }

    const userIdStr = String(memberId);
    // userId 직접 조회
    const byUserId = await this.prisma.student.findFirst({
      where: { userId: userIdStr },
    });
    if (byUserId) return byUserId.id;

    // sp_ 없이 들어온 Hub raw ID 재시도 ("S26H208011" → "sp_S26H208011")
    if (!userIdStr.startsWith('sp_')) {
      const withPrefix = await this.prisma.student.findFirst({
        where: { userId: `sp_${userIdStr}` },
      });
      if (withPrefix) return withPrefix.id;
    }

    // 학생 자동 생성 — User FK 제약 위반 방지: User 먼저 upsert
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
    const student = await this.prisma.student.upsert({
      where: { userId: normalizedUserId },
      create: {
        studentCode: `SP${Date.now()}`,
        userId: normalizedUserId,
        year: new Date().getFullYear(),
        schoolLevel: 'high',
        name: '학생',
      },
      update: {},
    });
    return student.id;
  }

  private formatTime(date: Date | string | null): string {
    if (!date) return '00:00';
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
      // 진행률: 결과의 달성률(achievementRate)이 있으면 그 값을, 없으면 완료 여부로 산출
      progress:
        result?.achievementRate != null
          ? Math.round(Number(result.achievementRate) * 100)
          : mission.status === MissionStatus.completed
            ? 100
            : 0,
      result: result
        ? {
            id: Number(result.id),
            startPage: result.startPage ?? null,
            endPage: result.endPage ?? null,
            amount: result.amount ?? null,
            achievementRate: result.achievementRate != null ? Number(result.achievementRate) : null,
            note: result.note ?? null,
            studyMinutes: result.studyMinutes ?? null,
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
    const resolvedStudentId = await this.getOrCreateStudent(dto.member_id || 1);
    const date = new Date(dto.date);

    const mission = await this.prisma.dailyMission.create({
      data: {
        missionCode: this.generateMissionCode(Number(resolvedStudentId), date),
        studentId: resolvedStudentId,
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

    // 미션 완료 시 일일 점수 자동 계산
    if (dto.status === 'completed' && mission.studentId) {
      const missionDate = mission.date instanceof Date ? mission.date : new Date(mission.date);
      this.scoringService
        .calculateDailyScore(Number(mission.studentId), missionDate)
        .catch((err) => console.error('DailyScore 계산 오류:', err));
    }

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

  /** 장기 계획 분배: 미션 대량 생성 + 계획 isDistributed 업데이트 */
  async distributeMissions(planId: number, missions: any[]): Promise<{ created: number }> {
    const plan = await this.prisma.longTermPlan.findUnique({
      where: { id: BigInt(planId) },
    });
    if (!plan) throw new Error(`Plan ${planId} not found`);

    const studentId = plan.studentId;
    let created = 0;

    for (const mission of missions) {
      try {
        const date = new Date(mission.date);
        // humps converts camelCase→snake_case, accept both
        const routineId = mission.routine_id ?? mission.routineId;
        const startTime = mission.start_time ?? mission.startTime;
        const endTime = mission.end_time ?? mission.endTime;
        const startPage = mission.start_page ?? mission.startPage;
        const endPage = mission.end_page ?? mission.endPage;
        const missionData = await this.prisma.dailyMission.create({
          data: {
            missionCode: this.generateMissionCode(Number(studentId), date),
            studentId,
            planId: BigInt(planId),
            routineId: routineId ? BigInt(routineId) : null,
            date,
            startTime: this.parseTime(startTime),
            endTime: this.parseTime(endTime),
            category: Category.study,
            subject: mission.subject,
            content: mission.content,
            startPage,
            endPage,
            amount: mission.amount,
            status: MissionStatus.pending,
          },
        });
        this.sharedSchedule.syncMission(missionData);
        created++;
      } catch (err) {
        console.error('Failed to create distributed mission:', err);
      }
    }

    await this.prisma.longTermPlan.update({
      where: { id: BigInt(planId) },
      data: { isDistributed: true },
    });

    return { created };
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
          startPage: dto.start_page,
          endPage: dto.end_page,
          amount: dto.amount,
          achievementRate: dto.achievement_rate !== undefined ? dto.achievement_rate : undefined,
          note: dto.note,
          studyMinutes: dto.study_minutes,
          completedDate: dto.achievement_rate && dto.achievement_rate >= 1 ? new Date() : undefined,
        },
      });
    } else {
      return this.prisma.missionResult.create({
        data: {
          resultCode,
          missionId: BigInt(missionId),
          studentId: BigInt(studentId),
          startPage: dto.start_page,
          endPage: dto.end_page,
          amount: dto.amount,
          achievementRate: dto.achievement_rate,
          note: dto.note,
          studyMinutes: dto.study_minutes,
          completedDate: dto.achievement_rate && dto.achievement_rate >= 1 ? new Date() : undefined,
        },
      });
    }
  }
}
