import { createRootRoute, Outlet, Link, useNavigate } from '@tanstack/react-router';
import { Toaster, toast } from 'sonner';
import { useAuthStore } from '@/stores/client/use-auth-store';

import { useSsoExchange } from '@/stores/server/auth';
import { useEffect, useState } from 'react';
import { Wallet, Bell, Share2, X, GraduationCap, LayoutGrid } from 'lucide-react';

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
      {/* 네비게이션 — 토스 스타일 헤더 */}
      <nav
        className="gb-header"
        style={{ backdropFilter: 'blur(12px)', background: 'rgba(255,255,255,0.92)' }}
      >
        <div className="mx-auto max-w-screen-xl px-4">
          <div className="flex h-14 items-center justify-between">
            {/* 왼쪽: 로고 */}
            <div className="flex items-center gap-3">
              <Link to="/" className="gb-header-brand">
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-md"
                  style={{ background: 'var(--color-primary)' }}
                >
                  <GraduationCap className="h-4 w-4 text-white" />
                </div>
                <span
                  className="hidden text-[15px] font-bold tracking-tight sm:inline"
                  style={{ color: 'var(--color-primary)' }}
                >
                  Study Planner
                </span>
              </Link>
            </div>

            {/* 중앙: 네비게이션 메뉴 */}
            <div className="hidden items-center gap-0.5 md:flex">
              <a
                href={HUB_URL}
                className="gb-header-nav-link"
                style={{ color: 'var(--color-primary)' }}
                title="전체 서비스"
              >
                <LayoutGrid className="h-4 w-4" />
              </a>
              <NavLink to="/">플래너홈</NavLink>
              <NavLink to="/missions">나의 미션</NavLink>
              <NavLink to="/routine">주간 루틴</NavLink>
              <NavLink to="/plans">장기 계획</NavLink>
              <NavLink to="/learning">학습 현황</NavLink>
            </div>

            {/* 오른쪽: 아이콘 버튼 + 사용자 정보 */}
            <div className="flex items-center gap-0.5">
              {/* 아이콘 버튼들 */}
              <Link
                to="/timer"
                className="relative flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
                title="타이머"
              >
                <span className="text-base">⏱️</span>
              </Link>
              <IconButton
                href={`${HUB_URL}/products`}
                icon={<Wallet className="h-4 w-4" />}
                label="결제"
              />
              <IconButton href="#" icon={<Bell className="h-4 w-4" />} label="알림" badge={3} />
              <Link
                to="/connections"
                className="relative flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
                title="계정 공유"
              >
                <Share2 className="h-4 w-4" />
              </Link>

              {/* 구분선 */}
              <div className="mx-2 h-5 w-px bg-gray-700" />

              {/* 사용자 정보 / 로그인 버튼 */}
              {isAuthenticated && user ? (
                <span
                  className="rounded-full px-5 py-2 text-sm font-semibold text-white"
                  style={{ background: 'var(--color-primary)' }}
                >
                  {user.userName}
                </span>
              ) : (
                <Link
                  to="/auth/login"
                  className="gb-btn gb-btn-primary gb-btn-sm"
                  style={{ borderRadius: '9999px' }}
                >
                  로그인
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* 로그인 유도 배너 (비로그인 시) */}
      {!isAuthenticated && !bannerDismissed && (
        <div className="relative border-b border-gray-700 bg-gray-800">
          <div className="mx-auto flex max-w-screen-xl items-center justify-between px-4 py-2.5">
            <p className="flex-1 text-center text-sm font-medium text-gray-300">
              로그인하면 학생, 선생님, 학부모가 함께 하는 스터디플래너를 실행할 수 있습니다{' '}
              <Link
                to="/auth/login"
                className="ml-1 inline-flex items-center gap-1 font-bold text-amber-400 underline underline-offset-2 hover:text-amber-300"
              >
                로그인하기 →
              </Link>
            </p>
            <button
              onClick={() => setBannerDismissed(true)}
              className="ml-3 flex-shrink-0 rounded-full p-1 text-gray-500 transition-colors hover:bg-gray-700 hover:text-gray-300"
              aria-label="배너 닫기"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* 모바일 하단 네비게이션 */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-700 bg-gray-900 md:hidden">
        <div className="flex items-center justify-around py-2">
          <MobileNavLink to="/" label="홈" />
          <MobileNavLink to="/missions" label="미션" />
          <MobileNavLink to="/routine" label="루틴" />
          <MobileNavLink to="/plans" label="계획" />
          <MobileNavLink to="/learning" label="현황" />
          <MobileNavLink to="/timer" label="⏱️" />
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
      className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
      activeProps={{
        className:
          'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-gray-800 rounded-md',
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
  circle,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  circle?: boolean;
}) {
  return (
    <a
      href={href}
      className={`relative flex h-8 w-8 items-center justify-center text-gray-400 transition-colors hover:text-white ${
        circle
          ? 'rounded-full border border-gray-600 hover:border-gray-400'
          : 'rounded-full hover:bg-gray-700'
      }`}
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

function MobileNavLink({ to, icon, label }: { to: string; icon?: React.ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className="flex flex-col items-center gap-1 px-3 py-1 text-gray-400"
      activeProps={{
        className: 'flex flex-col items-center gap-1 px-3 py-1 text-amber-400',
      }}
    >
      {icon}
      <span className="text-xs">{label}</span>
    </Link>
  );
}
