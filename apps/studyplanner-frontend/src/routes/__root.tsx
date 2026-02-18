import { createRootRoute, Outlet, Link, useNavigate } from '@tanstack/react-router';
import { Toaster, toast } from 'sonner';
import { useAuthStore } from '@/stores/client/use-auth-store';

import { useSsoExchange } from '@/stores/server/auth';
import { useEffect, useState } from 'react';
import { Wallet, Bell, Timer, X, GraduationCap, LayoutGrid, Users, ChevronDown, LogOut } from 'lucide-react';

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
  const ssoExchangeMutation = useSsoExchange();
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSSOLoading, setIsSSOLoading] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return !!params.get('sso_code');
  });

  // SSO 코드 처리
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const ssoCode = searchParams.get('sso_code');

    if (ssoCode) {
      ssoExchangeMutation.mutate(ssoCode, {
        onSuccess: () => {
          // 쿼리 파라미터 제거 (URL 정리)
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
          toast.success('로그인되었습니다.');
          setIsSSOLoading(false);
        },
        onError: () => {
          toast.error('SSO 로그인에 실패했습니다.');
          setIsSSOLoading(false);
          navigate({ to: '/auth/login' });
        },
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {isSSOLoading && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            style={{
              fontSize: '2.5rem',
              marginBottom: '1rem',
              animation: 'spin 1.2s linear infinite',
            }}
          >
            ⏳
          </div>
          <p
            style={{
              fontSize: '1.1rem',
              color: '#374151',
              fontWeight: 500,
            }}
          >
            자동 로그인 중입니다...
          </p>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      )}
      {/* ═══════ 네비게이션 — Hub 통일 헤더 ═══════ */}
      <nav className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-screen-xl px-4">
          <div className="flex h-14 items-center justify-between">
            {/* 왼쪽: 로고 */}
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center gap-2" style={{ textDecoration: 'none' }}>
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600"
                >
                  <GraduationCap className="h-4 w-4 text-white" />
                </div>
                <span className="hidden text-[15px] font-bold tracking-tight text-indigo-600 sm:inline">
                  Study Planner
                </span>
              </Link>
            </div>

            {/* 중앙: 네비게이션 메뉴 (Desktop) */}
            <div className="hidden items-center gap-1 md:flex">
              <a
                href={HUB_URL}
                className="flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium text-indigo-600 transition-colors hover:bg-indigo-50"
                title="전체 서비스"
              >
                <LayoutGrid className="h-4 w-4" />
                <span>전체 서비스</span>
              </a>
              <div className="mx-1 h-5 w-px bg-gray-200" />
              <NavLink to="/">플래너홈</NavLink>
              <NavLink to="/missions">나의 미션</NavLink>
              <NavLink to="/routine">주간 루틴</NavLink>
              <NavLink to="/plans">장기 계획</NavLink>
              <NavLink to="/learning">학습 현황</NavLink>
            </div>

            {/* 오른쪽: 아이콘 버튼 + 사용자 정보 */}
            <div className="flex items-center gap-1">
              {/* 타이머 */}
              <Link
                to="/timer"
                className="relative flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
                title="타이머"
              >
                <Timer className="h-5 w-5" />
              </Link>
              {/* 결제 */}
              <a
                href={`${HUB_URL}/products`}
                className="relative flex h-9 w-9 items-center justify-center rounded-full text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-700"
                title="결제"
              >
                <Wallet className="h-5 w-5" />
              </a>
              {/* 알림 */}
              <button
                className="relative flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
                title="알림"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
              </button>
              {/* 계정연동 */}
              <Link
                to="/connections"
                className="relative flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
                title="계정연동"
              >
                <Users className="h-5 w-5" />
              </Link>

              {/* 구분선 */}
              <div className="mx-1 h-5 w-px bg-gray-200" />

              {/* 사용자 정보 / 로그인 버튼 */}
              {isAuthenticated && user ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
                  >
                    <span>{user.userName}</span>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-1 w-40 rounded-md border border-gray-200 bg-white py-1 shadow-lg z-50">
                      <Link
                        to="/"
                        className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        설정
                      </Link>
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          // TODO: implement logout
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-gray-50"
                      >
                        <LogOut className="h-4 w-4" />
                        로그아웃
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/auth/login"
                  className="rounded-full bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
                >
                  로그인
                </Link>
              )}

              {/* 모바일 햄버거 */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="ml-1 flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 md:hidden"
                aria-label="메뉴"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <LayoutGrid className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* 모바일 메뉴 (드롭다운) */}
          {mobileMenuOpen && (
            <div className="border-t border-gray-200 pb-3 pt-2 md:hidden">
              <div className="space-y-1">
                <a href={HUB_URL} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50">
                  <LayoutGrid className="h-4 w-4" /> 전체 서비스
                </a>
                <div className="my-1 border-t border-gray-100" />
                {[
                  { to: '/', label: '플래너홈' },
                  { to: '/missions', label: '나의 미션' },
                  { to: '/routine', label: '주간 루틴' },
                  { to: '/plans', label: '장기 계획' },
                  { to: '/learning', label: '학습 현황' },
                  { to: '/timer', label: '타이머' },
                ].map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="block rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* 로그인 유도 배너 (비로그인 시) */}
      {!isAuthenticated && !bannerDismissed && (
        <div className="relative border-b border-indigo-200 bg-indigo-50">
          <div className="mx-auto flex max-w-screen-xl items-center justify-between px-4 py-2.5">
            <p className="flex-1 text-center text-sm font-medium text-indigo-700">
              로그인하면 학생, 선생님, 학부모가 함께 하는 스터디플래너를 실행할 수 있습니다{' '}
              <Link
                to="/auth/login"
                className="ml-1 inline-flex items-center gap-1 font-bold text-indigo-900 underline underline-offset-2 hover:text-indigo-600"
              >
                로그인하기 →
              </Link>
            </p>
            <button
              onClick={() => setBannerDismissed(true)}
              className="ml-3 flex-shrink-0 rounded-full p-1 text-indigo-400 transition-colors hover:bg-indigo-100 hover:text-indigo-600"
              aria-label="배너 닫기"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* 모바일 하단 네비게이션 */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white md:hidden">
        <div className="flex items-center justify-around py-2">
          <MobileNavLink to="/" label="홈" />
          <MobileNavLink to="/missions" label="미션" />
          <MobileNavLink to="/routine" label="루틴" />
          <MobileNavLink to="/plans" label="계획" />
          <MobileNavLink to="/learning" label="현황" />
          <MobileNavLink to="/timer" label="타이머" icon={<Timer className="h-4 w-4" />} />
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
      className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
      activeProps={{
        className:
          'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-md',
      }}
    >
      {icon}
      {children}
    </Link>
  );
}


function MobileNavLink({ to, icon, label }: { to: string; icon?: React.ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className="flex flex-col items-center gap-1 px-3 py-1 text-gray-400"
      activeProps={{
        className: 'flex flex-col items-center gap-1 px-3 py-1 text-indigo-600',
      }}
    >
      {icon}
      <span className="text-xs">{label}</span>
    </Link>
  );
}
