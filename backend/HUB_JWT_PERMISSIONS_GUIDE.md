# Hub JWT 권한 시스템 통합 가이드 (StudyPlanner)

## 개요

Hub(중앙 인증 서버)에서 발급한 JWT 토큰에 포함된 앱별 권한 정보를 확인하여, StudyPlanner 앱의 특정 기능에 대한 접근을 제어합니다.

## Hub JWT 토큰 구조

```json
{
  "sub": "ATK",
  "jti": "123",
  "iat": 1716558652,
  "exp": 1716576652,
  "permissions": {
    "studyplanner": {
      "plan": "premium",
      "expires": "2025-12-31T23:59:59Z",
      "features": ["planner", "routine", "analytics", "ai-recommendation"]
    }
  }
}
```

## 구현된 파일

### 1. 타입 정의

- `src/auth/types/jwt-payload.type.ts`
  - `AppPermission`: 앱별 권한 정보
  - `PermissionsPayload`: 전체 권한 맵
  - `JwtPayloadType`: JWT 페이로드 (permissions 필드 추가)

### 2. JWT 헬퍼 서비스

- `src/auth/services/jwt-helper.service.ts`
  - `getAppPermission(token, appId)`: 특정 앱의 권한 추출
  - `getAllPermissions(token)`: 모든 권한 추출
  - `verifyToken(token)`: JWT 토큰 검증

### 3. 데코레이터

- `src/auth/decorators/require-feature.decorator.ts`
  - `@RequireFeature(feature)`: 특정 기능 권한이 필요한 엔드포인트에 사용

### 4. 가드

- `src/auth/guards/hub-permission.guard.ts`
  - JWT 토큰의 permissions 필드 확인
  - 만료일 체크
  - 기능 권한 체크

## 사용 방법

### 1. 기본 사용 (컨트롤러 메서드에 적용)

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { RequireFeature } from 'src/auth/decorators/require-feature.decorator';
import { HubPermissionGuard } from 'src/auth/guards/hub-permission.guard';
import { JwtAuthGuard } from '@nestjs/passport';

@Controller('planner')
@UseGuards(JwtAuthGuard) // 먼저 JWT 인증 확인
export class PlannerController {
  // 무료 사용자도 접근 가능 (기본 플래너)
  @Get('basic')
  getBasicPlanner() {
    return { message: '기본 학습 계획 - 무료' };
  }

  // 'planner' 기능 권한이 필요한 API
  @Get('advanced')
  @UseGuards(HubPermissionGuard)
  @RequireFeature('planner')
  getAdvancedPlanner() {
    return { message: '고급 학습 계획 - basic 이상' };
  }

  // 'routine' 기능 권한이 필요한 API
  @Get('routine')
  @UseGuards(HubPermissionGuard)
  @RequireFeature('routine')
  getRoutine() {
    return { message: '루틴 관리 - basic 이상' };
  }

  // 'analytics' 기능 권한이 필요한 API
  @Get('analytics')
  @UseGuards(HubPermissionGuard)
  @RequireFeature('analytics')
  getAnalytics() {
    return { message: '학습 분석 - premium 플랜 필요' };
  }

  // 'ai-recommendation' 기능 권한이 필요한 API
  @Get('ai-recommend')
  @UseGuards(HubPermissionGuard)
  @RequireFeature('ai-recommendation')
  getAiRecommendation() {
    return { message: 'AI 추천 - premium 플랜 필요' };
  }
}
```

### 2. 전역 적용 (app.module.ts에 APP_GUARD로 등록)

```typescript
// app.module.ts
import { HubPermissionGuard } from './auth/guards/hub-permission.guard';

@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard, // 먼저 JWT 인증
    },
    {
      provide: APP_GUARD,
      useClass: HubPermissionGuard, // 그 다음 권한 체크
    },
  ],
})
export class AppModule {}
```

## 플랜별 권한 예시

### Free 플랜

```json
{
  "plan": "free",
  "features": ["planner"]
}
```

- 기본 학습 계획만 가능
- 루틴, 분석, AI 추천 불가

### Basic 플랜

```json
{
  "plan": "basic",
  "expires": "2025-12-31T23:59:59Z",
  "features": ["planner", "routine"]
}
```

- 학습 계획 + 루틴 관리 가능
- 만료일 존재

### Premium 플랜

```json
{
  "plan": "premium",
  "expires": "2025-12-31T23:59:59Z",
  "features": ["planner", "routine", "analytics", "ai-recommendation"]
}
```

- 모든 기능 사용 가능 (계획, 루틴, 분석, AI 추천)
- 만료일 존재

## 에러 응답

### 401 Unauthorized

- JWT 토큰이 없거나 유효하지 않음

### 403 Forbidden

- StudyPlanner 앱 권한이 없음
- 구독이 만료됨
- 요청한 기능에 대한 권한이 없음

예시:

```json
{
  "success": false,
  "statusCode": 403,
  "message": "'analytics' 기능을 사용할 권한이 없습니다."
}
```

## Hub와 JWT 시크릿 키 공유

StudyPlanner와 Hub는 **동일한 JWT 시크릿 키**를 사용해야 합니다.

### .env 파일 설정

```env
# Hub와 동일한 시크릿 키 사용
AUTH_SECRET=04ca023b39512e46d0c2cf4b48d5aac61d34302994c87ed4eff225dcf3b0a218739f3897051a057f9b846a69ea2927a587044164b7bae5e1306219d50b588cb1
```

⚠️ **중요**: Hub에서 설정한 시크릿 키와 정확히 일치해야 합니다.

## 테스트

### 1. JWT 토큰 생성 (Hub에서)

```bash
curl -X POST http://localhost:4000/auth/login/email \
  -H "Content-Type: application/json" \
  -d '{"email": "test@test.com", "password": "password123"}'
```

### 2. 권한이 필요한 API 호출

```bash
curl -X GET http://localhost:4004/planner/analytics \
  -H "Authorization: Bearer eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9..."
```

## 문의

Hub JWT 권한 시스템 관련 문의사항은 Hub 백엔드 팀에 연락하세요.
