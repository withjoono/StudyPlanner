import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';

interface LeaderboardEntry {
  rank: number;
  studentId: number;
  name: string;
  grade: string | null;
  totalScore: number;
  studyMinutes: number;
  missionCount: number;
  rankChange: number | null; // 이전 기간 대비 순위 변동 (▲양수 ▼음수)
}

export interface LeaderboardResponse {
  period: 'daily' | 'weekly' | 'monthly';
  dateRange: { start: string; end: string };
  leaderboard: LeaderboardEntry[];
  myRank: number | null;
  groupAverage: number;
  totalMembers: number;
  availableGroups?: { id: string; name: string }[];
}

@Injectable()
export class RankingService {
  private readonly logger = new Logger(RankingService.name);
  private readonly hubApiUrl = process.env.HUB_API_URL || 'http://localhost:4000';

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 학생 기준: 자신이 속한 그룹의 리더보드 (선생님 반 + Hub 자동 편성 반)
   */
  async getMyLeaderboard(
    memberId: string,
    period: 'daily' | 'weekly' | 'monthly' = 'weekly',
    date?: string,
    requestedGroupId?: string,
    authHeader?: string,
  ): Promise<LeaderboardResponse | null> {
    const student = await this.findStudent(memberId);
    if (!student) return null;

    const availableGroups: { id: string; name: string }[] = [];

    // 1. 선생님 반 조회
    const teacherLink = await this.prisma.teacherStudent.findFirst({
      where: { studentId: student.id },
      select: { teacherId: true },
    });

    if (teacherLink) {
      availableGroups.push({ id: 'teacher', name: '선생님 멘토링 반' });
    }

    // 2. Hub 그룹 조회 (API 호출)
    let hubGroups: any[] = [];
    try {
      if (authHeader) {
        const { data } = await axios.get(`${this.hubApiUrl}/api/groups/my`, {
          headers: { Authorization: authHeader },
          timeout: 3000,
        });
        hubGroups = data?.groups || [];
        hubGroups.forEach((g) => {
          availableGroups.push({ id: String(g.id), name: g.name });
        });
      }
    } catch (error) {
      this.logger.warn(`Hub 그룹 조회 실패: ${(error as Error).message}`);
    }

    // 3. 마이 클래스 (StudyRoom) 조회
    const myRooms = await this.prisma.studyRoomMember.findMany({
      where: { studentId: student.id, isActive: true },
      include: {
        room: { select: { id: true, name: true, isActive: true } },
      },
    });
    myRooms.forEach((m) => {
      if (m.room.isActive) {
        availableGroups.push({ id: `mc-${m.room.id}`, name: `🏠 ${m.room.name}` });
      }
    });

    if (availableGroups.length === 0) {
      // 어디에도 속하지 않은 경우
      return {
        ...(await this.buildSoloLeaderboard(student, period, date)),
        availableGroups,
      };
    }

    // 4. 렌더링할 타겟 그룹 결정
    let targetGroupId = requestedGroupId;
    if (!targetGroupId || !availableGroups.find((g) => g.id === targetGroupId)) {
      targetGroupId = availableGroups[0].id;
    }

    // 5. 타겟 그룹에 따른 랭킹 산출
    let response: LeaderboardResponse;

    if (targetGroupId === 'teacher' && teacherLink) {
      // 선생님 반
      response = await this.getLeaderboardByTeacher(
        teacherLink.teacherId,
        period,
        date,
        Number(student.id),
      );
    } else if (targetGroupId.startsWith('mc-')) {
      // 마이 클래스
      const roomId = parseInt(targetGroupId.replace('mc-', ''), 10);
      response = await this.getLeaderboardByStudyRoom(roomId, period, date, Number(student.id));
    } else {
      // Hub 반
      response = await this.getLeaderboardByHubGroup(
        targetGroupId,
        period,
        date,
        Number(student.id),
        authHeader,
      );
    }

    response.availableGroups = availableGroups;
    return response;
  }
  /**
   * 마이 클래스(StudyRoom) 기준 리더보드
   */
  async getLeaderboardByStudyRoom(
    roomId: number,
    period: 'daily' | 'weekly' | 'monthly' = 'weekly',
    date?: string,
    currentStudentId?: number,
  ): Promise<LeaderboardResponse> {
    const members = await this.prisma.studyRoomMember.findMany({
      where: { roomId: BigInt(roomId), isActive: true },
      include: {
        student: { select: { id: true, name: true, grade: true } },
      },
    });

    const students = members.map((m) => ({
      id: Number(m.student.id),
      name: m.student.name,
      grade: m.student.grade,
    }));

    return this.calculateLeaderboard(students, period, date, currentStudentId);
  }

