/**
 * 플래너 Mock 데이터
 *
 * 실제 API 연결 전 테스트용 더미 데이터
 */

import type { PlannerItem, Routine, LongTermPlan, WeeklyProgress } from '@/types/planner';

// 오늘 날짜 기준
const today = new Date();
const todayStr = today.toISOString().split('T')[0];

// ================================================================
// 교재 DB Mock 데이터
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

// 교재 DB - 수학의 정석
export const mockMaterials: Material[] = [
  {
    id: 1,
    materialCode: 'M-MATH-001',
    category: 'reference',
    subjectCode: 'math',
    grade: 'H1',
    name: '수학의 정석 (기본편)',
    publisher: '성지출판',
    author: '홍성대',
    year: 2024,
    totalPages: 456,
    estimatedHours: 120,
    difficulty: 3,
    description: '고등 수학 기본서의 정석',
    chapters: [
      {
        id: 1,
        materialId: 1,
        chapterNumber: 1,
        title: '다항식',
        startPage: 8,
        endPage: 72,
        pageCount: 64,
        estimatedTime: 480, // 8시간
        sections: [
          {
            id: 1,
            chapterId: 1,
            sectionNumber: 1,
            title: '다항식의 연산',
            startPage: 8,
            endPage: 24,
            pageCount: 16,
          },
          {
            id: 2,
            chapterId: 1,
            sectionNumber: 2,
            title: '항등식과 나머지 정리',
            startPage: 25,
            endPage: 48,
            pageCount: 23,
          },
          {
            id: 3,
            chapterId: 1,
            sectionNumber: 3,
            title: '인수분해',
            startPage: 49,
            endPage: 72,
            pageCount: 23,
          },
        ],
      },
      {
        id: 2,
        materialId: 1,
        chapterNumber: 2,
        title: '방정식과 부등식',
        startPage: 73,
        endPage: 156,
        pageCount: 83,
        estimatedTime: 600, // 10시간
        sections: [
          {
            id: 4,
            chapterId: 2,
            sectionNumber: 1,
            title: '복소수',
            startPage: 73,
            endPage: 96,
            pageCount: 23,
          },
          {
            id: 5,
            chapterId: 2,
            sectionNumber: 2,
            title: '이차방정식',
            startPage: 97,
            endPage: 128,
            pageCount: 31,
          },
          {
            id: 6,
            chapterId: 2,
            sectionNumber: 3,
            title: '이차함수와 이차방정식',
            startPage: 129,
            endPage: 156,
            pageCount: 27,
          },
        ],
      },
      {
        id: 3,
        materialId: 1,
        chapterNumber: 3,
        title: '도형의 방정식',
        startPage: 157,
        endPage: 260,
        pageCount: 103,
        estimatedTime: 720, // 12시간
        sections: [
          {
            id: 7,
            chapterId: 3,
            sectionNumber: 1,
            title: '점과 좌표',
            startPage: 157,
            endPage: 180,
            pageCount: 23,
          },
          {
            id: 8,
            chapterId: 3,
            sectionNumber: 2,
            title: '직선의 방정식',
            startPage: 181,
            endPage: 216,
            pageCount: 35,
          },
          {
            id: 9,
            chapterId: 3,
            sectionNumber: 3,
            title: '원의 방정식',
            startPage: 217,
            endPage: 260,
            pageCount: 43,
          },
        ],
      },
      {
        id: 4,
        materialId: 1,
        chapterNumber: 4,
        title: '집합과 명제',
        startPage: 261,
        endPage: 340,
        pageCount: 79,
        estimatedTime: 540, // 9시간
        sections: [
          {
            id: 10,
            chapterId: 4,
            sectionNumber: 1,
            title: '집합',
            startPage: 261,
            endPage: 296,
            pageCount: 35,
          },
          {
            id: 11,
            chapterId: 4,
            sectionNumber: 2,
            title: '명제',
            startPage: 297,
            endPage: 340,
            pageCount: 43,
          },
        ],
      },
      {
        id: 5,
        materialId: 1,
        chapterNumber: 5,
        title: '함수',
        startPage: 341,
        endPage: 456,
        pageCount: 115,
        estimatedTime: 780, // 13시간
        sections: [
          {
            id: 12,
            chapterId: 5,
            sectionNumber: 1,
            title: '함수',
            startPage: 341,
            endPage: 380,
            pageCount: 39,
          },
          {
            id: 13,
            chapterId: 5,
            sectionNumber: 2,
            title: '유리함수와 무리함수',
            startPage: 381,
            endPage: 420,
            pageCount: 39,
          },
          {
            id: 14,
            chapterId: 5,
            sectionNumber: 3,
            title: '경우의 수',
            startPage: 421,
            endPage: 456,
            pageCount: 35,
          },
        ],
      },
    ],
  },
  {
    id: 2,
    materialCode: 'M-KOR-001',
    category: 'textbook',
    subjectCode: 'korean',
    grade: 'H3',
    name: '수능특강 국어영역',
    publisher: 'EBS',
    year: 2025,
    totalPages: 320,
    estimatedHours: 80,
    difficulty: 4,
    description: '2025 수능 대비 국어영역 교재',
    chapters: [
      {
        id: 6,
        materialId: 2,
        chapterNumber: 1,
        title: '문학 - 현대시',
        startPage: 8,
        endPage: 72,
        pageCount: 64,
        estimatedTime: 360,
        sections: [
          {
            id: 15,
            chapterId: 6,
            sectionNumber: 1,
            title: '현대시 1~10',
            startPage: 8,
            endPage: 40,
            pageCount: 32,
          },
          {
            id: 16,
            chapterId: 6,
            sectionNumber: 2,
            title: '현대시 11~20',
            startPage: 41,
            endPage: 72,
            pageCount: 31,
          },
        ],
      },
      {
        id: 7,
        materialId: 2,
        chapterNumber: 2,
        title: '문학 - 고전시가',
        startPage: 73,
        endPage: 128,
        pageCount: 55,
        estimatedTime: 300,
        sections: [
          {
            id: 17,
            chapterId: 7,
            sectionNumber: 1,
            title: '고전시가 1~8',
            startPage: 73,
            endPage: 100,
            pageCount: 27,
          },
          {
            id: 18,
            chapterId: 7,
            sectionNumber: 2,
            title: '고전시가 9~16',
            startPage: 101,
            endPage: 128,
            pageCount: 27,
          },
        ],
      },
      {
        id: 8,
        materialId: 2,
        chapterNumber: 3,
        title: '독서 - 인문/예술',
        startPage: 129,
        endPage: 200,
        pageCount: 71,
        estimatedTime: 420,
        sections: [
          {
            id: 19,
            chapterId: 8,
            sectionNumber: 1,
            title: '인문 지문',
            startPage: 129,
            endPage: 164,
            pageCount: 35,
          },
          {
            id: 20,
            chapterId: 8,
            sectionNumber: 2,
            title: '예술 지문',
            startPage: 165,
            endPage: 200,
            pageCount: 35,
          },
        ],
      },
    ],
  },
  {
    id: 3,
    materialCode: 'M-ENG-001',
    category: 'lecture',
    subjectCode: 'english',
    grade: 'H2',
    name: '이투스 영어 구문독해',
    publisher: '이투스',
    author: '김기훈',
    year: 2024,
    totalLectures: 48,
    totalDuration: 2880, // 48시간
    estimatedHours: 60,
    difficulty: 3,
    description: '수능 영어 구문독해 완성',
    chapters: [
      {
        id: 9,
        materialId: 3,
        chapterNumber: 1,
        title: '문장의 기본 구조',
        lectureCount: 12,
        durationMinutes: 720,
        estimatedTime: 900,
        sections: [
          { id: 21, chapterId: 9, sectionNumber: 1, title: '주어와 동사', durationMinutes: 60 },
          { id: 22, chapterId: 9, sectionNumber: 2, title: '목적어와 보어', durationMinutes: 60 },
          { id: 23, chapterId: 9, sectionNumber: 3, title: '문장의 5형식', durationMinutes: 120 },
        ],
      },
      {
        id: 10,
        materialId: 3,
        chapterNumber: 2,
        title: '수식어구',
        lectureCount: 16,
        durationMinutes: 960,
        estimatedTime: 1200,
        sections: [
          { id: 24, chapterId: 10, sectionNumber: 1, title: '형용사와 부사', durationMinutes: 120 },
          { id: 25, chapterId: 10, sectionNumber: 2, title: '분사', durationMinutes: 180 },
          { id: 26, chapterId: 10, sectionNumber: 3, title: '관계사', durationMinutes: 240 },
        ],
      },
      {
        id: 11,
        materialId: 3,
        chapterNumber: 3,
        title: '특수 구문',
        lectureCount: 20,
        durationMinutes: 1200,
        estimatedTime: 1500,
        sections: [
          { id: 27, chapterId: 11, sectionNumber: 1, title: '비교 구문', durationMinutes: 180 },
          { id: 28, chapterId: 11, sectionNumber: 2, title: '가정법', durationMinutes: 240 },
          { id: 29, chapterId: 11, sectionNumber: 3, title: '도치와 강조', durationMinutes: 180 },
        ],
      },
    ],
  },
  {
    id: 4,
    materialCode: 'M-SCI-001',
    category: 'reference',
    subjectCode: 'science',
    grade: 'H2',
    name: '물리학 I 개념완성',
    publisher: '비상교육',
    year: 2024,
    totalPages: 280,
    estimatedHours: 70,
    difficulty: 4,
    description: '물리학 I 핵심 개념 완성',
    chapters: [
      {
        id: 12,
        materialId: 4,
        chapterNumber: 1,
        title: '역학과 에너지',
        startPage: 8,
        endPage: 96,
        pageCount: 88,
        estimatedTime: 540,
        sections: [
          {
            id: 30,
            chapterId: 12,
            sectionNumber: 1,
            title: '힘과 운동',
            startPage: 8,
            endPage: 48,
            pageCount: 40,
          },
          {
            id: 31,
            chapterId: 12,
            sectionNumber: 2,
            title: '에너지와 열',
            startPage: 49,
            endPage: 96,
            pageCount: 47,
          },
        ],
      },
      {
        id: 13,
        materialId: 4,
        chapterNumber: 2,
        title: '물질과 전자기장',
        startPage: 97,
        endPage: 188,
        pageCount: 91,
        estimatedTime: 600,
        sections: [
          {
            id: 32,
            chapterId: 13,
            sectionNumber: 1,
            title: '물질의 전기적 특성',
            startPage: 97,
            endPage: 140,
            pageCount: 43,
          },
          {
            id: 33,
            chapterId: 13,
            sectionNumber: 2,
            title: '물질의 자기적 특성',
            startPage: 141,
            endPage: 188,
            pageCount: 47,
          },
        ],
      },
    ],
  },
];

