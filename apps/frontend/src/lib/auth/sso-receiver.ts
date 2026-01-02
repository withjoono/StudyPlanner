/**
 * SSO 토큰 수신기
 * Hub에서 전달받은 SSO 토큰을 처리하여 자동 로그인
 */

import { setTokens, clearTokens } from '@/lib/api/token-manager';
import { useAuthStore } from '@/stores/client/use-auth-store';
import { authClient } from '@/lib/api/instances';
import type { Member } from '@/types/auth';

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
    // 토큰 저장 (2시간 = 7200초)
    setTokens(accessToken, refreshToken, 7200);

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
