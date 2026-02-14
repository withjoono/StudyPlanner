import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * AI 학습 분석 & 주간 리포트 서비스
 * 매주 일요일 자정에 자동 생성 (크론잡)
 * 현재는 AI 피드백 stub, 추후 LLM API 연동
 */
@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 주간 리포트 생성
   */
  async generateWeeklyReport(studentId: number, weekStart?: Date) {
    const start = weekStart || this.getWeekStart();
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    // 해당 주의 DailyScore 조회
    const dailyScores = await this.prisma.dailyScore.findMany({
      where: {
        studentId: BigInt(studentId),
        date: { gte: start, lte: end },
      },
      orderBy: { date: 'asc' },
    });

    // 해당 주의 미션 조회
    const missions = await this.prisma.dailyMission.findMany({
      where: {
        studentId: BigInt(studentId),
        date: { gte: start, lte: end },
      },
      include: {
        missionResults: true,
      },
    });

    // 과목별 분석
    const subjectBreakdown: Record<
      string,
      {
        studyMinutes: number;
        missionCount: number;
        completedCount: number;
        score: number;
      }
    > = {};

    for (const mission of missions) {
      const subject = mission.subject || 'other';
      if (!subjectBreakdown[subject]) {
        subjectBreakdown[subject] = {
          studyMinutes: 0,
          missionCount: 0,
          completedCount: 0,
          score: 0,
        };
      }
      subjectBreakdown[subject].missionCount++;
      if (mission.status === 'completed') {
        subjectBreakdown[subject].completedCount++;
      }
      for (const result of mission.missionResults) {
        subjectBreakdown[subject].studyMinutes += result.studyMinutes || 0;
      }
    }

    // 총합 계산
    const totalStudyMin = dailyScores.reduce((sum, ds) => sum + ds.studyMinutes, 0);
    const totalScore = dailyScores.reduce((sum, ds) => sum + Number(ds.totalScore), 0);

    // 학습 일관성 (7일 중 학습한 날 비율)
    const activeDays = dailyScores.filter((ds) => Number(ds.totalScore) > 0).length;
    const consistency = activeDays / 7;

    // AI 피드백 stub (추후 LLM API로 교체)
    const feedback = this.generateStubFeedback(subjectBreakdown, consistency, totalStudyMin);

    // WeeklyReport upsert
    const report = await this.prisma.weeklyReport.upsert({
      where: {
        uk_weekly_report: {
          studentId: BigInt(studentId),
          weekStart: start,
        },
      },
      create: {
        studentId: BigInt(studentId),
        weekStart: start,
        weekEnd: end,
        totalStudyMin,
        totalScore,
        subjectBreakdown,
        strengths: feedback.strengths,
        improvements: feedback.improvements,
        encouragement: feedback.encouragement,
        consistency,
      },
      update: {
        totalStudyMin,
        totalScore,
        subjectBreakdown,
        strengths: feedback.strengths,
        improvements: feedback.improvements,
        encouragement: feedback.encouragement,
        consistency,
      },
    });

    this.logger.log(
      `Weekly report generated: student=${studentId}, week=${start.toISOString().split('T')[0]}, score=${totalScore}`,
    );

    return this.serialize(report);
  }

  /**
   * 주간 리포트 조회
   */
  async getWeeklyReport(studentId: number, weekStart?: Date) {
    const start = weekStart || this.getWeekStart();

    const report = await this.prisma.weeklyReport.findUnique({
      where: {
        uk_weekly_report: {
          studentId: BigInt(studentId),
          weekStart: start,
        },
      },
    });

    return report ? this.serialize(report) : null;
  }

  /**
   * 최근 리포트 목록
   */
  async getReportHistory(studentId: number, limit: number = 12) {
    const reports = await this.prisma.weeklyReport.findMany({
      where: { studentId: BigInt(studentId) },
      orderBy: { weekStart: 'desc' },
      take: limit,
    });

    return reports.map(this.serialize.bind(this));
  }

  /**
   * 이번 주 시작일 (월요일)
   */
  private getWeekStart(): Date {
    const now = new Date();
    const day = now.getDay();
    const diff = day === 0 ? 6 : day - 1; // 월요일 기준
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - diff);
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  }

  /**
   * AI 피드백 생성 Stub
   */
  private generateStubFeedback(
    subjects: Record<string, any>,
    consistency: number,
    totalStudyMin: number,
  ) {
    const subjectNames = Object.keys(subjects);
    const topSubject =
      subjectNames.length > 0
        ? subjectNames.reduce((a, b) =>
            subjects[a].studyMinutes > subjects[b].studyMinutes ? a : b,
          )
        : '없음';

    return {
      strengths:
        consistency >= 0.7
          ? `이번 주 ${Math.round(consistency * 7)}일 동안 꾸준히 학습했습니다! ${topSubject} 과목에 가장 많은 시간을 투자했네요.`
          : `${topSubject} 과목 학습에 집중한 한 주였습니다.`,
      improvements:
        consistency < 0.5
          ? '매일 조금씩이라도 학습하는 습관을 만들어보세요. 꾸준함이 실력의 비결입니다.'
          : subjectNames.length < 3
            ? '더 다양한 과목에 시간을 배분해보세요.'
            : '현재 학습 패턴이 좋습니다. 계속 유지하세요!',
      encouragement:
        totalStudyMin >= 300
          ? `이번 주 총 ${Math.round(totalStudyMin / 60)}시간 공부했습니다! 정말 대단해요! 🔥`
          : totalStudyMin >= 120
            ? `총 ${Math.round(totalStudyMin / 60)}시간 학습을 완료했습니다. 한 걸음씩 나아가고 있어요! 💪`
            : '작은 시작이라도 소중합니다. 이번 주에도 화이팅! ✨',
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
        result[key] = result[key].toNumber();
      }
    }
    return result;
  }
}
