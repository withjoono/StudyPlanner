/**
 * 인증 API Hooks
 * TanStack Query 기반
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { publicClient, authClient, setTokens, clearTokens } from '@/lib/api';
import { env } from '@/lib/config/env';
import type {
  LoginWithEmailRequest,
  RegisterWithEmailRequest,
  LoginWithSocialRequest,
  RegisterWithSocialRequest,
  SendCodeRequest,
  VerifyCodeRequest,
  PasswordResetRequest,
  PasswordResetConfirmRequest,
  LoginResponse,
  Member,
} from '@/types/auth';
import { useAuthStore } from '@/stores/client/use-auth-store';

// ============================================
// Query Keys
// ============================================

export const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const,
  activeServices: () => [...authKeys.all, 'activeServices'] as const,
};

// ============================================
// 로그인 관련 Hooks
// ============================================

/**
 * 이메일 로그인
 */
export function useLoginWithEmail() {
  const queryClient = useQueryClient();
  const { setUser, setActiveServices } = useAuthStore();

  return useMutation({
    mutationFn: async (data: LoginWithEmailRequest) => {
      const response = await publicClient.post<LoginResponse>('/auth/login/email', data);
      return response.data;
    },
    onSuccess: async (data) => {
      // 토큰 저장
      setTokens(data.accessToken, data.refreshToken, data.tokenExpiry);
      setActiveServices(data.activeServices);

      // 사용자 정보 조회
      const meResponse = await authClient.get<Member>('/auth/me');
      setUser(meResponse.data);

      // 캐시 갱신
      queryClient.invalidateQueries({ queryKey: authKeys.me() });
    },
  });
}

/**
 * 소셜 로그인
 */
export function useLoginWithSocial() {
  const queryClient = useQueryClient();
  const { setUser, setActiveServices } = useAuthStore();

  return useMutation({
    mutationFn: async (data: LoginWithSocialRequest) => {
      const response = await publicClient.post<LoginResponse>('/auth/login/social', data);
      return response.data;
    },
    onSuccess: async (data) => {
      setTokens(data.accessToken, data.refreshToken, data.tokenExpiry);
      setActiveServices(data.activeServices);

      const meResponse = await authClient.get<Member>('/auth/me');
      setUser(meResponse.data);

      queryClient.invalidateQueries({ queryKey: authKeys.me() });
    },
  });
}

// ============================================
// 회원가입 관련 Hooks
// ============================================

/**
 * 이메일 회원가입
 */
export function useRegisterWithEmail() {
  const queryClient = useQueryClient();
  const { setUser, setActiveServices } = useAuthStore();

  return useMutation({
    mutationFn: async (data: RegisterWithEmailRequest) => {
      const response = await publicClient.post<LoginResponse>('/auth/register/email', data);
      return response.data;
    },
    onSuccess: async (data) => {
      setTokens(data.accessToken, data.refreshToken, data.tokenExpiry);
      setActiveServices(data.activeServices);

      const meResponse = await authClient.get<Member>('/auth/me');
      setUser(meResponse.data);

      queryClient.invalidateQueries({ queryKey: authKeys.me() });
    },
  });
}

/**
 * 소셜 회원가입
 */
export function useRegisterWithSocial() {
  const queryClient = useQueryClient();
  const { setUser, setActiveServices } = useAuthStore();

  return useMutation({
    mutationFn: async (data: RegisterWithSocialRequest) => {
      const response = await publicClient.post<LoginResponse>('/auth/register/social', data);
      return response.data;
    },
    onSuccess: async (data) => {
      setTokens(data.accessToken, data.refreshToken, data.tokenExpiry);
      setActiveServices(data.activeServices);

      const meResponse = await authClient.get<Member>('/auth/me');
      setUser(meResponse.data);

      queryClient.invalidateQueries({ queryKey: authKeys.me() });
    },
  });
}

/**
 * 휴대폰 인증번호 발송
 */
export function useSendCode() {
  return useMutation({
    mutationFn: async (data: SendCodeRequest) => {
      await publicClient.post('/auth/register/send-code', data);
    },
  });
}

/**
 * 인증번호 확인
 */
export function useVerifyCode() {
  return useMutation({
    mutationFn: async (data: VerifyCodeRequest) => {
      await publicClient.post('/auth/verify-code', data);
    },
  });
}

// ============================================
// 로그아웃
// ============================================

/**
 * 로그아웃
 */
export function useLogout() {
  const queryClient = useQueryClient();
  const { clearAuth } = useAuthStore();

  return useMutation({
    mutationFn: async () => {
      await publicClient.post('/auth/logout');
    },
    onSettled: () => {
      // 성공/실패 관계없이 로컬 상태 정리
      clearTokens();
      clearAuth();
      queryClient.clear();
    },
  });
}

// ============================================
// 사용자 정보 조회
// ============================================

/**
 * 현재 사용자 정보 조회
 */
export function useGetMe() {
  const { setUser } = useAuthStore();

  return useQuery({
    queryKey: authKeys.me(),
    queryFn: async () => {
      const response = await authClient.get<Member>('/auth/me');
      setUser(response.data);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5분
    retry: false,
  });
}

/**
 * 활성 서비스 목록 조회
 */
export function useGetActiveServices() {
  const { setActiveServices } = useAuthStore();

  return useQuery({
    queryKey: authKeys.activeServices(),
    queryFn: async () => {
      const response = await authClient.get<string[]>('/auth/me/active');
      setActiveServices(response.data);
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

// ============================================
// 비밀번호 재설정
// ============================================

/**
 * 비밀번호 재설정 인증번호 요청
 */
export function usePasswordResetRequest() {
  return useMutation({
    mutationFn: async (data: PasswordResetRequest) => {
      await publicClient.post('/auth/password-reset-request', data);
    },
  });
}

/**
 * 비밀번호 재설정 인증번호 확인
 */
export function useVerifyResetCode() {
  return useMutation({
    mutationFn: async (data: { phone: string; code: string }) => {
      const response = await publicClient.post<{ token: string }>('/auth/verify-reset-code', data);
      return response.data;
    },
  });
}

/**
 * 비밀번호 재설정
 */
export function usePasswordReset() {
  return useMutation({
    mutationFn: async (data: PasswordResetConfirmRequest) => {
      await publicClient.post('/auth/password-reset', data);
    },
  });
}

/**
 * SSO 코드 교환 (Hub -> Client)
 */
export function useSsoExchange() {
  const queryClient = useQueryClient();
  const { setUser, setActiveServices } = useAuthStore();

  return useMutation({
    mutationFn: async (code: string) => {
      // plannerClient는 auth 인터셉터가 있어서 SSO 교환(공개 엔드포인트)에 401 발생
      // 직접 axios 호출로 인터셉터 없이 요청
      const response = await axios.post<LoginResponse>(`${env.apiUrlPlanner}/auth/sso/exchange`, {
        code,
      });
      return response.data;
    },
    onSuccess: async (data) => {
      setTokens(data.accessToken, data.refreshToken, data.tokenExpiry);
      setActiveServices(data.activeServices);

      const meResponse = await authClient.get<Member>('/auth/me');
      setUser(meResponse.data);

      queryClient.invalidateQueries({ queryKey: authKeys.me() });
    },
  });
}
