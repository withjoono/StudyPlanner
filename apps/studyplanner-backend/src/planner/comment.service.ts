import { Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { UserRole } from '@prisma/client';

@Injectable()
export class CommentService {
  private readonly logger = new Logger(CommentService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 선생님 권한 검증: TeacherStudentSubject 기반
   * - 해당 교과에 대해 허용된 과목만 코멘트 가능
   */
  private async validateTeacherPermission(
    teacherId: string,
    studentId: bigint,
    subject?: string,
  ): Promise<void> {
    const link = await this.prisma.teacherStudent.findFirst({
      where: { teacherId, studentId },
      include: { managedSubjects: true },
    });

    if (!link) {
      throw new ForbiddenException('해당 학생과 연결되지 않았습니다.');
    }

    if (subject && link.managedSubjects.length > 0) {
      const hasPermission = link.managedSubjects.some(
        (ms) =>
          ms.isActive && (ms.allSubjects || ms.kyokwa === subject || ms.subjectName === subject),
      );
      if (!hasPermission) {
        throw new ForbiddenException(`'${subject}' 과목에 대한 코멘트 권한이 없습니다.`);
      }
    }
  }

  /**
   * 학부모 권한 검증: ParentStudent 연결 기반
   */
  private async validateParentPermission(parentId: string, studentId: bigint): Promise<void> {
    const link = await this.prisma.parentStudent.findFirst({
      where: { parentId, studentId },
    });
    if (!link) {
      throw new ForbiddenException('해당 학생과 연결되지 않았습니다.');
    }
  }

  /**
   * 코멘트 생성
   */
  async createComment(dto: {
    studentId: number;
    authorId: string;
    authorRole: UserRole;
    missionId?: number;
    routineId?: number;
    planId?: number;
    content: string;
    subject?: string;
    period?: string;
  }) {
    const studentBigInt = BigInt(dto.studentId);

    // 역할별 권한 검증
    if (dto.authorRole === UserRole.teacher) {
      await this.validateTeacherPermission(dto.authorId, studentBigInt, dto.subject);
    } else if (dto.authorRole === UserRole.parent) {
      await this.validateParentPermission(dto.authorId, studentBigInt);
    } else if (dto.authorRole === UserRole.student) {
      // 학생 본인 or 스터디그룹 멤버 확인
      const student = await this.prisma.student.findFirst({
        where: { id: studentBigInt },
      });
      if (!student || student.userId !== dto.authorId) {
        // 본인 플래너가 아닌 경우 → 스터디그룹 연결 확인 (향후 확장)
        this.logger.warn(
          `Student ${dto.authorId} tried to comment on student ${dto.studentId}'s planner`,
        );
        throw new ForbiddenException('해당 학생의 플래너에 코멘트 권한이 없습니다.');
      }
    }

    const comment = await this.prisma.plannerComment.create({
      data: {
        studentId: studentBigInt,
        authorId: dto.authorId,
        authorRole: dto.authorRole,
        missionId: dto.missionId ? BigInt(dto.missionId) : null,
        routineId: dto.routineId ? BigInt(dto.routineId) : null,
        planId: dto.planId ? BigInt(dto.planId) : null,
        content: dto.content,
        subject: dto.subject,
        period: dto.period,
      },
      include: {
        author: { select: { id: true, name: true, role: true, avatarUrl: true } },
      },
    });

    return this.serializeComment(comment);
  }

  /**
   * 코멘트 목록 조회 (필터: studentId, missionId, routineId, planId)
   */
  async getComments(filters: {
    studentId?: number;
    missionId?: number;
    routineId?: number;
    planId?: number;
    period?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters.studentId) where.studentId = BigInt(filters.studentId);
    if (filters.missionId) where.missionId = BigInt(filters.missionId);
    if (filters.routineId) where.routineId = BigInt(filters.routineId);
    if (filters.planId) where.planId = BigInt(filters.planId);
    if (filters.period) where.period = filters.period;

    const [comments, total] = await Promise.all([
      this.prisma.plannerComment.findMany({
        where,
        include: {
          author: { select: { id: true, name: true, role: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: filters.limit || 50,
        skip: filters.offset || 0,
      }),
      this.prisma.plannerComment.count({ where }),
    ]);

    return {
      comments: comments.map((c) => this.serializeComment(c)),
      total,
    };
  }

  /**
   * 읽음 처리
   */
  async markAsRead(commentId: number) {
    const comment = await this.prisma.plannerComment.update({
      where: { id: BigInt(commentId) },
      data: { isRead: true },
    });
    return this.serializeComment(comment);
  }

  /**
   * 읽지 않은 코멘트 수
   */
  async getUnreadCount(studentId: number) {
    const count = await this.prisma.plannerComment.count({
      where: {
        studentId: BigInt(studentId),
        isRead: false,
      },
    });
    return { unreadCount: count };
  }

  /**
   * 최근 읽지 않은 코멘트 (대시보드용)
   */
  async getRecentUnread(studentId: number, limit: number = 3) {
    const comments = await this.prisma.plannerComment.findMany({
      where: {
        studentId: BigInt(studentId),
        isRead: false,
      },
      include: {
        author: { select: { id: true, name: true, role: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return comments.map((c) => this.serializeComment(c));
  }

  private serializeComment(comment: any) {
    return {
      id: Number(comment.id),
      studentId: Number(comment.studentId),
      authorId: comment.authorId,
      authorRole: comment.authorRole,
      missionId: comment.missionId ? Number(comment.missionId) : null,
      routineId: comment.routineId ? Number(comment.routineId) : null,
      planId: comment.planId ? Number(comment.planId) : null,
      content: comment.content,
      subject: comment.subject,
      period: comment.period,
      isRead: comment.isRead,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      author: comment.author || null,
    };
  }
}
