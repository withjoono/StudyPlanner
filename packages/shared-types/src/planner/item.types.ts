/**
 * 플래너 일정 아이템 타입 정의
 */

/**
 * 일정 분류
 */
export enum PlannerPrimaryType {
  STUDY = '학습',
  CLASS = '수업',
}

/**
 * 작업 상태
 */
export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

/**
 * 플래너 일정 아이템 기본 타입
 */
export interface PlannerItem {
  id: number;
  memberId: number;

  // 분류
  primaryType: PlannerPrimaryType | '학습' | '수업';
  subject?: string;
  teacher?: string;

  // 일정
  title: string;
  startDate: Date | string;
  endDate: Date | string;
  rRule?: string;
  exDate?: string;

  // 상태
  late?: number;
  absent?: number;
  progress: number;
  taskStatus?: TaskStatus;

  // 학습상세
  studyType?: string;
  studyContent?: string;
  description?: string;

  // 범위
  startPage?: number;
  endPage?: number;
  startSession?: number;
  endSession?: number;

  // 평가
  score?: number;
  rank?: number;
  achievement?: number;

  // 멘토 평가
  mentorRank?: number;
  mentorDesc?: string;
  mentorTest?: string;
  test?: string;
  planDate?: Date;

  // 메타
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * 일정 생성 DTO
 */
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

/**
 * 일정 업데이트 DTO
 */
export interface UpdatePlannerItemDto extends Partial<CreatePlannerItemDto> {
  progress?: number;
  taskStatus?: TaskStatus;
  score?: number;
  rank?: number;
}

/**
 * 일정 조회 필터
 */
export interface PlannerItemFilter {
  memberId?: number;
  primaryType?: PlannerPrimaryType;
  subject?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  taskStatus?: TaskStatus;
}
