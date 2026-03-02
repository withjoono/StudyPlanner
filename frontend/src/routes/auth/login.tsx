import { createFileRoute } from '@tanstack/react-router';
import { useEffect } from 'react';
import { redirectToHubLogin } from '@/lib/auth/hub-login';

export const Route = createFileRoute('/auth/login')({
  component: LoginPage,
});

/**
 * 로그인 페이지 → Hub SSO 로그인으로 바로 리다이렉트
 * StudyPlanner는 자체 로그인 없이 Hub(T Skool) SSO만 사용합니다.
 */
function LoginPage() {
  useEffect(() => {
    redirectToHubLogin('/');
  }, []);

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 py-12">
      <p className="text-gray-500">T Skool 로그인 페이지로 이동 중...</p>
    </div>
  );
}
