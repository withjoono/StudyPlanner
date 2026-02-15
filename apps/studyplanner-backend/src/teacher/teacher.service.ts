import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * 선생님용 서비스
 * 담당 학생 관리, 미션 조정, 성적 입력
 */
@Injectable()
export class TeacherService {
  private readonly logger = new Logger(TeacherService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** 담당 학생 목록 */
  async getStudents(teacherUserId: number) {
    const links = await this.prisma.teacherStudent.findMany({
      where: { teacherId: String(teacherUserId) },
      include: {
        student: {
          select: {
            id: true,
            studentCode: true,
            name: true,
            schoolName: true,
            grade: true,
            schoolLevel: true,
            phone: true,
            parentPhone: true,
          },
        },
      },
    });
    return links.map((l: any) => ({
      ...this.serialize(l.student),
      subject: l.subject,
    }));
  }

  /** 학생 추가 (학생코드로) */
  async addStudent(teacherUserId: number, studentCode: string, subject?: string) {
    const student = await this.prisma.student.findUnique({
      where: { studentCode },
    });
    if (!student) throw new Error('해당 학생을 찾을 수 없습니다.');

    const link = await this.prisma.teacherStudent.create({
      data: {
        teacherId: String(teacherUserId),
        studentId: student.id,
        subject,
      },
    });
    return this.serialize(link);
  }

  /** 학생 제거 */
  async removeStudent(teacherUserId: number, studentId: number) {
    await this.prisma.teacherStudent.deleteMany({
      where: {
        teacherId: String(teacherUserId),
        studentId: BigInt(studentId),
      },
    });
    return { success: true };
  }

  /** 학생 상세 (대시보드) */
  async getStudentDetail(teacherUserId: number, studentId: number) {
    await this.verifyTeacherAccess(teacherUserId, studentId);

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const student = await this.prisma.student.findUnique({
      where: { id: BigInt(studentId) },
      select: {
        id: true,
        name: true,
        studentCode: true,
        schoolName: true,
        grade: true,
        schoolLevel: true,
      },
    });

    // 오늘 미션
    const todayMissions = await this.prisma.dailyMission.findMany({
      where: { studentId: BigInt(studentId), date: new Date(todayStr) },
    });
    const totalMissions = todayMissions.length;
    const completedMissions = todayMissions.filter((m) => m.status === 'completed').length;

    // 최근 7일 점수
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentScores = await this.prisma.dailyScore.findMany({
      where: { studentId: BigInt(studentId), date: { gte: weekAgo } },
      orderBy: { date: 'asc' },
    });

    return {
      student: this.serialize(student),
      today: {
        totalMissions,
        completedMissions,
        completionRate:
          totalMissions > 0 ? Math.round((completedMissions / totalMissions) * 100) : 0,
      },
      weeklyScores: recentScores.map(this.serialize),
    };
  }

  /** 학생 미션 목록 */
  async getStudentMissions(teacherUserId: number, studentId: number, date?: string) {
    await this.verifyTeacherAccess(teacherUserId, studentId);

    const targetDate = date ? new Date(date) : new Date();
    const dateStr = targetDate.toISOString().split('T')[0];

    const missions = await this.prisma.dailyMission.findMany({
      where: { studentId: BigInt(studentId), date: new Date(dateStr) },
      orderBy: { startTime: 'asc' },
    });

    return missions.map(this.serialize);
  }

  /** 학생 미션 생성 (선생님이 직접) */
  async createMission(
    teacherUserId: number,
    studentId: number,
    data: {
      date: string;
      subject?: string;
      content?: string;
      startTime?: string;
      endTime?: string;
      amount?: number;
    },
  ) {
    await this.verifyTeacherAccess(teacherUserId, studentId);

    const missionCode = `T-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const mission = await this.prisma.dailyMission.create({
      data: {
        missionCode,
        studentId: BigInt(studentId),
        date: new Date(data.date),
        subject: data.subject,
        content: data.content,
        startTime: data.startTime ? new Date(`1970-01-01T${data.startTime}`) : undefined,
        endTime: data.endTime ? new Date(`1970-01-01T${data.endTime}`) : undefined,
        amount: data.amount,
        status: 'added',
        category: 'study',
      },
    });

    return this.serialize(mission);
  }

  /** 학생 인증사진 조회 */
  async getStudentPhotos(teacherUserId: number, studentId: number, limit: number = 20) {
    await this.verifyTeacherAccess(teacherUserId, studentId);

    const photos = await this.prisma.verificationPhoto.findMany({
      where: {
        missionResult: { studentId: BigInt(studentId) },
      },
      include: {
        missionResult: {
          select: {
            id: true,
            completedDate: true,
            mission: { select: { subject: true, content: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return photos.map(this.serialize);
  }

  /** 전체 학생 요약 (선생님 대시보드) */
  async getDashboard(teacherUserId: number) {
    const students = await this.getStudents(teacherUserId);

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const summaries = await Promise.all(
      students.map(async (student: any) => {
        const missions = await this.prisma.dailyMission.findMany({
          where: { studentId: BigInt(student.id), date: new Date(todayStr) },
        });
        const total = missions.length;
        const completed = missions.filter((m) => m.status === 'completed').length;

        return {
          studentId: student.id,
          studentName: student.name,
          grade: student.grade,
          subject: student.subject,
          totalMissions: total,
          completedMissions: completed,
          completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        };
      }),
    );

    const totalStudents = summaries.length;
    const atRisk = summaries.filter((s: any) => s.completionRate < 50).length;

    return {
      totalStudents,
      atRiskStudents: atRisk,
      avgCompletionRate:
        totalStudents > 0
          ? Math.round(
              summaries.reduce((sum: number, s: any) => sum + s.completionRate, 0) / totalStudents,
            )
          : 0,
      students: summaries,
    };
  }

  private async verifyTeacherAccess(teacherUserId: number, studentId: number) {
    const link = await this.prisma.teacherStudent.findUnique({
      where: {
        uk_teacher_student: { teacherId: String(teacherUserId), studentId: BigInt(studentId) },
      },
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
      } else if (
        result[key] &&
        typeof result[key] === 'object' &&
        !Array.isArray(result[key]) &&
        !(result[key] instanceof Date)
      ) {
        result[key] = this.serialize(result[key]);
      }
    }
    return result;
  }
}
