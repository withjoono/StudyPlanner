import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * 학부모용 서비스
 * 담당 자녀의 학습 데이터를 읽기 전용으로 제공
 */
@Injectable()
export class ParentService {
  private readonly logger = new Logger(ParentService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** 자녀 목록 조회 */
  async getChildren(parentUserId: number) {
    const links = await this.prisma.parentStudent.findMany({
      where: { parentId: BigInt(parentUserId) },
      include: {
        student: {
          select: {
            id: true,
            studentCode: true,
            name: true,
            schoolName: true,
            grade: true,
            schoolLevel: true,
          },
        },
      },
    });
    return links.map((l: any) => ({
      ...this.serialize(l.student),
      relation: l.relation,
    }));
  }

  /** 자녀 오늘 미션 현황 */
  async getChildMissions(parentUserId: number, studentId: number, date?: string) {
    await this.verifyParentAccess(parentUserId, studentId);

    const targetDate = date ? new Date(date) : new Date();
    const dateStr = targetDate.toISOString().split('T')[0];

    const missions = await this.prisma.dailyMission.findMany({
      where: {
        studentId: BigInt(studentId),
        date: new Date(dateStr),
      },
      orderBy: { startTime: 'asc' },
    });

    return missions.map(this.serialize);
  }

  /** 자녀 학습 성과 점수 */
  async getChildScores(parentUserId: number, studentId: number, days: number = 7) {
    await this.verifyParentAccess(parentUserId, studentId);

    const since = new Date();
    since.setDate(since.getDate() - days);

    const scores = await this.prisma.dailyScore.findMany({
      where: {
        studentId: BigInt(studentId),
        date: { gte: since },
      },
      orderBy: { date: 'asc' },
    });

    return scores.map(this.serialize);
  }

  /** 자녀 타이머 세션 (학습 시간) */
  async getChildStudyTime(parentUserId: number, studentId: number, days: number = 7) {
    await this.verifyParentAccess(parentUserId, studentId);

    const since = new Date();
    since.setDate(since.getDate() - days);

    const sessions = await this.prisma.timerSession.findMany({
      where: {
        studentId: BigInt(studentId),
        startedAt: { gte: since },
        isCompleted: true,
      },
      orderBy: { startedAt: 'desc' },
    });

    const totalMinutes = sessions.reduce((sum, s) => sum + s.durationMin, 0);

    return {
      totalMinutes,
      sessions: sessions.map(this.serialize),
    };
  }

  /** 자녀 인증 사진 목록 */
  async getChildPhotos(parentUserId: number, studentId: number, limit: number = 20) {
    await this.verifyParentAccess(parentUserId, studentId);

    const photos = await this.prisma.verificationPhoto.findMany({
      where: {
        missionResult: { studentId: BigInt(studentId) },
      },
      include: {
        missionResult: {
          select: { id: true, completedDate: true, mission: { select: { subject: true, content: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return photos.map(this.serialize);
  }

  /** 자녀 대시보드 요약 */
  async getChildDashboard(parentUserId: number, studentId: number) {
    await this.verifyParentAccess(parentUserId, studentId);

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // 오늘 미션
    const todayMissions = await this.prisma.dailyMission.findMany({
      where: { studentId: BigInt(studentId), date: new Date(todayStr) },
    });

    const totalMissions = todayMissions.length;
    const completedMissions = todayMissions.filter((m) => m.status === 'completed').length;

    // 오늘 점수
    const todayScore = await this.prisma.dailyScore.findUnique({
      where: { uk_daily_score: { studentId: BigInt(studentId), date: new Date(todayStr) } },
    });

    // 오늘 학습 시간
    const todaySessions = await this.prisma.timerSession.aggregate({
      where: {
        studentId: BigInt(studentId),
        startedAt: { gte: new Date(todayStr) },
        isCompleted: true,
      },
      _sum: { durationMin: true },
    });

    return {
      today: {
        totalMissions,
        completedMissions,
        completionRate: totalMissions > 0 ? Math.round((completedMissions / totalMissions) * 100) : 0,
        score: todayScore ? Number(todayScore.totalScore) : 0,
        studyMinutes: (todaySessions._sum as any)?.durationMin || 0,
      },
    };
  }

  /** 부모-학생 접근 권한 확인 */
  private async verifyParentAccess(parentUserId: number, studentId: number) {
    const link = await this.prisma.parentStudent.findUnique({
      where: { uk_parent_student: { parentId: BigInt(parentUserId), studentId: BigInt(studentId) } },
    });
    if (!link) {
      throw new Error('해당 학생에 대한 접근 권한이 없습니다.');
    }
  }

  private serialize(obj: any): any {
    if (!obj) return null;
    const result: any = { ...obj };
    for (const key of Object.keys(result)) {
      if (typeof result[key] === 'bigint') {
        result[key] = Number(result[key]);
      } else if (result[key]?.constructor?.name === 'Decimal') {
        result[key] = Number(result[key]);
      } else if (result[key] && typeof result[key] === 'object' && !Array.isArray(result[key]) && !(result[key] instanceof Date)) {
        result[key] = this.serialize(result[key]);
      }
    }
    return result;
  }
}
