/**
 * Commitlint 설정
 */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Type 규칙
    'type-enum': [
      2,
      'always',
      [
        'feat',     // 새로운 기능
        'fix',      // 버그 수정
        'docs',     // 문서 수정
        'style',    // 코드 포맷팅
        'refactor', // 리팩토링
        'test',     // 테스트
        'chore',    // 빌드, 설정
        'perf',     // 성능 개선
        'revert',   // 되돌리기
        'ci',       // CI/CD
        'build',    // 빌드 시스템
      ],
    ],
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],

    // Scope 규칙 (기능 모듈명)
    'scope-enum': [
      1, // warning (필수 아님)
      'always',
      [
        // 플래너 기능
        'routine',      // 루틴
        'plan',         // 계획
        'mission',      // 미션
        'schedule',     // 일정
        'feedback',     // 피드백
        'mentor',       // 멘토
        'student',      // 학생

        // 공용
        'ui',           // UI 컴포넌트
        'common',       // 공용 유틸
        'auth',         // 인증
        'api',          // API 전반
        'store',        // 상태 관리
        'route',        // 라우팅

        // 기타
        'deps',         // 의존성
        'config',       // 설정
        'release',      // 릴리즈
      ],
    ],
    'scope-case': [2, 'always', 'lower-case'],

    // Subject 규칙
    'subject-case': [0], // 한글 허용을 위해 비활성화
    'subject-empty': [2, 'never'],
    'subject-max-length': [2, 'always', 72],

    // Header 규칙
    'header-max-length': [2, 'always', 100],

    // Body 규칙
    'body-max-line-length': [1, 'always', 100],

    // Footer 규칙
    'footer-max-line-length': [1, 'always', 100],
  },
};