// ================================================================
// 주간 루틴 Mock 데이터
// ================================================================

export const mockRoutines: Routine[] = [
  {
    id: 1,
    title: '아침 기상',
    majorCategory: 'schedule',
    startTime: '06:30',
    endTime: '07:00',
    days: [false, true, true, true, true, true, false],
    repeat: true,
    startDate: '2025-01-06',
    endDate: '2025-03-30',
  },
  {
    id: 2,
    title: '아침 영어 단어',
    majorCategory: 'self_study',
    subject: '영어',
    startTime: '07:00',
    endTime: '08:00',
    days: [false, true, true, true, true, true, false],
    repeat: true,
    startDate: '2025-01-06',
    endDate: '2025-03-30',
  },
  {
    id: 3,
    title: '학교 수업',
    majorCategory: 'class',
    subject: '기타',
    startTime: '08:00',
    endTime: '15:00',
    days: [false, true, true, true, true, true, false],
    repeat: true,
    startDate: '2025-01-06',
    endDate: '2025-03-30',
  },
  {
    id: 4,
    title: '수학 문제 풀이',
    majorCategory: 'self_study',
    subject: '수학',
    startTime: '16:00',
    endTime: '18:00',
    days: [false, true, true, true, true, true, false],
    repeat: true,
    startDate: '2025-01-06',
    endDate: '2025-03-30',
  },
  {
    id: 5,
    title: '저녁 운동',
    majorCategory: 'exercise',
    startTime: '18:00',
    endTime: '19:00',
    days: [true, true, true, true, true, true, true],
    repeat: true,
    startDate: '2025-01-06',
    endDate: '2025-03-30',
  },
  {
    id: 6,
    title: '국어 인강',
    majorCategory: 'class',
    subject: '국어',
    startTime: '19:00',
    endTime: '21:00',
    days: [false, true, false, true, false, true, false],
    repeat: true,
    startDate: '2025-01-06',
    endDate: '2025-03-30',
  },
  {
    id: 7,
    title: '과학 자습',
    majorCategory: 'self_study',
    subject: '과학',
    startTime: '19:00',
    endTime: '21:00',
    days: [false, false, true, false, true, false, false],
    repeat: true,
    startDate: '2025-01-06',
    endDate: '2025-03-30',
  },
];

