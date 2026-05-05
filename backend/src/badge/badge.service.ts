import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * 뱃지(Badge) & 칭호 시스템
 *
 * - 뱃지 카탈로그 관리
 * - 자동 뱃지 부여 (조건 충족 시)
 * - 학생 뱃지 조회
 */

// ═══════════════════════════════════════════
// 뱃지 카탈로그 정의 (시드 데이터)
// ═══════════════════════════════════════════

export const BADGE_CATALOG = [
  // ── Streak 카테고리 ──
  {
    id: 'streak_3',
    name: '첫 불꽃',
    description: '3일 연속 학습 달성',
    emoji: '🔥',
    category: 'streak',
    rarity: 'common',
    condition: 'streak >= 3',
    sortOrder: 1,
  },
  {
    id: 'streak_7',
    name: '일주일 전사',
    description: '7일 연속 학습 달성',
    emoji: '⚔️',
    category: 'streak',
    rarity: 'common',
    condition: 'streak >= 7',
    sortOrder: 2,
  },
  {
    id: 'streak_14',
    name: '2주 마라토너',
    description: '14일 연속 학습 달성',
    emoji: '🏃',
    category: 'streak',
    rarity: 'rare',
    condition: 'streak >= 14',
    sortOrder: 3,
  },
  {
    id: 'streak_30',
    name: '한 달의 왕',
    description: '30일 연속 학습 달성',
    emoji: '👑',
    category: 'streak',
    rarity: 'epic',
    condition: 'streak >= 30',
    sortOrder: 4,
  },
  {
    id: 'streak_100',
    name: '불멸의 투사',
    description: '100일 연속 학습 달성',
    emoji: '💎',
    category: 'streak',
    rarity: 'legendary',
    condition: 'streak >= 100',
    sortOrder: 5,
  },

  // ── Mission 카테고리 ──
  {
    id: 'mission_first',
    name: '시작이 반',
    description: '첫 미션 완료',
    emoji: '🌱',
    category: 'mission',
    rarity: 'common',
    condition: 'total_missions >= 1',
    sortOrder: 10,
  },
  {
    id: 'mission_50',
    name: '미션 헌터',
    description: '총 50개 미션 완료',
    emoji: '🎯',
    category: 'mission',
    rarity: 'common',
    condition: 'total_missions >= 50',
    sortOrder: 11,
  },
  {
    id: 'mission_100',
    name: '센추리온',
    description: '총 100개 미션 완료',
    emoji: '💯',
    category: 'mission',
    rarity: 'rare',
    condition: 'total_missions >= 100',
    sortOrder: 12,
  },
  {
    id: 'mission_500',
    name: '미션 마스터',
    description: '총 500개 미션 완료',
    emoji: '🏆',
    category: 'mission',
    rarity: 'epic',
    condition: 'total_missions >= 500',
    sortOrder: 13,
  },
  {
    id: 'perfect_day',
    name: '완벽한 하루',
    description: '하루 미션 100% 달성',
    emoji: '⭐',
    category: 'mission',
    rarity: 'common',
    condition: 'daily_achievement == 100%',
    sortOrder: 14,
  },
  {
    id: 'perfect_week',
    name: '완벽한 한 주',
    description: '7일 연속 미션 100% 달성',
    emoji: '🌟',
    category: 'mission',
    rarity: 'epic',
    condition: '7_consecutive_100%',
    sortOrder: 15,
  },

  // ── Social 카테고리 ──
  {
    id: 'social_first_share',
    name: '첫 공유',
    description: '첫 SNS 공유',
    emoji: '📤',
    category: 'social',
    rarity: 'common',
    condition: 'share_count >= 1',
    sortOrder: 20,
  },
  {
    id: 'social_influencer',
    name: '인플루언서',
    description: 'SNS 공유 10회',
    emoji: '📣',
    category: 'social',
    rarity: 'rare',
    condition: 'share_count >= 10',
    sortOrder: 21,
  },
  {
    id: 'social_recruiter',
    name: '리크루터',
    description: '친구 3명 초대',
    emoji: '🤝',
    category: 'social',
    rarity: 'rare',
    condition: 'invite_count >= 3',
    sortOrder: 22,
  },
  {
    id: 'social_class_founder',
    name: '클래스 창설자',
    description: '마이 클래스 생성',
    emoji: '🏠',
    category: 'social',
    rarity: 'common',
    condition: 'class_create >= 1',
    sortOrder: 23,
  },

  // ── Growth 카테고리 ──
  {
    id: 'growth_first_reflection',
    name: '첫 회고',
    description: '첫 자기 회고 작성',
    emoji: '📝',
    category: 'growth',
    rarity: 'common',
    condition: 'reflection_count >= 1',
    sortOrder: 30,
  },
  {
    id: 'growth_study_100h',
    name: '100시간 학자',
    description: '누적 학습 100시간 달성',
    emoji: '📚',
    category: 'growth',
    rarity: 'rare',
    condition: 'total_study_hours >= 100',
    sortOrder: 31,
  },
  {
    id: 'growth_study_500h',
    name: '500시간 현자',
    description: '누적 학습 500시간 달성',
    emoji: '🧙',
    category: 'growth',
    rarity: 'epic',
    condition: 'total_study_hours >= 500',
    sortOrder: 32,
  },
  {
    id: 'growth_rank_1',
    name: '넘버 원',
    description: '주간 랭킹 1위 달성',
    emoji: '🥇',
    category: 'growth',
    rarity: 'rare',
    condition: 'weekly_rank == 1',
    sortOrder: 33,
  },

  // ── Special 카테고리 ──
  {
    id: 'special_early_bird',
    name: '얼리버드',
    description: '오전 6시 이전 학습 시작',
    emoji: '🐦',
    category: 'special',
    rarity: 'common',
    condition: 'study_before_6am',
    sortOrder: 40,
  },
  {
    id: 'special_night_owl',
    name: '올빼미',
    description: '자정 이후 학습',
    emoji: '🦉',
    category: 'special',
    rarity: 'common',
    condition: 'study_after_midnight',
    sortOrder: 41,
  },
  {
    id: 'special_acorn_100',
    name: '도토리 수집가',
    description: '도토리 100개 모으기',
    emoji: '🌰',
    category: 'special',
    rarity: 'rare',
    condition: 'acorn_lifetime >= 100',
    sortOrder: 42,
  },
] as const;

