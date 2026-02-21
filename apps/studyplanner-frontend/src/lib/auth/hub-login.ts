/**
 * Hub 로그인 연동 유틸리티
 * StudyPlanner에서 Hub(G Skool) 로그인 페이지로 리디렉트
 */

import { env } from '@/lib/config/env';

// Hub Frontend URL (환경 변수 또는 기본값)
const HUB_URL =
  import.meta.env.VITE_HUB_URL ||
  (import.meta.env.PROD ? 'https://geobukschool.kr' : 'http://localhost:3000');

/**
 * Hub 로그인 URL 생성
 * 로그인 후 StudyPlanner로 SSO 토큰과 함께 돌아옴
 * @param returnPath - 로그인 후 돌아올 경로 (기본: /)
 */
export function getHubLoginUrl(returnPath: string = '/'): string {
  const frontUrl = env.frontUrl || window.location.origin;
  const redirectUri = `${frontUrl}${returnPath}`;

  return `${HUB_URL}/auth/login?redirect=${encodeURIComponent(redirectUri)}`;
}

/**
 * Hub 회원가입 URL 생성
 * @param returnPath - 회원가입 후 돌아올 경로 (기본: /)
 */
export function getHubRegisterUrl(returnPath: string = '/'): string {
  const frontUrl = env.frontUrl || window.location.origin;
  const redirectUri = `${frontUrl}${returnPath}`;

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
