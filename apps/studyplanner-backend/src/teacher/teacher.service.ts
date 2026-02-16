import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * 선생님용 서비스
 * 담당 학생 관리, 과목별 관리, 미션 조정, 코멘트
 */
@Injectable()
export class TeacherService {
  private readonly logger = new Logger(TeacherService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ================================================================
  // Curriculum Helper
  // ================================================================

  /** 사용자 ID prefix 기반 교육과정 판별 */
  private getCurriculum(userId: string): '2015' | '2022' {
    const idBody = userId.startsWith('sp_') ? userId.substring(3) : userId;
    const prefix = idBody.substring(0, 4).toUpperCase();
    if (['26H3', '26H4', '26H0'].includes(prefix)) return '2015';
    return '2022';
  }

  /** 사용 가능한 교과/과목 목록 조회 (사용자 ID 기반) */
  async getAvailableSubjects(userId: string) {
    const curriculum = this.getCurriculum(userId);
    const tableName = curriculum === '2015' ? 'hub_2015_kyokwa_subject' : 'hub_2022_kyokwa_subject';

    const subjects = (await this.prisma.$queryRawUnsafe(`
      SELECT id, kyokwa, kyokwa_code, classification, classification_code,
             subject_name, subject_code, evaluation_method
      FROM ${tableName}
      ORDER BY kyokwa_code, classification_code, subject_code
    `)) as any[];

    // 교과별 그룹핑
    const grouped: Record<string, { kyokwa: string; kyokwaCode: string; subjects: any[] }> = {};
    for (const s of subjects) {
      const key = s.kyokwa_code || 'etc';
      if (!grouped[key]) {
        grouped[key] = { kyokwa: s.kyokwa, kyokwaCode: key, subjects: [] };
      }
      grouped[key].subjects.push({
        id: s.id,
        subjectName: s.subject_name,
        subjectCode: s.subject_code,
        classification: s.classification,
        classificationCode: s.classification_code,
        evaluationMethod: s.evaluation_method,
      });
    }

    return {
      curriculum,
      groups: Object.values(grouped),
    };
  }

  // ================================================================
  // 담당 학생 관리
  // ================================================================

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
        managedSubjects: {
          where: { isActive: true },
          select: {
            id: true,
            kyokwa: true,
            kyokwaCode: true,
            subjectName: true,
            subjectId: true,
            allSubjects: true,
            curriculum: true,
            startDate: true,
            endDate: true,
          },
        },
      },
    });
    return links.map((l: any) => ({
      ...this.serialize(l.student),
      teacherStudentId: Number(l.id),
      managedSubjects: l.managedSubjects.map(this.serialize),
    }));
  }

  /** 학생 추가 (학생코드로) */
  async addStudent(teacherUserId: number, studentCode: string) {
    const student = await this.prisma.student.findUnique({
      where: { studentCode },
    });
    if (!student) throw new Error('해당 학생을 찾을 수 없습니다.');

    const link = await this.prisma.teacherStudent.create({
      data: {
        teacherId: String(teacherUserId),
        studentId: student.id,
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

  // ================================================================
  // 과목 관리
  // ================================================================

  /** 학생에게 관리 과목 추가 */
  async addStudentSubject(
    teacherStudentId: number,
    data: {
      kyokwa?: string;
      kyokwaCode?: string;
      subjectName?: string;
      subjectId?: string;
      allSubjects?: boolean;
      curriculum: string;
      startDate: string;
      endDate?: string;
    },
  ) {
    const subject = await this.prisma.teacherStudentSubject.create({
      data: {
        teacherStudentId: BigInt(teacherStudentId),
        kyokwa: data.kyokwa,
        kyokwaCode: data.kyokwaCode,
        subjectName: data.subjectName,
        subjectId: data.subjectId,
        allSubjects: data.allSubjects || false,
        curriculum: data.curriculum,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
    });
    return this.serialize(subject);
  }

  /** 관리 과목 제거 */
  async removeStudentSubject(subjectId: number) {
    await this.prisma.teacherStudentSubject.delete({
      where: { id: BigInt(subjectId) },
    });
    return { success: true };
  }

  /** 관리 과목 목록 조회 */
  async getStudentSubjects(teacherStudentId: number) {
    const subjects = await this.prisma.teacherStudentSubject.findMany({
      where: { teacherStudentId: BigInt(teacherStudentId), isActive: true },
      orderBy: { createdAt: 'asc' },
    });
    return subjects.map(this.serialize);
  }

  // ================================================================
  // 코멘트 (선생님 ↔ 학생)
  // ================================================================

  /** 코멘트 목록 조회 */
  async getComments(teacherStudentId: number, limit: number = 50) {
    const comments = await this.prisma.teacherStudentComment.findMany({
      where: { teacherStudentId: BigInt(teacherStudentId) },
      include: {
        author: { select: { id: true, name: true, role: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return comments.map(this.serialize);
  }

  /** 코멘트 작성 */
  async addComment(teacherStudentId: number, authorId: string, content: string) {
    const comment = await this.prisma.teacherStudentComment.create({
      data: {
        teacherStudentId: BigInt(teacherStudentId),
        authorId,
        content,
      },
      include: {
        author: { select: { id: true, name: true, role: true, avatarUrl: true } },
      },
    });
    return this.serialize(comment);
  }

  /** 코멘트 읽음 처리 */
  async markCommentsRead(teacherStudentId: number, readerId: string) {
    await this.prisma.teacherStudentComment.updateMany({
      where: {
        teacherStudentId: BigInt(teacherStudentId),
        authorId: { not: readerId },
        isRead: false,
      },
      data: { isRead: true },
    });
    return { success: true };
  }

  // ================================================================
  // 학생 상세 & 미션 (기존)
  // ================================================================

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
          managedSubjects: student.managedSubjects,
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

  // ================================================================
  // Helpers
  // ================================================================

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
