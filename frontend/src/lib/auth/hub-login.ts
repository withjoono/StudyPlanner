/**
 * Hub 로그인 연동 유틸리티
 * StudyPlanner에서 Hub(T Skool) 로그인 페이지로 리디렉트
 */

// Hub Frontend URL (환경 변수 또는 기본값)
const HUB_URL =
  import.meta.env.VITE_HUB_URL ||
  (import.meta.env.PROD ? 'https://www.tskool.kr' : 'http://localhost:3000');

/**
 * Hub 로그인 URL 생성
 * 로그인 후 StudyPlanner로 SSO 토큰과 함께 돌아옴
 * @param returnPath - 로그인 후 돌아올 경로 (기본: /)
 */
export function getHubLoginUrl(returnPath: string = '/'): string {
  // window.location.origin을 사용해 항상 현재 도메인으로 redirect
  // (env.frontUrl은 빌드 시점 환경변수에 의존하므로 잘못된 값이 번들에 포함될 수 있음)
  const redirectUri = `${window.location.origin}${returnPath}`;
  return `${HUB_URL}/auth/login?redirect=${encodeURIComponent(redirectUri)}`;
}

/**
 * Hub 회원가입 URL 생성
 * @param returnPath - 회원가입 후 돌아올 경로 (기본: /)
 */
export function getHubRegisterUrl(returnPath: string = '/'): string {
  const redirectUri = `${window.location.origin}${returnPath}`;
  return `${HUB_URL}/auth/register?redirect=${encodeURIComponent(redirectUri)}`;
}

/**
 * Hub 로그인 페이지로 리디렉트
 */
export function redirectToHubLogin(returnPath?: string): void {
  window.location.href = getHubLoginUrl(returnPath);
}

/**
 * Hub 회원가입 페이지로 리디렉트
 */
export function redirectToHubRegister(returnPath?: string): void {
  window.location.href = getHubRegisterUrl(returnPath);
}
