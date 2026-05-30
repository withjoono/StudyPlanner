import { createFileRoute, Link, Outlet } from '@tanstack/react-router';
import {
  ArrowRight,
  ListChecks,
  Target,
  Repeat,
  TrendingUp,
  BarChart3,
  Timer,
  Users,
  Home,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/promo', label: '홈', icon: Home, exact: true },
  { href: '/promo/missions', label: '금일 계획', icon: ListChecks },
  { href: '/promo/plans', label: '장기 계획', icon: Target },
  { href: '/promo/routine', label: '주간 루틴', icon: Repeat },
  { href: '/promo/growth', label: '성장 기록', icon: TrendingUp },
  { href: '/promo/learning', label: '학습 분석', icon: BarChart3 },
  { href: '/promo/timer', label: '집중 타이머', icon: Timer },
  { href: '/promo/groups', label: '마이그룹', icon: Users },
];

export const Route = createFileRoute('/promo')({
  component: PromoLayout,
});

function PromoLayout() {
  return (
    <div className="bg-background min-h-screen">
      {/* ===== TOP NAV ===== */}
      <header className="bg-background/80 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 border-b backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/promo" className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-lg font-bold">
              S
            </div>
            <span className="text-foreground text-base font-semibold">학습 플래너</span>
          </Link>
          <Link
            to="/"
            className="bg-primary text-primary-foreground inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition-opacity hover:opacity-90"
          >
            시작하기
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* feature tabs */}
        <nav className="bg-card/50 border-t">
          <div className="mx-auto max-w-6xl overflow-x-auto px-4 sm:px-6">
            <ul className="flex min-w-max items-center gap-1 py-2">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      className="text-muted-foreground hover:bg-accent hover:text-foreground inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>
      </header>

      <Outlet />

      <footer className="bg-card text-muted-foreground border-t py-8 text-center text-xs">
        © 거북스쿨 · StudyPlanner ·{' '}
        <a
          href="https://www.tskool.kr"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground underline"
        >
          tskool.kr
        </a>
      </footer>
    </div>
  );
}
