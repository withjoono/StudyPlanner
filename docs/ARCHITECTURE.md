# GB Planner 아키텍처 가이드

## 목차

1. [프로젝트 구조](#프로젝트-구조)
2. [모노레포 구성](#모노레포-구성)
3. [Frontend 아키텍처](#frontend-아키텍처)
4. [Backend 아키텍처](#backend-아키텍처)
5. [공유 패키지](#공유-패키지)
6. [데이터 흐름](#데이터-흐름)
7. [개발 가이드](#개발-가이드)

---

## 프로젝트 구조

```
gb-planner/
├── apps/
│   ├── frontend/               # React 프론트엔드
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── planner/    # 플래너 전용 컴포넌트
│   │   │   │   └── ui/         # shadcn/ui 컴포넌트
│   │   │   ├── hooks/          # 커스텀 훅
│   │   │   ├── lib/
│   │   │   │   └── utils/      # 유틸리티 함수
│   │   │   ├── routes/         # TanStack Router 페이지
│   │   │   ├── stores/
│   │   │   │   ├── client/     # Zustand 스토어
│   │   │   │   └── server/     # TanStack Query 훅
│   │   │   └── types/          # 프론트엔드 전용 타입
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   └── tailwind.config.js
│   │
│   └── backend/                # NestJS 백엔드
│       ├── src/
│       │   ├── common/         # 공통 모듈 (Guards, Pipes 등)
│       │   ├── planner/        # 플래너 기능 모듈
│       │   │   ├── planner.module.ts
│       │   │   ├── planner.controller.ts
│       │   │   ├── planner.service.ts
│       │   │   ├── routine.controller.ts
│       │   │   ├── routine.service.ts
│       │   │   ├── plan.controller.ts
│       │   │   └── plan.service.ts
│       │   ├── app.module.ts
│       │   └── main.ts
│       ├── test/
│       ├── package.json
│       └── nest-cli.json
│
├── packages/
│   └── shared-types/           # 공유 타입 패키지
│       ├── src/
│       │   ├── planner/        # 플래너 관련 타입
│       │   │   ├── item.types.ts
│       │   │   ├── plan.types.ts
│       │   │   ├── routine.types.ts
│       │   │   └── index.ts
│       │   ├── api/            # API 응답 타입
│       │   │   ├── response.types.ts
│       │   │   └── index.ts
│       │   ├── common/         # 공통 상수
│       │   │   ├── constants.ts
│       │   │   └── index.ts
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
│
├── docs/                       # 문서
│   └── ARCHITECTURE.md
├── package.json                # 루트 워크스페이스 설정
├── commitlint.config.js        # 커밋 컨벤션 설정
├── CONTRIBUTING.md             # 기여 가이드
└── yarn.lock
```

---

## 모노레포 구성

### Yarn Workspaces

이 프로젝트는 **Yarn Workspaces**를 사용하여 여러 패키지를 단일 저장소에서 관리합니다.

```json
// package.json (루트)
{
  "workspaces": ["apps/*", "packages/*"]
}
```

### 워크스페이스 패키지

| 패키지명                   | 경로                    | 설명                 |
| -------------------------- | ----------------------- | -------------------- |
| `@gb-planner/frontend`     | `apps/frontend`         | React 프론트엔드 앱  |
| `@gb-planner/backend`      | `apps/backend`          | NestJS 백엔드 API    |
| `@gb-planner/shared-types` | `packages/shared-types` | 공유 TypeScript 타입 |

### 패키지 간 의존성

```
@gb-planner/frontend
    └── @gb-planner/shared-types

@gb-planner/backend
    └── @gb-planner/shared-types
```

---

## Frontend 아키텍처

### 기술 스택

| 영역           | 기술                         |
| -------------- | ---------------------------- |
| Framework      | React 18 + TypeScript        |
| Build Tool     | Vite                         |
| Router         | TanStack Router (File-based) |
| State (Client) | Zustand                      |
| State (Server) | TanStack Query               |
| Styling        | Tailwind CSS                 |
| UI Components  | shadcn/ui + Radix UI         |
| Forms          | React Hook Form + Zod        |
| Icons          | Lucide React                 |

### 디렉토리 구조

```
src/
├── components/
│   ├── planner/           # 플래너 도메인 컴포넌트
│   │   ├── DailyMissionCard.tsx
│   │   ├── WeeklyCalendar.tsx
│   │   └── ...
│   └── ui/                # 재사용 UI 컴포넌트 (shadcn/ui)
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       └── ...
│
├── hooks/                 # 커스텀 훅
│   ├── use-debounce.ts
│   └── ...
│
├── lib/
│   └── utils/             # 유틸리티 함수
│       ├── cn.ts          # clsx + tailwind-merge
│       └── distribution.ts # 일정 분배 알고리즘
│
├── routes/                # TanStack Router 페이지
│   ├── __root.tsx         # 루트 레이아웃
│   ├── index.tsx          # 대시보드 (/)
│   ├── today.lazy.tsx     # 금일 할일 (/today)
│   ├── routine.lazy.tsx   # 주간 루틴 (/routine)
│   ├── plans.lazy.tsx     # 장기 계획 (/plans)
│   └── learning.lazy.tsx  # 학습 현황 (/learning)
│
├── stores/
│   ├── client/            # Zustand 클라이언트 상태
│   │   └── use-planner-store.ts
│   └── server/            # TanStack Query API 훅
│       └── planner/
│           ├── hooks.ts   # useGetRoutines, useCreatePlan 등
│           ├── mock-data.ts
│           └── index.ts
│
├── types/                 # 프론트엔드 전용 타입
│   └── planner.ts
│
├── main.tsx               # 앱 엔트리포인트
└── index.css              # 글로벌 스타일 + Tailwind
```

### 상태 관리 전략

#### Client State (Zustand)

- UI 상태 (모달 열림/닫힘, 선택된 날짜, 필터 등)
- localStorage 동기화

```typescript
// stores/client/use-planner-store.ts
export const usePlannerStore = create<PlannerStore>()(
  persist(
    (set, get) => ({
      selectedDate: getInitialDate(),
      currentView: 'daily',
      // ...
    }),
    { name: 'planner-store' },
  ),
);
```

#### Server State (TanStack Query)

- API 데이터 캐싱 및 동기화
- 자동 리패칭, 낙관적 업데이트

```typescript
// stores/server/planner/hooks.ts
export function useGetRoutines() {
  return useQuery({
    queryKey: plannerKeys.routines(),
    queryFn: () => api.get('/planner/routines'),
  });
}
```

### 라우팅

TanStack Router의 File-based routing 사용:

| 파일                | 경로        | 설명           |
| ------------------- | ----------- | -------------- |
| `index.tsx`         | `/`         | 대시보드       |
| `today.lazy.tsx`    | `/today`    | 금일 할일      |
| `routine.lazy.tsx`  | `/routine`  | 주간 루틴 설정 |
| `plans.lazy.tsx`    | `/plans`    | 장기 계획 관리 |
| `learning.lazy.tsx` | `/learning` | 학습 현황      |

---

## Backend 아키텍처

### 기술 스택

| 영역       | 기술            |
| ---------- | --------------- |
| Framework  | NestJS 10       |
| ORM        | TypeORM         |
| Database   | MySQL           |
| Validation | class-validator |
| API Docs   | Swagger         |

### 디렉토리 구조

```
src/
├── common/                # 공통 모듈
│   ├── guards/            # 인증/인가 가드
│   ├── pipes/             # 유효성 검사 파이프
│   ├── filters/           # 예외 필터
│   └── decorators/        # 커스텀 데코레이터
│
├── planner/               # 플래너 모듈
│   ├── planner.module.ts
│   ├── planner.controller.ts   # /planner/items API
│   ├── planner.service.ts
│   ├── routine.controller.ts   # /planner/routines API
│   ├── routine.service.ts
│   ├── plan.controller.ts      # /planner/plans API
│   └── plan.service.ts
│
├── app.module.ts          # 루트 모듈
└── main.ts                # 앱 부트스트랩
```

### API 엔드포인트

#### 플래너 아이템 API

| Method | Endpoint                      | 설명             |
| ------ | ----------------------------- | ---------------- |
| GET    | `/planner/items`              | 아이템 목록 조회 |
| GET    | `/planner/items/:id`          | 아이템 상세 조회 |
| POST   | `/planner/items`              | 아이템 생성      |
| PUT    | `/planner/items/:id`          | 아이템 수정      |
| PUT    | `/planner/items/:id/progress` | 성취도 업데이트  |
| DELETE | `/planner/items/:id`          | 아이템 삭제      |
| GET    | `/planner/dashboard`          | 대시보드 데이터  |
| GET    | `/planner/weekly-progress`    | 주간 성취도      |

#### 루틴 API

| Method | Endpoint                | 설명           |
| ------ | ----------------------- | -------------- |
| GET    | `/planner/routines`     | 루틴 목록 조회 |
| POST   | `/planner/routines`     | 루틴 생성      |
| PUT    | `/planner/routines/:id` | 루틴 수정      |
| DELETE | `/planner/routines/:id` | 루틴 삭제      |

#### 장기 계획 API

| Method | Endpoint                      | 설명            |
| ------ | ----------------------------- | --------------- |
| GET    | `/planner/plans`              | 계획 목록 조회  |
| POST   | `/planner/plans`              | 계획 생성       |
| PUT    | `/planner/plans/:id`          | 계획 수정       |
| PUT    | `/planner/plans/:id/progress` | 진행률 업데이트 |
| DELETE | `/planner/plans/:id`          | 계획 삭제       |

### Swagger API 문서

백엔드 실행 후 http://localhost:4000/api 에서 API 문서 확인 가능

---

## 공유 패키지

### @gb-planner/shared-types

프론트엔드와 백엔드 간 공유되는 TypeScript 타입을 정의합니다.

#### 빌드

```bash
cd packages/shared-types
yarn build
```

#### 사용

```typescript
// 프론트엔드 또는 백엔드에서
import { PlannerItem, Routine, PlannerPlan, SUBJECT_COLORS, DAYS } from '@gb-planner/shared-types';
```

#### 주요 타입

```typescript
// 플래너 아이템
interface PlannerItem {
  id: number;
  memberId: number;
  primaryType: '학습' | '수업';
  subject?: string;
  title: string;
  startDate: Date;
  endDate: Date;
  progress: number;
  // ...
}

// 루틴
interface Routine {
  id: number;
  title: string;
  category: 'fixed' | 'study' | 'rest' | 'other';
  startTime: string;
  endTime: string;
  days: boolean[];
  // ...
}

// 장기 계획
interface PlannerPlan {
  id: number;
  title: string;
  subject?: string;
  type: 'textbook' | 'lecture';
  total?: number;
  done: number;
  // ...
}
```

---

## 데이터 흐름

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐   │
│  │   UI Layer   │───▶│ Store Layer  │───▶│  API Layer   │   │
│  │   (React)    │◀───│  (Zustand +  │◀───│  (TanStack   │   │
│  │              │    │    Query)    │    │    Query)    │   │
│  └──────────────┘    └──────────────┘    └──────────────┘   │
│                                                  │           │
└──────────────────────────────────────────────────│───────────┘
                                                   │
                                            HTTP/REST API
                                                   │
┌──────────────────────────────────────────────────│───────────┐
│                        Backend                    │           │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐   │
│  │  Controller  │───▶│   Service    │───▶│ Repository   │   │
│  │   (NestJS)   │◀───│   Layer      │◀───│  (TypeORM)   │   │
│  └──────────────┘    └──────────────┘    └──────────────┘   │
│                                                  │           │
└──────────────────────────────────────────────────│───────────┘
                                                   │
                                              ┌────▼────┐
                                              │  MySQL  │
                                              └─────────┘
```

---

## 개발 가이드

### 새 기능 추가 시

1. **타입 정의** (`packages/shared-types`)

   ```typescript
   // src/planner/new-feature.types.ts
   export interface NewFeature { ... }
   ```

2. **타입 패키지 빌드**

   ```bash
   cd packages/shared-types && yarn build
   ```

3. **백엔드 API 구현** (`apps/backend`)
   - Controller, Service 추가
   - Swagger 문서화

4. **프론트엔드 구현** (`apps/frontend`)
   - API 훅 추가 (`stores/server/`)
   - UI 컴포넌트 추가 (`components/`)
   - 라우트 추가 (`routes/`)

### 타입 변경 시

공유 타입 변경 후 반드시 빌드:

```bash
cd packages/shared-types && yarn build
```

### 포트 설정

| 서비스   | 포트 | 환경변수 |
| -------- | ---- | -------- |
| Frontend | 3001 | -        |
| Backend  | 4000 | `PORT`   |
| Database | 3306 | -        |

### 프록시 설정

프론트엔드에서 백엔드 API 호출 시 Vite 프록시 사용:

```typescript
// apps/frontend/vite.config.ts
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:4000',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, ''),
    },
  },
}
```

---

## 참고 자료

- [TanStack Router](https://tanstack.com/router)
- [TanStack Query](https://tanstack.com/query)
- [Zustand](https://zustand-demo.pmnd.rs/)
- [NestJS](https://nestjs.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
