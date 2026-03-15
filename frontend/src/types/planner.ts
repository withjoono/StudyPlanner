// =====================================================
// 플래너 관련 타입 정의
// =====================================================

// ─────────────────────────────────────────────────────
// 상수 정의
// ─────────────────────────────────────────────────────

/** 과목 색상 매핑 */
export const SUBJECT_COLORS: Record<string, string> = {
  // 주요 교과
  국어: '#ef4444', // red
  수학: '#eab308', // yellow
  영어: '#f97316', // orange
  사회: '#3b82f6', // blue
  과학: '#14b8a6', // teal
  한국사: '#a855f7', // purple

  // 사탐/과탐 통합
  사탐: '#2563eb', // blue-600
  과탐: '#0d9488', // teal-600

  // 국어 세부
  공통국어1: '#dc2626', // red-600
  공통국어2: '#b91c1c', // red-700
  문학: '#e11d48', // rose-600
  독서: '#f43f5e', // rose-500
  화법과작문: '#fb7185', // rose-400
  언어와매체: '#be123c', // rose-700

  // 수학 세부
  수학1: '#ca8a04', // yellow-600
  수학2: '#a16207', // yellow-700
  확률과통계: '#d97706', // amber-600
  미적분: '#b45309', // amber-700
  기하: '#92400e', // amber-800

  // 영어 세부
  영어1: '#ea580c', // orange-600
  영어2: '#c2410c', // orange-700

  // 사회 세부
  생활과윤리: '#1d4ed8', // blue-700
  윤리와사상: '#1e40af', // blue-800
  한국지리: '#2563eb', // blue-600
  세계지리: '#3730a3', // indigo-800
  동아시아사: '#4f46e5', // indigo-600
  세계사: '#6366f1', // indigo-500
  정치와법: '#7c3aed', // violet-600
  경제: '#6d28d9', // violet-700
  사회문화: '#4338ca', // indigo-700

  // 과학 세부
  통합과학: '#0f766e', // teal-700
  물리학1: '#0891b2', // cyan-600
  물리학2: '#0e7490', // cyan-700
  화학1: '#059669', // emerald-600
  화학2: '#047857', // emerald-700
  생명과학1: '#16a34a', // green-600
  생명과학2: '#15803d', // green-700
  지구과학1: '#0284c7', // sky-600
  지구과학2: '#0369a1', // sky-700

  // 예체능 & 기타
  음악: '#c026d3', // fuchsia-600
  미술: '#db2777', // pink-600
  체육: '#65a30d', // lime-600
  기술가정: '#78716c', // stone-500
  정보: '#06b6d4', // cyan-500
  제2외국어: '#6366f1', // indigo-500
  한문: '#9333ea', // purple-600
  기타: '#6b7280', // gray-500
};

