/**
 * Protected Route 컴포넌트
 * 인증이 필요한 페이지를 보호합니다
 */

import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAuthStore } from '@/stores/client/use-auth-store';
import { hasAccessToken } from '@/lib/api';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredService?: string; // 특정 서비스 필요 시
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  requiredService,
  redirectTo = '/auth/login',
}: ProtectedRouteProps) {
  const navigate = useNavigate();
  const { isAuthenticated, isInitialized, activeServices } = useAuthStore();

  useEffect(() => {
    // 초기화 대기
    if (!isInitialized) return;

    // 토큰이 없으면 로그인 페이지로
    if (!hasAccessToken() || !isAuthenticated) {
      navigate({ to: redirectTo, search: { redirect: window.location.pathname } });
      return;
    }

    // 특정 서비스가 필요한 경우
    if (requiredService && !activeServices.includes(requiredService)) {
      navigate({ to: '/products', search: { required: requiredService } });
    }
  }, [isAuthenticated, isInitialized, activeServices, requiredService, navigate, redirectTo]);

  // 초기화 중
  if (!isInitialized) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  // 인증되지 않음
  if (!isAuthenticated) {
    return null;
  }

  // 특정 서비스 필요 시 체크
  if (requiredService && !activeServices.includes(requiredService)) {
    return null;
  }

  return <>{children}</>;
}

/**
 * 인증 상태에 따라 리다이렉트하는 훅
 */
export function useRequireAuth(redirectTo: string = '/auth/login') {
  const navigate = useNavigate();
  const { isAuthenticated, isInitialized } = useAuthStore();

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      navigate({ to: redirectTo });
    }
  }, [isAuthenticated, isInitialized, navigate, redirectTo]);

  return { isAuthenticated, isInitialized };
}

/**
 * 이미 로그인된 사용자를 리다이렉트하는 훅 (로그인/회원가입 페이지용)
 */
export function useRedirectIfAuthenticated(redirectTo: string = '/') {
  const navigate = useNavigate();
  const { isAuthenticated, isInitialized } = useAuthStore();

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      navigate({ to: redirectTo });
    }
  }, [isAuthenticated, isInitialized, navigate, redirectTo]);

  return { isAuthenticated, isInitialized };
}




