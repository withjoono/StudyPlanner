/**
 * 자동 분배 유틸리티
 *
 * 장기 계획을 주간 루틴의 과목별 시간에 맞춰
 * 일일 미션으로 자동 분배합니다.
 */

import type { LongTermPlan, Routine, DailyMission, MissionStatus } from '@/types';

// ─────────────────────────────────────────────────────
// 타입 정의
// ─────────────────────────────────────────────────────

/** 과목별 주간 학습 시간 */
export interface SubjectWeeklyTime {
  subject: string;
  totalMinutes: number; // 주간 총 시간 (분)
  dailyMinutes: number[]; // 요일별 시간 [일, 월, 화, ...]
  slots: {
    dayIndex: number;
    startTime: string;
    endTime: string;
    minutes: number;
  }[];
}

/** 자동 분배 결과 */
export interface DistributionResult {
  missions: Omit<DailyMission, 'id' | 'createdAt' | 'updatedAt'>[];
  warnings: string[];
  summary: {
    totalMissions: number;
    bySubject: Record<string, number>;
    totalStudyMinutes: number;
  };
}

/** 분배 옵션 */
export interface DistributionOptions {
  startDate: Date; // 분배 시작일
  endDate: Date; // 분배 종료일
  memberId: number;
  prioritizeHighPriority?: boolean; // 우선순위 높은 계획 먼저
  skipWeekends?: boolean; // 주말 제외
}

// ─────────────────────────────────────────────────────
// 유틸리티 함수
// ─────────────────────────────────────────────────────

/** 시간 문자열을 분으로 변환 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/** 분을 시간 문자열로 변환 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/** 두 날짜 사이의 일수 계산 */
export function daysBetween(start: Date, end: Date): number {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round(Math.abs((end.getTime() - start.getTime()) / oneDay)) + 1;
}

