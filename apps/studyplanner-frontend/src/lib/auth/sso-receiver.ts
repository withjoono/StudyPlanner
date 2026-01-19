/**
 * SSO 토큰 수신기
 * Hub에서 전달받은 SSO 토큰을 처리하여 자동 로그인
 */

import { setTokens, clearTokens } from '@/lib/api/token-manager';
import { useAuthStore } from '@/stores/client/use-auth-store';
import { authClient } from '@/lib/api/instances';
import type { Member } from '@/types/auth';

/**
 * JWT 토큰에서 만료 시간(exp) 추출
 * @param token - JWT 토큰
 * @returns 만료까지 남은 시간 (초) 또는 기본값 (1시간)
 */
function getTokenExpirySeconds(token: string): number {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    if (decoded.exp) {
      // exp는 Unix timestamp (초)
      const expiresInSeconds = decoded.exp - Math.floor(Date.now() / 1000);
      return expiresInSeconds > 0 ? expiresInSeconds : 3600;
    }
  } catch (error) {
    console.warn('JWT 토큰 디코딩 실패, 기본 만료 시간 사용');
  }
  // 기본값: 1시간
  return 3600;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

/**
 * URL에서 SSO 토큰을 추출하고 처리
 * @returns SSO 토큰이 처리되었으면 true, 아니면 false
 */
export async function processSSOTokens(): Promise<boolean> {
  const url = new URL(window.location.href);
  const accessToken = url.searchParams.get('sso_access_token');
  const refreshToken = url.searchParams.get('sso_refresh_token');

  // SSO 토큰이 없으면 처리하지 않음
  if (!accessToken || !refreshToken) {
    return false;
  }

  try {
    // JWT에서 실제 만료 시간 추출
    const expirySeconds = getTokenExpirySeconds(accessToken);

    // 토큰 저장
    setTokens(accessToken, refreshToken, expirySeconds);

    // 사용자 정보 조회하여 토큰 유효성 확인
    const meResponse = await authClient.get<ApiResponse<Member>>('/auth/me');

    if (!meResponse.data.success || !meResponse.data.data) {
      throw new Error('사용자 정보 조회 실패');
    }

    // auth store 업데이트
    const { setUser, setActiveServices, setInitialized } = useAuthStore.getState();
    setUser(meResponse.data.data);

    // 활성 서비스 조회
    try {
      const servicesResponse = await authClient.get<ApiResponse<string[]>>('/auth/me/active');
      if (servicesResponse.data.success && servicesResponse.data.data) {
        setActiveServices(servicesResponse.data.data);
      }
    } catch {
      // 활성 서비스 조회 실패해도 로그인은 유지
      console.warn('활성 서비스 조회 실패');
    }

    setInitialized(true);

    // URL에서 토큰 제거 (브라우저 히스토리에서 숨김)
    url.searchParams.delete('sso_access_token');
    url.searchParams.delete('sso_refresh_token');
    window.history.replaceState({}, '', url.toString());

    console.log('SSO 로그인 성공');
    return true;
  } catch (error) {
    console.error('SSO 토큰 검증 실패:', error);
    // 유효하지 않은 토큰 정리
    clearTokens();

    // URL에서 토큰 제거
    url.searchParams.delete('sso_access_token');
    url.searchParams.delete('sso_refresh_token');
    window.history.replaceState({}, '', url.toString());

    return false;
  }
}
