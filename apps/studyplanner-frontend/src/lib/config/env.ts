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
  apiUrlPlanner: string; // StudyPlanner 백엔드 (플래너 전용)
  apiUrlMain: string; // Hub 통합 백엔드 (인증, 결제, 회원)

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

// 개발 환경에서는 Vite 프록시 사용 (CORS 해결)
const isDev = import.meta.env.DEV;

export const env: EnvConfig = {
  // 프론트엔드 URL
  frontUrl: getEnvVar('VITE_FRONT_URL', 'http://localhost:3004'),

  // 백엔드 API URL (개발: 프록시, 프로덕션: 직접 연결)
  apiUrlPlanner: isDev
    ? '/api'
    : getEnvVar('VITE_API_URL_PLANNER', 'http://localhost:4004'),
  apiUrlMain: isDev
    ? '/api-main'
    : getEnvVar('VITE_API_URL_MAIN', 'http://localhost:4000'),

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
    apiUrlPlanner: env.apiUrlPlanner,
    apiUrlMain: env.apiUrlMain,
    frontUrl: env.frontUrl,
  });
}

export default env;




