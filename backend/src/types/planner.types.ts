/**
 * 플래너 공유 타입 정의
 * 원래 @gb-planner/shared-types 패키지에서 가져온 타입들
 */

// ==================== Planner Item ====================

export enum PlannerPrimaryType {
  STUDY = '학습',
  CLASS = '수업',
}

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface PlannerItem {
  id: number;
  memberId: number;
  primaryType: PlannerPrimaryType | '학습' | '수업';
  subject?: string;
  teacher?: string;
  title: string;
  startDate: Date | string;
  endDate: Date | string;
  rRule?: string;
  exDate?: string;
  late?: number;
  absent?: number;
  progress: number;
  taskStatus?: TaskStatus;
  studyType?: string;
  studyContent?: string;
  description?: string;
  startPage?: number;
  endPage?: number;
  startSession?: number;
  endSession?: number;
  score?: number;
  rank?: number;
  achievement?: number;
  mentorRank?: number;
  mentorDesc?: string;
  mentorTest?: string;
  test?: string;
  planDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreatePlannerItemDto {
  primaryType: PlannerPrimaryType;
  subject?: string;
  teacher?: string;
  title: string;
  startDate: Date | string;
  endDate: Date | string;
  rRule?: string;
  description?: string;
  studyType?: string;
  studyContent?: string;
}

export interface UpdatePlannerItemDto extends Partial<CreatePlannerItemDto> {
  progress?: number;
  taskStatus?: TaskStatus;
  score?: number;
  rank?: number;
}

export interface PlannerItemFilter {
  memberId?: number;
  primaryType?: PlannerPrimaryType;
  subject?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  taskStatus?: TaskStatus;
}

// ==================== Routine ====================

export type RoutineCategory = 'fixed' | 'study' | 'rest' | 'other';
export type MissionStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';

export interface Routine {
  id: number;
  memberId?: number;
  title: string;
  category: RoutineCategory;
  subject?: string;
  startTime: string;
  endTime: string;
  repeat: boolean;
  date?: Date | string;
  days: boolean[];
  color?: string;
  order?: number;
}

export interface CreateRoutineDto {
  title: string;
  category: RoutineCategory;
  subject?: string;
  startTime: string;
  endTime: string;
  repeat?: boolean;
  date?: string;
  days: boolean[];
  color?: string;
}

export interface UpdateRoutineDto extends Partial<CreateRoutineDto> {
  id: number;
}

export interface WeeklyProgress {
  primaryType: string;
  memberId: number;
  startDateDay: string;
  comnCd: number;
  comnNm: string;
  avgProgress: number;
}

// ==================== Plan ====================

export enum PlanType {
  LECTURE = 0,
  TEXTBOOK = 1,
}

export interface PlannerPlan {
  id: number;
  memberId?: number;
  title: string;
  subject?: string;
  step?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  startTime?: string;
  endTime?: string;
  type: PlanType | 'textbook' | 'lecture';
  material?: string;
  person?: string;
  total?: number;
  done: number;
  isItem?: boolean;
  isItemDone?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreatePlannerPlanDto {
  title: string;
  subject?: string;
  step?: string;
  startDay?: string;
  endDay?: string;
  startTime?: string;
  endTime?: string;
  type?: 'textbook' | 'lecture';
  material?: string;
  person?: string;
  amount?: number;
  finished?: number;
}

export interface UpdatePlannerPlanDto extends Partial<CreatePlannerPlanDto> {
  id: number;
  done?: number;
  isItem?: boolean;
  isItemDone?: boolean;
}

export interface PlannerPlanFilter {
  memberId?: number;
  subject?: string;
  type?: PlanType;
  startDate?: Date | string;
  endDate?: Date | string;
}

export function calculateProgress(done: number, total?: number): number {
  if (!total || total === 0) return 0;
  return Math.min(Math.round((done / total) * 100), 100);
}

// ==================== API ====================

export interface ApiResponse<T> {
  success: boolean;
  msg?: string;
  data: T;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: Pagination;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

// ==================== Constants ====================

export const SUBJECT_COLORS: Record<string, string> = {
  국어: '#ef4444',
  수학: '#eab308',
  영어: '#f97316',
  사회: '#3b82f6',
  과학: '#14b8a6',
  사탐: '#3b82f6',
  과탐: '#14b8a6',
  한국사: '#a855f7',
  제2외국어: '#6366f1',
  기타: '#6b7280',
};

export const ROUTINE_CATEGORY_COLORS = {
  fixed: '#64748b',
  study: '#f97316',
  rest: '#22c55e',
  other: '#a855f7',
} as const;

export const DAYS = ['일', '월', '화', '수', '목', '금', '토'] as const;
export const DAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export const SUBJECTS = [
  '국어', '수학', '영어', '사회', '과학', '한국사', '제2외국어', '기타',
] as const;

export const CATEGORY_LABELS = {
  fixed: '고정일과',
  study: '학습',
  rest: '휴식',
  other: '기타',
} as const;
