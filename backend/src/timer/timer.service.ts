import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ScoringService } from '../scoring/scoring.service';

@Injectable()
export class TimerService {
  private readonly logger = new Logger(TimerService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => ScoringService))
    private readonly scoringService: ScoringService,
  ) {}

  /** 타이머 세션 시작 */
  async startSession(data: {
    studentId: number;
    missionId?: number;
    targetMin?: number;
    subject?: string;
  }) {
    const session = await this.prisma.timerSession.create({
      data: {
        studentId: BigInt(data.studentId),
        missionId: data.missionId ? BigInt(data.missionId) : null,
        startedAt: new Date(),
        targetMin: data.targetMin || 25,
        sessionType: 'focus',
        subject: data.subject,
      },
    });

    return this.serialize(session);
  }

  /** 타이머 세션 종료 */
  async endSession(sessionId: number) {
    const session = await this.prisma.timerSession.findUnique({
      where: { id: BigInt(sessionId) },
    });

    if (!session) throw new Error('Session not found');

    const endedAt = new Date();
    const durationMin = Math.round((endedAt.getTime() - session.startedAt.getTime()) / 60000);
    const isCompleted = durationMin >= session.targetMin;

    const updated = await this.prisma.timerSession.update({
      where: { id: BigInt(sessionId) },
      data: { endedAt, durationMin, isCompleted },
    });

    // 미션에 학습시간 반영
    if (session.missionId) {
      await this.updateMissionStudyTime(Number(session.missionId), durationMin);
    }

    // 일간 점수 재계산 트리거
    try {
      await this.scoringService.calculateDailyScore(Number(session.studentId));
    } catch (e) {
      this.logger.warn(`Failed to recalculate daily score: ${e}`);
    }

    return this.serialize(updated);
  }

  /** 진행 중인 세션 조회 */
  async getActiveSession(studentId: number) {
    const session = await this.prisma.timerSession.findFirst({
      where: {
        studentId: BigInt(studentId),
        endedAt: null,
      },
      orderBy: { startedAt: 'desc' },
    });

    return session ? this.serialize(session) : null;
  }

  /** 오늘 세션 목록 */
  async getTodaySessions(studentId: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sessions = await this.prisma.timerSession.findMany({
      where: {
        studentId: BigInt(studentId),
        startedAt: { gte: today },
      },
      orderBy: { startedAt: 'desc' },
    });

    return sessions.map(this.serialize);
  }

  /** 통계: 오늘 총 집중 시간 */
  async getTodayStats(studentId: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sessions = await this.prisma.timerSession.findMany({
      where: {
        studentId: BigInt(studentId),
        startedAt: { gte: today },
        sessionType: 'focus',
        isCompleted: true,
      },
    });

    const totalMin = sessions.reduce((sum: number, s: any) => sum + s.durationMin, 0);
    const completedSessions = sessions.length;

    return { totalMin, completedSessions };
  }

  /** 미션에 학습시간 반영 */
  private async updateMissionStudyTime(missionId: number, durationMin: number) {
    try {
      const existing = await this.prisma.missionResult.findFirst({
        where: { missionId: BigInt(missionId) },
      });

      if (existing) {
        const currentMinutes = existing.studyMinutes || 0;
        await this.prisma.missionResult.update({
          where: { id: existing.id },
          data: { studyMinutes: currentMinutes + durationMin },
        });
        this.logger.log(
          `Updated mission ${missionId}: +${durationMin}min (total: ${currentMinutes + durationMin}min)`,
        );
      } else {
        // 미션 결과가 없으면 새로 생성
        const mission = await this.prisma.dailyMission.findUnique({
          where: { id: BigInt(missionId) },
        });
        if (mission) {
          await this.prisma.missionResult.create({
            data: {
              missionId: BigInt(missionId),
              studentId: mission.studentId,
              studyMinutes: durationMin,
              completedDate: new Date(),
            },
          });
          this.logger.log(`Created MissionResult for mission ${missionId}: ${durationMin}min`);
        }
      }
    } catch (e) {
      this.logger.warn(`Failed to update mission study time: ${e}`);
    }
  }

  /** BigInt를 직렬화 */
  private serialize(session: any) {
    return {
      ...session,
      id: Number(session.id),
      studentId: Number(session.studentId),
      missionId: session.missionId ? Number(session.missionId) : null,
    };
  }
}
