# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**GB Planner** is a Korean study planning and learning management platform. It is a full-stack monorepo with a React SPA frontend and a NestJS REST API backend.

## Commands

### Development

```bash
yarn dev              # Frontend only (http://localhost:3004)
yarn dev:backend      # Backend only (http://localhost:4004)
yarn dev:all          # Both simultaneously
```

### Building

```bash
yarn build:frontend
yarn build:backend
```

### Code Quality

```bash
yarn lint             # ESLint fix
yarn lint:check       # ESLint check (CI mode, no write)
yarn format           # Prettier fix
yarn format:check     # Prettier check
```

### Testing

```bash
yarn test:backend     # Jest (backend only)
yarn test:watch       # Jest watch mode
yarn test:cov         # Jest coverage
```

### Database (run from repo root)

```bash
yarn prisma:generate  # Regenerate Prisma client after schema changes
yarn prisma:migrate   # Run pending migrations
yarn prisma:studio    # Open Prisma Studio GUI
```

### Routing (Frontend)

After adding or removing route files, TanStack Router auto-regenerates `frontend/src/routeTree.gen.ts` during dev. To trigger manually:

```bash
cd frontend && npx tsr generate
```

## Architecture

### Monorepo Layout

- `frontend/` — React 18 SPA (Vite, TanStack Router, TanStack Query, Zustand, Tailwind + shadcn/ui)
- `backend/` — NestJS API (Prisma + PostgreSQL, Passport JWT, Swagger)
- Root holds Yarn workspace config, ESLint, Prettier, and commitlint

### Frontend API Proxy (Dual Backend)

The Vite dev server proxies to two separate backends:

- `/api/*` → StudyPlanner backend (`localhost:4004`)
- `/api-main/*` → Hub backend (`localhost:4000`) — centralized auth, payments, user management

Production targets are set via `VITE_API_URL` and `VITE_MAIN_API_URL` env vars.

### Frontend State Management

- **Server state** (API data): TanStack Query hooks in `src/stores/server/` — 5-minute stale time by default
- **Client state** (UI, auth): Zustand stores in `src/stores/client/`

### Frontend Routing

File-based routing via TanStack Router. Files in `src/routes/` map directly to URL paths. `.lazy.tsx` suffix = lazy-loaded. Route params are fully type-safe. `__root.tsx` defines the root layout and auth guards.

### Backend Module Pattern

Each domain is a NestJS module (e.g., `PlannerModule`, `TimerModule`, `MessageModule`). All modules are imported in `AppModule`. Feature structure per module: `*.module.ts`, `*.controller.ts`, `*.service.ts`, `*.dto.ts`.

### Authentication & Hub SSO

**JWT spec**: Algorithm `HS512`, secret is Base64-encoded. Backend must decode as:

```typescript
secretOrKey: Buffer.from(configService.get('AUTH_SECRET'), 'base64');
```

If you use `algorithms: ['HS256']` or treat the secret as a raw string, tokens will always fail with 401 even if the `.env` strings match.

**SSO flow** (sso_code exchange pattern):

1. Hub Frontend redirects user to `?sso_code=XYZ` on this app's domain
2. Frontend captures the code and calls `POST /auth/sso/exchange` on **this** backend
3. This backend calls `POST http://localhost:4000/auth/sso/verify-code` server-to-server
4. Backend receives tokens and returns them to the frontend

**SSO capture must run in `__root.tsx`** (root layout), not just the homepage. Hub can redirect back to any deep-link URL; if capture is page-specific, users arriving at `/missions` or `/plans` will remain logged out.

Hub SSO service ID for this app: `studyplanner` (port `3004`). Hub Frontend's `.env` must include `VITE_STUDYPLANNER_URL="http://localhost:3004"` for local SSO to work.

Tokens are stored in `localStorage` and injected via `frontend/src/lib/api/token-manager.ts`. Backend guards in `backend/src/common/`.

### Shared Package

