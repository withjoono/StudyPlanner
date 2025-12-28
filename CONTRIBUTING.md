# CONTRIBUTING.md

GB Planner 프론트엔드 기여 가이드입니다.

---

## Git 커밋 컨벤션

### 커밋 메시지 형식

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Type (필수)

| Type       | 설명                         | 예시                                        |
| ---------- | ---------------------------- | ------------------------------------------- |
| `feat`     | 새로운 기능 추가             | `feat(routine): 주간 루틴 뷰 추가`          |
| `fix`      | 버그 수정                    | `fix(mission): 성취도 계산 오류 수정`       |
| `docs`     | 문서 수정                    | `docs: README 업데이트`                     |
| `style`    | 코드 포맷팅 (기능 변경 없음) | `style: lint 오류 수정`                     |
| `refactor` | 코드 리팩토링                | `refactor(plan): 장기 계획 폼 구조 개선`    |
| `test`     | 테스트 추가/수정             | `test(mission): 미션 생성 유닛 테스트 추가` |
| `chore`    | 빌드, 설정 변경              | `chore: package.json 업데이트`              |
| `perf`     | 성능 개선                    | `perf(timeline): 타임라인 렌더링 최적화`    |
| `revert`   | 커밋 되돌리기                | `revert: feat(routine) 커밋 취소`           |

### Scope (권장)

| Scope      | 설명             |
| ---------- | ---------------- |
| `routine`  | 루틴 관련        |
| `plan`     | 계획 관련        |
| `mission`  | 미션 관련        |
| `schedule` | 일정 관련        |
| `feedback` | 피드백 관련      |
| `mentor`   | 멘토 관련        |
| `student`  | 학생 관련        |
| `ui`       | UI 컴포넌트 관련 |
| `api`      | API 연동 관련    |
| `store`    | 상태 관리 관련   |

---

## 코딩 스타일 가이드

### 명명 규칙 (Naming Conventions)

| 대상              | 규칙                     | 예시                                         |
| ----------------- | ------------------------ | -------------------------------------------- |
| 변수              | camelCase                | `memberScore`, `calculatedResult`            |
| 상수              | UPPER_SNAKE_CASE         | `MAX_RETRY_COUNT`, `DEFAULT_TIMEOUT`         |
| 함수              | camelCase                | `calculateScore()`, `getMemberById()`        |
| 클래스            | PascalCase               | `MemberService`, `ScoreCalculator`           |
| 인터페이스        | PascalCase (접두사 없음) | `ScoreResult`, `MemberInfo`                  |
| 타입              | PascalCase               | `ScoreType`, `CalculationMethod`             |
| React 컴포넌트    | PascalCase               | `ScoreCard`, `MemberProfile`                 |
| 커스텀 훅         | camelCase (use 접두사)   | `useScoreCalculation`, `useMemberData`       |
| 파일명 (컴포넌트) | PascalCase               | `ScoreCard.tsx`, `MemberProfile.tsx`         |
| 파일명 (유틸/훅)  | kebab-case               | `use-score-calculation.ts`, `format-date.ts` |
| 디렉토리          | kebab-case               | `mock-exam/`, `school-record/`               |

### API 통신

| 대상          | 규칙       | 예시                                            |
| ------------- | ---------- | ----------------------------------------------- |
| API 경로      | kebab-case | `/api/planner/routines`                         |
| 쿼리 파라미터 | camelCase  | `?memberId=123&weekStart=2025-01-01`            |
| Request Body  | camelCase  | `{ "memberId": 123, "title": "수학 공부" }`     |
| Response Body | camelCase  | `{ "totalAmount": 100, "completedAmount": 50 }` |

---

## 자동화 도구

### Husky (Git Hooks)

- **commit-msg**: commitlint로 커밋 메시지 검사
- **pre-commit**: lint-staged로 변경된 파일만 lint/format

### ESLint + Prettier

```bash
yarn lint          # ESLint 검사 및 자동 수정
yarn format        # Prettier 포맷팅
yarn type-check    # TypeScript 타입 검사
```

### Commitlint

```bash
# ✅ 올바른 커밋 메시지
git commit -m "feat(routine): 주간 루틴 타임테이블 추가"

# ❌ 거부되는 커밋 메시지
git commit -m "작업함"  # type 없음
git commit -m "FEAT: 추가"  # type은 소문자
```
