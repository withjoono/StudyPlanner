import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * 도토리(Acorn) 보상 시스템 서비스
 *
 * 도토리 획득 규칙:
 * - SNS 공유:       +10 (1일 2회 제한)
 * - 친구 초대(가입): +50 (무제한)
 * - 마이클래스 생성:  +30 (1회)
 * - Streak 7일:      +5  (주 1회)
 * - Streak 30일:     +20 (월 1회)
 * - 일일 미션 100%:  +3  (매일)
 * - 주간 리포트 생성: +5  (주 1회)
 * - 반 내 주간 1등:  +15 (주 1회)
 */

export interface AcornEarnResult {
  success: boolean;
  amount: number;
  newBalance: number;
  reason?: string;
}

export interface AcornBalanceSummary {
  balance: number;
  lifetime: number;
  recentTransactions: {
    id: number;
    amount: number;
    type: string;
    description: string | null;
    createdAt: Date;
  }[];
}

// 도토리 획득 타입별 설정
const ACORN_RULES: Record<
  string,
  {
    amount: number;
    dailyLimit?: number;
    weeklyLimit?: number;
    monthlyLimit?: number;
    totalLimit?: number;
  }
> = {
  sns_share: { amount: 10, dailyLimit: 2 },
  invite: { amount: 50 },
  class_create: { amount: 30, totalLimit: 1 },
  streak_7: { amount: 5, weeklyLimit: 1 },
  streak_30: { amount: 20, monthlyLimit: 1 },
  mission_complete: { amount: 3, dailyLimit: 1 },
  weekly_report: { amount: 5, weeklyLimit: 1 },
  weekly_first: { amount: 15, weeklyLimit: 1 },
};

@Injectable()
export class AcornService {
  private readonly logger = new Logger(AcornService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 도토리 잔액 + 최근 거래내역 조회
   */
  async getBalance(memberId: string): Promise<AcornBalanceSummary> {
    const student = await this.findStudent(memberId);
    if (!student) {
      return { balance: 0, lifetime: 0, recentTransactions: [] };
    }

    // 잔액 조회 (없으면 자동 생성)
    const balance = await this.prisma.acornBalance.upsert({
      where: { studentId: student.id },
      create: { studentId: student.id, balance: 0, lifetime: 0 },
      update: {},
    });

    // 최근 20건 거래내역
    const transactions = await this.prisma.acornTransaction.findMany({
      where: { studentId: student.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return {
      balance: balance.balance,
      lifetime: balance.lifetime,
      recentTransactions: transactions.map(this.serialize),
    };
  }

  /**
   * 도토리 획득 (규칙 기반, 제한 자동 체크)
   */
  async earn(memberId: string, type: string, referenceId?: string): Promise<AcornEarnResult> {
    const student = await this.findStudent(memberId);
    if (!student) {
      return { success: false, amount: 0, newBalance: 0, reason: '학생 정보를 찾을 수 없습니다.' };
    }

    const rule = ACORN_RULES[type];
    if (!rule) {
      return {
        success: false,
        amount: 0,
        newBalance: 0,
        reason: `알 수 없는 도토리 타입: ${type}`,
      };
    }

    // 제한 체크
    const limitCheck = await this.checkLimit(student.id, type, rule);
    if (!limitCheck.allowed) {
      return {
        success: false,
        amount: 0,
        newBalance: await this.getCurrentBalance(student.id),
        reason: limitCheck.reason,
      };
    }

    // 트랜잭션 내 도토리 지급
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. 잔액 업데이트 (upsert)
      const updated = await tx.acornBalance.upsert({
        where: { studentId: student.id },
        create: {
          studentId: student.id,
          balance: rule.amount,
          lifetime: rule.amount,
        },
        update: {
          balance: { increment: rule.amount },
          lifetime: { increment: rule.amount },
        },
      });

      // 2. 거래 기록
      await tx.acornTransaction.create({
        data: {
          studentId: student.id,
          amount: rule.amount,
          type,
          description: this.getDescription(type, rule.amount),
          referenceId: referenceId || null,
        },
      });

      return updated;
    });

    this.logger.log(
      `🌰 Acorn earned: student=${memberId}, type=${type}, +${rule.amount}, balance=${result.balance}`,
    );

    return {
      success: true,
      amount: rule.amount,
      newBalance: result.balance,
    };
  }

  /**
   * 도토리 사용 (프리미엄 기능 해금 등)
   */
  async spend(
    memberId: string,
    amount: number,
    type: string,
    description?: string,
  ): Promise<AcornEarnResult> {
    const student = await this.findStudent(memberId);
    if (!student) {
      return { success: false, amount: 0, newBalance: 0, reason: '학생 정보를 찾을 수 없습니다.' };
    }

    const currentBalance = await this.getCurrentBalance(student.id);
    if (currentBalance < amount) {
      return {
        success: false,
        amount: 0,
        newBalance: currentBalance,
        reason: `도토리가 부족합니다. (현재: ${currentBalance}, 필요: ${amount})`,
      };
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.acornBalance.update({
        where: { studentId: student.id },
        data: { balance: { decrement: amount } },
      });

      await tx.acornTransaction.create({
        data: {
          studentId: student.id,
          amount: -amount,
          type: 'redeem',
          description: description || `${type} 이용`,
        },
      });

      return updated;
    });

    this.logger.log(
      `🌰 Acorn spent: student=${memberId}, type=${type}, -${amount}, balance=${result.balance}`,
    );

    return {
      success: true,
      amount: -amount,
      newBalance: result.balance,
    };
  }

  // ─────────── Private Helpers ───────────

  private async findStudent(memberId: string) {
    const memberIdNum = parseInt(memberId, 10);
    if (!isNaN(memberIdNum)) {
      return this.prisma.student.findUnique({
        where: { id: BigInt(memberIdNum) },
        select: { id: true },
      });
    }
    return this.prisma.student.findFirst({
      where: { userId: memberId },
      select: { id: true },
    });
  }

  private async getCurrentBalance(studentId: bigint): Promise<number> {
    const balance = await this.prisma.acornBalance.findUnique({
      where: { studentId },
    });
    return balance?.balance ?? 0;
  }

  private async checkLimit(
    studentId: bigint,
    type: string,
    rule: (typeof ACORN_RULES)[string],
  ): Promise<{ allowed: boolean; reason?: string }> {
    const now = new Date();

    if (rule.dailyLimit) {
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);

      const count = await this.prisma.acornTransaction.count({
        where: {
          studentId,
          type,
          amount: { gt: 0 },
          createdAt: { gte: startOfDay },
        },
      });
      if (count >= rule.dailyLimit) {
        return {
          allowed: false,
          reason: `오늘 ${type} 도토리 획득 한도에 도달했습니다. (${rule.dailyLimit}회/일)`,
        };
      }
    }

    if (rule.weeklyLimit) {
      const day = now.getDay();
      const mondayOffset = day === 0 ? -6 : 1 - day;
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() + mondayOffset);
      startOfWeek.setHours(0, 0, 0, 0);

      const count = await this.prisma.acornTransaction.count({
        where: {
          studentId,
          type,
          amount: { gt: 0 },
          createdAt: { gte: startOfWeek },
        },
      });
      if (count >= rule.weeklyLimit) {
        return {
          allowed: false,
          reason: `이번 주 ${type} 도토리 획득 한도에 도달했습니다. (${rule.weeklyLimit}회/주)`,
        };
      }
    }

