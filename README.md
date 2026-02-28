# GB Planner

학습 계획 관리 플랫폼 - 플래너 독립 프로젝트

## 🏗️ 프로젝트 구조

이 프로젝트는 **Yarn Workspaces** 기반 모노레포로 구성되어 있습니다.

```
gb-planner/
├── frontend/              # React 프론트엔드
├── backend/               # NestJS 백엔드 (플래너 전용)
├── package.json           # 루트 워크스페이스 설정
└── ...설정파일들
```

### 외부 연동

| 서비스  | 경로                | 설명                                           |
| ------- | ------------------- | ---------------------------------------------- |
| **Hub** | `E:\Dev\github\Hub` | 통합 백엔드/프론트엔드 (인증, 결제, 회원 관리) |

자세한 아키텍처는 [backend/docs/ARCHITECTURE.md](./backend/docs/ARCHITECTURE.md)를 참고하세요.

## 🚀 시작하기

### 1. 의존성 설치

```bash
yarn install
```

### 2. 공유 타입 빌드

```bash
cd shared && yarn build
```

### 3. 환경 변수 설정

`frontend/.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
# 프론트엔드 URL
VITE_FRONT_URL=http://localhost:3004

# StudyPlanner 백엔드 (플래너 전용)
VITE_API_URL_PLANNER=http://localhost:4004

# Hub 통합 백엔드 (인증, 결제, 회원 관리)
VITE_API_URL_MAIN=http://localhost:4000

# 소셜 로그인 (선택)
VITE_NAVER_LOGIN_CLIENT_ID=
VITE_GOOGLE_CLIENT_ID=
```

### 4. 개발 서버 실행

```bash
# 프론트엔드만 실행 (http://localhost:3004)
yarn dev

# 백엔드만 실행 (http://localhost:4004)
yarn dev:backend

# 프론트엔드 + 백엔드 동시 실행
yarn dev:all
```

> ⚠️ **중요**: 인증/결제 기능을 사용하려면 Hub 서버도 실행해야 합니다.
>
> ```bash
> cd E:\Dev\github\Hub && yarn start:dev
> ```

## 📦 워크스페이스

| 패키지                     | 설명                           | 포트 |
| -------------------------- | ------------------------------ | ---- |
| `@gb-planner/frontend`     | React + Vite + TanStack Router | 3004 |
| `@gb-planner/backend`      | NestJS + Prisma (플래너 전용)  | 4004 |
| `@gb-planner/shared-types` | 공유 TypeScript 타입           | -    |

### 외부 서비스 연동

| 서비스       | 포트 | 설명                      |
| ------------ | ---- | ------------------------- |
| Hub Backend  | 4000 | 인증, 결제, 회원 관리 API |
| Hub Frontend | 3000 | 메인 프론트엔드           |

## 🛠️ 주요 명령어

```bash
# 개발
yarn dev                    # 프론트엔드 개발 서버
yarn dev:backend            # 백엔드 개발 서버
yarn dev:all                # 동시 실행

# 빌드
yarn build                  # 전체 빌드
yarn build:frontend         # 프론트엔드만 빌드
yarn build:backend          # 백엔드만 빌드

# 코드 품질
yarn lint                   # ESLint 검사 및 수정
yarn lint:check             # ESLint 검사만
yarn format                 # Prettier 포맷팅
yarn format:check           # Prettier 검사만
```

## 🔧 기술 스택

### Frontend

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Router**: TanStack Router (File-based routing)
- **State**: Zustand (Client) + TanStack Query (Server)
- **UI**: Tailwind CSS + shadcn/ui
- **Form**: React Hook Form + Zod

### Backend

- **Framework**: NestJS
- **ORM**: TypeORM
- **Database**: MySQL
- **API Docs**: Swagger

### Shared

- **Types**: TypeScript interfaces/types
- **Build**: tsup

## 📁 주요 페이지

| 경로             | 설명                                | 인증 |
| ---------------- | ----------------------------------- | ---- |
| `/`              | 대시보드 - 오늘의 미션, 성취도 요약 | ✅   |
| `/missions`      | 나의 미션 - 일간 미션 관리          | ✅   |
| `/routine`       | 주간 루틴 - 반복 일정 설정          | ✅   |
| `/plans`         | 장기 계획 - 교재/강의 진도 관리     | ✅   |
| `/learning`      | 학습 현황 - 과목별 성취도 분석      | ✅   |
| `/auth/login`    | 로그인                              | ❌   |
| `/auth/register` | 회원가입                            | ❌   |
| `/products`      | 요금제 안내                         | ❌   |
| `/order/:id`     | 결제 페이지                         | ✅   |

## 📖 문서

- [아키텍처 가이드](./backend/docs/ARCHITECTURE.md)
- [기여 가이드](./CONTRIBUTING.md)

## 🤝 기여하기

1. Fork 후 feature 브랜치 생성
2. 변경사항 커밋 (컨벤션 준수)
3. Pull Request 생성

커밋 메시지는 [Conventional Commits](https://www.conventionalcommits.org/) 규칙을 따릅니다:

```
feat(frontend): 새 기능 추가
fix(backend): 버그 수정
docs: 문서 업데이트
```

## 📜 라이선스

Private - All rights reserved
