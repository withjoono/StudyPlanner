import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Study Performance Score 산출 서비스
 * 공식: S = Σ(P × W_subject × I_complexity) × (1 + αQ)
 * - P: 페이지/학습량
 * - W_subject: 과목 난이도 가중치
 * - I_complexity: 교재 난이도 (1~5)
 * - Q: AI 퀴즈 정답률 (Phase 2 전까지 1.0)
 * - α: 조절 상수 (기본 0.2)
 */

// 과목별 가중치 — 수능 기준 난이도/중요도 반영
const SUBJECT_WEIGHTS: Record<string, number> = {
  korean: 1.0,
  math: 1.3,
  english: 1.0,
  science: 1.2,
  social: 1.0,
  history: 0.9,
  foreign: 0.8,
  other: 0.7,
};

@Injectable()
export class ScoringService {
  private readonly logger = new Logger(ScoringService.name);
  private readonly ALPHA = parseFloat(process.env.SCORING_ALPHA || '0.2');

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 단일 미션 성과 점수 계산
   */
  calculateMissionScore(params: {
    amount: number; // 학습량 (페이지 수 등)
    subjectCode: string; // 과목 코드
    difficulty: number; // 교재 난이도 1~5
    quizScoreRate: number; // 퀴즈 정답률 0~1 (기본 1.0)
  }): number {
    const { amount, subjectCode, difficulty, quizScoreRate } = params;

    const W = SUBJECT_WEIGHTS[subjectCode] || 1.0;
    const I = Math.max(1, Math.min(5, difficulty)) / 3; // normalize: 1~5 → 0.33~1.67
    const Q = Math.max(0, Math.min(1, quizScoreRate));

    // S = P × W × I × (1 + αQ)
    const score = amount * W * I * (1 + this.ALPHA * Q);
    return Math.round(score * 100) / 100;
  }

  /**
   * 특정 학생의 특정 일자 전체 미션 기반 일간 점수 산출 및 저장
   */
  async calculateDailyScore(studentId: number, date?: Date) {
    const targetDate = date || new Date();
    const dateOnly = new Date(targetDate);
    dateOnly.setHours(0, 0, 0, 0);
    const nextDate = new Date(dateOnly);
    nextDate.setDate(nextDate.getDate() + 1);

    // 해당 날짜의 완료된 미션 + 결과 조회
    const missions = await this.prisma.dailyMission.findMany({
      where: {
        studentId: BigInt(studentId),
        date: dateOnly,
        status: 'completed',
      },
      include: {
        missionResults: true,
        plan: {
          include: { material: true },
        },
      },
    });

    let totalScore = 0;
    let totalStudyMinutes = 0;

    for (const mission of missions) {
      const result = mission.missionResults[0]; // 가장 최근 결과
      if (!result) continue;

      const amount = result.amount || mission.amount || 1;
      const subjectCode = (mission.subject || 'other').toLowerCase();
      const difficulty = mission.plan?.material?.difficulty || 3;

      // Phase 2 전까지 퀴즈 점수는 1.0
      const quizScoreRate = 1.0;

      const missionScore = this.calculateMissionScore({
        amount,
        subjectCode,
        difficulty,
        quizScoreRate,
      });

      totalScore += missionScore;
      totalStudyMinutes += result.studyMinutes || 0;
    }

    // DailyScore upsert
    const dailyScore = await this.prisma.dailyScore.upsert({
      where: {
        uk_daily_score: {
          studentId: BigInt(studentId),
          date: dateOnly,
        },
      },
      create: {
        studentId: BigInt(studentId),
        date: dateOnly,
        totalScore,
        missionCount: missions.length,
        studyMinutes: totalStudyMinutes,
      },
      update: {
        totalScore,
        missionCount: missions.length,
        studyMinutes: totalStudyMinutes,
      },
    });

    this.logger.log(
      `DailyScore updated: student=${studentId}, date=${dateOnly.toISOString().split('T')[0]}, score=${totalScore}, missions=${missions.length}`,
    );

    return this.serialize(dailyScore);
  }

  /**
   * 학생의 일간 점수 조회 (기간)
   */
  async getDailyScores(studentId: number, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const scores = await this.prisma.dailyScore.findMany({
      where: {
        studentId: BigInt(studentId),
        date: { gte: startDate },
      },
      orderBy: { date: 'desc' },
    });

    return scores.map(this.serialize);
  }

  /**
   * 오늘 점수 요약
   */
  async getTodayScore(studentId: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const score = await this.prisma.dailyScore.findUnique({
      where: {
        uk_daily_score: {
          studentId: BigInt(studentId),
          date: today,
        },
      },
    });

    return score
      ? this.serialize(score)
      : {
          studentId,
          date: today,
          totalScore: 0,
          missionCount: 0,
          studyMinutes: 0,
        };
  }

  private serialize(obj: any) {
    if (!obj) return null;
    const result: any = { ...obj };
    for (const key of Object.keys(result)) {
      if (typeof result[key] === 'bigint') {
        result[key] = Number(result[key]);
      } else if (
        result[key] !== null &&
        typeof result[key] === 'object' &&
        typeof result[key].toNumber === 'function'
      ) {
        // Prisma Decimal
        result[key] = result[key].toNumber();
      }
    }
    return result;
  }
}
