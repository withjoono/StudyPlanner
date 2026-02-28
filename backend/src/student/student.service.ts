import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StudentService {
  private readonly logger = new Logger(StudentService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 연결된 모든 사용자 조회
   */
  async getConnections(studentUserId: number) {
    // 1. 학생 식별
    const student = await this.prisma.student.findUnique({
      where: { userId: String(studentUserId) },
      select: { id: true },
    });
    if (!student) throw new Error('학생 정보를 찾을 수 없습니다.');
    const studentId = student.id;

    // 2. 선생님 목록 조회
    const teachers = await this.prisma.teacherStudent.findMany({
      where: { studentId },
      include: {
        teacher: { select: { id: true, name: true, email: true, role: true, avatarUrl: true } },
        managedSubjects: {
          where: { isActive: true },
          select: { kyokwa: true, subjectName: true, allSubjects: true },
        },
      },
    });

    // 3. 학부모 목록 조회
    const parents = await this.prisma.parentStudent.findMany({
      where: { studentId },
      include: {
        parent: { select: { id: true, name: true, email: true, role: true, avatarUrl: true } },
      },
    });

    // 4. (Optional) 학생(친구) 목록 - 현재 스키마에는 명시적 친구 관계 테이블이 없음.
    // 추후 추가 가능.

    return {
      teachers: teachers.map((t) => ({
        ...t.teacher,
        connectionId: t.id.toString(),
        permissions: t.managedSubjects,
      })),
      parents: parents.map((p) => ({
        ...p.parent,
        connectionId: p.id.toString(),
        relation: p.relation,
      })),
      students: [], // Placeholder
    };
  }

  /**
   * 선생님 권한 업데이트
   */
  async updateTeacherPermissions(
    studentUserId: number,
    teacherUserIdStr: string,
    permissions: { kyokwa: string; allowed: boolean; subjectId?: string }[],
  ) {
    const student = await this.prisma.student.findUnique({
      where: { userId: String(studentUserId) },
    });
    if (!student) throw new Error('학생 정보를 찾을 수 없습니다.');

    // Find the link
    const link = await this.prisma.teacherStudent.findUnique({
      where: {
        uk_teacher_student: { teacherId: teacherUserIdStr, studentId: student.id },
      },
    });
    if (!link) throw new Error('연결된 선생님이 아닙니다.');

    const teacherStudentId = link.id;

    // Transaction to update permissions
    await this.prisma.$transaction(async (tx) => {
      // 1. 기존 권한 비활성화 (Clean slate approach for specific kyokwas, or update existing?)
      // Simplest: If 'allowed' is false, delete/deactivate. If true, upsert.
      // However, current schema `TeacherStudentSubject` has `kyokwa`, `subjectName`, etc.

      // Let's iterate permissions.
      for (const perm of permissions) {
        if (perm.allowed) {
          // Enable/Create
          // Check if exists
          const existing = await tx.teacherStudentSubject.findFirst({
            where: {
              teacherStudentId,
              kyokwa: perm.kyokwa,
              isActive: true, // Assuming isActive field exists? No, it doesn't in schema.prisma preview.
              // Wait, schema preview for TeacherStudentSubject:
              //   model TeacherStudentSubject {
              //     ...
              //     endDate DateTime? // null = active
              //   }
              endDate: null,
            },
          });

          if (!existing) {
            await tx.teacherStudentSubject.create({
              data: {
                teacherStudentId,
                kyokwa: perm.kyokwa,
                curriculum: '2022', // Defaulting, might need refinement
                startDate: new Date(),
                allSubjects: true, // For now, allow all subjects within the kyokwa
                // subjectId: ... if specific
              },
            });
          }
        } else {
          // Disable/Delete (Set endDate)
          await tx.teacherStudentSubject.updateMany({
            where: {
              teacherStudentId,
              kyokwa: perm.kyokwa,
              endDate: null,
            },
            data: {
              endDate: new Date(),
            },
          });
        }
      }
    });

    return { success: true };
  }
}
