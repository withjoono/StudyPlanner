import { createRootRoute, Outlet, Link, useNavigate } from '@tanstack/react-router';
import { Toaster } from 'sonner';
import { useAuthStore } from '@/stores/client/use-auth-store';
import { useLogout } from '@/stores/server/auth';
import { LogOut, User } from 'lucide-react';

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const logoutMutation = useLogout();

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    navigate({ to: '/auth/login' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 네비게이션 */}
      <nav className="sticky top-0 z-40 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-screen-xl px-4">
          <div className="flex h-14 items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
                GP
              </div>
              <span className="font-bold text-gray-900">GB Planner</span>
            </Link>

            <div className="flex items-center gap-1">
              <NavLink to="/">대시보드</NavLink>
              <NavLink to="/missions">나의 미션</NavLink>
              <NavLink to="/routine">주간 루틴</NavLink>
              <NavLink to="/plans">장기 계획</NavLink>
              <NavLink to="/learning">학습 현황</NavLink>
            </div>

            {/* 사용자 정보 / 로그인 버튼 */}
            <div className="flex items-center gap-2">
              {isAuthenticated && user ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
                      {user.profileImageUrl ? (
                        <img
                          src={user.profileImageUrl}
                          alt={user.userName}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <User className="h-4 w-4 text-gray-500" />
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-700">{user.userName}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
                    disabled={logoutMutation.isPending}
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="hidden sm:inline">로그아웃</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/auth/login"
                    className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
                  >
                    로그인
                  </Link>
                  <Link
                    to="/auth/register"
                    className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
                  >
                    회원가입
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* 메인 콘텐츠 */}
      <main className="pb-10">
        <Outlet />
      </main>

      {/* Toast notifications */}
      <Toaster position="top-right" richColors />
    </div>
  );
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
      activeProps={{
        className: 'px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg',
      }}
    >
      {children}
    </Link>
  );
}