  /**
   * 선생님 반 기준 리더보드
   */
  async getLeaderboardByTeacher(
    teacherId: string,
    period: 'daily' | 'weekly' | 'monthly' = 'weekly',
    date?: string,
    currentStudentId?: number,
  ): Promise<LeaderboardResponse> {
    const links = await this.prisma.teacherStudent.findMany({
      where: { teacherId },
      include: {
        student: { select: { id: true, name: true, grade: true } },
      },
    });

    const students = links.map((l) => ({
      id: Number(l.student.id),
      name: l.student.name,
      grade: l.student.grade,
    }));

    return this.calculateLeaderboard(students, period, date, currentStudentId);
  }

  /**
   * Hub 반 기준 리더보드
   */
  async getLeaderboardByHubGroup(
    groupId: string,
    period: 'daily' | 'weekly' | 'monthly' = 'weekly',
    date?: string,
    currentStudentId?: number,
    authHeader?: string,
  ): Promise<LeaderboardResponse> {
    try {
      const { data } = await axios.get(`${this.hubApiUrl}/api/groups/${groupId}/members`, {
        headers: authHeader ? { Authorization: authHeader } : undefined,
        timeout: 3000,
      });

      const hubUserIds: string[] = data?.members?.map((m: any) => m.hubUserId) || [];

      if (hubUserIds.length === 0) {
        return this.getEmptyLeaderboard(period, date);
      }

      // SP DB에서 Student 매핑
      const spStudents = await this.prisma.student.findMany({
        where: { userId: { in: hubUserIds } },
        select: { id: true, name: true, grade: true },
      });

      const students = spStudents.map((s) => ({
        id: Number(s.id),
        name: s.name,
        grade: s.grade,
      }));

      return this.calculateLeaderboard(students, period, date, currentStudentId);
    } catch (error) {
      this.logger.error(`Hub 그룹 멤버 조회 실패: ${(error as Error).message}`);
      return this.getEmptyLeaderboard(period, date);
    }
  }

  /**
   * 공통 리더보드 산출 로직
   */
  private async calculateLeaderboard(
    students: { id: number; name: string; grade: string | null }[],
    period: 'daily' | 'weekly' | 'monthly',
    date?: string,
    currentStudentId?: number,
  ): Promise<LeaderboardResponse> {
    if (students.length === 0) {
      return this.getEmptyLeaderboard(period, date);
    }

    const studentIds = students.map((s) => BigInt(s.id));
    const { start, end } = this.getDateRange(period, date);

    // 1. 현재 기간 점수 집계
    const currentScores = await this.aggregateScores(studentIds, start, end);

    // 2. 이전 기간 점수 집계 (순위 변동용)
    const prevRange = this.getPreviousDateRange(period, date);
    const prevScores = await this.aggregateScores(studentIds, prevRange.start, prevRange.end);
    const prevRankMap = this.buildRankMap(prevScores);

    // 3. 순위 산출
    const sorted = currentScores.sort((a, b) => b.totalScore - a.totalScore);
    const leaderboard: LeaderboardEntry[] = sorted.map((score, idx) => {
      const student = students.find((s) => s.id === score.studentId);
      const currentRank = idx + 1;
      const prevRank = prevRankMap.get(score.studentId) ?? null;
      const rankChange = prevRank !== null ? prevRank - currentRank : null;

      return {
        rank: currentRank,
        studentId: score.studentId,
        name: student?.name || '학생',
        grade: student?.grade || null,
        totalScore: score.totalScore,
        studyMinutes: score.studyMinutes,
        missionCount: score.missionCount,
        rankChange,
      };
    });

    const totalScoreSum = leaderboard.reduce((s, e) => s + e.totalScore, 0);
    const groupAverage =
      leaderboard.length > 0 ? Math.round((totalScoreSum / leaderboard.length) * 100) / 100 : 0;

    const myRank = currentStudentId
      ? (leaderboard.find((e) => e.studentId === currentStudentId)?.rank ?? null)
      : null;

    return {
      period,
      dateRange: { start, end },
      leaderboard,
      myRank,
      groupAverage,
      totalMembers: leaderboard.length,
    };
  }

  /**
   * 내 순위 요약 (대시보드 배지용)
   */
  async getMyRankSummary(memberId: string) {
    const result = await this.getMyLeaderboard(memberId, 'weekly');
    if (!result || result.myRank === null) {
      return { rank: null, totalMembers: 0, period: 'weekly' };
    }
    const myEntry = result.leaderboard.find((e) => e.rank === result.myRank);
    return {
      rank: result.myRank,
      totalMembers: result.totalMembers,
      totalScore: myEntry?.totalScore ?? 0,
      studyMinutes: myEntry?.studyMinutes ?? 0,
      rankChange: myEntry?.rankChange ?? null,
      period: 'weekly',
    };
  }

  // ─────────── Private Helpers ───────────

  private async findStudent(memberId: string) {
    const memberIdNum = parseInt(memberId, 10);
    if (!isNaN(memberIdNum)) {
      return this.prisma.student.findUnique({
        where: { id: BigInt(memberIdNum) },
        select: { id: true, name: true, grade: true },
      });
    }
    return this.prisma.student.findFirst({
      where: { userId: memberId },
      select: { id: true, name: true, grade: true },
    });
  }

