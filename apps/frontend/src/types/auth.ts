/**
 * 인증 관련 타입 정의
 */

// 회원 정보
export interface Member {
  id: number;
  email: string;
  userName: string;
  phone?: string;
  profileImageUrl?: string;
  school?: string;
  grade?: string;
  providerType?: 'local' | 'naver' | 'google';
  createdAt?: string;
  updatedAt?: string;
}

// 로그인 응답
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenExpiry: number;
  activeServices: string[];
}

// 이메일 로그인 요청
export interface LoginWithEmailRequest {
  email: string;
  password: string;
}

// 이메일 회원가입 요청
export interface RegisterWithEmailRequest {
  email: string;
  password: string;
  userName: string;
  phone: string;
  inviteCode?: string;
}

// 소셜 로그인 요청
export interface LoginWithSocialRequest {
  socialType: 'naver' | 'google';
  accessToken: string;
}

// 소셜 회원가입 요청
export interface RegisterWithSocialRequest {
  socialType: 'naver' | 'google';
  accessToken: string;
  userName: string;
  phone: string;
  inviteCode?: string;
}

// 인증 코드 발송 요청
export interface SendCodeRequest {
  email?: string;
  phone: string;
}

// 인증 코드 확인 요청
export interface VerifyCodeRequest {
  phone: string;
  code: string;
}

// 비밀번호 재설정 요청
export interface PasswordResetRequest {
  email: string;
  phone: string;
}

// 비밀번호 재설정 확인 요청
export interface PasswordResetConfirmRequest {
  token: string;
  newPassword: string;
}




