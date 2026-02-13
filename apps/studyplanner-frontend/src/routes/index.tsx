/**
 * 플래너 대시보드 페이지
 *
 * 오늘의 캘린더, 미션, 성취도, 주간 진행률을 한눈에 보여줍니다.
 * 비로그인 사용자도 열람 가능하며, 액션 시 로그인 모달이 표시됩니다.
 */

import { createFileRoute, Link } from '@tanstack/react-router';
import { useMemo } from 'react';
import { useLoginGuard } from '@/hooks/useLoginGuard';
import {
  useGetTodayDashboard,
  useGetNotices,
  useGetPlannerMentors,
  useGetPlannerItems,
} from '@/stores/server/planner';
import {
  usePlannerStore,
  useIsToday,
  useSelectedDateString,
} from '@/stores/client/use-planner-store';
import type { PlannerItem } from '@/types/planner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CalendarDays,
  Target,
  TrendingUp,
  Award,
  Bell,
  ChevronRight,
  ChevronLeft,
  Plus,
  CheckCircle,
  Circle,
  Clock,
  Bookmark,
} from 'lucide-react';

export const Route = createFileRoute('/')({
  component: PlannerDashboard,
});

// ============================================
// 상수
// ============================================

const SUBJECT_COLORS: Record<string, string> = {
  국어: '#ef4444',
  수학: '#eab308',
  영어: '#f97316',
  사회: '#3b82f6',
  과학: '#14b8a6',
  한국사: '#a855f7',
};

// Mock 쪽지 데이터
const MOCK_NOTES: Record<number, { id: number; from: string; message: string; date: string }[]> = {
  1: [
    {
      id: 1,
      from: '김멘토',
      message: '수학 숙제 잘 했어요! 다음엔 증명 문제도 도전해봐요.',
      date: '2025-12-17',
    },
    { id: 2, from: '김멘토', message: '오늘 수업 집중 잘 했네요 👍', date: '2025-12-16' },
  ],
  2: [{ id: 3, from: '이멘토', message: '영어 단어 암기 화이팅!', date: '2025-12-17' }],
};

// ============================================
// 미션 요약 카드 컴포넌트 (캘린더 상단)
// ============================================

interface MissionSummary {
  subject: string;
  count: number;
  completedCount: number;
  totalTime: number; // 분
  titles: string[];
}

