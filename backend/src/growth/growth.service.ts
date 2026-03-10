import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { MissionStatus } from '@prisma/client';

// DTO 타입
export interface ReflectionDto {
  member_id: number | string;
  date: string;
  mood: string;
  best_thing?: string;
  worst_thing?: string;
  improvement?: string;
  daily_goal?: string;
  understanding?: number;
}

export interface GrowthStatsResponse {
  streak: number;
  longestStreak: number;
  thisWeek: WeekStats;
  lastWeek: WeekStats;
  subjectTrend: SubjectTrend[];
  moodTrend: MoodEntry[];
  weeklyAchievements: number[];
}

interface WeekStats {
  totalMissions: number;
  completedMissions: number;
  achievementRate: number;
  studyMinutes: number;
}

interface SubjectTrend {
  subject: string;
  thisWeek: number;
  lastWeek: number;
  change: number;
}

interface MoodEntry {
  date: string;
  mood: string;
  understanding: number;
}

@Injectable()
export class GrowthService {
  constructor(private readonly prisma: PrismaService) {}

  // ─────────── 학생 조회/생성 ───────────

  private async getOrCreateStudent(memberId: number | string): Promise<bigint> {
    const memberIdNum = typeof memberId === 'string' ? parseInt(memberId, 10) : memberId;
    if (isNaN(memberIdNum)) {
      // Hub UUID 기반 → userId로 조회
      const student = await this.prisma.student.findFirst({
        where: { userId: String(memberId) },
      });
      if (student) return student.id;
      const created = await this.prisma.student.create({
        data: {
          studentCode: `SP${Date.now()}`,
          userId: String(memberId),
          name: '학생',
          year: new Date().getFullYear(),
          schoolLevel: 'high',
        },
      });
      return created.id;
    }
    return BigInt(memberIdNum);
  }

  // ─────────── 회고 CRUD ───────────

  async getReflection(memberId: number | string, date: string) {
    const studentId = await this.getOrCreateStudent(memberId);
    const reflection = await this.prisma.dailyReflection.findUnique({
      where: {
        uk_daily_reflection: {
          studentId,
          date: new Date(date),
        },
      },
    });
    return reflection
      ? {
          id: Number(reflection.id),
          date: reflection.date.toISOString().split('T')[0],
          mood: reflection.mood,
          bestThing: reflection.bestThing,
          worstThing: reflection.worstThing,
          improvement: reflection.improvement,
          dailyGoal: reflection.dailyGoal,
          understanding: reflection.understanding,
        }
      : null;
  }

