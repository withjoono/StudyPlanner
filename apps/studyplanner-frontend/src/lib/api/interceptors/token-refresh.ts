/**
 * 토큰 갱신 인터셉터
 * GB-Front의 토큰 갱신 패턴 적용
 */

import { AxiosError } from 'axios';
import { publicClient } from '../instances';
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

    const response = await publicClient.post('/auth/refresh', {
      refreshToken,
    });

    const { accessToken, refreshToken: newRefreshToken, tokenExpiry } = response.data;
    if (accessToken) {
      setTokens(accessToken, newRefreshToken || refreshToken, tokenExpiry);
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

    // 토큰 만료 → 갱신 시도
    if (errorCode === ERROR_CODES.TOKEN_EXPIRED && !originalRequest?._retry) {
      if (originalRequest) {
        originalRequest._retry = true;
      }

      const newAccessToken = await refreshAccessToken();
      if (newAccessToken && originalRequest) {
        // 새 토큰으로 원래 요청 재시도
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return publicClient.request(originalRequest);
      } else {
        // 갱신 실패 → 로그아웃
        handleLogout();
        return Promise.reject(error);
      }
    }

    // 유효하지 않은 토큰 → 로그아웃
    if (errorCode === ERROR_CODES.INVALID_TOKEN) {
      handleLogout();
      return Promise.reject(error);
    }

    // 세션 만료 → 로그아웃
    if (errorCode === ERROR_CODES.SESSION_EXPIRED) {
      alert(errorData?.message || '세션이 만료되었습니다.');
      handleLogout();
      return Promise.reject(error);
    }
  }

  return Promise.reject(error);
};