// ================================================================
// 장기 계획 Mock 데이터 (교재 연결)
// ================================================================

export interface ExtendedLongTermPlan extends LongTermPlan {
  materialId?: number;
  startPage?: number;
  endPage?: number;
  isDistributed?: boolean;
  nWeeks?: number;
}

export const mockPlans: ExtendedLongTermPlan[] = [
  {
    id: 1,
    title: '수학의 정석 1~3장',
    subject: '수학',
    type: 'textbook',
    material: '수학의 정석 (기본편)',
    materialId: 1,
    startPage: 8,
    endPage: 260,
    totalAmount: 252, // 252페이지
    completedAmount: 64, // 1장 완료
    startDate: '2025-01-06',
    endDate: '2025-03-30',
    dailyTarget: 8,
    weeklyTarget: 24,
    isDistributed: true,
  },
  {
    id: 2,
    title: '수능특강 국어 문학',
    subject: '국어',
    type: 'textbook',
    material: '수능특강 국어영역',
    materialId: 2,
    startPage: 8,
    endPage: 128,
    totalAmount: 120,
    completedAmount: 40,
    startDate: '2025-01-06',
    endDate: '2025-02-28',
    dailyTarget: 4,
    weeklyTarget: 20,
    isDistributed: true,
  },
  {
    id: 3,
    title: '영어 구문독해 완성',
    subject: '영어',
    type: 'lecture',
    material: '이투스 영어 구문독해',
    materialId: 3,
    totalAmount: 48, // 48강
    completedAmount: 12, // 12강 완료
    startDate: '2025-01-06',
    endDate: '2025-03-30',
    dailyTarget: 1,
    weeklyTarget: 4,
    isDistributed: true,
  },
];

