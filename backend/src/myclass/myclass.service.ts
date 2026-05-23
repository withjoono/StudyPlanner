import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AcornService } from '../acorn/acorn.service';

/**
 * 마이 클래스(StudyRoom) 서비스
 *
 * - 학생이 직접 경쟁 반을 생성
 * - SNS 초대 코드로 친구를 초대
 * - 학생 직접 초대 (검색 → 초대장 발송 → 수락/거절)
 * - 방 내 주간 랭킹 경쟁
 * - 생성/초대 시 도토리 보상
 */

@Injectable()
export class MyClassService {
  private readonly logger = new Logger(MyClassService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly acornService: AcornService,
  ) {}

  /**
   * 내가 속한 마이 클래스 목록 조회
   */
  async getMyRooms(memberId: string) {
    const student = await this.findStudent(memberId);
    if (!student) return [];

    const memberships = await this.prisma.studyRoomMember.findMany({
      where: { studentId: student.id, isActive: true },
      include: {
        room: {
          include: {
            owner: { select: { id: true, name: true } },
            _count: { select: { members: { where: { isActive: true } } } },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    return memberships.map((m) => ({
      ...this.serialize(m.room),
      memberCount: m.room._count.members,
      ownerName: m.room.owner.name,
      myRole: m.role,
      joinedAt: m.joinedAt,
    }));
  }

  /**
   * 마이 클래스 상세 (멤버 목록 포함)
   */
  async getRoomDetail(roomId: number, memberId: string) {
    const student = await this.findStudent(memberId);
    if (!student) throw new NotFoundException('학생 정보를 찾을 수 없습니다.');

    const room = await this.prisma.studyRoom.findUnique({
      where: { id: BigInt(roomId) },
      include: {
        owner: { select: { id: true, name: true, grade: true } },
        members: {
          where: { isActive: true },
          include: {
            student: { select: { id: true, name: true, grade: true } },
          },
          orderBy: { joinedAt: 'asc' },
        },
      },
    });

    if (!room) throw new NotFoundException('마이 클래스를 찾을 수 없습니다.');

    // 멤버인지 확인
    const isMember = room.members.some((m) => m.studentId === student.id);
    if (!isMember && !room.isPublic) {
      throw new ForbiddenException('이 클래스의 멤버가 아닙니다.');
    }

    return {
      ...this.serialize(room),
      ownerName: room.owner.name,
      members: room.members.map((m) => ({
        id: Number(m.student.id),
        name: m.student.name,
        grade: m.student.grade,
        role: m.role,
        joinedAt: m.joinedAt,
      })),
      memberCount: room.members.length,
      isMember,
      isOwner: room.ownerId === student.id,
    };
  }

  /**
   * 마이 클래스 생성
   */
  async createRoom(
    memberId: string,
    data: {
      name: string;
      description?: string;
      subject?: string;
      isPublic?: boolean;
      weeklyGoal?: number;
    },
  ) {
    const student = await this.findOrCreateStudent(memberId);
    if (!student) throw new NotFoundException('학생 정보를 찾을 수 없습니다.');

    // 초대 코드 생성
    const roomCode = await this.generateRoomCode();

    const room = await this.prisma.$transaction(async (tx) => {
      // 1. 방 생성
      const newRoom = await tx.studyRoom.create({
        data: {
          roomCode,
          name: data.name,
          description: data.description,
          subject: data.subject,
          ownerId: student.id,
          isPublic: data.isPublic ?? false,
          weeklyGoal: data.weeklyGoal,
        },
      });

      // 2. 방장을 멤버로 추가
      await tx.studyRoomMember.create({
        data: {
          roomId: newRoom.id,
          studentId: student.id,
          role: 'owner',
        },
      });

      return newRoom;
    });

    // 3. 도토리 보상 (방 생성 — 1회)
    const acornResult = await this.acornService.earn(memberId, 'class_create');

    this.logger.log(`🏠 MyClass created: "${data.name}" (${roomCode}) by student=${memberId}`);

    return {
      ...this.serialize(room),
      acorn: acornResult,
    };
  }

  /**
   * 초대 코드로 방 정보 조회 (가입 전 미리보기)
   */
  async getRoomByCode(code: string) {
    const room = await this.prisma.studyRoom.findUnique({
      where: { roomCode: code.toUpperCase() },
      include: {
        owner: { select: { name: true } },
        _count: { select: { members: { where: { isActive: true } } } },
      },
    });

    if (!room || !room.isActive) {
      throw new NotFoundException('존재하지 않는 초대 코드입니다.');
    }

    return {
      id: Number(room.id),
      roomCode: room.roomCode,
      name: room.name,
      description: room.description,
      subject: room.subject,
      ownerName: room.owner.name,
      memberCount: room._count.members,
      maxMembers: room.maxMembers,
      weeklyGoal: room.weeklyGoal,
      isPublic: room.isPublic,
    };
  }

  /**
   * 초대 코드로 마이 클래스 가입
   */
  async joinRoom(memberId: string, code: string, inviterId?: string) {
    const student = await this.findOrCreateStudent(memberId);
    if (!student) throw new NotFoundException('학생 정보를 찾을 수 없습니다.');

    const room = await this.prisma.studyRoom.findUnique({
      where: { roomCode: code.toUpperCase() },
      include: {
        _count: { select: { members: { where: { isActive: true } } } },
      },
    });

    if (!room || !room.isActive) {
      throw new NotFoundException('존재하지 않는 초대 코드입니다.');
    }

    // 정원 체크
    if (room._count.members >= room.maxMembers) {
      throw new BadRequestException('이 클래스는 이미 정원이 찼습니다.');
    }

    // 이미 멤버인지 체크
    const existing = await this.prisma.studyRoomMember.findUnique({
      where: { uk_room_member: { roomId: room.id, studentId: student.id } },
    });

    if (existing) {
      if (existing.isActive) {
        throw new BadRequestException('이미 참여 중인 클래스입니다.');
      }
      // 비활성 → 재활성
      await this.prisma.studyRoomMember.update({
        where: { id: existing.id },
        data: { isActive: true },
      });
    } else {
      await this.prisma.studyRoomMember.create({
        data: {
          roomId: room.id,
          studentId: student.id,
          role: 'member',
        },
      });
    }

    // 초대한 사람에게 도토리 보상
    if (inviterId) {
      await this.acornService.earn(inviterId, 'invite', memberId);
    }

    this.logger.log(`🤝 MyClass join: student=${memberId} → room="${room.name}" (${code})`);

    return {
      success: true,
      roomId: Number(room.id),
      roomName: room.name,
    };
  }

  /**
   * 마이 클래스 나가기
   */
  async leaveRoom(memberId: string, roomId: number) {
    const student = await this.findStudent(memberId);
    if (!student) throw new NotFoundException('학생 정보를 찾을 수 없습니다.');

    const room = await this.prisma.studyRoom.findUnique({
      where: { id: BigInt(roomId) },
    });

    if (!room) throw new NotFoundException('마이 클래스를 찾을 수 없습니다.');

    // 방장은 나갈 수 없음
    if (room.ownerId === student.id) {
      throw new BadRequestException('방장은 클래스를 떠날 수 없습니다. 클래스를 삭제하세요.');
    }

    await this.prisma.studyRoomMember.updateMany({
      where: { roomId: BigInt(roomId), studentId: student.id },
      data: { isActive: false },
    });

    return { success: true };
  }

  /**
   * 마이 클래스 삭제 (방장만)
   */
  async deleteRoom(memberId: string, roomId: number) {
    const student = await this.findStudent(memberId);
    if (!student) throw new NotFoundException('학생 정보를 찾을 수 없습니다.');

    const room = await this.prisma.studyRoom.findUnique({
      where: { id: BigInt(roomId) },
    });

    if (!room) throw new NotFoundException('마이 클래스를 찾을 수 없습니다.');
    if (room.ownerId !== student.id) {
      throw new ForbiddenException('방장만 클래스를 삭제할 수 있습니다.');
    }

    await this.prisma.studyRoom.update({
      where: { id: BigInt(roomId) },
      data: { isActive: false },
    });

    return { success: true };
  }

  /**
   * 마이 클래스 리더보드 조회 (방 내 멤버 랭킹)
   */
  async getRoomLeaderboard(
    roomId: number,
    period: 'daily' | 'weekly' | 'monthly' = 'weekly',
    date?: string,
    currentMemberId?: string,
  ) {
    const members = await this.prisma.studyRoomMember.findMany({
      where: { roomId: BigInt(roomId), isActive: true },
      include: {
        student: { select: { id: true, name: true, grade: true } },
      },
    });

    if (members.length === 0) return { leaderboard: [], teamStats: null };

    const studentIds = members.map((m) => m.student.id);
    const { start, end } = this.getDateRange(period, date);

    // 점수 집계
    const scores = await this.prisma.dailyScore.groupBy({
      by: ['studentId'],
      where: {
        studentId: { in: studentIds },
        date: { gte: start, lte: end },
      },
      _sum: { totalScore: true, studyMinutes: true, missionCount: true },
    });

    const scoreMap = new Map(
      scores.map((s) => [
        Number(s.studentId),
        {
          totalScore: Number(s._sum.totalScore ?? 0),
          studyMinutes: Number(s._sum.studyMinutes ?? 0),
          missionCount: Number(s._sum.missionCount ?? 0),
        },
      ]),
    );

    // 완료 미션의 pages 집계 (MissionResult.amount 합산)
    const pageResults = await this.prisma.missionResult.groupBy({
      by: ['studentId'],
      where: {
        studentId: { in: studentIds },
        completedDate: { gte: start, lte: end },
        amount: { not: null },
      },
      _sum: { amount: true },
    });
    const pageMap = new Map(
      pageResults.map((r) => [Number(r.studentId), Number(r._sum.amount ?? 0)]),
    );

    // 순위 산출
    const leaderboard = members
      .map((m) => {
        const stats = scoreMap.get(Number(m.student.id)) || {
          totalScore: 0,
          studyMinutes: 0,
          missionCount: 0,
        };
        return {
          studentId: Number(m.student.id),
          name: m.student.name,
          grade: m.student.grade,
          role: m.role,
          totalPages: pageMap.get(Number(m.student.id)) ?? 0,
          ...stats,
        };
      })
      .sort((a, b) => b.totalScore - a.totalScore)
      .map((entry, idx) => ({ ...entry, rank: idx + 1 }));

    // 팀 전체 통계
    const teamTotalMinutes = leaderboard.reduce((sum, e) => sum + e.studyMinutes, 0);
    const teamTotalScore = leaderboard.reduce((sum, e) => sum + e.totalScore, 0);

    // 현재 사용자의 순위 찾기
    let currentStudent: any = null;
    if (currentMemberId) {
      const s = await this.findStudent(currentMemberId);
      if (s) {
        currentStudent = leaderboard.find((e) => e.studentId === Number(s.id));
      }
    }

    // 방 정보 (주간 목표 체크)
    const room = await this.prisma.studyRoom.findUnique({
      where: { id: BigInt(roomId) },
      select: { weeklyGoal: true, name: true },
    });

    return {
      leaderboard,
      myRank: currentStudent || null,
      totalMembers: members.length,
      teamStats: {
        totalMinutes: teamTotalMinutes,
        totalScore: teamTotalScore,
        weeklyGoal: room?.weeklyGoal || null,
        goalAchieved: room?.weeklyGoal ? teamTotalMinutes >= room.weeklyGoal : null,
      },
    };
  }

  /**
   * 공개 마이 클래스 검색
   */
  async searchPublicRooms(query?: string, subject?: string) {
    const rooms = await this.prisma.studyRoom.findMany({
      where: {
        isPublic: true,
        isActive: true,
        ...(query ? { name: { contains: query } } : {}),
        ...(subject ? { subject } : {}),
      },
      include: {
        owner: { select: { name: true } },
        _count: { select: { members: { where: { isActive: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return rooms.map((r) => ({
      ...this.serialize(r),
      ownerName: r.owner.name,
      memberCount: r._count.members,
    }));
  }

  // ─────────────────────────────────────────────
  // 학생 직접 초대 기능
  // ─────────────────────────────────────────────

  /**
   * 학생 이름으로 검색 (초대 대상 찾기)
   */
  async searchStudents(query: string, requesterId: string) {
    if (!query || query.length < 1) return [];

    const requester = await this.findStudent(requesterId);
    if (!requester) return [];

    const students = await this.prisma.student.findMany({
      where: {
        name: { contains: query },
        id: { not: requester.id }, // 본인 제외
        userId: { not: null }, // 앱 가입자만
      },
      select: { id: true, name: true, grade: true, schoolName: true },
      take: 20,
      orderBy: { name: 'asc' },
    });

    return students.map((s) => ({
      id: Number(s.id),
      name: s.name,
      grade: s.grade,
      schoolName: s.schoolName,
    }));
  }

  /**
   * 특정 학생에게 클래스 초대장 발송
   */
  async sendInvitation(roomId: number, senderId: string, inviteeId: number, message?: string) {
    const sender = await this.findStudent(senderId);
    if (!sender) throw new NotFoundException('학생 정보를 찾을 수 없습니다.');

    // 발송자가 해당 클래스 멤버인지 확인
    const senderMembership = await this.prisma.studyRoomMember.findUnique({
      where: { uk_room_member: { roomId: BigInt(roomId), studentId: sender.id } },
    });
    if (!senderMembership || !senderMembership.isActive) {
      throw new ForbiddenException('클래스 멤버만 초대할 수 있습니다.');
    }

    const room = await this.prisma.studyRoom.findUnique({
      where: { id: BigInt(roomId) },
      include: { _count: { select: { members: { where: { isActive: true } } } } },
    });
    if (!room || !room.isActive) throw new NotFoundException('클래스를 찾을 수 없습니다.');

    if (room._count.members >= room.maxMembers) {
      throw new BadRequestException('정원이 꽉 찼습니다.');
    }

    // 초대 대상이 이미 멤버인지 확인
    const alreadyMember = await this.prisma.studyRoomMember.findUnique({
      where: { uk_room_member: { roomId: BigInt(roomId), studentId: BigInt(inviteeId) } },
    });
    if (alreadyMember?.isActive) {
      throw new BadRequestException('이미 클래스에 참여 중인 학생입니다.');
    }

    // 이미 대기 중인 초대가 있는지 확인
    const existingPending = await this.prisma.studyRoomInvitation.findFirst({
      where: {
        roomId: BigInt(roomId),
        inviteeId: BigInt(inviteeId),
        status: 'pending',
        expiresAt: { gt: new Date() },
      },
    });
    if (existingPending) {
      throw new BadRequestException('이미 초대장이 발송되어 있습니다.');
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7일 유효

    const invitation = await this.prisma.studyRoomInvitation.create({
      data: {
        roomId: BigInt(roomId),
        inviterId: sender.id,
        inviteeId: BigInt(inviteeId),
        message,
        expiresAt,
      },
    });

    this.logger.log(`📨 Invitation sent: room=${roomId} from=${senderId} to=${inviteeId}`);

    return { success: true, invitationId: Number(invitation.id) };
  }

  /**
   * 내가 받은 초대 목록 조회 (pending)
   */
  async getMyInvitations(memberId: string) {
    const student = await this.findStudent(memberId);
    if (!student) return [];

    const invitations = await this.prisma.studyRoomInvitation.findMany({
      where: {
        inviteeId: student.id,
        status: 'pending',
        expiresAt: { gt: new Date() },
      },
      include: {
        room: {
          include: {
            _count: { select: { members: { where: { isActive: true } } } },
          },
        },
        inviter: { select: { id: true, name: true, grade: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return invitations.map((inv) => ({
      id: Number(inv.id),
      roomId: Number(inv.roomId),
      roomName: inv.room.name,
      roomCode: inv.room.roomCode,
      memberCount: inv.room._count.members,
      maxMembers: inv.room.maxMembers,
      inviterName: inv.inviter.name,
      inviterGrade: inv.inviter.grade,
      message: inv.message,
      createdAt: inv.createdAt,
      expiresAt: inv.expiresAt,
    }));
  }

  /**
   * 초대 수락
   */
  async acceptInvitation(invitationId: number, memberId: string) {
    const student = await this.findStudent(memberId);
    if (!student) throw new NotFoundException('학생 정보를 찾을 수 없습니다.');

    const invitation = await this.prisma.studyRoomInvitation.findUnique({
      where: { id: BigInt(invitationId) },
      include: {
        room: {
          include: { _count: { select: { members: { where: { isActive: true } } } } },
        },
      },
    });

    if (!invitation) throw new NotFoundException('초대장을 찾을 수 없습니다.');
    if (invitation.inviteeId !== student.id)
      throw new ForbiddenException('본인의 초대장이 아닙니다.');
    if (invitation.status !== 'pending') throw new BadRequestException('이미 처리된 초대장입니다.');
    if (invitation.expiresAt < new Date()) throw new BadRequestException('만료된 초대장입니다.');

    const room = invitation.room;
    if (!room.isActive) throw new NotFoundException('클래스가 더 이상 존재하지 않습니다.');
    if (room._count.members >= room.maxMembers)
      throw new BadRequestException('정원이 꽉 찼습니다.');

    await this.prisma.$transaction(async (tx) => {
      // 상태 업데이트
      await tx.studyRoomInvitation.update({
        where: { id: BigInt(invitationId) },
        data: { status: 'accepted' },
      });

      // 멤버 추가 (재가입 처리 포함)
      const existing = await tx.studyRoomMember.findUnique({
        where: { uk_room_member: { roomId: invitation.roomId, studentId: student.id } },
      });

      if (existing) {
        await tx.studyRoomMember.update({
          where: { id: existing.id },
          data: { isActive: true },
        });
      } else {
        await tx.studyRoomMember.create({
          data: { roomId: invitation.roomId, studentId: student.id, role: 'member' },
        });
      }
    });

    // 초대한 사람에게 도토리 보상
    await this.acornService.earn(String(invitation.inviterId), 'invite', memberId);

    this.logger.log(
      `✅ Invitation accepted: inv=${invitationId} student=${memberId} → room=${invitation.roomId}`,
    );

    return { success: true, roomId: Number(invitation.roomId), roomName: room.name };
  }

  /**
   * 초대 거절
   */
  async declineInvitation(invitationId: number, memberId: string) {
    const student = await this.findStudent(memberId);
    if (!student) throw new NotFoundException('학생 정보를 찾을 수 없습니다.');

    const invitation = await this.prisma.studyRoomInvitation.findUnique({
      where: { id: BigInt(invitationId) },
    });

    if (!invitation) throw new NotFoundException('초대장을 찾을 수 없습니다.');
    if (invitation.inviteeId !== student.id)
      throw new ForbiddenException('본인의 초대장이 아닙니다.');
    if (invitation.status !== 'pending') throw new BadRequestException('이미 처리된 초대장입니다.');

    await this.prisma.studyRoomInvitation.update({
      where: { id: BigInt(invitationId) },
      data: { status: 'declined' },
    });

    return { success: true };
  }

  // ─────────── Private Helpers ───────────

  private async findStudent(memberId: string) {
    // 숫자 ID로 조회
    if (/^\d+$/.test(memberId)) {
      const byId = await this.prisma.student.findUnique({
        where: { id: BigInt(memberId) },
        select: { id: true },
      });
      if (byId) return byId;
    }
    // userId 직접 조회
    const byUserId = await this.prisma.student.findFirst({
      where: { userId: memberId },
      select: { id: true },
    });
    if (byUserId) return byUserId;
    // sp_ 없이 들어온 Hub raw ID 재시도
    if (!memberId.startsWith('sp_')) {
      return this.prisma.student.findFirst({
        where: { userId: `sp_${memberId}` },
        select: { id: true },
      });
    }
    return null;
  }

  /** 학생 조회 후 없으면 자동 생성 (쓰기 작업용 — plan.controller 정책과 동일) */
  private async findOrCreateStudent(memberId: string) {
    const existing = await this.findStudent(memberId);
    if (existing) return existing;
    // 숫자 ID만 들어왔는데 학생이 없으면 안전하게 생성 불가
    if (/^\d+$/.test(memberId)) return null;

    // User FK 제약 위반 방지: User 먼저 upsert
    const normalizedUserId = memberId.startsWith('sp_') ? memberId : `sp_${memberId}`;
    const hubId = normalizedUserId.replace(/^sp_/, '');
    await this.prisma.user.upsert({
      where: { id: normalizedUserId },
      create: {
        id: normalizedUserId,
        email: `${hubId}@hub.local`,
        name: hubId,
        role: 'student',
        hubUserId: hubId,
      },
      update: {},
    });
    return this.prisma.student.upsert({
      where: { userId: normalizedUserId },
      create: {
        studentCode: `SP${Date.now()}`,
        userId: normalizedUserId,
        year: new Date().getFullYear(),
        schoolLevel: 'high',
        name: '학생',
      },
      update: {},
      select: { id: true },
    });
  }

  private async generateRoomCode(): Promise<string> {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // O/0/I/1 제외
    let code: string;
    let exists = true;

    while (exists) {
      code = 'MC-';
      for (let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
      }
      const found = await this.prisma.studyRoom.findUnique({ where: { roomCode: code } });
      exists = !!found;
    }

    return code!;
  }

  private getDateRange(period: string, date?: string) {
    const ref = date ? new Date(date) : new Date();
    let start: Date;
    let end: Date;

    if (period === 'daily') {
      start = new Date(ref);
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setDate(end.getDate() + 1);
    } else if (period === 'weekly') {
      const day = ref.getDay();
      const mondayOffset = day === 0 ? -6 : 1 - day;
      start = new Date(ref);
      start.setDate(ref.getDate() + mondayOffset);
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setDate(end.getDate() + 7);
    } else {
      start = new Date(ref.getFullYear(), ref.getMonth(), 1);
      end = new Date(ref.getFullYear(), ref.getMonth() + 1, 1);
    }

    return { start, end };
  }

  private serialize(obj: any) {
    if (!obj) return null;
    const result: any = {};
    for (const key of Object.keys(obj)) {
      if (key === '_count' || key === 'owner' || key === 'members') continue;
      if (typeof obj[key] === 'bigint') {
        result[key] = Number(obj[key]);
      } else if (obj[key] instanceof Date) {
        result[key] = obj[key];
      } else {
        result[key] = obj[key];
      }
    }
    return result;
  }
}
