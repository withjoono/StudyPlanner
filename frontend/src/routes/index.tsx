/**
 * 플래너 대시보드 — "오늘의 커맨드 센터"
 *
 * 모바일 퍼스트, 한 화면에 오늘 핵심 정보를 한눈에 보여줍니다.
 * - 인사 헤더 (이름 + 날짜)
 * - 통계 3칸 (미션/성취도/학습시간)
 * - 오늘의 미션 미리보기 (3~5개)
 * - 타이머 위젯
 * - 최근 코멘트
 * - 빠른 이동 (6개 바로가기)
 *
 * 비로그인 사용자는 __root.tsx에서 PromoPage로 리다이렉트되므로
 * 이 컴포넌트는 로그인 사용자만 볼 수 있습니다.
 */

import { createFileRoute, Link } from '@tanstack/react-router';
import { useMemo } from 'react';
import { useAuthStore } from '@/stores/client';
import { useGetDailyMissions, useGetRoutines, useGetTodayDashboard } from '@/stores/server/planner';
import { useGetRecentUnread } from '@/stores/server/planner/comments';
import { getSubjectColor } from '@/types/planner';
import type { DailyMission } from '@/stores/server/planner/planner-types';
import type { Routine } from '@/types/planner';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CalendarDays,
  Target,
  Clock,
  Timer,
  MessageSquare,
  ChevronRight,
  CheckCircle2,
  Circle,
  BookOpen,
  TrendingUp,
  Zap,
  BarChart3,
  Heart,
} from 'lucide-react';

