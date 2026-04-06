/**
 * 환경 변수 중앙 관리
 *
 * 모든 환경 변수를 타입 안전하게 관리합니다.
 * import.meta.env를 직접 사용하지 말고 이 파일을 통해 접근하세요.
 */

interface EnvConfig {
  // 프론트엔드 URL
  frontUrl: string;

  // 백엔드 API URL
  apiUrl: string; // StudyPlanner 백엔드 (플래너 전용)
  apiUrlHub: string; // Hub 통합 백엔드 (인증, 결제, 회원)

  // 소셜 로그인
  naverLoginClientId: string;
  googleClientId: string;

  // 환경
  isDevelopment: boolean;
  isProduction: boolean;
}

const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = import.meta.env[key] || defaultValue;
  if (!value) {
    console.warn(`Environment variable ${key} is not set`);
    return '';
  }
  return value;
};

/**
 * API URL을 결정합니다.
 * 1. VITE_ 환경변수가 설정되어 있으면 항상 그 값을 사용
 * 2. 환경변수가 없으면: 개발=프록시 경로, 프로덕션=localhost 폴백
 *
 * 이렇게 하면 빌드 시 import.meta.env.DEV 값이 잘못 설정되어도
 * 환경변수가 존재하면 올바른 URL을 사용합니다.
 */
const getApiUrl = (envKey: string, devProxy: string, fallback: string): string => {
  const envValue = import.meta.env[envKey];
  if (envValue) return envValue;
  return import.meta.env.DEV ? devProxy : fallback;
};

export const env: EnvConfig = {
  // 프론트엔드 URL
  frontUrl: getEnvVar('VITE_FRONT_URL', 'http://localhost:3004'),

  // 백엔드 API URL (환경변수 우선, 없으면 개발: 프록시 / 프로덕션: localhost 폴백)
  apiUrl: getApiUrl('VITE_API_URL', '/api', 'http://localhost:4004'),
  apiUrlHub: getApiUrl('VITE_API_URL_HUB', '/api-main', 'http://localhost:4000'),

  // 소셜 로그인
  naverLoginClientId: getEnvVar('VITE_NAVER_LOGIN_CLIENT_ID'),
  googleClientId: getEnvVar('VITE_GOOGLE_CLIENT_ID'),

  // 환경
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
};

// 개발 환경에서 환경 변수 로깅 (디버깅용)
if (env.isDevelopment) {
  console.log('🔧 Environment Configuration:', {
    mode: import.meta.env.MODE,
    apiUrl: env.apiUrl,
    apiUrlHub: env.apiUrlHub,
    frontUrl: env.frontUrl,
  });
}

export default env;