type BadgeCatalogEntry = (typeof BADGE_CATALOG)[number];

// ═══════════════════════════════════════════
// Rarity 설정
// ═══════════════════════════════════════════

export const RARITY_CONFIG: Record<
  string,
  { label: string; color: string; bgColor: string; borderColor: string }
> = {
  common: { label: '일반', color: '#6b7280', bgColor: '#f3f4f6', borderColor: '#e5e7eb' },
  rare: { label: '희귀', color: '#3b82f6', bgColor: '#eff6ff', borderColor: '#bfdbfe' },
  epic: { label: '영웅', color: '#8b5cf6', bgColor: '#f5f3ff', borderColor: '#c4b5fd' },
  legendary: { label: '전설', color: '#f59e0b', bgColor: '#fffbeb', borderColor: '#fcd34d' },
};

@Injectable()
export class BadgeService {
  private readonly logger = new Logger(BadgeService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 뱃지 카탈로그 시드 (서버 시작 시 실행)
   */
  async seedBadgeCatalog() {
    for (const badge of BADGE_CATALOG) {
      await this.prisma.badge.upsert({
        where: { id: badge.id },
        create: {
          id: badge.id,
          name: badge.name,
          description: badge.description,
          emoji: badge.emoji,
          category: badge.category,
          rarity: badge.rarity,
          condition: badge.condition,
          sortOrder: badge.sortOrder,
        },
        update: {
          name: badge.name,
          description: badge.description,
          emoji: badge.emoji,
          category: badge.category,
          rarity: badge.rarity,
          condition: badge.condition,
          sortOrder: badge.sortOrder,
        },
      });
    }
    this.logger.log(`🏅 Badge catalog seeded: ${BADGE_CATALOG.length} badges`);
  }

  /**
   * 내 뱃지 목록 (획득 + 미획득 전체)
   */
  async getMyBadges(memberId: string) {
    const student = await this.findStudent(memberId);
    if (!student) return { earned: [], catalog: BADGE_CATALOG, newCount: 0 };

    const earned = await this.prisma.studentBadge.findMany({
      where: { studentId: student.id },
      include: { badge: true },
      orderBy: { earnedAt: 'desc' },
    });

    const earnedMap = new Map(earned.map((e) => [e.badgeId, e]));

    const catalog = BADGE_CATALOG.map((b) => {
      const studentBadge = earnedMap.get(b.id);
      return {
        ...b,
        earned: !!studentBadge,
        earnedAt: studentBadge?.earnedAt || null,
        isNew: studentBadge?.isNew ?? false,
      };
    });

    const newCount = earned.filter((e) => e.isNew).length;

    return { badges: catalog, newCount };
  }

  /**
   * 새 뱃지 확인 처리
   */
  async acknowledgeNewBadges(memberId: string) {
    const student = await this.findStudent(memberId);
    if (!student) return;

    await this.prisma.studentBadge.updateMany({
      where: { studentId: student.id, isNew: true },
      data: { isNew: false },
    });
  }

  /**
   * 뱃지 자동 부여 체크 (이벤트 발생 시 호출)
   *
   * @returns 새로 획득한 뱃지 목록
   */
  async checkAndAwardBadges(memberId: string, context: BadgeCheckContext): Promise<AwardedBadge[]> {
    const student = await this.findStudent(memberId);
    if (!student) return [];

    const existingBadges = await this.prisma.studentBadge.findMany({
      where: { studentId: student.id },
      select: { badgeId: true },
    });
    const existingSet = new Set(existingBadges.map((b) => b.badgeId));

    const awarded: AwardedBadge[] = [];

    for (const badge of BADGE_CATALOG) {
      if (existingSet.has(badge.id)) continue;

      if (this.checkCondition(badge, context)) {
        try {
          await this.prisma.studentBadge.create({
            data: {
              studentId: student.id,
              badgeId: badge.id,
              isNew: true,
            },
          });
          awarded.push({
            id: badge.id,
            name: badge.name,
            emoji: badge.emoji,
            rarity: badge.rarity,
          });
          this.logger.log(`🏅 Badge awarded: ${badge.emoji} ${badge.name} → student=${memberId}`);
        } catch {
          // unique constraint — already earned, skip
        }
      }
    }

    return awarded;
  }

  // ─────────── Private ───────────

  private checkCondition(badge: BadgeCatalogEntry, ctx: BadgeCheckContext): boolean {
    switch (badge.id) {
      // Streak
      case 'streak_3':
        return (ctx.streak ?? 0) >= 3;
      case 'streak_7':
        return (ctx.streak ?? 0) >= 7;
      case 'streak_14':
        return (ctx.streak ?? 0) >= 14;
      case 'streak_30':
        return (ctx.streak ?? 0) >= 30;
      case 'streak_100':
        return (ctx.streak ?? 0) >= 100;

      // Mission
      case 'mission_first':
        return (ctx.totalMissions ?? 0) >= 1;
      case 'mission_50':
        return (ctx.totalMissions ?? 0) >= 50;
      case 'mission_100':
        return (ctx.totalMissions ?? 0) >= 100;
      case 'mission_500':
        return (ctx.totalMissions ?? 0) >= 500;
      case 'perfect_day':
        return ctx.dailyAchievementRate === 100;
      case 'perfect_week':
        return (ctx.consecutivePerfectDays ?? 0) >= 7;

      // Social
      case 'social_first_share':
        return (ctx.shareCount ?? 0) >= 1;
      case 'social_influencer':
        return (ctx.shareCount ?? 0) >= 10;
      case 'social_recruiter':
        return (ctx.inviteCount ?? 0) >= 3;
      case 'social_class_founder':
        return (ctx.classCreateCount ?? 0) >= 1;

      // Growth
      case 'growth_first_reflection':
        return (ctx.reflectionCount ?? 0) >= 1;
      case 'growth_study_100h':
        return (ctx.totalStudyMinutes ?? 0) >= 6000;
      case 'growth_study_500h':
        return (ctx.totalStudyMinutes ?? 0) >= 30000;
      case 'growth_rank_1':
        return ctx.weeklyRank === 1;

      // Special
      case 'special_early_bird':
        return ctx.earlyBird === true;
      case 'special_night_owl':
        return ctx.nightOwl === true;
      case 'special_acorn_100':
        return (ctx.acornLifetime ?? 0) >= 100;

      default:
        return false;
    }
  }

  private async findStudent(memberId: string) {
    const num = parseInt(memberId, 10);
    if (!isNaN(num)) {
      return this.prisma.student.findUnique({ where: { id: BigInt(num) }, select: { id: true } });
    }
    return this.prisma.student.findFirst({ where: { userId: memberId }, select: { id: true } });
  }
}

// ═══════════════════════════════════════════
// Types
// ═══════════════════════════════════════════

export interface BadgeCheckContext {
  streak?: number;
  totalMissions?: number;
  dailyAchievementRate?: number;
  consecutivePerfectDays?: number;
  shareCount?: number;
  inviteCount?: number;
  classCreateCount?: number;
  reflectionCount?: number;
  totalStudyMinutes?: number;
  weeklyRank?: number;
  earlyBird?: boolean;
  nightOwl?: boolean;
  acornLifetime?: number;
}

export interface AwardedBadge {
  id: string;
  name: string;
  emoji: string;
  rarity: string;
}
