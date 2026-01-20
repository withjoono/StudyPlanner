export type JwtPayloadType = {
  jti: string; // JWT ID (토큰 고유 식별자)
  sub: string; // Subject (사용자 ID)
  iat: number; // Issued At (발급 시간)
  exp: number; // Expiration Time (만료 시간)
  email?: string; // 사용자 이메일 (선택적)
};
