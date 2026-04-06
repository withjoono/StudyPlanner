/**
 * 플래너 확장 타입 정의
 *
 * 교재, 일간 미션 등 프론트엔드 전용 타입
 */

import type { Routine, LongTermPlan } from '@/types/planner';

// ================================================================
// 교재 DB 타입
// ================================================================

export interface MaterialChapter {
  id: number;
  materialId: number;
  chapterNumber: number;
  title: string;
  startPage?: number;
  endPage?: number;
  pageCount?: number;
  lectureCount?: number;
  durationMinutes?: number;
  estimatedTime?: number;
  sections?: MaterialSection[];
}

export interface MaterialSection {
  id: number;
  chapterId: number;
  sectionNumber: number;
  title: string;
  startPage?: number;
  endPage?: number;
  pageCount?: number;
  durationMinutes?: number;
}

export interface Material {
  id: number;
  materialCode: string;
  category: 'textbook' | 'reference' | 'lecture';
  subjectCode: string;
  grade?: string;
  name: string;
  publisher?: string;
  author?: string;
  year?: number;
  totalPages?: number;
  totalLectures?: number;
  totalDuration?: number;
  estimatedHours?: number;
  difficulty?: number;
  description?: string;
  coverImage?: string;
  chapters: MaterialChapter[];
}

// ================================================================
// 장기 계획 확장 타입
// ================================================================

export interface ExtendedLongTermPlan extends LongTermPlan {
  materialId?: number;
  startPage?: number;
  endPage?: number;
  isDistributed?: boolean;
  nWeeks?: number;
}

// ================================================================
// 일간 미션 타입
// ================================================================

export interface DailyMission {
  id: number;
  planId: number;
  routineId?: number;
  date: string;
  startTime: string;
  endTime: string;
  subject: string;
  title: string;
  content: string;
  startPage?: number;
  endPage?: number;
  amount: number;
  status: 'pending' | 'completed' | 'skipped';
  progress: number;
  weekNumber?: number;
  weeklyTarget?: number;
  // 결과 필드
  resultStartPage?: number;
  resultEndPage?: number;
  resultMemo?: string;
}

// ================================================================
// 자동 분배 알고리즘 유틸리티
// ================================================================

/** 시간 문자열("HH:MM")을 분(minutes)으로 변환 */
function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/** 루틴의 학습 시간(분)을 계산 */
function getRoutineDuration(routine: Routine): number {
  return timeToMinutes(routine.endTime) - timeToMinutes(routine.startTime);
}

/** startDate 이후 첫 번째 월요일 */
function getFirstMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? 1 : day === 1 ? 0 : 8 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

interface DayStudySlot {
  dayOfWeek: number;
  routine: Routine;
  minutes: number;
}

function getSubjectDaySlots(
  subject: string,
  routines: Routine[],
): { slots: DayStudySlot[]; totalMinutes: number } {
  const subjectRoutines = routines.filter(
    (r) => r.majorCategory === 'self_study' && (r.subject === subject || r.subject === '기타'),
  );

  const slots: DayStudySlot[] = [];
  for (const routine of subjectRoutines) {
    const minutes = getRoutineDuration(routine);
    for (let dow = 0; dow < 7; dow++) {
      if (routine.days[dow]) {
        const existing = slots.find((s) => s.dayOfWeek === dow);
        if (existing) {
          existing.minutes += minutes;
        } else {
          slots.push({ dayOfWeek: dow, routine, minutes });
        }
      }
    }
  }

  slots.sort((a, b) => {
    const aOrder = a.dayOfWeek === 0 ? 7 : a.dayOfWeek;
    const bOrder = b.dayOfWeek === 0 ? 7 : b.dayOfWeek;
    return aOrder - bOrder;
  });

  const totalMinutes = slots.reduce((sum, s) => sum + s.minutes, 0);
  return { slots, totalMinutes };
}

/**
 * 장기 계획을 주 단위로 나누어 일간 미션으로 자동 분배
 */
export function distributePlanToMissions(
  plan: ExtendedLongTermPlan,
  routines: Routine[],
  startDate: Date,
  endDate: Date,
): DailyMission[] {
  const missions: DailyMission[] = [];

  const { slots, totalMinutes } = getSubjectDaySlots(plan.subject || '기타', routines);
  if (slots.length === 0 || totalMinutes === 0) return missions;

  const firstMonday = getFirstMonday(startDate);
  const totalDays = Math.floor((endDate.getTime() - firstMonday.getTime()) / (1000 * 60 * 60 * 24));
  const nWeeks = Math.floor(totalDays / 7);
  if (nWeeks <= 0) return missions;

  const totalAmount = plan.totalAmount || (plan.endPage || 0) - (plan.startPage || 0);
  const weeklyAmount = Math.ceil(totalAmount / nWeeks);

  let missionId = 1000 + plan.id * 10000;
  let currentPage = plan.startPage || 1;
  const lastPage = plan.endPage || (plan.startPage || 1) + totalAmount;

  for (let week = 0; week < nWeeks; week++) {
    if (currentPage >= lastPage) break;

    const weekStart = new Date(firstMonday);
    weekStart.setDate(firstMonday.getDate() + week * 7);

    let weekRemaining = weeklyAmount;

    for (const slot of slots) {
      if (currentPage >= lastPage || weekRemaining <= 0) break;

      const missionDate = new Date(weekStart);
      const dayOffset =
        slot.dayOfWeek >= weekStart.getDay()
          ? slot.dayOfWeek - weekStart.getDay()
          : 7 - weekStart.getDay() + slot.dayOfWeek;
      missionDate.setDate(weekStart.getDate() + dayOffset);

      if (missionDate > endDate) break;

      const dayRatio = slot.minutes / totalMinutes;
      const dayAmount = Math.max(1, Math.round(weeklyAmount * dayRatio));
      const actualAmount = Math.min(dayAmount, weekRemaining, lastPage - currentPage);

      if (actualAmount <= 0) continue;

      const missionStartPage = currentPage;
      const missionEndPage = currentPage + actualAmount;

      const isLecture = plan.type === 'lecture';

      missions.push({
        id: missionId++,
        planId: plan.id,
        routineId: slot.routine.id,
        date: missionDate.toISOString().split('T')[0],
        startTime: slot.routine.startTime,
        endTime: slot.routine.endTime,
        subject: plan.subject || '기타',
        title: plan.title || '학습',
        content: isLecture
          ? `${missionStartPage}~${missionEndPage}강`
          : `p.${missionStartPage}~${missionEndPage}`,
        startPage: missionStartPage,
        endPage: missionEndPage,
        amount: actualAmount,
        status: 'pending',
        progress: 0,
        weekNumber: week + 1,
        weeklyTarget: weeklyAmount,
      });

      currentPage += actualAmount;
      weekRemaining -= actualAmount;
    }
  }

  return missions;
}
