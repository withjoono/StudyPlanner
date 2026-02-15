import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MessageService {
  private readonly logger = new Logger(MessageService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** 쪽지 발송 */
  async sendMessage(data: {
    senderId: string;
    receiverId: string;
    studentId?: number;
    content: string;
  }) {
    const message = await this.prisma.message.create({
      data: {
        senderId: String(data.senderId),
        receiverId: String(data.receiverId),
        studentId: data.studentId ? BigInt(data.studentId) : null,
        content: data.content,
      },
      include: {
        sender: { select: { id: true, name: true, role: true } },
        receiver: { select: { id: true, name: true, role: true } },
      },
    });
    return this.serialize(message);
  }

  /** 받은 쪽지 목록 */
  async getInbox(userId: string, params?: { limit?: number; offset?: number }) {
    const messages = await this.prisma.message.findMany({
      where: { receiverId: userId },
      include: {
        sender: { select: { id: true, name: true, role: true, avatarUrl: true } },
        student: { select: { id: true, name: true, studentCode: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: params?.limit || 50,
      skip: params?.offset || 0,
    });
    return messages.map(this.serialize);
  }

  /** 보낸 쪽지 목록 */
  async getSent(userId: string, params?: { limit?: number; offset?: number }) {
    const messages = await this.prisma.message.findMany({
      where: { senderId: userId },
      include: {
        receiver: { select: { id: true, name: true, role: true, avatarUrl: true } },
        student: { select: { id: true, name: true, studentCode: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: params?.limit || 50,
      skip: params?.offset || 0,
    });
    return messages.map(this.serialize);
  }

  /** 대화 스레드 (특정 상대와의 쪽지 목록) */
  async getConversation(userId: string, otherUserId: string, studentId?: number) {
    const where: any = {
      OR: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId },
      ],
    };
    if (studentId) {
      where.studentId = BigInt(studentId);
    }

    const messages = await this.prisma.message.findMany({
      where,
      include: {
        sender: { select: { id: true, name: true, role: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    // 읽음 처리
    await this.prisma.message.updateMany({
      where: {
        senderId: otherUserId,
        receiverId: userId,
        isRead: false,
      },
      data: { isRead: true },
    });

    return messages.map(this.serialize);
  }

  /** 안 읽은 쪽지 수 */
  async getUnreadCount(userId: string) {
    return this.prisma.message.count({
      where: { receiverId: userId, isRead: false },
    });
  }

  /** 읽음 처리 */
  async markAsRead(messageId: number, userId: string) {
    await this.prisma.message.updateMany({
      where: {
        id: BigInt(messageId),
        receiverId: userId,
      },
      data: { isRead: true },
    });
    return { success: true };
  }

  private serialize(obj: any): any {
    if (!obj) return null;
    const result: any = { ...obj };
    for (const key of Object.keys(result)) {
      if (typeof result[key] === 'bigint') {
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
