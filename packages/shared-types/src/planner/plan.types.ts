/**
 * 플래너 장기계획 타입 정의
 */

/**
 * 계획 타입
 */
export enum PlanType {
  LECTURE = 0, // 강의
  TEXTBOOK = 1, // 교재
}

/**
 * 장기계획 기본 타입
 */
export interface PlannerPlan {
  id: number;
  memberId?: number;

  title: string;
  subject?: string;
  step?: string;

  // 기간
  startDate?: Date | string;
  endDate?: Date | string;
  startTime?: string;
  endTime?: string;

  // 교재/강의
  type: PlanType | 'textbook' | 'lecture';
  material?: string;
  person?: string;

  // 진행률
  total?: number;
  done: number;

  // 상태
  isItem?: boolean;
  isItemDone?: boolean;

  // 메타
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * 장기계획 생성 DTO
 */
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

/**
 * 장기계획 업데이트 DTO
 */
export interface UpdatePlannerPlanDto extends Partial<CreatePlannerPlanDto> {
  id: number;
  done?: number;
  isItem?: boolean;
  isItemDone?: boolean;
}

/**
 * 장기계획 조회 필터
 */
export interface PlannerPlanFilter {
  memberId?: number;
  subject?: string;
  type?: PlanType;
  startDate?: Date | string;
  endDate?: Date | string;
}

/**
 * 진행률 계산
 */
export function calculateProgress(done: number, total?: number): number {
  if (!total || total === 0) return 0;
  return Math.min(Math.round((done / total) * 100), 100);
}
