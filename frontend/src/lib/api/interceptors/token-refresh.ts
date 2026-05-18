/**
 * 토큰 갱신 인터셉터
 * GB-Front의 토큰 갱신 패턴 적용
 */

import axios, { AxiosError } from 'axios';
import { env } from '@/lib/config/env';
import { clearTokens, getRefreshToken, setTokens } from '../token-manager';

// 에러 코드 상수
const ERROR_CODES = {
  TOKEN_EXPIRED: 'C401',
  INVALID_TOKEN: 'C999',
  SESSION_EXPIRED: 'C5050',
} as const;

/**
 * 토큰 갱신 API 호출
 */
const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      return null;
    }

    // publicClient는 body를 snake_case로 변환하므로 순수 axios 직접 사용
    // Hub 백엔드는 camelCase `refreshToken`을 기대함
    const response = await axios.post(
      `${env.apiUrlHub}/auth/refresh`,
      {
        refreshToken,
      },
      {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
      },
    );

    // Hub 응답 envelope { success, data } 자동 해제 + camelCase/snake_case 모두 지원
    const raw = response.data;
    const payload = (raw?.data ?? raw) as Record<string, unknown>;
    const accessToken = (payload?.accessToken ?? payload?.access_token) as string | undefined;
    const newRefreshToken = (payload?.refreshToken ?? payload?.refresh_token) as string | undefined;
    if (accessToken) {
      setTokens(accessToken, newRefreshToken || refreshToken);
      return accessToken;
    }

    return null;
  } catch (error) {
    console.error('토큰 갱신 실패:', error);
    return null;
  }
};

/**
 * 로그아웃 처리 (토큰 제거 + 로그인 페이지 이동)
 */
const handleLogout = () => {
  clearTokens();

  // 현재 페이지가 로그인 페이지가 아닐 때만 리다이렉트
  if (!window.location.pathname.includes('/auth/login')) {
    window.location.href = '/auth/login';
  }
};

/**
 * 에러 Response 인터셉터 (토큰 갱신 포함)
 */
export const authResponseErrorInterceptor = async (error: AxiosError) => {
  const originalRequest = error.config as typeof error.config & { _retry?: boolean };

  // 401 에러 처리
  if (error.response?.status === 401) {
    const errorData = error.response.data as { detailCode?: string; message?: string };
    const errorCode = errorData?.detailCode;

    // 세션 만료 → 로그아웃 (갱신 시도 없음)
    if (errorCode === ERROR_CODES.SESSION_EXPIRED) {
      alert(errorData?.message || '세션이 만료되었습니다.');
      handleLogout();
      return Promise.reject(error);
    }

    // 유효하지 않은 토큰 → 로그아웃 (갱신 시도 없음)
    if (errorCode === ERROR_CODES.INVALID_TOKEN) {
      handleLogout();
      return Promise.reject(error);
    }

    // 토큰 만료 또는 기타 401 (detailCode 없는 경우 포함) → 갱신 시도
    // StudyPlanner 백엔드는 detailCode 없이 순수 401을 반환하므로 모든 401에 갱신 시도
    if (!originalRequest?._retry) {
      if (originalRequest) {
        originalRequest._retry = true;
      }

      const newAccessToken = await refreshAccessToken();
      if (newAccessToken && originalRequest) {
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axios(originalRequest);
      } else {
        handleLogout();
        return Promise.reject(error);
      }
    }
  }

  return Promise.reject(error);
};
