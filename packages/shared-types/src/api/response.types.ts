/**
 * API 응답 공통 타입
 */

/**
 * API 응답 기본 형식
 */
export interface ApiResponse<T> {
  success: boolean;
  msg?: string;
  data: T;
}

/**
 * 페이지네이션 정보
 */
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * 페이지네이션 응답
 */
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: Pagination;
}

/**
 * 에러 응답
 */
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
