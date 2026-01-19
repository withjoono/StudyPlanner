// =====================================================
// 플래너 관련 타입 정의
// =====================================================

// ─────────────────────────────────────────────────────
// 상수 정의
// ─────────────────────────────────────────────────────

/** 과목 색상 매핑 */
export const SUBJECT_COLORS: Record<string, string> = {
  국어: '#ef4444', // red
  수학: '#eab308', // yellow
  영어: '#f97316', // orange
  사회: '#3b82f6', // blue
  과학: '#14b8a6', // teal
  사탐: '#3b82f6', // blue
  과탐: '#14b8a6', // teal
  한국사: '#a855f7', // purple
  제2외국어: '#6366f1', // indigo
  기타: '#6b7280', // gray
};

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

/** 소분류 (과목) 목록 - 수업/자습용 */
export const ROUTINE_SUBJECTS: RoutineSubject[] = ['국어', '영어', '수학', '과학', '사회', '기타'];

/** 과목 정렬 순서 */
export const SUBJECT_ORDER: Record<string, number> = {
  국어: 1,
  수학: 2,
  영어: 3,
  사회: 4,
  과학: 5,
  한국사: 6,
  제2외국어: 7,
  기타: 8,
};

/** 요일 */
export const DAYS = ['일', '월', '화', '수', '목', '금', '토'] as const;

/** 요일 (영문) */
export const DAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

/** 과목 목록 */
export const SUBJECTS = [
  '국어',
  '수학',
  '영어',
  '사회',
  '과학',
  '한국사',
  '제2외국어',
  '기타',
] as const;

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

// 소분류 (수업/자습용): 국어, 영어, 수학, 과학, 사회, 기타
export type RoutineSubject = '국어' | '영어' | '수학' | '과학' | '사회' | '기타';

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
  subject?: RoutineSubject; // 소분류 - 수업/자습인 경우 과목
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
