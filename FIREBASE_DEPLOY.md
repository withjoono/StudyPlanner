# Firebase 배포 가이드

이 프로젝트는 Firebase Hosting을 사용하여 배포됩니다.

## 사전 준비

1. Firebase 프로젝트가 필요합니다. [Firebase Console](https://console.firebase.google.com/)에서 프로젝트를 생성하세요.
2. Firebase CLI가 설치되어 있어야 합니다 (이미 설치됨).

## 초기 설정

### 1. Firebase 로그인

```bash
firebase login
```

### 2. Firebase 프로젝트 설정

`.firebaserc` 파일을 열고 `your-project-id`를 실제 Firebase 프로젝트 ID로 변경하세요:

```json
{
  "projects": {
    "default": "실제-프로젝트-id"
  }
}
```

또는 아래 명령어로 자동으로 프로젝트를 연결할 수 있습니다:

```bash
firebase use --add
```

## 배포 방법

### 방법 1: 전체 배포 (권장)

```bash
yarn firebase:deploy
```

이 명령은:
1. Frontend를 빌드합니다 (`apps/frontend/dist`에 빌드됨)
2. Firebase에 배포합니다

### 방법 2: Hosting만 배포

```bash
yarn firebase:deploy:hosting
```

### 방법 3: 수동 배포

```bash
# 1. 빌드
yarn build:frontend

# 2. 배포
firebase deploy --only hosting
```

## 배포 확인

배포가 완료되면 터미널에 Hosting URL이 표시됩니다:
- Hosting URL: https://your-project-id.web.app

## 환경 변수 설정

프로덕션 환경에서 사용할 환경 변수가 있다면:

1. `apps/frontend/.env.production` 파일을 생성하세요
2. 필요한 환경 변수를 설정하세요 (예: API 엔드포인트)

```env
VITE_API_URL=https://your-backend-api.com
```

## 주의사항

- Firebase Hosting은 **정적 파일 호스팅**만 지원합니다
- Backend (NestJS) 서버는 별도로 배포해야 합니다:
  - Firebase Cloud Functions
  - Google Cloud Run
  - Heroku, Railway, Render 등의 플랫폼

## Backend 배포 (별도 필요)

현재 설정은 Frontend만 Firebase Hosting에 배포합니다. Backend는 다음 옵션 중 하나를 선택하여 배포하세요:

### 옵션 1: Firebase Cloud Functions (권장)
- Firebase 생태계와 통합
- 서버리스 환경

### 옵션 2: Google Cloud Run
- 컨테이너 기반
- Auto-scaling 지원

### 옵션 3: 기타 플랫폼
- Heroku, Railway, Render, AWS, etc.

Backend를 배포한 후 Frontend의 API 엔드포인트를 업데이트하세요.

## 문제 해결

### 배포 실패 시

```bash
# Firebase 캐시 정리
firebase deploy --force

# 로그 확인
firebase deploy --debug
```

### 빌드 오류 시

```bash
# 의존성 재설치
yarn install

# 빌드 테스트
yarn build:frontend
```

