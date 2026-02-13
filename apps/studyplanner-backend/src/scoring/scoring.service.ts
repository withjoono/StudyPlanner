import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * 학습 성과 점수 산출 서비스
 * S = Σ(P × W_subject × I_complexity) × (1 + αQ)
 */
@Injectable()
export class ScoringService {
  private readonly logger = new Logger(ScoringService.name);

  // 과목 난이도 가중치 (W_subject)
  private readonly subjectWeights: Record<string, number> = {
    korean: 1.0,
    math: 1.4,
    english: 1.1,
    science: 1.3,
    social: 1.0,
    history: 0.9,
    foreign: 1.1,
    other: 0.8,
    // 한글 매핑
    국어: 1.0,
    수학: 1.4,
    영어: 1.1,
    과학: 1.3,
    사회: 1.0,
    한국사: 0.9,
    제2외국어: 1.1,
    기타: 0.8,
  };

  // 퀴즈 영향도 상수 (α)
  private readonly QUIZ_ALPHA = 0.2;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 미션 완료 시 성과 점수 계산
   */
  calculateMissionScore(params: {
    pages: number;
    subject: string;
    difficulty: number;
    quizScore?: number;
    studyMinutes?: number;
  }): number {
    const W = this.subjectWeights[params.subject] || 1.0;
    const I = params.difficulty || 3;
    const P = params.pages;
    const Q = params.quizScore ?? 0;

    // 기본 점수: P × W × I
    const baseScore = P * W * I;

    // 퀴즈 보너스: (1 + αQ)
    const quizMultiplier = 1 + this.QUIZ_ALPHA * Q;

    // 시간 보너스 (집중 시간이 있으면 약간의 가산)
    const timeBonus = params.studyMinutes
      ? Math.min(params.studyMinutes * 0.1, 5)
      : 0;

    const finalScore =
      Math.round((baseScore * quizMultiplier + timeBonus) * 10) / 10;

    this.logger.debug(
      `Score: P=${P} × W=${W} × I=${I} × (1+${this.QUIZ_ALPHA}×${Q}) + timeBonus=${timeBonus} = ${finalScore}`,
    );

    return finalScore;
  }

  /**
   * 일간 종합 점수 집계 및 DailyScore 모델에 저장
   */
  async calculateDailyScore(
    studentId: number,
    date: Date,
  ): Promise<{
    totalScore: number;
    missionCount: number;
    completedCount: number;
    studyMinutes: number;
    breakdown: Array<{ subject: string; score: number; pages: number }>;
  }> {
    const dateStart = new Date(date);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(date);
    dateEnd.setHours(23, 59, 59, 999);

    // 완료된 미션 조회
    const missions = await this.prisma.dailyMission.findMany({
      where: {
        studentId: BigInt(studentId),
        date: { gte: dateStart, lte: dateEnd },
      },
      include: {
        missionResults: true,
        plan: {
          include: { material: true },
        },
      },
    });

    const completed = missions.filter((m: any) => m.status === 'completed');
    const breakdown: Array<{ subject: string; score: number; pages: number }> =
      [];
    let totalScore = 0;
    let totalStudyMinutes = 0;

    for (const mission of completed) {
      const pages =
        mission.amount ||
        (mission.endPage && mission.startPage
          ? mission.endPage - mission.startPage + 1
          : 0);
      const subject = mission.subject || '기타';
      const difficulty = (mission as any).plan?.material?.difficulty || 3;

      // 타이머 학습 시간 합산
      const timerSessions = await this.prisma.timerSession.findMany({
        where: {
          missionId: mission.id,
          isCompleted: true,
        },
      });
      const studyMinutes = timerSessions.reduce(
        (sum, s) => sum + s.durationMin,
        0,
      );
      totalStudyMinutes += studyMinutes;

      const score = this.calculateMissionScore({
        pages,
        subject,
        difficulty,
        studyMinutes,
      });

      breakdown.push({ subject, score, pages });
      totalScore += score;
    }

    const roundedScore = Math.round(totalScore * 10) / 10;

    // DailyScore 테이블에 upsert
    await this.prisma.dailyScore.upsert({
      where: {
        uk_daily_score: {
          studentId: BigInt(studentId),
          date: dateStart,
        },
      },
      update: {
        totalScore: roundedScore,
        missionCount: completed.length,
        studyMinutes: totalStudyMinutes,
      },
      create: {
        studentId: BigInt(studentId),
        date: dateStart,
        totalScore: roundedScore,
        missionCount: completed.length,
        studyMinutes: totalStudyMinutes,
      },
    });

    return {
      totalScore: roundedScore,
      missionCount: missions.length,
      completedCount: completed.length,
      studyMinutes: totalStudyMinutes,
      breakdown,
    };
  }

  /**
   * 주간 점수 조회
   */
  async getWeeklyScores(studentId: number, date?: Date) {
    const targetDate = date || new Date();
    const dayOfWeek = targetDate.getDay();
    const monday = new Date(targetDate);
    monday.setDate(targetDate.getDate() - ((dayOfWeek + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const scores = await this.prisma.dailyScore.findMany({
      where: {
        studentId: BigInt(studentId),
        date: { gte: monday, lte: sunday },
      },
      orderBy: { date: 'asc' },
    });

    const totalScore = scores.reduce(
      (sum, s) => sum + Number(s.totalScore),
      0,
    );
    const totalStudyMinutes = scores.reduce(
      (sum, s) => sum + s.studyMinutes,
      0,
    );

    return {
      weekStart: monday.toISOString().split('T')[0],
      weekEnd: sunday.toISOString().split('T')[0],
      totalScore: Math.round(totalScore * 10) / 10,
      totalStudyMinutes,
      dailyScores: scores.map((s) => ({
        date: s.date.toISOString().split('T')[0],
        totalScore: Number(s.totalScore),
        missionCount: s.missionCount,
        studyMinutes: s.studyMinutes,
      })),
    };
  }
}
