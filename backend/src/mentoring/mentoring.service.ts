import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSessionDto } from './dto/create-session.dto';

@Injectable()
export class MentoringService {
  constructor(private readonly prisma: PrismaService) {}

  private serialize(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'bigint') return Number(obj);
    if (obj instanceof Date) return obj.toISOString();
    if (Array.isArray(obj)) return obj.map((v) => this.serialize(v));
    if (typeof obj === 'object') {
      const result: any = {};
      for (const key of Object.keys(obj)) result[key] = this.serialize(obj[key]);
      return result;
    }
    return obj;
  }

  /** 주간 날짜 범위 계산 (해당 주 월요일~일요일) */
  private getWeekRange(dateStr?: string): { start: Date; end: Date } {
    const ref = dateStr ? new Date(dateStr) : new Date();
    const day = ref.getDay(); // 0=Sun
    const diff = day === 0 ? -6 : 1 - day; // 월요일 기준
    const start = new Date(ref);
    start.setDate(ref.getDate() + diff);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  /** teacherStudentId 조회 및 선생님 권한 검증 */
  private async getTeacherStudentLink(teacherUserId: string, studentId: number) {
    const link = await this.prisma.teacherStudent.findUnique({
      where: {
        uk_teacher_student: { teacherId: teacherUserId, studentId: BigInt(studentId) },
      },
    });
    if (!link) throw new ForbiddenException('해당 학생에 대한 접근 권한이 없습니다.');
    return link;
  }

  // ================================================================
  // 선생님: 주간 검사 요약 자동 생성
  // ================================================================

  async getInspectionSummary(teacherUserId: string, studentId: number, week?: string) {
    const link = await this.getTeacherStudentLink(teacherUserId, studentId);
    const { start, end } = this.getWeekRange(week);

    const student = await this.prisma.student.findUnique({
      where: { id: BigInt(studentId) },
      select: { id: true, name: true, grade: true, schoolName: true, studentCode: true },
    });
    if (!student) throw new NotFoundException('학생을 찾을 수 없습니다.');

    // 주간 미션 집계
    const missions = await this.prisma.dailyMission.findMany({
      where: { studentId: BigInt(studentId), date: { gte: start, lte: end } },
    });
    const totalMissions = missions.length;
    const completedMissions = missions.filter((m) => m.status === 'completed').length;
    const missionRate =
      totalMissions > 0 ? Math.round((completedMissions / totalMissions) * 100) : 0;

    // 과목별 달성률
    const subjectMap: Record<string, { total: number; done: number }> = {};
    for (const m of missions) {
      if (!m.subject) continue;
      if (!subjectMap[m.subject]) subjectMap[m.subject] = { total: 0, done: 0 };
      subjectMap[m.subject].total++;
      if (m.status === 'completed') subjectMap[m.subject].done++;
    }
    const subjectStats = Object.entries(subjectMap).map(([subject, { total, done }]) => ({
      subject,
      total,
      done,
      rate: total > 0 ? Math.round((done / total) * 100) : 0,
    }));

    // 주간 학습 점수 집계
    const dailyScores = await this.prisma.dailyScore.findMany({
      where: { studentId: BigInt(studentId), date: { gte: start, lte: end } },
      orderBy: { date: 'asc' },
    });
    const totalScore = dailyScores.reduce((sum, s) => sum + Number(s.totalScore), 0);
    const studyMinutes = dailyScores.reduce((sum, s) => sum + s.studyMinutes, 0);

    // 직전 주와 비교
    const prevStart = new Date(start);
    prevStart.setDate(prevStart.getDate() - 7);
    const prevEnd = new Date(end);
    prevEnd.setDate(prevEnd.getDate() - 7);
    const prevScores = await this.prisma.dailyScore.findMany({
      where: { studentId: BigInt(studentId), date: { gte: prevStart, lte: prevEnd } },
    });
    const prevMinutes = prevScores.reduce((sum, s) => sum + s.studyMinutes, 0);
    const prevScore = prevScores.reduce((sum, s) => sum + Number(s.totalScore), 0);

    // 인증사진
    const photos = await this.prisma.verificationPhoto.findMany({
      where: { studentId: BigInt(studentId), createdAt: { gte: start, lte: end } },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, photoUrl: true, createdAt: true },
    });

    // 학생 회고 (이번 주)
    const reflections = await this.prisma.dailyReflection.findMany({
      where: { studentId: BigInt(studentId), date: { gte: start, lte: end } },
      orderBy: { date: 'desc' },
      take: 7,
    });

    // 기존 멘토링 세션 (이번 주에 이미 작성했으면 불러오기)
    const existingSession = await this.prisma.mentoringSession.findUnique({
      where: { uk_mentoring_session: { teacherStudentId: link.id, weekStart: start } },
    });

    return this.serialize({
      student,
      week: {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
      },
      stats: {
        missionRate,
        totalMissions,
        completedMissions,
        totalScore: Math.round(totalScore),
        studyMinutes,
        studyMinutesDelta: studyMinutes - prevMinutes,
        scoreDelta: Math.round(totalScore - prevScore),
      },
      subjectStats,
      photos: photos.map((p) => ({ id: Number(p.id), url: p.photoUrl, at: p.createdAt })),
      reflections: reflections.map((r) => ({
        date: r.date,
        mood: r.mood,
        goodPoints: r.goodPoints,
        badPoints: r.badPoints,
        tomorrowPlan: r.tomorrowPlan,
      })),
      existingSession: existingSession ? this.serialize(existingSession) : null,
    });
  }

  // ================================================================
  // 선생님: 멘토링 세션 저장
  // ================================================================

  async createOrUpdateSession(teacherUserId: string, studentId: number, dto: CreateSessionDto) {
    const link = await this.getTeacherStudentLink(teacherUserId, studentId);
    const weekStart = new Date(dto.weekStart);
    const weekEnd = new Date(dto.weekEnd);

    const session = await this.prisma.mentoringSession.upsert({
      where: { uk_mentoring_session: { teacherStudentId: link.id, weekStart } },
      update: {
        weekEnd,
        checklist: dto.checklist ?? undefined,
        grade: dto.grade,
        subjectComments: dto.subjectComments ?? undefined,
        overallComment: dto.overallComment,
        nextWeekTask: dto.nextWeekTask,
        studentAcked: false, // 수정 시 확인 초기화
        studentAckedAt: null,
      },
      create: {
        teacherStudentId: link.id,
        weekStart,
        weekEnd,
        checklist: dto.checklist ?? undefined,
        grade: dto.grade,
        subjectComments: dto.subjectComments ?? undefined,
        overallComment: dto.overallComment,
        nextWeekTask: dto.nextWeekTask,
      },
    });

    return this.serialize(session);
  }

  // ================================================================
  // 선생님: 멘토링 대시보드 (학생별 주간 검사 현황)
  // ================================================================

  async getTeacherDashboard(teacherUserId: string, week?: string) {
    const { start, end } = this.getWeekRange(week);

    const links = await this.prisma.teacherStudent.findMany({
      where: { teacherId: teacherUserId },
      include: {
        student: {
          select: { id: true, name: true, grade: true, studentCode: true },
        },
        mentoringSessions: {
          where: { weekStart: start },
          take: 1,
        },
      },
    });

    const summaries = await Promise.all(
      links.map(async (link) => {
        const missions = await this.prisma.dailyMission.findMany({
          where: { studentId: link.studentId, date: { gte: start, lte: end } },
        });
        const total = missions.length;
        const done = missions.filter((m) => m.status === 'completed').length;
        const scores = await this.prisma.dailyScore.findMany({
          where: { studentId: link.studentId, date: { gte: start, lte: end } },
        });
        const studyMinutes = scores.reduce((sum, s) => sum + s.studyMinutes, 0);
        const session = link.mentoringSessions[0] ?? null;

        return {
          studentId: Number(link.studentId),
          studentName: link.student.name,
          grade: link.student.grade,
          missionRate: total > 0 ? Math.round((done / total) * 100) : 0,
          studyMinutes,
          sessionDone: session !== null,
          sessionGrade: session?.grade ?? null,
          sessionId: session ? Number(session.id) : null,
        };
      }),
    );

    // 위험 학생 (달성률 50% 미만) 상단
    summaries.sort((a, b) => {
      if (a.sessionDone !== b.sessionDone) return a.sessionDone ? 1 : -1;
      return a.missionRate - b.missionRate;
    });

    return {
      week: { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] },
      total: summaries.length,
      done: summaries.filter((s) => s.sessionDone).length,
      atRisk: summaries.filter((s) => !s.sessionDone && s.missionRate < 50).length,
      students: summaries,
    };
  }

  // ================================================================
  // 공통: 멘토링 이력 조회
  // ================================================================

  async getSessions(callerId: string, role: 'teacher' | 'student', studentId?: number, limit = 12) {
    let where: any = {};

    if (role === 'teacher') {
      if (!studentId) throw new ForbiddenException('studentId required for teacher');
      const link = await this.getTeacherStudentLink(callerId, studentId);
      where = { teacherStudentId: link.id };
    } else {
      // 학생 본인의 세션들
      const student = await this.prisma.student.findFirst({
        where: { userId: callerId },
      });
      if (!student) return [];
      const links = await this.prisma.teacherStudent.findMany({
        where: { studentId: student.id },
        select: { id: true, teacherId: true },
      });
      if (links.length === 0) return [];
      where = { teacherStudentId: { in: links.map((l) => l.id) } };
    }

    const sessions = await this.prisma.mentoringSession.findMany({
      where,
      orderBy: { weekStart: 'desc' },
      take: limit,
      include: {
        teacherStudent: {
          include: {
            student: { select: { name: true, grade: true } },
          },
        },
      },
    });

    return this.serialize(sessions);
  }

  // ================================================================
  // 학생: 미확인 피드백 수
  // ================================================================

  async getUnreadCount(studentUserId: string) {
    const student = await this.prisma.student.findFirst({
      where: { userId: studentUserId },
    });
    if (!student) return { unreadCount: 0 };

    const links = await this.prisma.teacherStudent.findMany({
      where: { studentId: student.id },
      select: { id: true },
    });
    if (links.length === 0) return { unreadCount: 0 };

    const count = await this.prisma.mentoringSession.count({
      where: {
        teacherStudentId: { in: links.map((l) => l.id) },
        studentAcked: false,
        overallComment: { not: null },
      },
    });

    return { unreadCount: count };
  }

  // ================================================================
  // 학생: 피드백 확인(Ack)
  // ================================================================

  async ackSession(studentUserId: string, sessionId: number) {
    const session = await this.prisma.mentoringSession.findUnique({
      where: { id: BigInt(sessionId) },
      include: { teacherStudent: { select: { studentId: true } } },
    });
    if (!session) throw new NotFoundException('세션을 찾을 수 없습니다.');

    const student = await this.prisma.student.findFirst({
      where: { userId: studentUserId },
    });
    if (!student || student.id !== session.teacherStudent.studentId) {
      throw new ForbiddenException('접근 권한이 없습니다.');
    }

    await this.prisma.mentoringSession.update({
      where: { id: BigInt(sessionId) },
      data: { studentAcked: true, studentAckedAt: new Date() },
    });

    return { ok: true };
  }
}