  private async aggregateScores(studentIds: bigint[], startDate: string, endDate: string) {
    const scores = await this.prisma.dailyScore.findMany({
      where: {
        studentId: { in: studentIds },
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
    });

    const map = new Map<
      number,
      { totalScore: number; studyMinutes: number; missionCount: number }
    >();

    for (const s of scores) {
      const sid = Number(s.studentId);
      const entry = map.get(sid) || { totalScore: 0, studyMinutes: 0, missionCount: 0 };
      entry.totalScore += Number(s.totalScore);
      entry.studyMinutes += s.studyMinutes;
      entry.missionCount += s.missionCount;
      map.set(sid, entry);
    }

    for (const sid of studentIds) {
      const id = Number(sid);
      if (!map.has(id)) {
        map.set(id, { totalScore: 0, studyMinutes: 0, missionCount: 0 });
      }
    }

    return Array.from(map.entries()).map(([studentId, data]) => ({
      studentId,
      totalScore: Math.round(data.totalScore * 100) / 100,
      studyMinutes: data.studyMinutes,
      missionCount: data.missionCount,
    }));
  }

  private buildRankMap(scores: { studentId: number; totalScore: number }[]): Map<number, number> {
    const sorted = [...scores].sort((a, b) => b.totalScore - a.totalScore);
    const map = new Map<number, number>();
    sorted.forEach((s, idx) => map.set(s.studentId, idx + 1));
    return map;
  }

  private getDateRange(
    period: 'daily' | 'weekly' | 'monthly',
    dateStr?: string,
  ): { start: string; end: string } {
    const base = dateStr ? new Date(dateStr) : new Date();
    base.setHours(0, 0, 0, 0);

    if (period === 'daily') {
      const d = base.toISOString().split('T')[0];
      return { start: d, end: d };
    }

    if (period === 'weekly') {
      const day = base.getDay();
      const mondayOffset = day === 0 ? -6 : 1 - day;
      const monday = new Date(base);
      monday.setDate(base.getDate() + mondayOffset);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return {
        start: monday.toISOString().split('T')[0],
        end: sunday.toISOString().split('T')[0],
      };
    }

    const monthStart = new Date(base.getFullYear(), base.getMonth(), 1);
    const monthEnd = new Date(base.getFullYear(), base.getMonth() + 1, 0);
    return {
      start: monthStart.toISOString().split('T')[0],
      end: monthEnd.toISOString().split('T')[0],
    };
  }

  private getPreviousDateRange(
    period: 'daily' | 'weekly' | 'monthly',
    dateStr?: string,
  ): { start: string; end: string } {
    const base = dateStr ? new Date(dateStr) : new Date();
    base.setHours(0, 0, 0, 0);

    if (period === 'daily') {
      const prev = new Date(base);
      prev.setDate(prev.getDate() - 1);
      const d = prev.toISOString().split('T')[0];
      return { start: d, end: d };
    }

    if (period === 'weekly') {
      const day = base.getDay();
      const mondayOffset = day === 0 ? -6 : 1 - day;
      const thisMonday = new Date(base);
      thisMonday.setDate(base.getDate() + mondayOffset);
      const prevMonday = new Date(thisMonday);
      prevMonday.setDate(thisMonday.getDate() - 7);
      const prevSunday = new Date(prevMonday);
      prevSunday.setDate(prevMonday.getDate() + 6);
      return {
        start: prevMonday.toISOString().split('T')[0],
        end: prevSunday.toISOString().split('T')[0],
      };
    }

    const prevMonth = new Date(base.getFullYear(), base.getMonth() - 1, 1);
    const prevMonthEnd = new Date(base.getFullYear(), base.getMonth(), 0);
    return {
      start: prevMonth.toISOString().split('T')[0],
      end: prevMonthEnd.toISOString().split('T')[0],
    };
  }

  private getEmptyLeaderboard(
    period: 'daily' | 'weekly' | 'monthly',
    date?: string,
  ): LeaderboardResponse {
    return {
      period,
      dateRange: this.getDateRange(period, date),
      leaderboard: [],
      myRank: null,
      groupAverage: 0,
      totalMembers: 0,
    };
  }

  private async buildSoloLeaderboard(
    student: { id: bigint; name: string; grade: string | null },
    period: 'daily' | 'weekly' | 'monthly',
    date?: string,
  ): Promise<LeaderboardResponse> {
    const { start, end } = this.getDateRange(period, date);
    const scores = await this.aggregateScores([student.id], start, end);
    const myScore = scores[0] || { totalScore: 0, studyMinutes: 0, missionCount: 0 };

    return {
      period,
      dateRange: { start, end },
      leaderboard: [
        {
          rank: 1,
          studentId: Number(student.id),
          name: student.name,
          grade: student.grade,
          totalScore: myScore.totalScore,
          studyMinutes: myScore.studyMinutes,
          missionCount: myScore.missionCount,
          rankChange: null,
        },
      ],
      myRank: 1,
      groupAverage: myScore.totalScore,
      totalMembers: 1,
    };
  }
}