function MissionSummaryCard({
  items,
  period,
}: {
  items: PlannerItem[];
  period: '일간' | '주간' | '월간';
}) {
  // 과목별로 그룹화
  const summaryBySubject = useMemo(() => {
    const map = new Map<string, MissionSummary>();

    items.forEach((item) => {
      const subject = item.subject || '기타';
      const existing = map.get(subject) || {
        subject,
        count: 0,
        completedCount: 0,
        totalTime: 0,
        titles: [],
      };

      const startTime = new Date(item.startDate).getTime();
      const endTime = new Date(item.endDate).getTime();
      const duration = Math.round((endTime - startTime) / (1000 * 60));

      existing.count += 1;
      existing.completedCount += item.progress >= 100 ? 1 : 0;
      existing.totalTime += duration;
      if (existing.titles.length < 3) {
        existing.titles.push(item.title);
      }

      map.set(subject, existing);
    });

    return Array.from(map.values()).sort((a, b) => b.totalTime - a.totalTime);
  }, [items]);

  const totalMissions = items.length;
  const completedMissions = items.filter((i) => i.progress >= 100).length;
  const totalMinutes = summaryBySubject.reduce((sum, s) => sum + s.totalTime, 0);

  if (totalMissions === 0) {
    return null;
  }

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}시간 ${mins}분` : `${hours}시간`;
    }
    return `${mins}분`;
  };

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        {/* 헤더 */}
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">{period} 미션 요약</h3>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-500">
              총 <span className="font-semibold text-gray-700">{totalMissions}</span>개
            </span>
            <span className="text-green-600">
              완료 <span className="font-semibold">{completedMissions}</span>개
            </span>
            <span className="text-blue-600">
              학습 <span className="font-semibold">{formatTime(totalMinutes)}</span>
            </span>
          </div>
        </div>

        {/* 과목별 미션 목록 */}
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {summaryBySubject.map((summary) => {
            const color = SUBJECT_COLORS[summary.subject] || '#6b7280';
            const progressPercent =
              summary.count > 0 ? Math.round((summary.completedCount / summary.count) * 100) : 0;

            return (
              <div
                key={summary.subject}
                className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3"
              >
                {/* 과목 색상 바 */}
                <div
                  className="mt-0.5 h-full w-1 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: color, minHeight: '40px' }}
                />

                <div className="min-w-0 flex-1">
                  {/* 과목명 + 진행률 */}
                  <div className="flex items-center justify-between">
                    <span
                      className="rounded px-2 py-0.5 text-xs font-medium text-white"
                      style={{ backgroundColor: color }}
                    >
                      {summary.subject}
                    </span>
                    <span className="text-xs text-gray-500">
                      {summary.completedCount}/{summary.count} ({progressPercent}%)
                    </span>
                  </div>

                  {/* 미션 제목들 */}
                  <div className="mt-1.5 space-y-0.5">
                    {summary.titles.map((title, idx) => (
                      <p key={idx} className="truncate text-xs text-gray-600">
                        • {title}
                      </p>
                    ))}
                    {summary.count > 3 && (
                      <p className="text-xs text-gray-400">외 {summary.count - 3}개</p>
                    )}
                  </div>

                  {/* 학습 시간 */}
                  <p className="mt-1 text-[10px] text-gray-400">
                    학습시간: {formatTime(summary.totalTime)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// 일간 캘린더 컴포넌트
// ============================================

function DailyCalendar({ items }: { items: PlannerItem[] }) {
  const { selectedDate, goToPrevDay, goToNextDay, goToToday } = usePlannerStore();
  const isToday = useIsToday();

  const date = new Date(selectedDate.year, selectedDate.month - 1, selectedDate.day);
  const DAYS_KR = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  const HOURS = Array.from({ length: 24 }, (_, i) => i);
  const dayOfWeek = date.getDay();

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const currentPosition = (currentMinutes / (24 * 60)) * 100;

  const sortedItems = useMemo(() => {
    return [...items].sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    );
  }, [items]);

  const getItemPosition = (item: PlannerItem) => {
    const startDate = new Date(item.startDate);
    const endDate = new Date(item.endDate);
    const startMinutes = startDate.getHours() * 60 + startDate.getMinutes();
    const endMinutes = endDate.getHours() * 60 + endDate.getMinutes();
    const top = (startMinutes / (24 * 60)) * 100;
    const height = ((endMinutes - startMinutes) / (24 * 60)) * 100;
    return { top, height: Math.max(height, 2) };
  };

  const formatTime = (dateInput: Date | string) => {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  return (
    <Card>
      <CardContent className="p-4">
        {/* 헤더 */}
        <div className="mb-4 flex items-center justify-between">
          <button onClick={goToPrevDay} className="rounded-full p-2 hover:bg-gray-100">
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="flex flex-col items-center">
            <div className="flex items-center gap-3">
              <span
                className={`text-4xl font-bold ${
                  isToday
                    ? 'text-ultrasonic-500'
                    : dayOfWeek === 0
                      ? 'text-red-500'
                      : dayOfWeek === 6
                        ? 'text-blue-500'
                        : 'text-gray-900'
                }`}
              >
                {date.getDate()}
              </span>
              <div className="flex flex-col">
                <span className="text-sm text-gray-500">
                  {date.getFullYear()}년 {date.getMonth() + 1}월
                </span>
                <span
                  className={`text-sm font-medium ${
                    dayOfWeek === 0
                      ? 'text-red-500'
                      : dayOfWeek === 6
                        ? 'text-blue-500'
                        : 'text-gray-700'
                  }`}
                >
                  {DAYS_KR[dayOfWeek]}
                </span>
              </div>
            </div>
            {!isToday && (
              <button
                onClick={goToToday}
                className="bg-ultrasonic-100 text-ultrasonic-600 hover:bg-ultrasonic-200 mt-2 rounded-full px-3 py-1 text-xs font-medium"
              >
                오늘로 이동
              </button>
            )}
            {isToday && (
              <span className="bg-ultrasonic-500 mt-2 rounded-full px-3 py-1 text-xs font-medium text-white">
                오늘
              </span>
            )}
          </div>

          <button onClick={goToNextDay} className="rounded-full p-2 hover:bg-gray-100">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* 24시간 타임라인 */}
        <div className="flex">
          <div className="w-10 flex-shrink-0">
            <div className="relative h-[400px]">
              {HOURS.filter((h) => h % 2 === 0).map((hour) => (
                <div
                  key={hour}
                  className="absolute left-0 right-0 pr-2 text-right text-xs text-gray-400"
                  style={{ top: `${(hour / 24) * 100}%`, transform: 'translateY(-50%)' }}
                >
                  {hour.toString().padStart(2, '0')}
                </div>
              ))}
            </div>
          </div>

          <div className="relative h-[400px] flex-1 rounded-lg border border-gray-200 bg-gray-50">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className={`absolute left-0 right-0 border-t ${hour % 2 === 0 ? 'border-gray-200' : 'border-gray-100'}`}
                style={{ top: `${(hour / 24) * 100}%` }}
              />
            ))}

            {isToday && (
              <div
                className="bg-ultrasonic-500 absolute left-0 right-0 z-20 h-0.5"
                style={{ top: `${currentPosition}%` }}
              >
                <div className="bg-ultrasonic-500 absolute -left-1 -top-1 h-2.5 w-2.5 rounded-full" />
              </div>
            )}

            {sortedItems.map((item) => {
              const pos = getItemPosition(item);
              const isCompleted = item.progress >= 100;
              const color = SUBJECT_COLORS[item.subject ?? ''] || '#6b7280';

              return (
                <div
                  key={item.id}
                  className={`absolute left-1 right-1 z-10 overflow-hidden rounded border-l-2 px-2 py-0.5 text-xs shadow-sm ${
                    isCompleted
                      ? 'border-gray-400 bg-gray-200 text-gray-500'
                      : item.primaryType === '학습'
                        ? 'border-blue-500 bg-blue-100 text-blue-800'
                        : 'border-green-500 bg-green-100 text-green-800'
                  }`}
                  style={{
                    top: `${pos.top}%`,
                    height: `${pos.height}%`,
                    minHeight: '24px',
                    borderLeftColor: color,
                  }}
                  title={`${item.title} (${formatTime(item.startDate)}-${formatTime(item.endDate)})`}
                >
                  <div className="truncate font-medium">{item.title}</div>
                  {pos.height > 3 && (
                    <div className="text-[10px] opacity-70">
                      {formatTime(item.startDate)} - {formatTime(item.endDate)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="w-10 flex-shrink-0">
            <div className="relative h-[400px]">
              {HOURS.filter((h) => h % 2 === 0).map((hour) => (
                <div
                  key={hour}
                  className="absolute left-0 right-0 pl-2 text-xs text-gray-400"
                  style={{ top: `${(hour / 24) * 100}%`, transform: 'translateY(-50%)' }}
                >
                  {hour.toString().padStart(2, '0')}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// 할일 목록 아이템 컴포넌트
// ============================================

function TodoListItem({ item }: { item: PlannerItem }) {
  const isCompleted = item.progress >= 100;
  const color = SUBJECT_COLORS[item.subject ?? ''] || '#6b7280';

  const formatTime = (dateInput: Date | string) => {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border p-3 transition-all ${
        isCompleted ? 'border-gray-200 bg-gray-50 opacity-60' : 'border-gray-200 hover:bg-gray-50'
      }`}
    >
      {/* 완료 체크 아이콘 */}
      <div className="flex-shrink-0">
        {isCompleted ? (
          <CheckCircle className="h-5 w-5 text-green-500" />
        ) : (
          <Circle className="h-5 w-5 text-gray-300" />
        )}
      </div>

      {/* 과목 색상 바 */}
      <div className="h-10 w-1 flex-shrink-0 rounded-full" style={{ backgroundColor: color }} />

      {/* 내용 */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className="rounded px-2 py-0.5 text-xs font-medium text-white"
            style={{ backgroundColor: color }}
          >
            {item.subject}
          </span>
          <span
            className={`rounded px-2 py-0.5 text-xs ${
              item.primaryType === '학습'
                ? 'bg-blue-100 text-blue-600'
                : 'bg-green-100 text-green-600'
            }`}
          >
            {item.primaryType}
          </span>
        </div>
        <p
          className={`mt-1 truncate font-medium ${isCompleted ? 'text-gray-400 line-through' : ''}`}
        >
          {item.title}
        </p>
        <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
          <Clock className="h-3 w-3" />
          <span>
            {formatTime(item.startDate)} - {formatTime(item.endDate)}
          </span>
        </div>
      </div>

      {/* 성취도 */}
      <div className="text-right">
        <div className="text-lg font-bold" style={{ color: isCompleted ? '#22c55e' : color }}>
          {item.progress ?? 0}%
        </div>
        <div className="text-xs text-gray-500">성취도</div>
      </div>
    </div>
  );
}

