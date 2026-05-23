import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type TeacherGroupPeriod = 'daily' | 'weekly' | 'monthly';

export interface TeacherGroupMember {
  studentId: number;
  name: string;
  grade: string | null;
  avgScore: number; // 기간 내 선생님 평가 평균 (0 = 평가 없음)
  ratingCount: number;
  studyMinutes: number;
  totalPages: number;
  rank: number;
  isMe: boolean;
}

export interface MyRatingItem {
  date: string; // YYYY-MM-DD
  score: number;
  comment: string | null;
}

export interface TeacherGroupLeaderboardResponse {
  hasTeacher: boolean;
  teacherName: string | null;
  period: TeacherGroupPeriod;
  dateRange: { start: string; end: string };
  members: TeacherGroupMember[];
  myRatings: MyRatingItem[];
  myRank: number | null;
  totalMembers: number;
  classAverage: { score: number; studyMinutes: number; totalPages: number };
}

/**
 * 담당 선생님 그룹 — 선생님이 채점한 플래너 점수를 학생들끼리 비교하는 리더보드.
 *
 * - 선생님이 `PlannerRating`(1~10점 + 코멘트)으로 채점한 결과를 집계
 * - 같은 선생님(`TeacherStudent.teacherId`)에 연결된 학생들을 한 그룹으로 묶어 경쟁 유도
 * - 일간 / 주간 / 월간 기간으로 선생님 점수 · 학습시간 · 분량을 비교
 */
@Injectable()
export class TeacherGroupService {
  constructor(private readonly prisma: PrismaService) {}

