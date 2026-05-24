/**
 * 홈 대시보드 — 학습 현황 한눈에 보기
 *
 * - 슬림 헤더 + 전체폭 스탯 바 + 2단 본문(좌: 할 일 / 우: 성과·동기)
 */

import { createFileRoute, Link } from '@tanstack/react-router';
import { OnboardingChecklist } from '@/components/onboarding/OnboardingChecklist';
import { useMemo } from 'react';
import { useAuthStore } from '@/stores/client';
import {
  useGetDailyMissions,
  useGetGrowthStats,
  useGetPlans,
  useGetRoutines,
  useGetTodayDashboard,
} from '@/stores/server/planner';
import { useGetRecentUnread } from '@/stores/server/planner/comments';
import type { DailyMission } from '@/stores/server/planner/planner-types';
import type { Routine } from '@/types/planner';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CalendarDays,
  Target,
  Clock,
  Timer,
  ChevronRight,
  CheckCircle,
  BookOpen,
  BarChart3,
  Heart,
  Sparkles,
  GraduationCap,
  Flame,
  Trophy,
  TrendingUp,
} from 'lucide-react';

export const Route = createFileRoute('/')({
  component: Dashboard,
});

// ───── 과목별 색상 ─────
const SUBJECT_COLORS: Record<string, string> = {
  국어: '#ef4444',
  수학: '#eab308',
  영어: '#f97316',
  사회: '#3b82f6',
  과학: '#14b8a6',
  한국사: '#a855f7',
};
function getColor(subject?: string) {
  return SUBJECT_COLORS[subject ?? ''] || '#8b5cf6';
}

