/**
 * Hub JWT 토큰에 포함된 앱별 권한 정보
 */
export type AppPermission = {
  plan: 'free' | 'basic' | 'premium' | 'none';
  expires?: string;
  features?: string[];
};

/**
 * Hub JWT 토큰에 포함된 전체 권한 정보
 */
export type PermissionsPayload = Record<string, AppPermission>;

export type JwtPayloadType = {
  jti: string; // JWT ID (토큰 고유 식별자)
  sub: string; // Subject (사용자 ID)
  iat: number; // Issued At (발급 시간)
  exp: number; // Expiration Time (만료 시간)
  email?: string; // 사용자 이메일 (선택적)
  permissions?: PermissionsPayload; // Hub JWT에 포함된 앱별 권한 (선택)
};

// Hub JWT payload 예시 (permissions 포함)
// {
//     "sub": "ATK",
//     "jti": "123",
//     "iat": 1716558652,
//     "exp": 1716576652,
//     "permissions": {
//       "studyplanner": {
//         "plan": "premium",
//         "expires": "2025-12-31T23:59:59Z",
//         "features": ["planner", "routine", "analytics"]
//       }
//     }
//   }
