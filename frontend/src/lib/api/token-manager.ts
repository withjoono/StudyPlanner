/**
 * 토큰 관리 전담 모듈
 * GB-Front의 토큰 관리 패턴 적용
 *
 * SSO 및 Zustand persist storage와의 호환성을 위한 fallback 로직 포함
 */

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const TOKEN_EXPIRY_KEY = 'tokenExpiry';
const AUTH_STORAGE_KEY = 'auth-storage';

/**
 * Zustand persist storage에서 토큰 추출 (fallback용)
 */
const getTokenFromAuthStorage = (tokenKey: 'accessToken' | 'refreshToken'): string | null => {
  try {
    const authStorage = localStorage.getItem(AUTH_STORAGE_KEY);
    if (authStorage) {
      const parsed = JSON.parse(authStorage);
      return parsed?.state?.[tokenKey] || null;
    }
  } catch (e) {
    console.error('Failed to parse auth-storage:', e);
  }
  return null;
};

/**
 * Access Token 조회
 * 1. 먼저 직접 저장된 토큰 확인
 * 2. 없으면 Zustand persist storage에서 확인 (SSO 호환성)
 */
export const getAccessToken = (): string | null => {
  // 1. 직접 저장된 토큰 확인
  const directToken = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (directToken) {
    return directToken;
  }

  // 2. Zustand persist storage에서 확인 (fallback)
  return getTokenFromAuthStorage('accessToken');
};

/**
 * Refresh Token 조회
 * 1. 먼저 직접 저장된 토큰 확인
 * 2. 없으면 Zustand persist storage에서 확인 (SSO 호환성)
 */
export const getRefreshToken = (): string | null => {
  // 1. 직접 저장된 토큰 확인
  const directToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (directToken) {
    return directToken;
  }

  // 2. Zustand persist storage에서 확인 (fallback)
  return getTokenFromAuthStorage('refreshToken');
};

/**
 * 토큰 만료 시간 조회 (밀리초 타임스탬프)
 */
export const getTokenExpiry = (): number | null => {
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
  return expiry ? parseInt(expiry, 10) : null;
};

/**
 * 토큰 저장
 */
export const setTokens = (
  accessToken: string,
  refreshToken: string,
  expirySeconds?: number,
): void => {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);

  if (expirySeconds) {
    const expiryTimestamp = Date.now() + expirySeconds * 1000;
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTimestamp.toString());
  }
};

/**
 * Access Token만 업데이트 (토큰 갱신 시)
 */
export const setAccessToken = (accessToken: string, expirySeconds?: number): void => {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);

  if (expirySeconds) {
    const expiryTimestamp = Date.now() + expirySeconds * 1000;
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTimestamp.toString());
  }
};

/**
 * 토큰 삭제 (로그아웃 시)
 */
export const clearTokens = (): void => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
};

/**
 * 토큰 존재 여부 확인
 */
export const hasTokens = (): boolean => {
  return !!getAccessToken() && !!getRefreshToken();
};

/**
 * Access Token 존재 여부 확인
 */
export const hasAccessToken = (): boolean => {
  return !!getAccessToken();
};

/**
 * 토큰 만료 여부 확인
 */
export const isTokenExpired = (): boolean => {
  const expiry = getTokenExpiry();
  if (!expiry) return true;
  // 만료 1분 전에 미리 갱신하도록
  return Date.now() > expiry - 60000;
};