/** 날짜 배열 생성 */
export function getDateRange(start: Date, end: Date): Date[] {
  const dates: Date[] = [];
  const current = new Date(start);

  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

// ─────────────────────────────────────────────────────
// 핵심 로직
// ─────────────────────────────────────────────────────

/**
 * 루틴에서 과목별 주간 학습 시간 추출
 */
export function extractSubjectWeeklyTime(routines: Routine[]): SubjectWeeklyTime[] {
  const subjectMap = new Map<string, SubjectWeeklyTime>();

  // 학습 루틴만 필터링
  const studyRoutines = routines.filter((r) => r.category === 'study' && r.subject);

  studyRoutines.forEach((routine) => {
    const subject = routine.subject!;
    const duration = timeToMinutes(routine.endTime) - timeToMinutes(routine.startTime);

    if (!subjectMap.has(subject)) {
      subjectMap.set(subject, {
        subject,
        totalMinutes: 0,
        dailyMinutes: [0, 0, 0, 0, 0, 0, 0],
        slots: [],
      });
    }

    const subjectTime = subjectMap.get(subject)!;

    routine.days.forEach((active, dayIndex) => {
      if (active) {
        subjectTime.totalMinutes += duration;
        subjectTime.dailyMinutes[dayIndex] += duration;
        subjectTime.slots.push({
          dayIndex,
          startTime: routine.startTime,
          endTime: routine.endTime,
          minutes: duration,
        });
      }
    });
  });

  return Array.from(subjectMap.values());
}

/**
 * 장기 계획의 일일 목표량 계산
 */
export function calculateDailyTarget(
  plan: LongTermPlan,
  subjectWeeklyTime: SubjectWeeklyTime | undefined,
  remainingDays: number,
): number {
  const remainingAmount = plan.totalAmount - plan.completedAmount;

  if (remainingDays <= 0 || remainingAmount <= 0) return 0;

  // 기본: 남은 분량 / 남은 일수
  const basicDaily = Math.ceil(remainingAmount / remainingDays);

  // 과목별 학습 시간이 설정되어 있으면 조정
  if (subjectWeeklyTime) {
    // 주당 평균 학습일 계산
    const activeDays = subjectWeeklyTime.dailyMinutes.filter((m) => m > 0).length;
    if (activeDays > 0) {
      const adjustedDays = Math.floor(remainingDays * (activeDays / 7));
      return Math.ceil(remainingAmount / Math.max(adjustedDays, 1));
    }
  }

  return basicDaily;
}

/**
 * 장기 계획을 일일 미션으로 분배
 */
export function distributePlansToMissions(
  plans: LongTermPlan[],
  routines: Routine[],
  options: DistributionOptions,
): DistributionResult {
  const warnings: string[] = [];
  const missions: Omit<DailyMission, 'id' | 'createdAt' | 'updatedAt'>[] = [];
  const summary = {
    totalMissions: 0,
    bySubject: {} as Record<string, number>,
    totalStudyMinutes: 0,
  };

  // 과목별 주간 시간 추출
  const subjectWeeklyTimes = extractSubjectWeeklyTime(routines);
  const subjectTimeMap = new Map(subjectWeeklyTimes.map((s) => [s.subject, s]));

  // 활성 계획만 필터링
  const activePlans = plans.filter((p) => p.isActive);

  // 우선순위 정렬
  if (options.prioritizeHighPriority) {
    activePlans.sort((a, b) => a.priority - b.priority);
  }

  // 분배 기간의 날짜들
  const dates = getDateRange(options.startDate, options.endDate);

  // 주말 제외 옵션
  const validDates = options.skipWeekends
    ? dates.filter((d) => d.getDay() !== 0 && d.getDay() !== 6)
    : dates;

  // 각 계획에 대해 미션 생성
  activePlans.forEach((plan) => {
    const subjectTime = subjectTimeMap.get(plan.subject);

    if (!subjectTime) {
      warnings.push(`${plan.subject} 과목의 학습 루틴이 설정되지 않았습니다.`);
    }

    // 계획 기간과 분배 기간의 교집합
    const planStart = new Date(Math.max(plan.startDate.getTime(), options.startDate.getTime()));
    const planEnd = new Date(Math.min(plan.endDate.getTime(), options.endDate.getTime()));

    if (planStart > planEnd) return; // 기간이 겹치지 않음

    const planDates = validDates.filter((d) => d >= planStart && d <= planEnd);
    const remainingAmount = plan.totalAmount - plan.completedAmount;

    if (remainingAmount <= 0 || planDates.length === 0) return;

    // 일일 목표량 계산
    const dailyTarget = calculateDailyTarget(plan, subjectTime, planDates.length);

    // 날짜별로 미션 생성
    let distributedAmount = 0;

    planDates.forEach((date, index) => {
      const dayIndex = date.getDay();

      // 해당 요일에 이 과목 루틴이 있는지 확인
      const daySlot = subjectTime?.slots.find((s) => s.dayIndex === dayIndex);

      // 루틴이 없는 요일이면 건너뜀 (옵션에 따라)
      if (subjectTime && !daySlot) return;

      // 이번 미션에서 할당할 분량
      const remainingToDistribute = remainingAmount - distributedAmount;
      const todayTarget = Math.min(
        dailyTarget,
        remainingToDistribute,
        // 마지막 날이면 남은 전부
        index === planDates.length - 1 ? remainingToDistribute : dailyTarget,
      );

      if (todayTarget <= 0) return;

      // 미션 제목 생성
      const startAmount = plan.completedAmount + distributedAmount + 1;
      const endAmount = plan.completedAmount + distributedAmount + todayTarget;
      const unit = plan.type === 'textbook' ? 'p' : '강';
      const title = `${plan.material} ${unit}.${startAmount}~${endAmount}`;

      const mission: Omit<DailyMission, 'id' | 'createdAt' | 'updatedAt'> = {
        memberId: options.memberId,
        date,
        planId: plan.id,
        subject: plan.subject,
        title,
        description: plan.title,
        targetAmount: todayTarget,
        completedAmount: 0,
        achievement: 0,
        status: 'pending' as MissionStatus,
        startTime: daySlot?.startTime,
        endTime: daySlot?.endTime,
      };

      missions.push(mission);
      distributedAmount += todayTarget;

      // 통계 업데이트
      summary.totalMissions++;
      summary.bySubject[plan.subject] = (summary.bySubject[plan.subject] || 0) + 1;
      if (daySlot) {
        summary.totalStudyMinutes += daySlot.minutes;
      }
    });

    // 미분배 경고
    if (distributedAmount < remainingAmount) {
      warnings.push(
        `${plan.title}: ${remainingAmount - distributedAmount}${plan.type === 'textbook' ? '페이지' : '강'}가 미분배되었습니다.`,
      );
    }
  });

  return { missions, warnings, summary };
}

/**
 * 특정 날짜의 미션 생성 (간단 버전)
 */
export function generateDailyMissions(
  date: Date,
  plans: LongTermPlan[],
  routines: Routine[],
  memberId: number,
): Omit<DailyMission, 'id' | 'createdAt' | 'updatedAt'>[] {
  const result = distributePlansToMissions(plans, routines, {
    startDate: date,
    endDate: date,
    memberId,
  });
  return result.missions;
}

/**
 * 주간 미션 요약 생성
 */
export function generateWeeklySummary(
  weekStart: Date,
  plans: LongTermPlan[],
  routines: Routine[],
): {
  subject: string;
  totalTarget: number;
  weeklyMissions: number;
  averageDaily: number;
}[] {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const subjectWeeklyTimes = extractSubjectWeeklyTime(routines);
  const activePlans = plans.filter((p) => p.isActive);

  return subjectWeeklyTimes.map((subjectTime) => {
    const subjectPlans = activePlans.filter((p) => p.subject === subjectTime.subject);

    let totalTarget = 0;
    subjectPlans.forEach((plan) => {
      const dailyTarget = calculateDailyTarget(plan, subjectTime, 7);
      const activeDays = subjectTime.dailyMinutes.filter((m) => m > 0).length;
      totalTarget += dailyTarget * activeDays;
    });

    const activeDays = subjectTime.dailyMinutes.filter((m) => m > 0).length;

    return {
      subject: subjectTime.subject,
      totalTarget,
      weeklyMissions: activeDays,
      averageDaily: activeDays > 0 ? Math.round(totalTarget / activeDays) : 0,
    };
  });
}

/**
 * 학습 가능 시간 계산
 */
export function calculateAvailableStudyTime(routines: Routine[]): {
  totalWeeklyMinutes: number;
  bySubject: Record<string, number>;
  byDay: number[];
  freeTimeByDay: number[];
} {
  const bySubject: Record<string, number> = {};
  const byDay = [0, 0, 0, 0, 0, 0, 0];
  const occupiedByDay = [0, 0, 0, 0, 0, 0, 0];

  routines.forEach((routine) => {
    const duration = timeToMinutes(routine.endTime) - timeToMinutes(routine.startTime);

    routine.days.forEach((active, dayIndex) => {
      if (active) {
        occupiedByDay[dayIndex] += duration;

        if (routine.category === 'study' && routine.subject) {
          bySubject[routine.subject] = (bySubject[routine.subject] || 0) + duration;
          byDay[dayIndex] += duration;
        }
      }
    });
  });

  // 빈 시간 = 하루 시간 - 점유 시간 (6시~24시 기준 = 18시간 = 1080분)
  const ACTIVE_HOURS = 18 * 60;
  const freeTimeByDay = occupiedByDay.map((occupied) => Math.max(0, ACTIVE_HOURS - occupied));

  return {
    totalWeeklyMinutes: Object.values(bySubject).reduce((a, b) => a + b, 0),
    bySubject,
    byDay,
    freeTimeByDay,
  };
}
