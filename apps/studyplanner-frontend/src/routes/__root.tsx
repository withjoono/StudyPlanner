import { createRootRoute, Outlet, Link, useNavigate } from '@tanstack/react-router';
import { Toaster } from 'sonner';
import { useAuthStore } from '@/stores/client/use-auth-store';
import { useLogout } from '@/stores/server/auth';
import {
  LogOut,
  User,
  ChevronLeft,
  CreditCard,
  Bell,
  Share2,
  LayoutDashboard,
  Target,
  CalendarClock,
  BookOpen,
  BarChart3,
} from 'lucide-react';

// Hub URL
const HUB_URL =
  import.meta.env.VITE_HUB_URL ||
  (import.meta.env.PROD ? 'https://geobukschool.kr' : 'http://localhost:5173');

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
            {/* 왼쪽: 전체 서비스 링크 */}
            <div className="flex items-center gap-4">
              <a
                href={HUB_URL}
                className="hover:text-ultrasonic-600 flex items-center gap-1 text-sm font-medium text-gray-600 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>전체 서비스</span>
              </a>

              {/* 로고 구분선 */}
              <div className="hidden h-6 w-px bg-gray-200 sm:block" />

              <Link to="/" className="flex items-center gap-2">
                <div className="bg-ultrasonic-500 flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white">
                  GP
                </div>
                <span className="hidden font-bold text-gray-900 sm:inline">플래너</span>
              </Link>
            </div>

            {/* 중앙: 네비게이션 메뉴 */}
            <div className="hidden items-center gap-1 md:flex">
              <NavLink to="/" icon={<LayoutDashboard className="h-4 w-4" />}>
                플래너홈
              </NavLink>
              <NavLink to="/missions" icon={<Target className="h-4 w-4" />}>
                나의 미션
              </NavLink>
              <NavLink to="/routine" icon={<CalendarClock className="h-4 w-4" />}>
                주간 루틴
              </NavLink>
              <NavLink to="/plans" icon={<BookOpen className="h-4 w-4" />}>
                장기 계획
              </NavLink>
              <NavLink to="/learning" icon={<BarChart3 className="h-4 w-4" />}>
                학습 현황
              </NavLink>
            </div>

            {/* 오른쪽: 아이콘 버튼 + 사용자 정보 */}
            <div className="flex items-center gap-1">
              {/* 아이콘 버튼들 */}
              <IconButton
                href={`${HUB_URL}/products`}
                icon={<CreditCard className="h-4 w-4" />}
                label="결제"
              />
              <IconButton href="#" icon={<Bell className="h-4 w-4" />} label="알림" badge={3} />
              <IconButton href="#" icon={<Share2 className="h-4 w-4" />} label="공유" />

              {/* 구분선 */}
              <div className="mx-2 h-6 w-px bg-gray-200" />

              {/* 사용자 정보 / 로그인 버튼 */}
              {isAuthenticated && user ? (
                <div className="flex items-center gap-2">
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
                    <span className="hidden text-sm font-medium text-gray-700 sm:inline">
                      {user.userName}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1 rounded-lg px-2 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
                    disabled={logoutMutation.isPending}
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <Link
                  to="/auth/login"
                  className="bg-ultrasonic-500 hover:bg-ultrasonic-600 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
                >
                  로그인
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* 모바일 하단 네비게이션 */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white md:hidden">
        <div className="flex items-center justify-around py-2">
          <MobileNavLink to="/" icon={<LayoutDashboard className="h-5 w-5" />} label="홈" />
          <MobileNavLink to="/missions" icon={<Target className="h-5 w-5" />} label="미션" />
          <MobileNavLink to="/routine" icon={<CalendarClock className="h-5 w-5" />} label="루틴" />
          <MobileNavLink to="/plans" icon={<BookOpen className="h-5 w-5" />} label="계획" />
          <MobileNavLink to="/learning" icon={<BarChart3 className="h-5 w-5" />} label="현황" />
        </div>
      </nav>

      {/* 메인 콘텐츠 */}
      <main className="pb-20 md:pb-10">
        <Outlet />
      </main>

      {/* Toast notifications */}
      <Toaster position="top-right" richColors />
    </div>
  );
}

function NavLink({
  to,
  children,
  icon,
}: {
  to: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
      activeProps={{
        className:
          'flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-ultrasonic-600 bg-ultrasonic-50 rounded-lg',
      }}
    >
      {icon}
      {children}
    </Link>
  );
}

function IconButton({
  href,
  icon,
  label,
  badge,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}) {
  return (
    <a
      href={href}
      className="relative flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
      title={label}
    >
      {icon}
      {badge !== undefined && badge > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </a>
  );
}

function MobileNavLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className="flex flex-col items-center gap-1 px-3 py-1 text-gray-500"
      activeProps={{
        className: 'flex flex-col items-center gap-1 px-3 py-1 text-ultrasonic-600',
      }}
    >
      {icon}
      <span className="text-xs">{label}</span>
    </Link>
  );
}