// ================================================================
// 자동 분배 알고리즘 (주 단위 기반)
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
  // 주 단위 분배 정보
  weekNumber?: number;
  weeklyTarget?: number;
}

// ── 유틸 함수 ──

/** 시간 문자열("HH:MM")을 분(minutes)으로 변환 */
function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/** 루틴의 학습 시간(분)을 계산 */
function getRoutineDuration(routine: Routine): number {
  return timeToMinutes(routine.endTime) - timeToMinutes(routine.startTime);
}

/** startDate 이후 첫 번째 월요일 (startDate가 월요일이면 그대로) */
function getFirstMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=일, 1=월 ...
  const diff = day === 0 ? 1 : day === 1 ? 0 : 8 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

// ── 요일별 학습 시간 정보 ──

interface DayStudySlot {
  dayOfWeek: number; // 0=일, 1=월, ...
  routine: Routine;
  minutes: number; // 학습 시간(분)
}

/**
 * 해당 과목의 자습 루틴에서 요일별 학습 시간 슬롯을 추출
 */
function getSubjectDaySlots(
  subject: string,
  routines: Routine[],
): { slots: DayStudySlot[]; totalMinutes: number } {
  // 해당 과목의 자습 루틴 찾기
  const subjectRoutines = routines.filter(
    (r) => r.majorCategory === 'self_study' && (r.subject === subject || r.subject === '기타'),
  );

  const slots: DayStudySlot[] = [];
  for (const routine of subjectRoutines) {
    const minutes = getRoutineDuration(routine);
    for (let dow = 0; dow < 7; dow++) {
      if (routine.days[dow]) {
        // 이미 같은 요일에 슬롯이 있으면 시간을 합산
        const existing = slots.find((s) => s.dayOfWeek === dow);
        if (existing) {
          existing.minutes += minutes;
        } else {
          slots.push({ dayOfWeek: dow, routine, minutes });
        }
      }
    }
  }

  // 요일 순서로 정렬 (월=1 부터, 일=0 은 맨 뒤)
  slots.sort((a, b) => {
    const aOrder = a.dayOfWeek === 0 ? 7 : a.dayOfWeek;
    const bOrder = b.dayOfWeek === 0 ? 7 : b.dayOfWeek;
    return aOrder - bOrder;
  });

  const totalMinutes = slots.reduce((sum, s) => sum + s.minutes, 0);
  return { slots, totalMinutes };
}

