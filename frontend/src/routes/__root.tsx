import { createRootRoute, Outlet, Link, useNavigate, useRouterState } from '@tanstack/react-router';
import { Toaster, toast } from 'sonner';
import { useAuthStore } from '@/stores/client/use-auth-store';

import { useSsoExchange } from '@/stores/server/auth';
import { useEffect, useRef, useState } from 'react';
import { Bell, X, LayoutGrid, Users, LogOut, ChevronDown } from 'lucide-react';
import { WonCircle } from '@/components/icons';
import PromoPage from '@/components/PromoPage';
import { useAcornBalance } from '@/stores/server/acorn';
import { useMyBadges } from '@/stores/server/badge';
import { Footer } from 'geobuk-shared/ui';

// Hub URL
const HUB_URL =
  import.meta.env.VITE_HUB_URL ||
  (import.meta.env.PROD ? 'https://tskool.kr' : 'http://localhost:5173');

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const router = useRouterState();
  const ssoExchangeMutation = useSsoExchange();
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [myclassDropdownOpen, setMyclassDropdownOpen] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const myclassDropdownRef = useRef<HTMLDivElement>(null);
  const [isSSOLoading, setIsSSOLoading] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return !!params.get('sso_code');
  });

  // 비로그인 + 홈 경로일 때 프로모 페이지 표시, ?promo=1 이면 항상 표시
  const isHomePath = router.location.pathname === '/';
  const forcePromo = new URLSearchParams(window.location.search).get('promo') === '1';
  const showPromo = ((!isAuthenticated && isHomePath) || forcePromo) && !isSSOLoading;

  // 도토리 잔액
  const { data: acornData } = useAcornBalance();

  // 뱃지
  const { data: badgeData } = useMyBadges();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    if (userDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userDropdownOpen]);

  // 드롭다운 외부 클릭 감지 (마이 클래스)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (myclassDropdownRef.current && !myclassDropdownRef.current.contains(e.target as Node)) {
        setMyclassDropdownOpen(false);
      }
    };
    if (myclassDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [myclassDropdownOpen]);

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
          toast.error('SSO 로그인에 실패했습니다. 다시 시도해주세요.');
          setIsSSOLoading(false);
          // URL에서 sso_code 제거 (무한 리다이렉트 방지: /auth/login → Hub → sso_code → 실패 루프)
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
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
                <img
                  src="/logo.png"
                  alt="StudyPlanner Logo"
                  className="h-7 w-7 rounded-md object-contain"
                />
                <span className="hidden text-[15px] font-bold tracking-tight text-indigo-600 sm:inline">
                  Study Planner
                </span>
              </Link>
            </div>

            {/* 중앙: 네비게이션 메뉴 (Desktop) */}
            <div className="hidden items-center gap-1 md:flex">
              <a
                href={HUB_URL}
                className="text-primary hover:bg-primary/10 flex h-9 w-9 items-center justify-center rounded-full transition-colors"
                title="전체 서비스"
              >
                <LayoutGrid className="h-5 w-5" />
              </a>
              <div className="mx-1 h-5 w-px bg-gray-200" />
              <NavLink to="/">홈</NavLink>
              <NavLink to="/plans">장기계획</NavLink>
              <NavLink to="/routine">주간루틴</NavLink>
              <NavLink to="/missions">금일계획</NavLink>
              <NavLink to="/growth">성장</NavLink>
              <NavLink to="/learning">분석</NavLink>
              {/* 마이 클래스 드롭다운 */}
              <div className="relative" ref={myclassDropdownRef}>
                <button
                  onClick={() => setMyclassDropdownOpen((v) => !v)}
                  className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
                >
                  마이 클래스
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${myclassDropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {myclassDropdownOpen && (
                  <div className="absolute left-0 top-full z-50 mt-1 w-52 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                    {/* 목표대학 반 */}
                    <a
                      href="/myclass?type=university"
                      className="flex w-full items-center px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
                      onClick={() => setMyclassDropdownOpen(false)}
                    >
                      🎓 목표대학 반
                    </a>
                    <a
                      href="/mentoring/ai?type=university"
                      className="flex w-full items-center px-6 py-1.5 text-xs text-indigo-600 hover:bg-indigo-50"
                      onClick={() => setMyclassDropdownOpen(false)}
                    >
                      ✦ 성취율 AI 평가
                    </a>
                    <div className="my-1 border-t border-gray-100" />
                    {/* 담당 선생님 반 */}
                    <a
                      href="/myclass?type=teacher"
                      className="flex w-full items-center px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
                      onClick={() => setMyclassDropdownOpen(false)}
                    >
                      👨‍🏫 담당 선생님 반
                    </a>
                    <a
                      href="/mentoring/ai?type=teacher"
                      className="flex w-full items-center px-6 py-1.5 text-xs text-indigo-600 hover:bg-indigo-50"
                      onClick={() => setMyclassDropdownOpen(false)}
                    >
                      ✦ 성취율 AI 평가
                    </a>
                    <div className="my-1 border-t border-gray-100" />
                    {/* 스터디 반 */}
                    <a
                      href="/myclass?type=study"
                      className="flex w-full items-center px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
                      onClick={() => setMyclassDropdownOpen(false)}
                    >
                      📚 스터디 반
                    </a>
                    <a
                      href="/mentoring/ai?type=study"
                      className="flex w-full items-center px-6 py-1.5 text-xs text-indigo-600 hover:bg-indigo-50"
                      onClick={() => setMyclassDropdownOpen(false)}
                    >
                      ✦ 성취율 AI 평가
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* 오른쪽: 아이콘 버튼 + 사용자 정보 */}
            <div className="flex items-center gap-1">
              {/* 타이머 (이모콘) */}
              <Link
                to="/timer"
                className="relative flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-indigo-50"
                title="타이머"
              >
                <span className="text-lg" role="img" aria-label="타이머">
                  ⏱️
                </span>
              </Link>
              {/* 🌰 도토리 잔액 */}
              {isAuthenticated && (
                <div
                  className="flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-semibold transition-colors hover:bg-amber-50"
                  title={`도토리 ${acornData?.balance ?? 0}개`}
                  style={{
                    background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                    color: '#92400e',
                  }}
                >
                  <span className="text-base" role="img" aria-label="도토리">
                    🌰
                  </span>
                  <span>{acornData?.balance ?? 0}</span>
                </div>
              )}
              {/* 🏅 뱃지 */}
              {isAuthenticated && (
                <Link
                  to="/badges"
                  className="relative flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-purple-50"
                  title="뱃지 컬렉션"
                >
                  <span className="text-lg">🏅</span>
                  {(badgeData?.newCount ?? 0) > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                      {badgeData!.newCount}
                    </span>
                  )}
                </Link>
              )}
              {/* 결제 */}
              <a
                href={`${HUB_URL}/products`}
                className="text-primary hover:bg-primary/10 relative flex h-9 w-9 items-center justify-center rounded-full transition-colors"
                title="결제"
              >
                <WonCircle className="h-5 w-5" />
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
                <div className="relative" ref={userDropdownRef}>
                  <button
                    onClick={() => setUserDropdownOpen((v) => !v)}
                    className="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
                  >
                    <span>{user.userName} 님</span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {userDropdownOpen && (
                    <div className="absolute right-0 top-full z-50 mt-1 w-44 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                      <a
                        href={`${HUB_URL}/users/profile`}
                        className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        마이페이지
                      </a>
                      <a
                        href={`${HUB_URL}/users/payment`}
                        className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        결제내역
                      </a>
                      <div className="my-1 border-t border-gray-100" />
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          clearAuth();
                          window.location.href = HUB_URL;
                        }}
                        className="flex w-full items-center px-4 py-2 text-sm text-red-500 hover:bg-red-50"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        로그아웃
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <a
                  href={`${HUB_URL}/login?redirect=${encodeURIComponent(window.location.href)}`}
                  className="rounded-full bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
                >
                  로그인
                </a>
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
                <a
                  href={HUB_URL}
                  className="text-primary hover:bg-primary/10 flex h-9 w-9 items-center justify-center rounded-full transition-colors"
                  title="전체 서비스"
                >
                  <LayoutGrid className="h-5 w-5" />
                </a>
                <div className="my-1 border-t border-gray-100" />
                {[
                  { to: '/', label: '홈' },
                  { to: '/plans', label: '장기계획' },
                  { to: '/routine', label: '주간루틴' },
                  { to: '/missions', label: '금일계획' },
                  { to: '/growth', label: '성장' },
                  { to: '/learning', label: '분석' },
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
                <div className="my-1 border-t border-gray-100" />
                <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  마이 클래스
                </p>
                {[
                  { href: '/myclass?type=university', label: '🎓 목표대학 반' },
                  { href: '/mentoring/ai?type=university', label: '　✦ 성취율 AI 평가', sub: true },
                  { href: '/myclass?type=teacher', label: '👨‍🏫 담당 선생님 반' },
                  { href: '/mentoring/ai?type=teacher', label: '　✦ 성취율 AI 평가', sub: true },
                  { href: '/myclass?type=study', label: '📚 스터디 반' },
                  { href: '/mentoring/ai?type=study', label: '　✦ 성취율 AI 평가', sub: true },
                ].map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className={`block rounded-md px-3 py-1.5 text-sm hover:bg-gray-50 ${'sub' in item && item.sub ? 'text-indigo-600' : 'text-gray-700'}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </a>
                ))}
                {isAuthenticated && user && (
                  <>
                    <div className="my-1 border-t border-gray-100" />
                    <a
                      href={`${HUB_URL}/users/profile`}
                      className="block rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      마이페이지
                    </a>
                    <a
                      href={`${HUB_URL}/users/payment`}
                      className="block rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      결제내역
                    </a>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        clearAuth();
                        window.location.href = HUB_URL;
                      }}
                      className="block w-full rounded-md px-3 py-2 text-left text-sm text-red-500 hover:bg-red-50"
                    >
                      로그아웃
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* 로그인 유도 배너 (비로그인 시, 프로모 페이지에서는 숨김) */}
      {!isAuthenticated && !bannerDismissed && !showPromo && (
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

      {/* 모바일 하단 네비게이션 (프로모 페이지에서는 숨김) */}
      {!showPromo && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white md:hidden">
          <div className="flex items-center justify-around py-2">
            <MobileNavLink to="/" label="홈" />
            <MobileNavLink to="/plans" label="장기계획" />
            <MobileNavLink to="/missions" label="금일계획" />
            <MobileNavLink to="/growth" label="성장" />
            <MobileNavLink to="/learning" label="분석" />
          </div>
        </nav>
      )}

      {/* 메인 콘텐츠 */}
      <main className={showPromo ? '' : 'pb-20 md:pb-10'}>
        {showPromo ? <PromoPage /> : <Outlet />}
        {!showPromo && <Footer />}
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