  async getLeaderboard(
    memberId: string,
    period: TeacherGroupPeriod = 'weekly',
    date?: string,
  ): Promise<TeacherGroupLeaderboardResponse> {
    const { start, end } = this.getDateRange(period, date);
    const dateRange = { start: this.fmt(start), end: this.fmt(end) };

    const empty = (): TeacherGroupLeaderboardResponse => ({
      hasTeacher: false,
      teacherName: null,
      period,
      dateRange,
      members: [],
      myRatings: [],
      myRank: null,
      totalMembers: 0,
      classAverage: { score: 0, studyMinutes: 0, totalPages: 0 },
    });

    const me = await this.findStudent(memberId);
    if (!me) return empty();
    const myId = Number(me.id);

    // 내 담당 선생님 (가장 먼저 연결된 선생님 기준)
    const myLink = await this.prisma.teacherStudent.findFirst({
      where: { studentId: me.id },
      orderBy: { createdAt: 'asc' },
    });
    if (!myLink) return empty();

    const teacherId = myLink.teacherId;
    const teacher = await this.prisma.user.findUnique({
      where: { id: teacherId },
      select: { name: true },
    });

    // 같은 선생님에게 연결된 모든 학생
    const links = await this.prisma.teacherStudent.findMany({
      where: { teacherId },
      include: { student: { select: { id: true, name: true, grade: true } } },
    });
    if (links.length === 0) return empty();

    const studentIds = links.map((l) => l.student.id);
    const linkIds = links.map((l) => l.id);
    const linkToStudent = new Map<number, number>(
      links.map((l) => [Number(l.id), Number(l.student.id)]),
    );

    // 1) 선생님 평가 점수 집계 (PlannerRating)
    const ratings = await this.prisma.plannerRating.findMany({
      where: {
        teacherStudentId: { in: linkIds },
        ratingDate: { gte: start, lt: end },
      },
      select: { teacherStudentId: true, score: true },
    });
    const scoreAgg = new Map<number, { sum: number; count: number }>();
    for (const r of ratings) {
      const sid = linkToStudent.get(Number(r.teacherStudentId));
      if (sid == null) continue;
      const a = scoreAgg.get(sid) ?? { sum: 0, count: 0 };
      a.sum += r.score;
      a.count += 1;
      scoreAgg.set(sid, a);
    }

    // 2) 학습시간 집계 (DailyScore)
    const scores = await this.prisma.dailyScore.groupBy({
      by: ['studentId'],
      where: { studentId: { in: studentIds }, date: { gte: start, lt: end } },
      _sum: { studyMinutes: true },
    });
    const minutesMap = new Map<number, number>(
      scores.map((s) => [Number(s.studentId), Number(s._sum.studyMinutes ?? 0)]),
    );

    // 3) 분량(페이지) 집계 (MissionResult.amount)
    const pages = await this.prisma.missionResult.groupBy({
      by: ['studentId'],
      where: {
        studentId: { in: studentIds },
        completedDate: { gte: start, lt: end },
        amount: { not: null },
      },
      _sum: { amount: true },
    });
    const pagesMap = new Map<number, number>(
      pages.map((p) => [Number(p.studentId), Number(p._sum.amount ?? 0)]),
    );

    const members: TeacherGroupMember[] = links
      .map((l) => {
        const sid = Number(l.student.id);
        const agg = scoreAgg.get(sid);
        const avgScore = agg && agg.count > 0 ? Math.round((agg.sum / agg.count) * 10) / 10 : 0;
        return {
          studentId: sid,
          name: l.student.name,
          grade: l.student.grade,
          avgScore,
          ratingCount: agg?.count ?? 0,
          studyMinutes: minutesMap.get(sid) ?? 0,
          totalPages: pagesMap.get(sid) ?? 0,
          rank: 0,
          isMe: sid === myId,
        };
      })
      .sort((a, b) => {
        if (b.avgScore !== a.avgScore) return b.avgScore - a.avgScore;
        if (b.studyMinutes !== a.studyMinutes) return b.studyMinutes - a.studyMinutes;
        return b.totalPages - a.totalPages;
      })
      .map((m, idx) => ({ ...m, rank: idx + 1 }));

    // 반 평균 (점수는 평가가 있는 학생만 기준)
    const rated = members.filter((m) => m.ratingCount > 0);
    const classAverage = {
      score:
        rated.length > 0
          ? Math.round((rated.reduce((s, m) => s + m.avgScore, 0) / rated.length) * 10) / 10
          : 0,
      studyMinutes:
        members.length > 0
          ? Math.round(members.reduce((s, m) => s + m.studyMinutes, 0) / members.length)
          : 0,
      totalPages:
        members.length > 0
          ? Math.round(members.reduce((s, m) => s + m.totalPages, 0) / members.length)
          : 0,
    };

    // 내 평가 상세 (코멘트 포함)
    const myRatingRows = await this.prisma.plannerRating.findMany({
      where: { teacherStudentId: myLink.id, ratingDate: { gte: start, lt: end } },
      orderBy: { ratingDate: 'desc' },
      select: { ratingDate: true, score: true, comment: true },
    });
    const myRatings: MyRatingItem[] = myRatingRows.map((r) => ({
      date: this.fmt(r.ratingDate),
      score: r.score,
      comment: r.comment,
    }));

    const myEntry = members.find((m) => m.isMe);

    return {
      hasTeacher: true,
      teacherName: teacher?.name ?? '담당 선생님',
      period,
      dateRange,
      members,
      myRatings,
      myRank: myEntry?.rank ?? null,
      totalMembers: members.length,
      classAverage,
    };
  }

  /** 학생 조회 (읽기 전용 — myclass.service 의 findStudent 정책과 동일) */
  private async findStudent(memberId: string) {
    if (/^\d+$/.test(memberId)) {
      const byId = await this.prisma.student.findUnique({
        where: { id: BigInt(memberId) },
        select: { id: true },
      });
      if (byId) return byId;
    }
    const byUserId = await this.prisma.student.findFirst({
      where: { userId: memberId },
      select: { id: true },
    });
    if (byUserId) return byUserId;
    if (!memberId.startsWith('sp_')) {
      return this.prisma.student.findFirst({
        where: { userId: `sp_${memberId}` },
        select: { id: true },
      });
    }
    return null;
  }

  private getDateRange(period: string, date?: string): { start: Date; end: Date } {
    const ref = date ? new Date(date) : new Date();
    let start: Date;
    let end: Date;

    if (period === 'daily') {
      start = new Date(ref);
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setDate(end.getDate() + 1);
    } else if (period === 'monthly') {
      start = new Date(ref.getFullYear(), ref.getMonth(), 1);
      end = new Date(ref.getFullYear(), ref.getMonth() + 1, 1);
    } else {
      const day = ref.getDay();
      const mondayOffset = day === 0 ? -6 : 1 - day;
      start = new Date(ref);
      start.setDate(ref.getDate() + mondayOffset);
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setDate(end.getDate() + 7);
    }
    return { start, end };
  }

  private fmt(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