    if (rule.monthlyLimit) {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const count = await this.prisma.acornTransaction.count({
        where: {
          studentId,
          type,
          amount: { gt: 0 },
          createdAt: { gte: startOfMonth },
        },
      });
      if (count >= rule.monthlyLimit) {
        return {
          allowed: false,
          reason: `이번 달 ${type} 도토리 획득 한도에 도달했습니다. (${rule.monthlyLimit}회/월)`,
        };
      }
    }

    if (rule.totalLimit) {
      const count = await this.prisma.acornTransaction.count({
        where: {
          studentId,
          type,
          amount: { gt: 0 },
        },
      });
      if (count >= rule.totalLimit) {
        return { allowed: false, reason: `${type} 도토리는 이미 획득하셨습니다.` };
      }
    }

    return { allowed: true };
  }

  private getDescription(type: string, amount: number): string {
    const descriptions: Record<string, string> = {
      sns_share: '📤 SNS 공유 보상',
      invite: '🤝 친구 초대 보상',
      class_create: '🏠 마이 클래스 생성 보상',
      streak_7: '🔥 7일 연속 달성 보상',
      streak_30: '🏆 30일 연속 달성 보상',
      mission_complete: '✅ 일일 미션 완료 보상',
      weekly_report: '📊 주간 리포트 보상',
      weekly_first: '👑 주간 1등 보상',
    };
    return `${descriptions[type] || type} (+${amount}🌰)`;
  }

  private serialize(obj: any) {
    if (!obj) return null;
    const result: any = { ...obj };
    for (const key of Object.keys(result)) {
      if (typeof result[key] === 'bigint') {
        result[key] = Number(result[key]);
      }
    }
    return result;
  }
}
