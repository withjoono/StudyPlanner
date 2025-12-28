/**
 * 공통 상수 정의
 */

/**
 * 과목 색상 매핑
 */
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

/**
 * 루틴 카테고리 색상
 */
export const ROUTINE_CATEGORY_COLORS = {
  fixed: '#64748b',
  study: '#f97316',
  rest: '#22c55e',
  other: '#a855f7',
} as const;

/**
 * 요일 (한글)
 */
export const DAYS = ['일', '월', '화', '수', '목', '금', '토'] as const;

/**
 * 요일 (영문)
 */
export const DAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

/**
 * 과목 목록
 */
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

/**
 * 카테고리 라벨
 */
export const CATEGORY_LABELS = {
  fixed: '고정일과',
  study: '학습',
  rest: '휴식',
  other: '기타',
} as const;