/** 과목 이름에 대한 고유 색상 반환 (매핑에 없으면 해시 기반 HSL 생성) */
export function getSubjectColor(subject: string): string {
  if (SUBJECT_COLORS[subject]) return SUBJECT_COLORS[subject];
  // 문자열 해시 → 고유 Hue 생성
  let hash = 0;
  for (let i = 0; i < subject.length; i++) {
    hash = subject.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = ((hash % 360) + 360) % 360;
  return `hsl(${hue}, 65%, 50%)`;
}

/** 루틴 카테고리 색상 */
export const ROUTINE_CATEGORY_COLORS: Record<RoutineCategory, string> = {
  fixed: '#64748b', // slate (고정 일과)
  study: '#f97316', // orange (학습)
  rest: '#22c55e', // green (휴식)
  other: '#a855f7', // purple (기타)
};

/** 대분류 라벨 */
export const MAJOR_CATEGORY_LABELS: Record<RoutineMajorCategory, string> = {
  class: '수업',
  self_study: '자습',
  exercise: '운동',
  schedule: '일정',
};

/** 대분류 색상 */
export const MAJOR_CATEGORY_COLORS: Record<
  RoutineMajorCategory,
  { bg: string; border: string; text: string }
> = {
  class: { bg: 'bg-blue-500', border: 'border-blue-600', text: 'text-blue-600' },
  self_study: { bg: 'bg-orange-500', border: 'border-orange-600', text: 'text-orange-600' },
  exercise: { bg: 'bg-green-500', border: 'border-green-600', text: 'text-green-600' },
  schedule: { bg: 'bg-slate-500', border: 'border-slate-600', text: 'text-slate-600' },
};

/** 요일 */
export const DAYS = ['일', '월', '화', '수', '목', '금', '토'] as const;

/** 요일 (영문) */
export const DAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

/** 기간 유형 라벨 */
export const PERIOD_TYPE_LABELS: Record<PeriodType, string> = {
  year: '년간',
  semester: '학기',
  vacation: '방학',
  month: '월간',
  custom: '사용자 정의',
};

// ─────────────────────────────────────────────────────
// 기본 타입
// ─────────────────────────────────────────────────────

// 대분류: 수업, 자습, 운동, 일정
export type RoutineMajorCategory = 'class' | 'self_study' | 'exercise' | 'schedule';

// 기존 카테고리 (하위 호환용)
export type RoutineCategory = 'fixed' | 'study' | 'rest' | 'other';
export type PeriodType = 'year' | 'semester' | 'vacation' | 'month' | 'custom';
export type MissionStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';
export type FeedbackType = 'praise' | 'encourage' | 'warning';
export type TimeSlotType = 'routine' | 'study' | 'mission' | 'free';

// ─────────────────────────────────────────────────────
// 루틴 (Routine)
// ─────────────────────────────────────────────────────

/** 루틴 (routines 테이블) */
export interface Routine {
  id: number;
  memberId?: number;
  title: string;
  majorCategory: RoutineMajorCategory; // 대분류 (수업/자습/운동/일정)
  subject?: string; // 소분류 - 수업/자습인 경우 과목 (교과명)
  category?: RoutineCategory; // 기존 카테고리 (하위 호환)
  startTime: string; // "09:00"
  endTime: string; // "10:30"
  repeat: boolean;
  date?: Date; // 특정 날짜 (반복 아닌 경우)
  days: boolean[]; // [일, 월, 화, 수, 목, 금, 토]
  // 기간 (주 단위) - 필수
  startDate: string; // "2025-01-06" (주 시작일)
  endDate: string; // "2025-03-30" (주 종료일)
  color?: string; // 커스텀 색상
  order?: number; // 정렬 순서
}

/** 플래너 아이템 (학습/수업 등 일정) */
export interface PlannerItem {
  id: number;
  memberId: number;
  primaryType: '학습' | '수업';
  subject?: string;
  teacher?: string;
  title: string;
  startDate: Date;
  endDate: Date;
  progress: number;
  late?: number;
  absent?: number;
  mentorRank?: number;
  mentorDesc?: string;
}

/** 루틴 생성/수정용 DTO */
export interface RoutineInput {
  title: string;
  category: RoutineCategory;
  subject?: string;
  startTime: string;
  endTime: string;
  repeat: boolean;
  date?: string;
  days: boolean[];
  color?: string;
}

// ─────────────────────────────────────────────────────
// 장기 계획 (Long-term Plan)
// ─────────────────────────────────────────────────────

/** 장기 계획 */
export interface LongTermPlan {
  id: number;
  memberId?: number;
  title: string;
  subject?: string;
  periodType?: PeriodType; // 기간 유형
  startDate?: string;
  endDate?: string;
  type: 'textbook' | 'lecture';
  material?: string; // 교재명/강의명
  totalAmount: number; // 총 분량 (페이지/강수)
  completedAmount: number; // 완료 분량
  dailyTarget?: number; // 일일 목표량 (자동 계산)
  weeklyTarget?: number; // 주간 목표량 (자동 계산)
  priority?: number; // 우선순위 (1=높음)
  isActive?: boolean; // 활성 상태
  nWeeks?: number; // 주 단위 수 (자동 계산)
  createdAt?: Date;
  updatedAt?: Date;
}

/** 장기 계획 생성/수정용 DTO */
export interface LongTermPlanInput {
  title: string;
  subject: string;
  periodType: PeriodType;
  startDate: string;
  endDate: string;
  type: 'textbook' | 'lecture';
  material: string;
  totalAmount: number;
  completedAmount?: number;
  priority?: number;
}

// ─────────────────────────────────────────────────────
// 일일 미션 (Daily Mission)
// ─────────────────────────────────────────────────────

/** 일일 미션 */
export interface DailyMission {
  id: number;
  memberId: number;
  date: Date;
  planId: number; // 연결된 장기 계획
  subject: string;
  title: string; // "수학 개념원리 p.45~52"
  description?: string;
  targetAmount: number; // 목표량
  completedAmount: number; // 완료량
  achievement: number; // 성취도 (0-100)
  status: MissionStatus;
  startTime?: string; // 배정된 시작 시간
  endTime?: string; // 배정된 종료 시간
  actualStartTime?: string; // 실제 시작 시간
  actualEndTime?: string; // 실제 종료 시간
  studentMemo?: string; // 학생 메모
  mentorFeedback?: MentorFeedback; // 멘토 피드백
  createdAt: Date;
  updatedAt: Date;
}

/** 멘토 피드백 */
export interface MentorFeedback {
  id: number;
  missionId: number;
  mentorId: number;
  rating: 1 | 2 | 3 | 4 | 5; // 평가 점수
  type: FeedbackType; // 칭찬/격려/분발요구
  comment: string;
  checkedAt: Date;
}

/** 미션 성취도 입력 DTO */
export interface AchievementInput {
  missionId: number;
  completedAmount: number;
  achievement: number;
  studentMemo?: string;
}

// ─────────────────────────────────────────────────────
// 일간 계획 (Daily Schedule)
// ─────────────────────────────────────────────────────

/** 일간 계획 */
export interface DailySchedule {
  id: number;
  memberId: number;
  date: Date;
  timeSlots: TimeSlot[];
  totalStudyMinutes: number; // 총 학습 시간 (분)
  completedMinutes: number; // 완료된 학습 시간 (분)
  dailyReview?: string; // 하루 회고
  mood?: 'great' | 'good' | 'okay' | 'bad' | 'terrible'; // 기분
  createdAt: Date;
  updatedAt: Date;
}

/** 시간 슬롯 */
export interface TimeSlot {
  id: number;
  scheduleId: number;
  startTime: string; // "09:00"
  endTime: string; // "10:30"
  type: TimeSlotType;
  routineId?: number; // 루틴 연결
  missionId?: number; // 미션 연결
  title: string;
  subject?: string;
  isCompleted: boolean;
  actualStartTime?: string;
  actualEndTime?: string;
  memo?: string;
}

// ─────────────────────────────────────────────────────
// 주간 뷰 관련
// ─────────────────────────────────────────────────────

/** 주간 요약 */
export interface WeeklySummary {
  weekStart: Date;
  weekEnd: Date;
  totalMissions: number;
  completedMissions: number;
  averageAchievement: number;
  studyTimeBySubject: Record<string, number>; // 과목별 학습 시간 (분)
  studyTimeByDay: number[]; // 요일별 학습 시간 [일, 월, 화, ...]
}

/** 주간 성취도 그래프 데이터 */
export interface WeeklyProgress {
  primaryType: string;
  memberId: number;
  startDateDay: string;
  comnCd: number;
  comnNm: string;
  avgProgress: number;
}

// ─────────────────────────────────────────────────────
// API 관련
// ─────────────────────────────────────────────────────

/** API 응답 공통 형식 */
export interface ApiResponse<T> {
  success: boolean;
  msg?: string;
  data: T;
}

/** 페이지네이션 */
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** 페이지네이션 응답 */
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: Pagination;
}