// ============================================
// 담당 선생님 카드 (쪽지 포함)
// ============================================

function MentorCard({ mentor }: { mentor: { id: number; name: string; subject?: string } }) {
  const notes = MOCK_NOTES[mentor.id] || [];
  const hasNotes = notes.length > 0;
  const latestNote = notes[0];

  return (
    <div className="relative flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-gray-50">
      {/* 멘토 아바타 */}
      <div className="from-ultrasonic-400 to-ultrasonic-600 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-bold text-white">
        {mentor.name?.charAt(0) ?? '?'}
      </div>

      {/* 멘토 정보 */}
      <div className="min-w-0 flex-1">
        <div className="font-medium">{mentor.name}</div>
        {mentor.subject && <div className="text-sm text-gray-500">{mentor.subject}</div>}

        {/* 최근 쪽지 미리보기 */}
        {latestNote && (
          <div className="mt-2 rounded-md bg-amber-50 p-2">
            <p className="line-clamp-2 text-xs text-amber-800">{latestNote.message}</p>
            <p className="mt-1 text-[10px] text-amber-600">{latestNote.date}</p>
          </div>
        )}
      </div>

      {/* 책갈피 쪽지 표시 */}
      {hasNotes && (
        <div className="absolute -right-1 -top-1">
          <div className="relative">
            {/* 책갈피 모양 */}
            <div className="relative">
              <Bookmark
                className="h-10 w-10 fill-amber-400 text-amber-500 drop-shadow-md"
                strokeWidth={1.5}
              />
              {/* 쪽지 개수 뱃지 */}
              <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow">
                {notes.length}
              </div>
            </div>
            {/* 쪽지 보낸 사람 이름 */}
            <div className="absolute left-1/2 top-2 -translate-x-1/2 transform">
              <span className="whitespace-nowrap text-[8px] font-bold text-amber-800">
                {latestNote.from.charAt(0)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// 메인 대시보드 컴포넌트
// ============================================

function PlannerDashboard() {
  const { data: dashboard, isLoading } = useGetTodayDashboard();
  const { data: notices } = useGetNotices();
  const { data: mentors } = useGetPlannerMentors();
  const { data: allItems } = useGetPlannerItems();

  const { openItemForm } = usePlannerStore();
  const { guard, LoginGuardModal } = useLoginGuard();

  const isToday = useIsToday();
  const dateString = useSelectedDateString();

  // 선택된 날짜의 아이템만 필터링
  const todayItems = useMemo(() => {
    if (!allItems) return [];
    return allItems.filter((item) => {
      const itemDate = new Date(item.startDate).toISOString().split('T')[0];
      return itemDate === dateString;
    });
  }, [allItems, dateString]);

  // 시간순 정렬
  const sortedTodayItems = useMemo(() => {
    return [...todayItems].sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    );
  }, [todayItems]);

  // 통계 계산
  const completedCount = todayItems.filter((i) => i.progress >= 100).length;
  const totalCount = todayItems.length;
  const avgProgress =
    totalCount > 0
      ? Math.round(todayItems.reduce((sum, i) => sum + (i.progress || 0), 0) / totalCount)
      : 0;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="mx-auto w-full max-w-screen-xl px-4 py-6">
      {/* 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">플래너</h1>
          <p className="mt-1 text-gray-500">학습 계획을 세우고 성취도를 관리하세요</p>
        </div>
        <Button onClick={() => guard(() => openItemForm())} className="gap-2">
          <Plus className="h-4 w-4" />새 일정
        </Button>
      </div>

      {LoginGuardModal}

      {/* 통계 카드 */}
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <StatCard
          icon={<Target className="text-ultrasonic-500 h-5 w-5" />}
          label="오늘 미션"
          value={`${completedCount}/${totalCount}`}
          subtext="완료"
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5 text-green-500" />}
          label="오늘 성취도"
          value={`${avgProgress}%`}
          progress={avgProgress}
        />
        <StatCard
          icon={<Award className="h-5 w-5 text-yellow-500" />}
          label="클래스 순위"
          value={dashboard?.rank ? `${dashboard.rank.myRank}위` : '-'}
          subtext={dashboard?.rank ? `/ ${dashboard.rank.totalStudents}명` : ''}
        />
        <StatCard
          icon={<CalendarDays className="h-5 w-5 text-blue-500" />}
          label="주간 성취도"
          value={`${dashboard?.rank?.weeklyAchievement ?? 0}%`}
          progress={dashboard?.rank?.weeklyAchievement}
        />
      </div>

      {/* 메인 컨텐츠 */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* 일간 캘린더 + 할일 목록 */}
        <div className="space-y-4 lg:col-span-2">
          {/* 일간 미션 요약 */}
          <MissionSummaryCard items={todayItems} period="일간" />

          {/* 일간 캘린더 */}
          <DailyCalendar items={todayItems} />

          {/* 금일 할일 목록 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg">
                {isToday ? '오늘의 할일' : '선택된 날짜 할일'}
              </CardTitle>
              <span className="text-sm text-gray-500">
                {completedCount}/{totalCount} 완료
              </span>
            </CardHeader>
            <CardContent>
              {sortedTodayItems.length > 0 ? (
                <div className="space-y-2">
                  {sortedTodayItems.map((item) => (
                    <TodoListItem key={item.id} item={item} />
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-gray-500">
                  <CalendarDays className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                  <p>등록된 할일이 없습니다</p>
                  <Button variant="outline" className="mt-4" onClick={() => openItemForm()}>
                    할일 추가하기
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 진행률 요약 */}
          {totalCount > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">
                      {isToday ? '오늘의 진행률' : '선택된 날짜 진행률'}
                    </p>
                    <p className="text-ultrasonic-600 mt-1 text-2xl font-bold">{avgProgress}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">완료</p>
                    <p className="mt-1 text-xl font-semibold">
                      <span className="text-green-600">{completedCount}</span>
                      <span className="text-gray-400"> / {totalCount}</span>
                    </p>
                  </div>
                </div>
                <Progress
                  value={totalCount > 0 ? (completedCount / totalCount) * 100 : 0}
                  className="mt-3 h-2"
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* 사이드바 */}
        <div className="space-y-6">
          {/* 담당 선생님 (쪽지 포함) */}
          {mentors && mentors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  담당 선생님
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                    쪽지 {Object.values(MOCK_NOTES).flat().length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mentors.map((mentor) => (
                    <MentorCard key={mentor.id} mentor={mentor} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 공지사항 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bell className="h-4 w-4" />
                공지사항
              </CardTitle>
            </CardHeader>
            <CardContent>
              {notices && notices.length > 0 ? (
                <div className="space-y-2">
                  {notices.slice(0, 3).map((notice) => (
                    <div key={notice.id} className="flex items-start gap-2">
                      {notice.isImportant && (
                        <span className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full bg-red-500" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{notice.title}</p>
                        <p className="text-xs text-gray-500">{notice.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-4 text-center text-sm text-gray-500">공지사항이 없습니다</p>
              )}
            </CardContent>
          </Card>

          {/* 빠른 링크 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">빠른 이동</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <QuickLink to="/routine" label="주간 루틴 설정" />
                <QuickLink to="/plans" label="장기 계획 관리" />
                <QuickLink to="/learning" label="학습 현황" />
              </div>
            </CardContent>
          </Card>
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
  subtext,
  progress,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext?: string;
  progress?: number;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-gray-100 p-2">{icon}</div>
          <div className="flex-1">
            <p className="text-sm text-gray-500">{label}</p>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold">{value}</span>
              {subtext && <span className="text-sm text-gray-400">{subtext}</span>}
            </div>
          </div>
        </div>
        {progress !== undefined && <Progress value={progress} className="mt-3 h-1.5" />}
      </CardContent>
    </Card>
  );
}

function QuickLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-gray-50"
    >
      <span className="text-sm font-medium">{label}</span>
      <ChevronRight className="h-4 w-4 text-gray-400" />
    </Link>
  );
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto w-full max-w-screen-xl px-4 py-6">
      <div className="mb-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="mt-2 h-5 w-64" />
      </div>
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Skeleton className="h-[450px] rounded-xl" />
          <Skeleton className="h-[300px] rounded-xl" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