export const Route = createFileRoute('/')({
  component: Dashboard,
});

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
  const totalItems = todayMissions.length + todayRoutines.length;

  // 통합 타임라인 (루틴 + 미션) 시간순 정렬, 상위 5개
  const previewItems = useMemo(() => {
    const items: Array<{
      type: 'routine' | 'mission';
      time: string;
      title: string;
      subject?: string;
      done: boolean;
      data: any;
    }> = [];

    todayRoutines.forEach((r: Routine) => {
      items.push({
        type: 'routine',
        time: r.startTime || '00:00',
        title: r.title,
        subject: r.subject,
        done: false,
        data: r,
      });
    });

    todayMissions.forEach((m: DailyMission) => {
      items.push({
        type: 'mission',
        time: m.startTime || '00:00',
        title: m.content || m.title || m.subject || '미션',
        subject: m.subject,
        done: m.status === 'done' || (m.progress != null && m.progress >= 100),
        data: m,
      });
    });

    items.sort((a, b) => a.time.localeCompare(b.time));
    return items.slice(0, 5);
  }, [todayRoutines, todayMissions]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-5">
      {/* ===== 인사 헤더 ===== */}
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">
          👋 {user?.userName ? `${user.userName}님, 안녕하세요!` : '안녕하세요!'}
        </h1>
        <p className="mt-0.5 text-sm text-gray-500">
          {today.getMonth() + 1}월 {today.getDate()}일 ({DAYS_KR[dayOfWeek]})
          {totalItems > 0 && (
            <span className="ml-2 font-medium text-indigo-600">오늘 {totalItems}개 일정</span>
          )}
        </p>
      </div>

      {/* ===== 통계 3칸 ===== */}
      <div className="mb-5 grid grid-cols-3 gap-3">
        <StatCard
          icon={<Target className="h-5 w-5 text-indigo-500" />}
          label="미션"
          value={totalMissions > 0 ? `${completedMissions}/${totalMissions}` : '-'}
          color="indigo"
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5 text-emerald-500" />}
          label="성취도"
          value={totalMissions > 0 ? `${avgProgress}%` : '-'}
          color="emerald"
          progress={avgProgress}
        />
        <StatCard
          icon={<Zap className="h-5 w-5 text-amber-500" />}
          label="순위"
          value={dashboard?.rank ? `${dashboard.rank.myRank}위` : '-'}
          color="amber"
        />
      </div>

      {/* ===== 오늘의 할일 미리보기 ===== */}
      <SectionCard
        icon={<CalendarDays className="h-4 w-4 text-indigo-500" />}
        title="오늘의 일정"
        linkTo="/missions"
        linkLabel="전체보기"
      >
        {previewItems.length > 0 ? (
          <div className="space-y-1.5">
            {previewItems.map((item, idx) => {
              const color = item.subject ? getSubjectColor(item.subject) : '#8b5cf6';
              return (
                <div
                  key={`${item.type}-${idx}`}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                    item.done ? 'bg-gray-50 opacity-60' : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  {/* 완료 체크 */}
                  {item.done ? (
                    <CheckCircle2 className="h-4.5 w-4.5 flex-shrink-0 text-emerald-500" />
                  ) : (
                    <Circle className="h-4.5 w-4.5 flex-shrink-0 text-gray-300" />
                  )}
                  {/* 시간 */}
                  <span className="w-11 flex-shrink-0 text-xs font-medium text-gray-400">
                    {item.time}
                  </span>
                  {/* 과목 뱃지 */}
                  {item.subject && (
                    <span
                      className="flex-shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold text-white"
                      style={{ backgroundColor: color }}
                    >
                      {item.subject.length > 3 ? item.subject.slice(0, 3) : item.subject}
                    </span>
                  )}
                  {/* 제목 */}
                  <span
                    className={`min-w-0 flex-1 truncate text-sm ${item.done ? 'text-gray-400 line-through' : 'text-gray-700'}`}
                  >
                    {item.title}
                  </span>
                  {/* 루틴 표시 */}
                  {item.type === 'routine' && (
                    <span className="flex-shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[9px] text-gray-400">
                      루틴
                    </span>
                  )}
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
              className="mt-2 inline-block rounded-full bg-indigo-50 px-4 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-100"
            >
              미션 추가하기 →
            </Link>
          </div>
        )}
      </SectionCard>

      {/* ===== 타이머 위젯 ===== */}
      <Link
        to="/timer"
        className="mb-4 flex items-center gap-4 rounded-2xl border border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50 px-5 py-4 transition-shadow hover:shadow-md"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
          <Timer className="h-6 w-6 text-indigo-500" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-800">집중 타이머</p>
          <p className="text-xs text-gray-500">포모도로로 집중 학습을 시작하세요</p>
        </div>
        <ChevronRight className="h-5 w-5 text-gray-300" />
      </Link>

      {/* ===== 최근 코멘트 ===== */}
      <RecentCommentsSection userId={user?.id} />

      {/* ===== 빠른 이동 ===== */}
      <div className="mb-2 mt-4">
        <p className="mb-3 text-sm font-semibold text-gray-700">🚀 빠른 이동</p>
        <div className="grid grid-cols-3 gap-2.5">
          <QuickNavButton
            to="/missions"
            icon={<CalendarDays className="h-5 w-5" />}
            label="금일계획"
            color="indigo"
          />
          <QuickNavButton
            to="/plans"
            icon={<Target className="h-5 w-5" />}
            label="장기계획"
            color="purple"
          />
          <QuickNavButton
            to="/routine"
            icon={<Clock className="h-5 w-5" />}
            label="주간루틴"
            color="blue"
          />
          <QuickNavButton
            to="/timer"
            icon={<Timer className="h-5 w-5" />}
            label="집중타이머"
            color="rose"
          />
          <QuickNavButton
            to="/learning"
            icon={<BarChart3 className="h-5 w-5" />}
            label="학습분석"
            color="emerald"
          />
          <QuickNavButton
            to="/growth"
            icon={<Heart className="h-5 w-5" />}
            label="성장기록"
            color="amber"
          />
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
  label,
  value,
  color,
  progress,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  progress?: number;
}) {
  const bgClass =
    color === 'indigo'
      ? 'bg-indigo-50'
      : color === 'emerald'
        ? 'bg-emerald-50'
        : color === 'amber'
          ? 'bg-amber-50'
          : 'bg-gray-50';

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-3">
        <div className={`mb-2 inline-flex rounded-lg p-1.5 ${bgClass}`}>{icon}</div>
        <p className="text-xl font-bold text-gray-900">{value}</p>
        <p className="text-[11px] text-gray-500">{label}</p>
        {progress !== undefined && progress > 0 && (
          <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SectionCard({
  icon,
  title,
  linkTo,
  linkLabel,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  linkTo: string;
  linkLabel: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="mb-4">
      <CardContent className="p-0">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5">
          <div className="flex items-center gap-2">
            {icon}
            <span className="text-sm font-semibold text-gray-700">{title}</span>
          </div>
          <Link
            to={linkTo}
            className="flex items-center gap-0.5 text-xs text-indigo-500 hover:text-indigo-700"
          >
            {linkLabel}
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="p-2">{children}</div>
      </CardContent>
    </Card>
  );
}

function RecentCommentsSection({ userId }: { userId?: number | string }) {
  const { data: comments, isLoading } = useGetRecentUnread(
    typeof userId === 'number' ? userId : 0,
    2,
  );

  const roleStyles: Record<string, { bg: string; text: string; avatar: string }> = {
    teacher: { bg: 'bg-indigo-50', text: 'text-indigo-700', avatar: 'bg-indigo-200' },
    parent: { bg: 'bg-amber-50', text: 'text-amber-700', avatar: 'bg-amber-200' },
    student: { bg: 'bg-emerald-50', text: 'text-emerald-700', avatar: 'bg-emerald-200' },
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

  if (isLoading) {
    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <Skeleton className="h-12 w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (!comments || comments.length === 0) return null;

  return (
    <SectionCard
      icon={<MessageSquare className="h-4 w-4 text-indigo-500" />}
      title="최근 코멘트"
      linkTo="/growth"
      linkLabel="더보기"
    >
      <div className="space-y-2">
        {comments.map((comment: any) => {
          const styles = roleStyles[comment.authorRole] || roleStyles.student;
          const authorName = comment.author?.name || '알 수 없음';
          return (
            <div key={comment.id} className={`rounded-lg ${styles.bg} p-3`}>
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded-full ${styles.avatar} text-[10px] font-bold ${styles.text}`}
                >
                  {authorName.charAt(0)}
                </div>
                <span className={`text-xs font-medium ${styles.text}`}>{authorName}</span>
                <span className="text-[10px] text-gray-400">{timeAgo(comment.createdAt)}</span>
              </div>
              <p className={`mt-1 text-xs ${styles.text} line-clamp-2`}>{comment.content}</p>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

const NAV_COLORS: Record<string, { bg: string; icon: string; hover: string }> = {
  indigo: { bg: 'bg-indigo-50', icon: 'text-indigo-500', hover: 'hover:bg-indigo-100' },
  purple: { bg: 'bg-purple-50', icon: 'text-purple-500', hover: 'hover:bg-purple-100' },
  blue: { bg: 'bg-blue-50', icon: 'text-blue-500', hover: 'hover:bg-blue-100' },
  rose: { bg: 'bg-rose-50', icon: 'text-rose-500', hover: 'hover:bg-rose-100' },
  emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-500', hover: 'hover:bg-emerald-100' },
  amber: { bg: 'bg-amber-50', icon: 'text-amber-500', hover: 'hover:bg-amber-100' },
};

function QuickNavButton({
  to,
  icon,
  label,
  color,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  color: string;
}) {
  const colors = NAV_COLORS[color] || NAV_COLORS.indigo;
  return (
    <Link
      to={to}
      className={`flex flex-col items-center gap-1.5 rounded-xl ${colors.bg} ${colors.hover} px-2 py-3 transition-colors`}
    >
      <div className={colors.icon}>{icon}</div>
      <span className="text-xs font-medium text-gray-700">{label}</span>
    </Link>
  );
}

// ============================================
// 스켈레톤
// ============================================

function DashboardSkeleton() {
  return (
    <div className="mx-auto w-full max-w-lg px-4 py-5">
      <Skeleton className="mb-1 h-7 w-48" />
      <Skeleton className="mb-5 h-4 w-32" />
      <div className="mb-5 grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="mb-4 h-48 rounded-xl" />
      <Skeleton className="mb-4 h-16 rounded-xl" />
      <Skeleton className="h-32 rounded-xl" />
    </div>
  );
}
