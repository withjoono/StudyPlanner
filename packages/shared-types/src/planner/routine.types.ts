/**
 * 플래너 루틴 타입 정의
 */

/**
 * 루틴 카테고리
 */
export type RoutineCategory = 'fixed' | 'study' | 'rest' | 'other';

/**
 * 미션 상태
 */
export type MissionStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';

/**
 * 루틴 타입
 */
export interface Routine {
  id: number;
  memberId?: number;
  title: string;
  category: RoutineCategory;
  subject?: string;
  startTime: string; // "09:00"
  endTime: string; // "10:30"
  repeat: boolean;
  date?: Date | string;
  days: boolean[]; // [일, 월, 화, 수, 목, 금, 토]
  color?: string;
  order?: number;
}

/**
 * 루틴 생성 DTO
 */
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

/**
 * 루틴 업데이트 DTO
 */
export interface UpdateRoutineDto extends Partial<CreateRoutineDto> {
  id: number;
}

/**
 * 주간 성취도 그래프 데이터
 */
export interface WeeklyProgress {
  primaryType: string;
  memberId: number;
  startDateDay: string;
  comnCd: number;
  comnNm: string;
  avgProgress: number;
}