function fmtMinutes(min: number) {
  if (!min || min <= 0) return '0m';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// ============================================
// 메인 대시보드
// ============================================

function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const { data: dashboard, isLoading: dashLoading } = useGetTodayDashboard();
  const { data: allMissions, isLoading: missionsLoading } = useGetDailyMissions();
  const { data: routines } = useGetRoutines();
  const { data: plans } = useGetPlans();
  const { data: growthStats } = useGetGrowthStats();

  const isLoading = dashLoading || missionsLoading;

  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  const DAYS_KR = ['일', '월', '화', '수', '목', '금', '토'];
  const dayOfWeek = today.getDay();

  // 오늘의 미션 / 루틴
  const todayMissions = useMemo(() => {
    if (!allMissions) return [];
    return allMissions
      .filter((m: DailyMission) => m.date === dateStr)
      .sort((a: DailyMission, b: DailyMission) =>
        (a.startTime || '').localeCompare(b.startTime || ''),
      );
  }, [allMissions, dateStr]);

  const todayRoutines = useMemo(() => {
    if (!routines) return [];
    return routines
      .filter((r: Routine) => r.days?.[dayOfWeek] === true)
      .sort((a: Routine, b: Routine) => (a.startTime || '').localeCompare(b.startTime || ''));
  }, [routines, dayOfWeek]);

  const completedMissions = todayMissions.filter(
    (m: DailyMission) => m.status === 'completed' || (m.progress && m.progress >= 100),
  ).length;
  const totalMissions = todayMissions.length;
  const avgProgress =
    totalMissions > 0
      ? Math.round(
          todayMissions.reduce((s: number, m: DailyMission) => s + (m.progress || 0), 0) /
            totalMissions,
        )
      : 0;

  // 오늘 통합 타임라인 (루틴 + 미션)
  const previewItems = useMemo(() => {
    const items: Array<{
      type: 'routine' | 'mission';
      time: string;
      title: string;
      subject?: string;
      done: boolean;
      progress: number;
    }> = [];
    todayRoutines.forEach((r: Routine) => {
      items.push({
        type: 'routine',
        time: r.startTime || '00:00',
        title: r.title,
        subject: r.subject,
        done: false,
        progress: 0,
      });
    });
    todayMissions.forEach((m: DailyMission) => {
      const prog = m.progress || 0;
      items.push({
        type: 'mission',
        time: m.startTime || '00:00',
        title: m.content || m.title || m.subject || '미션',
        subject: m.subject,
        done: m.status === 'completed' || prog >= 100,
        progress: prog,
      });
    });
    items.sort((a, b) => a.time.localeCompare(b.time));
    return items;
  }, [todayRoutines, todayMissions]);

  // 임박한 장기계획 마감 (D-day 가까운 순, 미완료)
  const upcomingPlans = useMemo(() => {
    if (!plans) return [];
    const now = Date.now();
    return (plans as any[])
      .map((p) => {
        const total = p.totalAmount ?? 0;
        const done = p.completedAmount ?? 0;
        const progress = total > 0 ? Math.round((done / total) * 100) : 0;
        const end = p.endDate ? new Date(p.endDate).getTime() : 0;
        const dday = end ? Math.ceil((end - now) / 86400000) : null;
        return {
          id: p.id,
          title: p.title || '제목 없음',
          subject: p.subject as string | undefined,
          progress,
          dday,
        };
      })
      .filter((p) => p.progress < 100 && p.dday !== null && (p.dday as number) >= 0)
      .sort((a, b) => (a.dday as number) - (b.dday as number))
      .slice(0, 3);
  }, [plans]);

  // 주간 학습 / 연속 / 순위
  const thisWeekMin = growthStats?.thisWeek?.studyMinutes ?? 0;
  const lastWeekMin = growthStats?.lastWeek?.studyMinutes ?? 0;
  const weekDeltaMin = thisWeekMin - lastWeekMin;
  const weekDone = growthStats?.thisWeek?.completedMissions ?? 0;
  const weekTotal = growthStats?.thisWeek?.totalMissions ?? 0;
  const weekRate = growthStats?.thisWeek?.achievementRate ?? 0;
  const streak = growthStats?.streak ?? 0;
  const longestStreak = growthStats?.longestStreak ?? 0;
  const myRank = dashboard?.rank?.myRank ?? null;

  if (isLoading) return <DashboardSkeleton />;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ═══════ 슬림 헤더 ═══════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-800 px-4 pb-20 pt-8 text-white">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-indigo-300/10 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-screen-xl">
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
            {today.getMonth() + 1}월 {today.getDate()}일 ({DAYS_KR[dayOfWeek]})
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">
            {user?.userName ? `${user.userName}님, 오늘도 화이팅!` : '안녕하세요!'}
          </h1>
        </div>
      </section>

      {/* ═══════ 메인 ═══════ */}
      <div className="relative mx-auto -mt-12 max-w-screen-xl space-y-6 px-4 pb-24">
        {/* 온보딩 체크리스트 — 5단계 시작 가이드 (거북 투어 연동) */}
        <OnboardingChecklist />

        {/* ── 스탯 바 (전체폭 4칸) ── */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          <StatCard
            icon={<TrendingUp className="h-4 w-4" />}
            iconBg="bg-indigo-500"
            label="오늘 달성률"
            value={totalMissions > 0 ? `${avgProgress}%` : '-'}
            sub={
              totalMissions > 0
                ? `${completedMissions}/${totalMissions} 미션 완료`
                : '오늘 미션 없음'
            }
          />
          <StatCard
            icon={<Clock className="h-4 w-4" />}
            iconBg="bg-blue-500"
            label="이번 주 학습"
            value={fmtMinutes(thisWeekMin)}
            sub={
              weekDeltaMin === 0
                ? '지난 주와 비슷해요'
                : weekDeltaMin > 0
                  ? `지난 주보다 +${fmtMinutes(weekDeltaMin)}`
                  : `지난 주보다 -${fmtMinutes(-weekDeltaMin)}`
            }
          />
          <StatCard
            icon={<Flame className="h-4 w-4" />}
            iconBg="bg-orange-500"
            label="연속 학습"
            value={`${streak}일`}
            sub={longestStreak > 0 ? `최고 ${longestStreak}일` : '오늘부터 시작!'}
          />
          <StatCard
            icon={<Trophy className="h-4 w-4" />}
            iconBg="bg-amber-500"
            label="클래스 순위"
            value={myRank ? `${myRank}위` : '-'}
            sub={myRank ? '마이그룹 기준' : '그룹에 참여해보세요'}
          />
        </div>

        {/* ── 2단 본문 ── */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* 좌측: 할 일 */}
          <div className="space-y-6 lg:col-span-7">
            {/* 오늘의 미션 */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100">
                    <CalendarDays className="h-4 w-4 text-indigo-600" />
                  </div>
                  <span className="text-sm font-bold text-gray-900">오늘의 미션</span>
                  {previewItems.length > 0 && (
                    <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-600">
                      {completedMissions}/{totalMissions} 완료
                    </span>
                  )}
                </div>
                <Link
                  to="/missions"
                  className="flex items-center gap-0.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  금일계획
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              {previewItems.length > 0 ? (
                <div className="relative ml-3 border-l-2 border-gray-100 pl-4">
                  {previewItems.map((item, idx) => {
                    const color = getColor(item.subject);
                    return (
                      <div key={`${item.type}-${idx}`} className="relative mb-4 last:mb-0">
                        <div
                          className="absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 border-white"
                          style={{ backgroundColor: item.done ? '#9ca3af' : color }}
                        />
                        <div className="flex items-center gap-2">
                          <span className="w-10 text-[10px] text-gray-400">{item.time}</span>
                          {item.subject && (
                            <span
                              className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-white"
                              style={{ backgroundColor: color }}
                            >
                              {item.subject}
                            </span>
                          )}
                          {item.type === 'routine' && (
                            <span className="rounded bg-gray-100 px-1 py-0.5 text-[9px] text-gray-400">
                              루틴
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 flex items-center justify-between">
                          <p
                            className={`text-sm font-medium ${item.done ? 'text-gray-400 line-through' : 'text-gray-800'}`}
                          >
                            {item.title}
                          </p>
                          {item.done ? (
                            <CheckCircle className="h-4 w-4 flex-shrink-0 text-green-400" />
                          ) : item.progress > 0 ? (
                            <span className="flex-shrink-0 text-[10px] font-bold text-yellow-500">
                              {item.progress}%
                            </span>
                          ) : (
                            <div className="h-3 w-3 flex-shrink-0 rounded-full border border-gray-200" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <BookOpen className="mx-auto mb-2 h-10 w-10 text-gray-200" />
                  <p className="mb-1 text-sm text-gray-400">오늘은 예정된 미션이 없습니다</p>
                  <Link
                    to="/missions"
                    className="mt-3 inline-flex items-center gap-1 rounded-2xl bg-indigo-50 px-5 py-2 text-xs font-semibold text-indigo-600 transition-all hover:-translate-y-0.5 hover:shadow-md"
                  >
                    금일계획 열기
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}
            </div>

            {/* 임박한 장기계획 마감 */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-100">
                    <Target className="h-4 w-4 text-violet-600" />
                  </div>
                  <span className="text-sm font-bold text-gray-900">임박한 장기계획</span>
                </div>
                <Link
                  to="/plans"
                  className="flex items-center gap-0.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  전체보기
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              {upcomingPlans.length > 0 ? (
                <div className="space-y-3">
                  {upcomingPlans.map((p) => {
                    const color = getColor(p.subject);
                    const urgent = (p.dday as number) <= 3;
                    return (
                      <Link
                        key={p.id}
                        to="/plans"
                        className="block rounded-xl border border-gray-100 p-3 transition-all hover:-translate-y-0.5 hover:shadow-md"
                      >
                        <div className="mb-1.5 flex items-center gap-2">
                          {p.subject && (
                            <span
                              className="rounded px-1.5 py-0.5 text-[10px] font-bold text-white"
                              style={{ backgroundColor: color }}
                            >
                              {p.subject}
                            </span>
                          )}
                          <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-800">
                            {p.title}
                          </span>
                          <span
                            className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              urgent ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {p.dday === 0 ? '오늘 마감' : `D-${p.dday}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${p.progress}%`,
                                backgroundColor: color,
                              }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-gray-400">{p.progress}%</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="py-6 text-center">
                  <p className="text-sm text-gray-400">진행 중인 장기계획이 없습니다</p>
                  <Link
                    to="/plans"
                    className="mt-3 inline-flex items-center gap-1 rounded-2xl bg-violet-50 px-5 py-2 text-xs font-semibold text-violet-600 transition-all hover:-translate-y-0.5 hover:shadow-md"
                  >
                    장기계획 세우기
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* 우측: 성과 · 동기 */}
          <div className="space-y-4 lg:col-span-5">
            {/* 이번 주 성취 */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100">
                  <BarChart3 className="h-4 w-4 text-emerald-600" />
                </div>
                <span className="text-sm font-bold text-gray-900">이번 주 성취</span>
              </div>
              <div className="mb-3 flex items-end justify-between">
                <div>
                  <p className="text-3xl font-extrabold text-emerald-600">{weekRate}%</p>
                  <p className="text-xs text-gray-400">주간 달성률</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-700">
                    {weekDone}/{weekTotal}
                  </p>
                  <p className="text-xs text-gray-400">미션 완료</p>
                </div>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500"
                  style={{ width: `${Math.min(weekRate, 100)}%` }}
                />
              </div>
              {weekTotal === 0 && (
                <p className="mt-3 text-center text-xs text-gray-400">
                  미션을 완료하면 주간 성취가 채워집니다
                </p>
              )}
            </div>

            {/* 집중 타이머 */}
            <Link
              to="/timer"
              className="group flex items-center gap-4 rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-400 to-rose-600 text-white shadow-lg shadow-rose-200">
                <Timer className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900">집중 타이머</p>
                <p className="text-xs text-gray-500">포모도로로 몰입 학습을 시작하세요</p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-300 transition-transform group-hover:translate-x-1" />
            </Link>

            {/* 최근 코멘트 */}
            <RecentCommentsCard userId={user?.id} />

            {/* 빠른 이동 */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100">
                  <GraduationCap className="h-4 w-4 text-gray-600" />
                </div>
                <span className="text-sm font-bold text-gray-900">바로가기</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <NavCard
                  to="/missions"
                  icon={<CalendarDays className="h-5 w-5" />}
                  label="금일계획"
                  gradient="from-blue-400 to-blue-600"
                  shadowColor="shadow-blue-200"
                />
                <NavCard
                  to="/plans"
                  icon={<Target className="h-5 w-5" />}
                  label="장기계획"
                  gradient="from-violet-400 to-violet-600"
                  shadowColor="shadow-violet-200"
                />
                <NavCard
                  to="/routine"
                  icon={<Clock className="h-5 w-5" />}
                  label="주간루틴"
                  gradient="from-teal-400 to-teal-600"
                  shadowColor="shadow-teal-200"
                />
                <NavCard
                  to="/learning"
                  icon={<BarChart3 className="h-5 w-5" />}
                  label="학습분석"
                  gradient="from-emerald-400 to-emerald-600"
                  shadowColor="shadow-emerald-200"
                />
                <NavCard
                  to="/growth"
                  icon={<Heart className="h-5 w-5" />}
                  label="성장기록"
                  gradient="from-amber-400 to-amber-600"
                  shadowColor="shadow-amber-200"
                />
                <NavCard
                  to="/timer"
                  icon={<Timer className="h-5 w-5" />}
                  label="타이머"
                  gradient="from-rose-400 to-rose-600"
                  shadowColor="shadow-rose-200"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// 서브 컴포넌트
// ============================================

function StatCard({
  icon,
  iconBg,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center gap-2">
        <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${iconBg} text-white`}>
          {icon}
        </div>
        <span className="text-xs font-semibold text-gray-500">{label}</span>
      </div>
      <p className="text-2xl font-extrabold text-gray-900">{value}</p>
      <p className="mt-0.5 truncate text-[11px] text-gray-400">{sub}</p>
    </div>
  );
}

function NavCard({
  to,
  icon,
  label,
  gradient,
  shadowColor,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  gradient: string;
  shadowColor: string;
}) {
  return (
    <Link
      to={to}
      className="group flex flex-col items-center gap-2 rounded-xl p-3 transition-all hover:-translate-y-0.5 hover:bg-gray-50"
    >
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-lg ${shadowColor} transition-transform group-hover:scale-105`}
      >
        {icon}
      </div>
      <span className="text-xs font-medium text-gray-700">{label}</span>
    </Link>
  );
}

function RecentCommentsCard({ userId }: { userId?: number | string }) {
  const { data: comments, isLoading } = useGetRecentUnread(
    typeof userId === 'number' ? userId : 0,
    2,
  );

  const roleStyles: Record<string, { bg: string; text: string; avatar: string }> = {
    teacher: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-700',
      avatar: 'bg-gradient-to-br from-indigo-400 to-indigo-600',
    },
    parent: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      avatar: 'bg-gradient-to-br from-amber-400 to-amber-600',
    },
    student: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      avatar: 'bg-gradient-to-br from-emerald-400 to-emerald-600',
    },
  };

  const timeAgo = (ds: string) => {
    const diff = Date.now() - new Date(ds).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return '방금';
    if (minutes < 60) return `${minutes}분 전`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}시간 전`;
    return `${Math.floor(hours / 24)}일 전`;
  };

  if (isLoading || !comments || comments.length === 0) return null;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100">
            <Heart className="h-4 w-4 text-indigo-600" />
          </div>
          <span className="text-sm font-bold text-gray-900">최근 코멘트</span>
        </div>
        <Link
          to="/growth"
          className="flex items-center gap-0.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
        >
          더보기
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="space-y-3">
        {comments.map((comment: any) => {
          const styles = roleStyles[comment.authorRole] || roleStyles.student;
          const authorName = comment.author?.name || '알 수 없음';
          return (
            <div key={comment.id} className={`rounded-xl ${styles.bg} p-3`}>
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full ${styles.avatar} text-[10px] font-bold text-white`}
                >
                  {authorName.charAt(0)}
                </div>
                <span className={`text-xs font-bold ${styles.text}`}>{authorName}</span>
                <span className="text-[10px] text-gray-400">{timeAgo(comment.createdAt)}</span>
              </div>
              <p className={`mt-1.5 text-xs leading-relaxed ${styles.text} line-clamp-2`}>
                {comment.content}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// 스켈레톤
// ============================================

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-800 px-4 pb-20 pt-8">
        <div className="mx-auto max-w-screen-xl">
          <Skeleton className="mb-2 h-6 w-32 bg-white/20" />
          <Skeleton className="h-9 w-64 bg-white/20" />
        </div>
      </div>
      <div className="relative mx-auto -mt-12 max-w-screen-xl space-y-6 px-4 pb-24">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-7">
            <Skeleton className="h-64 rounded-2xl" />
            <Skeleton className="h-44 rounded-2xl" />
          </div>
          <div className="space-y-4 lg:col-span-5">
            <Skeleton className="h-40 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-44 rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