// ── 핵심 분배 함수 ──

/**
 * 장기 계획을 주 단위로 나누어 일간 미션으로 자동 분배
 *
 * 알고리즘:
 * 1. 시작일부터 첫 월요일을 찾아 주 단위로 나눔 (짜투리 날 버림)
 * 2. 주간 할당량 = 총 할일 / n주
 * 3. 해당 과목 자습 루틴의 요일별 학습 시간 비율로 일별 분배
 *    예) 월 3시간, 수 2시간 → 월 3/5, 수 2/5
 */
export function distributePlanToMissions(
  plan: ExtendedLongTermPlan,
  routines: Routine[],
  startDate: Date,
  endDate: Date,
): DailyMission[] {
  const missions: DailyMission[] = [];

  // 1. 해당 과목의 요일별 학습 슬롯 추출
  const { slots, totalMinutes } = getSubjectDaySlots(plan.subject || '기타', routines);
  if (slots.length === 0 || totalMinutes === 0) return missions;

  // 2. 주 단위 계산 (월요일 시작, 짜투리 버림)
  const firstMonday = getFirstMonday(startDate);
  const totalDays = Math.floor((endDate.getTime() - firstMonday.getTime()) / (1000 * 60 * 60 * 24));
  const nWeeks = Math.floor(totalDays / 7);
  if (nWeeks <= 0) return missions;

  // 3. 주간 할당량
  const totalAmount = plan.totalAmount || (plan.endPage || 0) - (plan.startPage || 0);
  const weeklyAmount = Math.ceil(totalAmount / nWeeks);

  // 4. 각 주별로 미션 생성
  let missionId = 1000 + plan.id * 10000;
  let currentPage = plan.startPage || 1;
  const lastPage = plan.endPage || (plan.startPage || 1) + totalAmount;

  for (let week = 0; week < nWeeks; week++) {
    if (currentPage >= lastPage) break;

    const weekStart = new Date(firstMonday);
    weekStart.setDate(firstMonday.getDate() + week * 7);

    // 이 주에 남은 분량 (마지막 주는 남은 전부)
    const remainingTotal = lastPage - currentPage;
    const thisWeekAmount = Math.min(weeklyAmount, remainingTotal);

    // 요일별 분배 (학습 시간 비율)
    let distributed = 0;
    const dayAmounts: { slot: DayStudySlot; amount: number; date: Date }[] = [];

    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      const ratio = slot.minutes / totalMinutes;

      // 마지막 슬롯에서 나머지 전부 할당 (반올림 보정)
      const isLast = i === slots.length - 1;
      const dayAmount = isLast ? thisWeekAmount - distributed : Math.round(thisWeekAmount * ratio);

      if (dayAmount <= 0) continue;

      // 해당 요일의 날짜 계산
      const dayDate = new Date(weekStart);
      const targetDow = slot.dayOfWeek;
      const mondayDow = 1;
      const dayDiff = targetDow >= mondayDow ? targetDow - mondayDow : targetDow + 7 - mondayDow;
      dayDate.setDate(weekStart.getDate() + dayDiff);

      // endDate를 초과하면 스킵
      if (dayDate > endDate) continue;

      dayAmounts.push({ slot, amount: dayAmount, date: dayDate });
      distributed += dayAmount;
    }

    // 미션 생성
    for (const { slot, amount, date } of dayAmounts) {
      if (currentPage >= lastPage) break;

      const actualAmount = Math.min(amount, lastPage - currentPage);
      const nextPage = currentPage + actualAmount;
      const dateStr = date.toISOString().split('T')[0];

      missions.push({
        id: missionId++,
        planId: plan.id,
        routineId: slot.routine.id,
        date: dateStr,
        startTime: slot.routine.startTime,
        endTime: slot.routine.endTime,
        subject: plan.subject || '기타',
        title: `${plan.material || plan.title} 학습`,
        content:
          plan.type === 'textbook'
            ? `p.${currentPage}~${nextPage}`
            : `${currentPage}강~${nextPage}강`,
        startPage: currentPage,
        endPage: nextPage,
        amount: actualAmount,
        status: 'pending',
        progress: 0,
        weekNumber: week + 1,
        weeklyTarget: thisWeekAmount,
      });

      currentPage = nextPage;
    }
  }

  return missions;
}