`@withjoono/geobuk-shared` (private npm) provides shared UI components, auth utilities, and a Tailwind preset used by this repo.

### Database

Prisma with PostgreSQL. Schema at `backend/prisma/schema.prisma` (~40 models). Key domains:

- Users & roles: `User`, `Student`, `ParentStudent`, `TeacherStudent`
- Planner: `WeeklyRoutine`, `LongTermPlan`, `DailyMission`, `MissionResult`
- Learning: `Material`, `MaterialChapter`, `StudentLesson`, `StudentMentoring`
- Gamification: `DailyScore`, `Badge`, `Acorn`, ranking tables
- Timer & verification: `TimerSession`, `VerificationPhoto`

### Deployment

**Production URLs:**

- Frontend: `https://studyplanner.kr` (Firebase project `ts-front-479305`, also `studyplanner-new.web.app`)
- Backend: `https://studyplanner-backend-dot-ts-back-nest-479305.du.r.appspot.com`
- Hub Frontend (SSO dispatcher): `https://www.geobukschool.kr`
- Hub Backend API: `https://ts-back-nest-479305.du.r.appspot.com`

CI/CD triggers automatically on push to `main`:

- `frontend/**` changes → Firebase Hosting via GitHub Actions
- `backend/**` changes → GCP App Engine via GitHub Actions

**`.env.production` is critical.** Vite bakes env vars at build time. If `VITE_HUB_URL` is missing, the fallback `http://localhost:3000` gets hardcoded into the production bundle and all SSO logins will redirect to localhost. Required production vars:

```env
VITE_HUB_URL="https://www.geobukschool.kr"
VITE_HUB_API_URL="https://ts-back-nest-479305.du.r.appspot.com"
VITE_API_URL_PLANNER="https://studyplanner-backend-dot-ts-back-nest-479305.du.r.appspot.com"
```

After fixing, must rebuild (`yarn build:frontend`) and redeploy.

**Manual deployment** (gcloud named config: `studyplanner`, account: `geobukacademy@gmail.com`, GCP project: `studyplanner-new`):

```powershell
$env:CLOUDSDK_ACTIVE_CONFIG_NAME = "studyplanner"
```

## Domain-Specific Patterns

### Subject & Curriculum API

`GET /planner/subjects` returns a **nested** structure — not a flat array:

```json
{
  "curriculum": "2022",
  "groups": [
    {
      "kyokwa": "수학",
      "kyokwaCode": "02",
      "subjects": [{ "id": "H250211", "subjectName": "수학Ⅰ", "subjectCode": 1 }]
    }
  ]
}
```

Always access via `subjectsData?.groups ?? []`. Legacy flat-array access will return undefined.

**Curriculum detection** (`getCurriculumFromUserId`): strip `sp_` prefix → strip role prefix (`S`/`T`/etc.) → check first 4 chars. If `26H3`, `26H4`, or `26H0` → 2015 curriculum, otherwise 2022. This runs before the API responds to pre-set UI defaults.

**React key rule for subject `<option>` elements**: always use `subject.id`, never `subject.subjectCode`. `subjectCode` is an integer (1, 2, 3…) that resets per group — when the user switches kyokwa, React reuses the existing DOM nodes instead of replacing them, causing stale or mixed subject lists. Affected files: `plans.lazy.tsx`, `missions.lazy.tsx`, `routine.lazy.tsx`.

## Code Conventions

### Commits

Conventional Commits are enforced by commitlint + Husky. Valid types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `revert`, `ci`, `build`. Subject max 72 chars.

### ESLint Rules to Know

- No `console.log` (use `console.warn` / `console.error`)
- No `var`; use `const`/`let`
- PascalCase for classes/interfaces, camelCase for functions/variables
- `any` types will warn — prefer explicit types

### Prettier

Single quotes, 2-space indentation, 100-character print width, trailing commas, Tailwind class sorting.

### Path Alias

`@/*` resolves to `frontend/src/*`.
