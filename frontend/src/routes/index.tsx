/**
 * 플래너 대시보드 — 프로모 디자인 스타일 적용
 *
 * PromoPage의 디자인 언어를 그대로 차용:
 * - 인디고 그라데이션 히어로
 * - 글래스모피즘 카드
 * - 그라데이션 통계 카드 (blue/emerald/amber)
 * - rounded-2xl + shadow-xl
 * - 컬러 코딩된 타임라인
 */

import { createFileRoute, Link } from '@tanstack/react-router';
import { useMemo } from 'react';
import { useAuthStore } from '@/stores/client';
import { useGetDailyMissions, useGetRoutines, useGetTodayDashboard } from '@/stores/server/planner';
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

// ============================================
// 메인 대시보드
// ============================================

function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const { data: dashboard, isLoading: dashLoading } = useGetTodayDashboard();
  const { data: allMissions, isLoading: missionsLoading } = useGetDailyMissions();
  const { data: routines } = useGetRoutines();

  const isLoading = dashLoading || missionsLoading;

  // 오늘 날짜
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  const DAYS_KR = ['일', '월', '화', '수', '목', '금', '토'];
  const dayOfWeek = today.getDay();

  // 오늘의 미션만 필터
  const todayMissions = useMemo(() => {
    if (!allMissions) return [];
    return allMissions
      .filter((m: DailyMission) => m.date === dateStr)
      .sort((a: DailyMission, b: DailyMission) =>
        (a.startTime || '').localeCompare(b.startTime || ''),
      );
  }, [allMissions, dateStr]);

  // 오늘의 루틴
  const todayRoutines = useMemo(() => {
    if (!routines) return [];
    const dayMap: Record<string, number> = {
      mon: 1,
      tue: 2,
      wed: 3,
      thu: 4,
      fri: 5,
      sat: 6,
      sun: 0,
    };
    return routines
      .filter((r: Routine) => {
        if (!r.activeDays) return false;
        return Object.entries(r.activeDays).some(
          ([day, active]) => active && dayMap[day] === dayOfWeek,
        );
      })
      .sort((a: Routine, b: Routine) => (a.startTime || '').localeCompare(b.startTime || ''));
  }, [routines, dayOfWeek]);

  // 통계
  const completedMissions = todayMissions.filter(
    (m: DailyMission) => m.status === 'done' || (m.progress && m.progress >= 100),
  ).length;
  const totalMissions = todayMissions.length;
  const avgProgress =
    totalMissions > 0
      ? Math.round(
          todayMissions.reduce((sum: number, m: DailyMission) => sum + (m.progress || 0), 0) /
            totalMissions,
        )
      : 0;

  // 통합 타임라인 (루틴 + 미션) 시간순 정렬, 상위 5개
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
        done: m.status === 'done' || prog >= 100,
        progress: prog,
      });
    });

    items.sort((a, b) => a.time.localeCompare(b.time));
    return items.slice(0, 5);
  }, [todayRoutines, todayMissions]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ═══════ 히어로 헤더 (프로모 스타일 그라데이션) ═══════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-800 px-4 pb-28 pt-8 text-white">
        {/* 배경 장식 */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-indigo-400/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-lg">
          {/* 인사 */}
          <div className="mb-6">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur-sm">
              <Sparkles className="h-3 w-3 text-yellow-300" />
              {today.getMonth() + 1}월 {today.getDate()}일 ({DAYS_KR[dayOfWeek]})
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              {user?.userName ? `${user.userName}님, 안녕하세요!` : '안녕하세요!'}
            </h1>
            <p className="mt-1 text-sm text-blue-200">오늘도 멋진 학습을 시작해볼까요?</p>
          </div>

          {/* 통계 3칸 (프로모 스타일 그라데이션 카드) */}
          <div className="grid grid-cols-3 gap-2">
            {[
              {
                label: '오늘 미션',
                value: totalMissions > 0 ? `${completedMissions}/${totalMissions}` : '-',
                gradient: 'from-blue-400 to-blue-500',
              },
              {
                label: '성취도',
                value: totalMissions > 0 ? `${avgProgress}%` : '-',
                gradient: 'from-emerald-400 to-emerald-500',
              },
              {
                label: '순위',
                value: dashboard?.rank ? `${dashboard.rank.myRank}위` : '-',
                gradient: 'from-amber-400 to-amber-500',
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className={`rounded-xl bg-gradient-to-br ${stat.gradient} p-3 text-center shadow-lg`}
              >
                <div className="text-xl font-extrabold text-white">{stat.value}</div>
                <div className="text-[10px] font-medium text-white/80">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ 메인 콘텐츠 (오버랩 카드) ═══════ */}
      <div className="relative mx-auto -mt-20 max-w-lg px-4 pb-24">
        {/* ── 오늘의 일정 카드 ── */}
        <div className="mb-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-xl shadow-gray-200/50">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100">
                <CalendarDays className="h-4 w-4 text-indigo-600" />
              </div>
              <span className="text-sm font-bold text-gray-900">오늘의 일정</span>
            </div>
            <Link
              to="/missions"
              className="flex items-center gap-0.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              전체보기
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {previewItems.length > 0 ? (
            <div className="relative ml-3 border-l-2 border-gray-100 pl-4">
              {previewItems.map((item, idx) => {
                const color = getColor(item.subject);
                return (
                  <div key={`${item.type}-${idx}`} className="relative mb-4 last:mb-0">
                    {/* 타임라인 도트 */}
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
            <div className="py-6 text-center">
              <BookOpen className="mx-auto mb-2 h-8 w-8 text-gray-200" />
              <p className="text-sm text-gray-400">오늘의 일정이 없습니다</p>
              <Link
                to="/missions"
                className="mt-3 inline-flex items-center gap-1 rounded-2xl bg-indigo-50 px-5 py-2 text-xs font-semibold text-indigo-600 transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                미션 추가하기
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </div>

        {/* ── 집중 타이머 위젯 (프로모 스타일) ── */}
        <Link
          to="/timer"
          className="group mb-4 flex items-center gap-4 rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-xl shadow-gray-200/50 transition-all hover:-translate-y-0.5 hover:shadow-2xl"
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

        {/* ── 최근 코멘트 ── */}
        <RecentCommentsCard userId={user?.id} />

        {/* ── 빠른 이동 (프로모 역할 카드 스타일) ── */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xl shadow-gray-200/50">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100">
              <GraduationCap className="h-4 w-4 text-gray-600" />
            </div>
            <span className="text-sm font-bold text-gray-900">빠른 이동</span>
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
              to="/timer"
              icon={<Timer className="h-5 w-5" />}
              label="타이머"
              gradient="from-rose-400 to-rose-600"
              shadowColor="shadow-rose-200"
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
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// 서브 컴포넌트
// ============================================

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

  const roleStyles: Record<string, { bg: string; text: string; avatar: string; dot: string }> = {
    teacher: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-700',
      avatar: 'bg-gradient-to-br from-indigo-400 to-indigo-600',
      dot: 'bg-indigo-500',
    },
    parent: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      avatar: 'bg-gradient-to-br from-amber-400 to-amber-600',
      dot: 'bg-amber-500',
    },
    student: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      avatar: 'bg-gradient-to-br from-emerald-400 to-emerald-600',
      dot: 'bg-emerald-500',
    },
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return '방금';
    if (minutes < 60) return `${minutes}분 전`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}시간 전`;
    return `${Math.floor(hours / 24)}일 전`;
  };

  if (isLoading || !comments || comments.length === 0) return null;

  return (
    <div className="mb-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-xl shadow-gray-200/50">
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
      {/* 히어로 스켈레톤 */}
      <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-800 px-4 pb-28 pt-8">
        <div className="mx-auto max-w-lg">
          <Skeleton className="mb-2 h-6 w-32 bg-white/20" />
          <Skeleton className="mb-1 h-8 w-56 bg-white/20" />
          <Skeleton className="mb-6 h-4 w-40 bg-white/20" />
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 rounded-xl bg-white/20" />
            ))}
          </div>
        </div>
      </div>
      {/* 카드 스켈레톤 */}
      <div className="relative mx-auto -mt-20 max-w-lg px-4 pb-24">
        <Skeleton className="mb-4 h-56 rounded-2xl" />
        <Skeleton className="mb-4 h-20 rounded-2xl" />
        <Skeleton className="h-44 rounded-2xl" />
      </div>
    </div>
  );
}