// 생성된 미션 (장기계획 기반)
const planStartDate = new Date('2025-01-06');
const planEndDate = new Date('2025-03-30');

export const mockDailyMissions: DailyMission[] = [
  ...mockPlans.flatMap((plan) =>
    distributePlanToMissions(plan, mockRoutines, planStartDate, planEndDate),
  ),
];

// ================================================================
// 플래너 아이템 (대시보드용)
// ================================================================

export const mockPlannerItems: PlannerItem[] = [
  {
    id: 1,
    memberId: 1,
    primaryType: '학습',
    subject: '수학',
    title: '수학의 정석 p.65~72',
    startDate: new Date(`${todayStr}T16:00:00`),
    endDate: new Date(`${todayStr}T18:00:00`),
    progress: 75,
  },
  {
    id: 2,
    memberId: 1,
    primaryType: '학습',
    subject: '영어',
    title: '아침 영어 단어',
    startDate: new Date(`${todayStr}T07:00:00`),
    endDate: new Date(`${todayStr}T08:00:00`),
    progress: 100,
    mentorRank: 5,
    mentorDesc: '아주 잘했습니다! 꾸준히 하세요.',
  },
  {
    id: 3,
    memberId: 1,
    primaryType: '수업',
    subject: '국어',
    teacher: '김선생',
    title: '국어 인강 13강~14강',
    startDate: new Date(`${todayStr}T19:00:00`),
    endDate: new Date(`${todayStr}T21:00:00`),
    progress: 50,
  },
  {
    id: 4,
    memberId: 1,
    primaryType: '학습',
    subject: '과학',
    title: '물리학 I p.97~104',
    startDate: new Date(`${todayStr}T19:00:00`),
    endDate: new Date(`${todayStr}T21:00:00`),
    progress: 0,
  },
];

// ================================================================
// 기타 Mock 데이터
// ================================================================

export const mockWeeklyProgress: WeeklyProgress[] = [
  {
    primaryType: '학습',
    memberId: 1,
    startDateDay: todayStr,
    comnCd: 1,
    comnNm: 'Monday',
    avgProgress: 85,
  },
  {
    primaryType: '학습',
    memberId: 1,
    startDateDay: todayStr,
    comnCd: 2,
    comnNm: 'Tuesday',
    avgProgress: 72,
  },
  {
    primaryType: '학습',
    memberId: 1,
    startDateDay: todayStr,
    comnCd: 3,
    comnNm: 'Wednesday',
    avgProgress: 90,
  },
  {
    primaryType: '학습',
    memberId: 1,
    startDateDay: todayStr,
    comnCd: 4,
    comnNm: 'Thursday',
    avgProgress: 65,
  },
  {
    primaryType: '학습',
    memberId: 1,
    startDateDay: todayStr,
    comnCd: 5,
    comnNm: 'Friday',
    avgProgress: 78,
  },
  {
    primaryType: '학습',
    memberId: 1,
    startDateDay: todayStr,
    comnCd: 6,
    comnNm: 'Saturday',
    avgProgress: 45,
  },
  {
    primaryType: '학습',
    memberId: 1,
    startDateDay: todayStr,
    comnCd: 7,
    comnNm: 'Sunday',
    avgProgress: 30,
  },
];

export const mockDashboard = {
  totalMissions: mockPlannerItems.length,
  completedMissions: mockPlannerItems.filter((i) => i.progress >= 100).length,
  avgAchievement: Math.round(
    mockPlannerItems.reduce((sum, i) => sum + i.progress, 0) / mockPlannerItems.length,
  ),
  todayMissions: mockPlannerItems.map((item) => ({
    id: item.id,
    subject: item.subject,
    title: item.title,
    progress: item.progress,
  })),
  rank: {
    myRank: 5,
    totalStudents: 30,
    weeklyAchievement: 78,
    dailyAchievement: 65,
    monthlyAchievement: 72,
  },
};

export const mockNotices = [
  { id: 1, title: '12월 모의고사 일정 안내', date: '2025-12-10', isImportant: true },
  { id: 2, title: '겨울방학 특강 신청', date: '2025-12-08', isImportant: false },
  { id: 3, title: '학습 플래너 업데이트', date: '2025-12-05', isImportant: false },
];

export const mockMentors = [
  { id: 1, name: '김멘토', subject: '수학' },
  { id: 2, name: '이멘토', subject: '영어' },
];