// ─────────────────────────────────────────────────────
// 유틸리티 타입
// ─────────────────────────────────────────────────────

/** 시간 범위 */
export interface TimeRange {
  startTime: string;
  endTime: string;
}

/** 날짜 범위 */
export interface DateRange {
  startDate: Date;
  endDate: Date;
}

/** 학습 가능 시간 계산 결과 */
export interface AvailableStudyTime {
  totalMinutes: number; // 총 학습 가능 시간 (분)
  bySubject: Record<string, number>; // 과목별 배정 시간
  freeSlots: TimeRange[]; // 빈 시간대 목록
}

// ─────────────────────────────────────────────────────
// 성장형 플래너 (Growth)
// ─────────────────────────────────────────────────────

/** 일일 회고 */
export interface DailyReflection {
  id: number;
  date: string;
  mood: 'great' | 'good' | 'okay' | 'bad' | 'terrible';
  bestThing?: string;
  worstThing?: string;
  improvement?: string;
  dailyGoal?: string;
  understanding?: number;
}

/** 성장 통계 */
export interface GrowthStats {
  streak: number;
  longestStreak: number;
  thisWeek: {
    totalMissions: number;
    completedMissions: number;
    achievementRate: number;
    studyMinutes: number;
  };
  lastWeek: {
    totalMissions: number;
    completedMissions: number;
    achievementRate: number;
    studyMinutes: number;
  };
  subjectTrend: {
    subject: string;
    thisWeek: number;
    lastWeek: number;
    change: number;
  }[];
  moodTrend: {
    date: string;
    mood: string;
    understanding: number;
  }[];
  weeklyAchievements: number[];
}

/** AI 코칭 */
export interface AICoaching {
  achievementRate: number;
  totalMissions: number;
  completedMissions: number;
  insights: string[];
  suggestions: string[];
  strongestSubject: { subject: string; rate: number } | null;
  weakestSubject: { subject: string; rate: number } | null;
  moodAverage: number;
}