  async getReflections(memberId: number | string, startDate: string, endDate: string) {
    const studentId = await this.getOrCreateStudent(memberId);
    const reflections = await this.prisma.dailyReflection.findMany({
      where: {
        studentId,
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      orderBy: { date: 'asc' },
    });
    return reflections.map((r: any) => ({
      id: Number(r.id),
      date: r.date.toISOString().split('T')[0],
      mood: r.mood,
      bestThing: r.bestThing,
      worstThing: r.worstThing,
      improvement: r.improvement,
      dailyGoal: r.dailyGoal,
      understanding: r.understanding,
    }));
  }

  async upsertReflection(dto: ReflectionDto) {
    const studentId = await this.getOrCreateStudent(dto.member_id);
    const dateObj = new Date(dto.date);

    const reflection = await this.prisma.dailyReflection.upsert({
      where: {
        uk_daily_reflection: {
          studentId,
          date: dateObj,
        },
      },
      create: {
        studentId,
        date: dateObj,
        mood: dto.mood,
        bestThing: dto.best_thing,
        worstThing: dto.worst_thing,
        improvement: dto.improvement,
        dailyGoal: dto.daily_goal,
        understanding: dto.understanding ?? 3,
      },
      update: {
        mood: dto.mood,
        bestThing: dto.best_thing,
        worstThing: dto.worst_thing,
        improvement: dto.improvement,
        dailyGoal: dto.daily_goal,
        understanding: dto.understanding,
      },
    });

    return {
      id: Number(reflection.id),
      date: reflection.date.toISOString().split('T')[0],
      mood: reflection.mood,
      bestThing: reflection.bestThing,
      worstThing: reflection.worstThing,
      improvement: reflection.improvement,
      dailyGoal: reflection.dailyGoal,
      understanding: reflection.understanding,
    };
  }

  // ─────────── 성장 통계 ───────────

  async getGrowthStats(memberId: number | string): Promise<GrowthStatsResponse> {
    const studentId = await this.getOrCreateStudent(memberId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 이번 주(월~일) 계산
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() + mondayOffset);
    const thisWeekEnd = new Date(thisWeekStart);
    thisWeekEnd.setDate(thisWeekStart.getDate() + 6);

    // 지난 주
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(thisWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(thisWeekStart);
    lastWeekEnd.setDate(thisWeekStart.getDate() - 1);

    // 미션 데이터 (이번 주 + 지난 주)
    const [thisWeekMissions, lastWeekMissions] = await Promise.all([
      this.prisma.dailyMission.findMany({
        where: { studentId, date: { gte: thisWeekStart, lte: thisWeekEnd } },
      }),
      this.prisma.dailyMission.findMany({
        where: { studentId, date: { gte: lastWeekStart, lte: lastWeekEnd } },
      }),
    ]);

    const calcWeekStats = (missions: any[]): WeekStats => {
      const total = missions.length;
      const completed = missions.filter((m) => m.status === MissionStatus.completed).length;
      return {
        totalMissions: total,
        completedMissions: completed,
        achievementRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        studyMinutes: 0,
      };
    };

    // Streak 계산
    const streak = await this.calculateStreak(studentId, today);
    const longestStreak = await this.calculateLongestStreak(studentId);

    // 과목별 트렌드
    const subjectTrend = this.calculateSubjectTrend(thisWeekMissions, lastWeekMissions);

    // 기분 트렌드 (최근 14일)
    const twoWeeksAgo = new Date(today);
    twoWeeksAgo.setDate(today.getDate() - 13);
    const reflections = await this.prisma.dailyReflection.findMany({
      where: {
        studentId,
        date: { gte: twoWeeksAgo, lte: today },
      },
      orderBy: { date: 'asc' },
    });
    const moodTrend = reflections.map((r: any) => ({
      date: r.date.toISOString().split('T')[0],
      mood: r.mood,
      understanding: r.understanding ?? 3,
    }));

    // 주간 달성률 (최근 8주)
    const weeklyAchievements = await this.getWeeklyAchievements(studentId, 8);

    return {
      streak,
      longestStreak,
      thisWeek: calcWeekStats(thisWeekMissions),
      lastWeek: calcWeekStats(lastWeekMissions),
      subjectTrend,
      moodTrend,
      weeklyAchievements,
    };
  }

  private async calculateStreak(studentId: bigint, today: Date): Promise<number> {
    let streak = 0;
    const checkDate = new Date(today);

    for (let i = 0; i < 365; i++) {
      const dayStart = new Date(checkDate);
      const dayEnd = new Date(checkDate);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const missions = await this.prisma.dailyMission.findMany({
        where: {
          studentId,
          date: { gte: dayStart, lt: dayEnd },
        },
      });

      if (missions.length === 0) {
        // 오늘이면 아직 미션이 없을 수 있으니 skip
        if (i === 0) {
          checkDate.setDate(checkDate.getDate() - 1);
          continue;
        }
        break;
      }

      const allCompleted = missions.every((m) => m.status === MissionStatus.completed);
      if (!allCompleted) {
        if (i === 0) {
          checkDate.setDate(checkDate.getDate() - 1);
          continue;
        }
        break;
      }
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
    return streak;
  }

  private async calculateLongestStreak(studentId: bigint): Promise<number> {
    // 간단히 최근 90일만 봐서 최장 연속 일수 계산
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const ninetyDaysAgo = new Date(today);
    ninetyDaysAgo.setDate(today.getDate() - 90);

    const missions = await this.prisma.dailyMission.findMany({
      where: {
        studentId,
        date: { gte: ninetyDaysAgo, lte: today },
      },
      orderBy: { date: 'asc' },
    });

    // 날짜별 그룹
    const byDate = new Map<string, { total: number; completed: number }>();
    missions.forEach((m) => {
      const key = m.date.toISOString().split('T')[0];
      const entry = byDate.get(key) || { total: 0, completed: 0 };
      entry.total++;
      if (m.status === MissionStatus.completed) entry.completed++;
      byDate.set(key, entry);
    });

    let longest = 0;
    let current = 0;
    const checkDate = new Date(ninetyDaysAgo);
    while (checkDate <= today) {
      const key = checkDate.toISOString().split('T')[0];
      const entry = byDate.get(key);
      if (entry && entry.total > 0 && entry.completed === entry.total) {
        current++;
        longest = Math.max(longest, current);
      } else if (entry && entry.total > 0) {
        current = 0;
      }
      // 미션 없는 날은 건너뜀 (주말 등)
      checkDate.setDate(checkDate.getDate() + 1);
    }
    return longest;
  }

  private calculateSubjectTrend(thisWeek: any[], lastWeek: any[]): SubjectTrend[] {
    const count = (missions: any[]) => {
      const map = new Map<string, number>();
      missions.forEach((m) => {
        const subject = m.subject || '기타';
        map.set(subject, (map.get(subject) || 0) + 1);
      });
      return map;
    };

    const thisWeekMap = count(thisWeek);
    const lastWeekMap = count(lastWeek);
    const allSubjects = new Set([...thisWeekMap.keys(), ...lastWeekMap.keys()]);

    return Array.from(allSubjects).map((subject) => {
      const tw = thisWeekMap.get(subject) || 0;
      const lw = lastWeekMap.get(subject) || 0;
      return {
        subject,
        thisWeek: tw,
        lastWeek: lw,
        change: lw > 0 ? Math.round(((tw - lw) / lw) * 100) : tw > 0 ? 100 : 0,
      };
    });
  }

  private async getWeeklyAchievements(studentId: bigint, weeks: number): Promise<number[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const thisMonday = new Date(today);
    thisMonday.setDate(today.getDate() + mondayOffset);

    const results: number[] = [];
    for (let w = weeks - 1; w >= 0; w--) {
      const weekStart = new Date(thisMonday);
      weekStart.setDate(thisMonday.getDate() - w * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      const missions = await this.prisma.dailyMission.findMany({
        where: {
          studentId,
          date: { gte: weekStart, lte: weekEnd },
        },
      });

      const total = missions.length;
      const completed = missions.filter((m) => m.status === MissionStatus.completed).length;
      results.push(total > 0 ? Math.round((completed / total) * 100) : 0);
    }
    return results;
  }

  // ─────────── AI 코칭 ───────────

  async getAICoaching(memberId: number | string) {
    const studentId = await this.getOrCreateStudent(memberId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 최근 7일 미션 + 회고 수집
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 6);

    const [missions, reflections] = await Promise.all([
      this.prisma.dailyMission.findMany({
        where: { studentId, date: { gte: weekAgo, lte: today } },
        orderBy: { date: 'asc' },
      }),
      this.prisma.dailyReflection.findMany({
        where: { studentId, date: { gte: weekAgo, lte: today } },
        orderBy: { date: 'asc' },
      }),
    ]);

    // 패턴 분석 (규칙 기반 — OpenAI 없이도 동작)
    const totalMissions = missions.length;
    const completedMissions = missions.filter((m) => m.status === MissionStatus.completed).length;
    const achievementRate =
      totalMissions > 0 ? Math.round((completedMissions / totalMissions) * 100) : 0;

    // 과목별 완료율
    const subjectStats = new Map<string, { total: number; completed: number }>();
    missions.forEach((m) => {
      const subj = m.subject || '기타';
      const entry = subjectStats.get(subj) || { total: 0, completed: 0 };
      entry.total++;
      if (m.status === MissionStatus.completed) entry.completed++;
      subjectStats.set(subj, entry);
    });

    // 가장 약한 과목
    let weakestSubject = '';
    let weakestRate = 100;
    subjectStats.forEach((stats, subj) => {
      const rate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
      if (rate < weakestRate) {
        weakestRate = rate;
        weakestSubject = subj;
      }
    });

    // 가장 강한 과목
    let strongestSubject = '';
    let strongestRate = 0;
    subjectStats.forEach((stats, subj) => {
      const rate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
      if (rate > strongestRate) {
        strongestRate = rate;
        strongestSubject = subj;
      }
    });

    // 기분 평균
    const avgMoodScore =
      reflections.length > 0
        ? reflections.reduce((sum: number, r: any) => {
            const moodScore: Record<string, number> = {
              great: 5,
              good: 4,
              okay: 3,
              bad: 2,
              terrible: 1,
            };
            return sum + (moodScore[r.mood] || 3);
          }, 0) / reflections.length
        : 3;

    // 코칭 메시지 생성
    const insights: string[] = [];
    const suggestions: string[] = [];

    if (achievementRate >= 80) {
      insights.push(`이번 주 달성률 ${achievementRate}%! 훌륭한 성과를 내고 있어요. 🎉`);
    } else if (achievementRate >= 50) {
      insights.push(
        `이번 주 달성률 ${achievementRate}%입니다. 조금만 더 힘내면 목표에 도달할 수 있어요!`,
      );
    } else if (totalMissions > 0) {
      insights.push(
        `이번 주 달성률이 ${achievementRate}%네요. 계획량을 줄여서 확실히 완주하는 전략을 추천합니다.`,
      );
      suggestions.push('일일 미션 수를 2-3개로 줄여 확실하게 완료해보세요.');
    }

    if (weakestSubject && weakestRate < 50 && totalMissions > 0) {
      insights.push(`${weakestSubject} 과목이 달성률 ${weakestRate}%로 가장 약해요.`);
      suggestions.push(`${weakestSubject} 학습 시간을 더 짧은 단위로 쪼개보세요.`);
    }

    if (strongestSubject && strongestRate > 80) {
      insights.push(`${strongestSubject}은 ${strongestRate}%로 꾸준히 잘하고 있어요! 💪`);
    }

    if (avgMoodScore < 2.5 && reflections.length >= 3) {
      insights.push('최근 기분이 좋지 않은 것 같아요. 컨디션 관리도 중요해요.');
      suggestions.push('가벼운 운동이나 취미 활동으로 기분을 전환해보세요.');
    }

    if (reflections.length === 0) {
      suggestions.push('매일 회고를 작성하면 학습 패턴을 더 잘 파악할 수 있어요.');
    }

    // 반복되는 "아쉬운 것"이 있는지 확인
    const worstThings = reflections.filter((r: any) => r.worstThing).map((r: any) => r.worstThing!);
    if (worstThings.length >= 2) {
      suggestions.push('반복되는 아쉬운 점이 있다면, 구체적인 실천 계획을 세워보세요.');
    }

    return {
      achievementRate,
      totalMissions,
      completedMissions,
      insights:
        insights.length > 0
          ? insights
          : ['아직 데이터가 부족해요. 미션을 수행하고 회고를 작성해보세요!'],
      suggestions:
        suggestions.length > 0 ? suggestions : ['매일 꾸준히 미션을 수행하는 것부터 시작해보세요.'],
      strongestSubject:
        strongestSubject && totalMissions > 0
          ? { subject: strongestSubject, rate: strongestRate }
          : null,
      weakestSubject:
        weakestSubject && totalMissions > 0 ? { subject: weakestSubject, rate: weakestRate } : null,
      moodAverage: Math.round(avgMoodScore * 10) / 10,
    };
  }
}
