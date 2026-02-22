/**
 * 금일계획 페이지
 * - 월간/주간/일간 드롭다운으로 기간 선택
 * - 장기계획과 주간루틴에서 생성된 미션 표시
 * - 기간별 캘린더
 */

import { createLazyFileRoute, Link } from '@tanstack/react-router';
import { useState, useMemo } from 'react';
import { useLoginGuard } from '@/hooks/useLoginGuard';
import {
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  CheckCircle,
  Circle,
  Clock,
  BookOpen,
  Target,
  TrendingUp,
  Calendar,
  Camera,
  ImageIcon,
  MessageSquare,
} from 'lucide-react';
import { useGetDailyMissions, useCompleteDailyMission } from '@/stores/server/planner';
import type { DailyMission } from '@/stores/server/planner/planner-types';
import { SUBJECT_COLORS } from '@/types/planner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { CommentDialog } from '@/components/planner/CommentDialog';

export const Route = createLazyFileRoute('/missions')({
  component: MyMissionsPage,
});

// ============================================
// 상수
// ============================================

type PeriodType = 'daily' | 'weekly' | 'monthly';

const PERIOD_LABELS: Record<PeriodType, string> = {
  daily: '일간',
  weekly: '주간',
  monthly: '월간',
};

const DAYS_KR = ['일', '월', '화', '수', '목', '금', '토'];

// ============================================
// 유틸 함수
// ============================================

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekEnd(weekStart: Date): Date {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + 6);
  return d;
}

function formatDate(date: Date): string {
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

function formatDateStr(date: Date): string {
  return date.toISOString().split('T')[0];
}

// ============================================
// 미션 요약 카드 컴포넌트
// ============================================

interface MissionSummary {
  subject: string;
  count: number;
  completedCount: number;
  totalAmount: number;
  weeklyTarget: number;
  titles: string[];
}

function MissionSummaryCard({
  missions,
  period,
}: {
  missions: DailyMission[];
  period: PeriodType;
}) {
  const summaryBySubject = useMemo(() => {
    const map = new Map<string, MissionSummary>();

    missions.forEach((mission) => {
      const subject = mission.subject || '기타';
      const existing = map.get(subject) || {
        subject,
        count: 0,
        completedCount: 0,
        totalAmount: 0,
        weeklyTarget: 0,
        titles: [],
      };

      existing.count += 1;
      existing.completedCount += mission.status === 'completed' ? 1 : 0;
      existing.totalAmount += mission.amount;
      if (mission.weeklyTarget && mission.weeklyTarget > existing.weeklyTarget) {
        existing.weeklyTarget = mission.weeklyTarget;
      }
      if (existing.titles.length < 3) {
        existing.titles.push(mission.title);
      }

      map.set(subject, existing);
    });

    return Array.from(map.values()).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [missions]);

  const totalMissions = missions.length;
  const completedMissions = missions.filter((m) => m.status === 'completed').length;
  const avgProgress =
    totalMissions > 0
      ? Math.round(missions.reduce((sum, m) => sum + m.progress, 0) / totalMissions)
      : 0;

  if (totalMissions === 0) {
    return null;
  }

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        {/* 헤더 */}
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">{PERIOD_LABELS[period]} 미션 요약</h3>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-500">
              총 <span className="font-semibold text-gray-700">{totalMissions}</span>개
            </span>
            <span className="text-green-600">
              완료 <span className="font-semibold">{completedMissions}</span>개
            </span>
            <span className="text-blue-600">
              평균 <span className="font-semibold">{avgProgress}%</span>
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

                  {/* 총 분량 + 주간 할당량 */}
                  <div className="mt-1 flex items-center gap-2 text-[10px] text-gray-400">
                    <span>총 {summary.totalAmount}</span>
                    {summary.weeklyTarget > 0 && (
                      <span className="text-blue-400">(주간 {summary.weeklyTarget} 할당)</span>
                    )}
                  </div>
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

function DailyCalendar({
  missions,
  selectedDate,
  onDateChange,
}: {
  missions: DailyMission[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}) {
  const HOURS = Array.from({ length: 24 }, (_, i) => i);

  const navigate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    onDateChange(newDate);
  };

  const goToToday = () => {
    onDateChange(new Date());
  };

  const dateStr = formatDateStr(selectedDate);
  const dayMissions = missions.filter((m) => m.date === dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isToday = selectedDate.getTime() === today.getTime();

  const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const getMissionPosition = (mission: DailyMission) => {
    const startMinutes = timeToMinutes(mission.startTime);
    const endMinutes = timeToMinutes(mission.endTime);
    const top = (startMinutes / (24 * 60)) * 100;
    const height = ((endMinutes - startMinutes) / (24 * 60)) * 100;
    return { top, height: Math.max(height, 2) };
  };

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const currentPosition = (currentMinutes / (24 * 60)) * 100;

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        {/* 날짜 네비게이션 */}
        <div className="mb-4 flex items-center justify-between">
          <button onClick={() => navigate('prev')} className="rounded-full p-1 hover:bg-gray-100">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">
              {selectedDate.getFullYear()}년 {selectedDate.getMonth() + 1}월{' '}
              {selectedDate.getDate()}일 ({DAYS_KR[selectedDate.getDay()]})
            </h3>
            {!isToday && (
              <Button variant="outline" size="sm" onClick={goToToday}>
                오늘
              </Button>
            )}
          </div>
          <button onClick={() => navigate('next')} className="rounded-full p-1 hover:bg-gray-100">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* 타임라인 */}
        <div className="flex">
          {/* 시간 라벨 */}
          <div className="w-12 flex-shrink-0">
            <div className="relative h-[480px]">
              {HOURS.filter((h) => h % 2 === 0).map((hour) => (
                <div
                  key={hour}
                  className="absolute left-0 right-0 pr-2 text-right text-xs text-gray-400"
                  style={{ top: `${(hour / 24) * 100}%`, transform: 'translateY(-50%)' }}
                >
                  {hour.toString().padStart(2, '0')}:00
                </div>
              ))}
            </div>
          </div>

          {/* 캘린더 그리드 */}
          <div className="relative flex-1 rounded-lg border border-gray-200 bg-gray-50">
            <div className="relative h-[480px]">
              {/* 시간 그리드 */}
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="absolute left-0 right-0 border-t border-gray-100"
                  style={{ top: `${(hour / 24) * 100}%` }}
                />
              ))}

              {/* 현재 시간 표시 */}
              {isToday && (
                <div
                  className="absolute left-0 right-0 z-10 flex items-center"
                  style={{ top: `${currentPosition}%` }}
                >
                  <div className="h-2 w-2 rounded-full bg-red-500" />
                  <div className="h-0.5 flex-1 bg-red-500" />
                </div>
              )}

              {/* 미션들 */}
              {dayMissions.map((mission) => {
                const pos = getMissionPosition(mission);
                const color = SUBJECT_COLORS[mission.subject] || '#6b7280';
                const isCompleted = mission.status === 'completed';

                return (
                  <div
                    key={mission.id}
                    className={`absolute left-1 right-1 overflow-hidden rounded px-2 py-1 text-xs text-white ${
                      isCompleted ? 'opacity-60' : ''
                    }`}
                    style={{
                      top: `${pos.top}%`,
                      height: `${pos.height}%`,
                      backgroundColor: color,
                      minHeight: '24px',
                    }}
                    title={`${mission.title} (${mission.startTime}~${mission.endTime})`}
                  >
                    <div className="flex items-center gap-1">
                      {isCompleted ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <Circle className="h-3 w-3" />
                      )}
                      <span className="truncate font-medium">{mission.title}</span>
                    </div>
                    {pos.height > 4 && (
                      <div className="text-[10px] opacity-80">
                        {mission.content} · {mission.progress}%
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// 주간 캘린더 컴포넌트
// ============================================

function WeeklyCalendar({
  missions,
  weekStart,
  onWeekChange,
}: {
  missions: DailyMission[];
  weekStart: Date;
  onWeekChange: (date: Date) => void;
}) {
  const HOURS = Array.from({ length: 24 }, (_, i) => i);

  const navigate = (direction: 'prev' | 'next') => {
    const newStart = new Date(weekStart);
    newStart.setDate(newStart.getDate() + (direction === 'next' ? 7 : -7));
    onWeekChange(newStart);
  };

  const weekDays = useMemo(() => {
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      days.push(day);
    }
    return days;
  }, [weekStart]);

  const weekEnd = weekDays[6];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const getMissionPosition = (mission: DailyMission) => {
    const startMinutes = timeToMinutes(mission.startTime);
    const endMinutes = timeToMinutes(mission.endTime);
    const top = (startMinutes / (24 * 60)) * 100;
    const height = ((endMinutes - startMinutes) / (24 * 60)) * 100;
    return { top, height: Math.max(height, 2) };
  };

  const getMissionsForDay = (date: Date) => {
    const dateStr = formatDateStr(date);
    return missions.filter((m) => m.date === dateStr);
  };

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        {/* 헤더 */}
        <div className="mb-4 flex items-center justify-between">
          <button onClick={() => navigate('prev')} className="rounded-full p-1 hover:bg-gray-100">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h3 className="text-lg font-semibold">
            {formatDate(weekStart)} ~ {formatDate(weekEnd)}
          </h3>
          <button onClick={() => navigate('next')} className="rounded-full p-1 hover:bg-gray-100">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* 주간 할당량 진행률 요약 */}
        {(() => {
          // 이번 주 미션만 필터링
          const weekStartStr = formatDateStr(weekStart);
          const weekEndStr = formatDateStr(weekEnd);
          const weekMissions = missions.filter(
            (m) => m.date >= weekStartStr && m.date <= weekEndStr,
          );

          if (weekMissions.length === 0) return null;

          // 과목별 그룹화
          const subjectProgress = new Map<
            string,
            { total: number; completed: number; weeklyTarget: number }
          >();
          weekMissions.forEach((m) => {
            const existing = subjectProgress.get(m.subject) || {
              total: 0,
              completed: 0,
              weeklyTarget: 0,
            };
            existing.total += m.amount;
            existing.completed += m.status === 'completed' ? m.amount : 0;
            if (m.weeklyTarget && m.weeklyTarget > existing.weeklyTarget) {
              existing.weeklyTarget = m.weeklyTarget;
            }
            subjectProgress.set(m.subject, existing);
          });

          return (
            <div className="mb-3 flex flex-wrap gap-2">
              {Array.from(subjectProgress.entries()).map(([subject, data]) => {
                const color = SUBJECT_COLORS[subject] || '#6b7280';
                const target = data.weeklyTarget || data.total;
                const pct = target > 0 ? Math.round((data.completed / target) * 100) : 0;
                return (
                  <div
                    key={subject}
                    className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs"
                  >
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                    <span className="font-medium">{subject}</span>
                    <div className="h-1.5 w-12 overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }}
                      />
                    </div>
                    <span className="text-gray-500">
                      {data.completed}/{target} ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* 주간 타임라인 */}
        <div className="flex">
          {/* 시간 라벨 */}
          <div className="w-10 flex-shrink-0">
            <div className="h-12" />
            <div className="relative h-[400px]">
              {HOURS.filter((h) => h % 3 === 0).map((hour) => (
                <div
                  key={hour}
                  className="absolute left-0 right-0 pr-1 text-right text-[10px] text-gray-400"
                  style={{ top: `${(hour / 24) * 100}%`, transform: 'translateY(-50%)' }}
                >
                  {hour.toString().padStart(2, '0')}
                </div>
              ))}
            </div>
          </div>

          {/* 요일 컬럼들 */}
          <div className="grid flex-1 grid-cols-7 gap-0.5">
            {/* 요일 헤더 */}
            {weekDays.map((date, idx) => {
              const isToday = date.getTime() === today.getTime();
              return (
                <div
                  key={`header-${idx}`}
                  className={`flex h-12 flex-col items-center justify-center rounded-t ${
                    isToday ? 'bg-ultrasonic-500 text-white' : 'bg-gray-100'
                  }`}
                >
                  <span
                    className={`text-[10px] font-medium ${
                      isToday
                        ? 'text-white'
                        : idx === 0
                          ? 'text-red-500'
                          : idx === 6
                            ? 'text-blue-500'
                            : 'text-gray-500'
                    }`}
                  >
                    {DAYS_KR[idx]}
                  </span>
                  <span className={`text-sm font-bold ${isToday ? 'text-white' : 'text-gray-900'}`}>
                    {date.getDate()}
                  </span>
                </div>
              );
            })}

            {/* 타임라인 그리드 */}
            {weekDays.map((date, dayIdx) => {
              const isToday = date.getTime() === today.getTime();
              const dayMissions = getMissionsForDay(date);

              return (
                <div
                  key={`timeline-${dayIdx}`}
                  className={`relative h-[400px] border-l border-gray-200 ${
                    isToday ? 'bg-ultrasonic-50' : 'bg-gray-50'
                  }`}
                >
                  {HOURS.map((hour) => (
                    <div
                      key={hour}
                      className="absolute left-0 right-0 border-t border-gray-100"
                      style={{ top: `${(hour / 24) * 100}%` }}
                    />
                  ))}

                  {/* 미션들 */}
                  {dayMissions.map((mission) => {
                    const pos = getMissionPosition(mission);
                    const color = SUBJECT_COLORS[mission.subject] || '#6b7280';
                    const isCompleted = mission.status === 'completed';

                    return (
                      <div
                        key={mission.id}
                        className={`absolute left-0.5 right-0.5 overflow-hidden rounded px-1 text-[9px] text-white ${
                          isCompleted ? 'opacity-60' : ''
                        }`}
                        style={{
                          top: `${pos.top}%`,
                          height: `${pos.height}%`,
                          backgroundColor: color,
                          minHeight: '16px',
                        }}
                        title={`${mission.title} - ${mission.content}`}
                      >
                        <div className="truncate font-medium">{mission.subject}</div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// 월간 캘린더 컴포넌트
// ============================================

function MonthlyCalendar({
  missions,
  currentMonth,
  onMonthChange,
}: {
  missions: DailyMission[];
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const navigate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    onMonthChange(newDate);
  };

  const { weeks } = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const weeks: Date[][] = [];
    let week: Date[] = [];

    const startDay = firstDay.getDay();
    for (let i = 0; i < startDay; i++) {
      week.push(new Date(year, month, 1 - startDay + i));
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
      week.push(new Date(year, month, day));
      if (week.length === 7) {
        weeks.push(week);
        week = [];
      }
    }

    if (week.length > 0) {
      const remaining = 7 - week.length;
      for (let i = 1; i <= remaining; i++) {
        week.push(new Date(year, month + 1, i));
      }
      weeks.push(week);
    }

    return { weeks };
  }, [currentMonth]);

  const getMissionsForDate = (date: Date) => {
    const dateStr = formatDateStr(date);
    return missions.filter((m) => m.date === dateStr);
  };

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <button onClick={() => navigate('prev')} className="rounded-full p-1 hover:bg-gray-100">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h3 className="text-lg font-semibold">
            {currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월
          </h3>
          <button onClick={() => navigate('next')} className="rounded-full p-1 hover:bg-gray-100">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-2 grid grid-cols-7 text-center text-sm">
          {DAYS_KR.map((day, i) => (
            <div
              key={day}
              className={`py-1 font-medium ${
                i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-600'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {weeks.flat().map((date, idx) => {
            const isToday = date.getTime() === today.getTime();
            const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
            const dayIdx = idx % 7;
            const dateMissions = getMissionsForDate(date);
            const completedCount = dateMissions.filter((m) => m.status === 'completed').length;

            return (
              <div
                key={idx}
                className={`relative flex min-h-[60px] flex-col rounded p-1 ${
                  isToday
                    ? 'bg-ultrasonic-500 text-white'
                    : !isCurrentMonth
                      ? 'bg-gray-50'
                      : 'border border-gray-100 bg-white'
                }`}
              >
                <span
                  className={`text-sm ${
                    isToday
                      ? 'font-bold text-white'
                      : !isCurrentMonth
                        ? 'text-gray-300'
                        : dayIdx === 0
                          ? 'text-red-500'
                          : dayIdx === 6
                            ? 'text-blue-500'
                            : 'text-gray-700'
                  }`}
                >
                  {date.getDate()}
                </span>

                {dateMissions.length > 0 && isCurrentMonth && (
                  <div className="mt-0.5 flex flex-wrap gap-0.5">
                    {dateMissions.slice(0, 4).map((mission) => {
                      const color = SUBJECT_COLORS[mission.subject] || '#6b7280';
                      return (
                        <div
                          key={mission.id}
                          className={`h-1.5 w-1.5 rounded-full ${
                            mission.status === 'completed' ? 'opacity-50' : ''
                          }`}
                          style={{ backgroundColor: color }}
                          title={mission.title}
                        />
                      );
                    })}
                    {dateMissions.length > 4 && (
                      <span className={`text-[8px] ${isToday ? 'text-white' : 'text-gray-400'}`}>
                        +{dateMissions.length - 4}
                      </span>
                    )}
                  </div>
                )}

                {dateMissions.length > 0 && isCurrentMonth && (
                  <div
                    className={`mt-auto text-[9px] ${isToday ? 'text-white/80' : 'text-gray-400'}`}
                  >
                    {completedCount}/{dateMissions.length}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// 미션 목록 아이템 컴포넌트
// ============================================

function MissionItem({
  mission,
  onComplete,
  onComment,
}: {
  mission: DailyMission;
  onComplete: (id: number, progress: number) => void;
  onComment: (mission: DailyMission) => void;
}) {
  const isCompleted = mission.status === 'completed';
  const color = SUBJECT_COLORS[mission.subject] || '#6b7280';
  const [showVerification, setShowVerification] = useState(false);
  const [verificationSubmitted, setVerificationSubmitted] = useState(false);

  const handlePhotoUpload = () => {
    // Phase 1: 사진 선택 → 즉시 인증 완료 (AI stub)
    setVerificationSubmitted(true);
    setTimeout(() => setShowVerification(false), 1500);
  };

  return (
    <div
      className={`rounded-lg border p-3 transition-all ${
        isCompleted ? 'border-gray-200 bg-gray-50 opacity-60' : 'border-gray-200 hover:bg-gray-50'
      }`}
    >
      <div className="flex items-center gap-3">
        {/* 완료 체크 버튼 */}
        <button
          onClick={() => onComplete(mission.id, isCompleted ? 0 : 100)}
          className="flex-shrink-0"
        >
          {isCompleted ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <Circle className="h-5 w-5 text-gray-300 hover:text-gray-400" />
          )}
        </button>

        {/* 과목 색상 바 */}
        <div className="h-10 w-1 flex-shrink-0 rounded-full" style={{ backgroundColor: color }} />

        {/* 내용 */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className="rounded px-2 py-0.5 text-xs font-medium text-white"
              style={{ backgroundColor: color }}
            >
              {mission.subject}
            </span>
            {verificationSubmitted && (
              <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-600">
                <Camera className="h-3 w-3" /> 인증완료
              </span>
            )}
          </div>
          <p className={`mt-1 font-medium ${isCompleted ? 'text-gray-400 line-through' : ''}`}>
            {mission.title}
          </p>
          <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            <span>
              {mission.startTime} - {mission.endTime}
            </span>
            <span className="text-gray-300">|</span>
            <span>{mission.content}</span>
            {mission.weekNumber && (
              <>
                <span className="text-gray-300">|</span>
                <span className="text-blue-500">{mission.weekNumber}주차</span>
              </>
            )}
          </div>
        </div>

        {/* 진행률 + 인증 버튼 */}
        <div className="flex items-center gap-2">
          {isCompleted && !verificationSubmitted && (
            <button
              onClick={() => setShowVerification(!showVerification)}
              className="flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-600 transition-all hover:bg-indigo-100"
              title="사진 인증하기"
            >
              <Camera className="h-3.5 w-3.5" />
              인증
            </button>
          )}
          <div className="text-right">
            <div className="text-lg font-bold" style={{ color: isCompleted ? '#22c55e' : color }}>
              {mission.progress}%
            </div>
            <div className="text-xs text-gray-500">성취도</div>
            {mission.weeklyTarget && mission.weeklyTarget > 0 && (
              <div className="mt-1 text-[10px] text-blue-500">
                주간 {mission.amount}/{mission.weeklyTarget}
              </div>
            )}
          </div>
          {/* 코멘트 버튼 */}
          <button
            onClick={() => onComment(mission)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-indigo-50 hover:text-indigo-500"
            title="코멘트"
          >
            <MessageSquare className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 사진 인증 패널 */}
      {showVerification && (
        <div className="mt-3 rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-purple-50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-indigo-500" />
            <h4 className="text-sm font-semibold text-indigo-700">학습 인증 사진 업로드</h4>
          </div>
          <p className="mb-3 text-xs text-gray-500">학습한 교재 페이지를 촬영해서 업로드하세요.</p>
          <div className="flex gap-2">
            <label className="flex-1 cursor-pointer">
              <div className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-indigo-200 bg-white py-3 text-sm font-medium text-indigo-600 transition-all hover:border-indigo-400 hover:bg-indigo-50">
                <Camera className="h-4 w-4" />
                파일 선택
              </div>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </label>
            <button
              onClick={() => setShowVerification(false)}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-500 hover:bg-gray-50"
            >
              취소
            </button>
          </div>
          {verificationSubmitted && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-100 px-3 py-2 text-sm font-medium text-emerald-600">
              <CheckCircle className="h-4 w-4" /> 인증이 완료되었습니다!
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// 메인 페이지 컴포넌트
// ============================================

function MyMissionsPage() {
  const { data: missions, isLoading } = useGetDailyMissions();
  const completeMutation = useCompleteDailyMission();

  // 기간 선택 상태
  const [period, setPeriod] = useState<PeriodType>('weekly');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // 선택된 기간의 미션 필터링
  const filteredMissions = useMemo(() => {
    if (!missions) return [];

    switch (period) {
      case 'daily': {
        const dateStr = formatDateStr(selectedDate);
        return missions.filter((m) => m.date === dateStr);
      }
      case 'weekly': {
        const weekEndDate = getWeekEnd(weekStart);
        const startStr = formatDateStr(weekStart);
        const endStr = formatDateStr(weekEndDate);
        return missions.filter((m) => m.date >= startStr && m.date <= endStr);
      }
      case 'monthly': {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const monthStart = new Date(year, month, 1);
        const monthEnd = new Date(year, month + 1, 0);
        const startStr = formatDateStr(monthStart);
        const endStr = formatDateStr(monthEnd);
        return missions.filter((m) => m.date >= startStr && m.date <= endStr);
      }
    }
  }, [missions, period, selectedDate, weekStart, currentMonth]);

  // 통계 계산
  const stats = useMemo(() => {
    const total = filteredMissions.length;
    const completed = filteredMissions.filter((m) => m.status === 'completed').length;
    const avgProgress =
      total > 0 ? Math.round(filteredMissions.reduce((sum, m) => sum + m.progress, 0) / total) : 0;
    const totalAmount = filteredMissions.reduce((sum, m) => sum + m.amount, 0);

    return { total, completed, avgProgress, totalAmount };
  }, [filteredMissions]);

  const { guard, LoginGuardModal } = useLoginGuard();

  // 코멘트 다이얼로그 상태
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [commentTarget, setCommentTarget] = useState<DailyMission | null>(null);

  const handleComplete = (missionId: number, progress: number) => {
    guard(() => completeMutation.mutate({ missionId, progress }));
  };

  const handleComment = (mission: DailyMission) => {
    setCommentTarget(mission);
    setCommentDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-screen-xl px-4 py-6">
        <Skeleton className="mb-6 h-8 w-32" />
        <Skeleton className="mb-4 h-32 w-full rounded-xl" />
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-screen-xl px-4 py-6">
      {/* 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="rounded-lg p-2 hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">금일계획</h1>
            <p className="mt-1 text-gray-500">장기계획과 주간루틴에서 생성된 학습 미션</p>
          </div>
        </div>

        {/* 기간 선택 드롭다운 */}
        <div className="flex items-center gap-3">
          <div className="from-ultrasonic-500 to-ultrasonic-600 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg">
            <Calendar className="h-6 w-6 text-white" />
          </div>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as PeriodType)}
            className="hover:border-ultrasonic-400 focus:border-ultrasonic-500 focus:ring-ultrasonic-200 min-w-[120px] cursor-pointer rounded-lg border-2 border-gray-200 bg-white px-4 py-2.5 text-base font-bold text-gray-700 transition-all focus:outline-none focus:ring-2"
          >
            <option value="daily">📅 일간</option>
            <option value="weekly">📆 주간</option>
            <option value="monthly">🗓️ 월간</option>
          </select>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-blue-100 p-2">
              <Target className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{PERIOD_LABELS[period]} 미션</p>
              <p className="text-xl font-bold">{stats.total}개</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-green-100 p-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">완료</p>
              <p className="text-xl font-bold">{stats.completed}개</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-orange-100 p-2">
              <TrendingUp className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">평균 진행률</p>
              <p className="text-xl font-bold">{stats.avgProgress}%</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-purple-100 p-2">
              <BookOpen className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">총 분량</p>
              <p className="text-xl font-bold">{stats.totalAmount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 미션 요약 카드 */}
      <MissionSummaryCard missions={filteredMissions} period={period} />

      {/* 기간별 캘린더 */}
      {period === 'daily' && (
        <DailyCalendar
          missions={missions || []}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />
      )}
      {period === 'weekly' && (
        <WeeklyCalendar
          missions={missions || []}
          weekStart={weekStart}
          onWeekChange={setWeekStart}
        />
      )}
      {period === 'monthly' && (
        <MonthlyCalendar
          missions={missions || []}
          currentMonth={currentMonth}
          onMonthChange={setCurrentMonth}
        />
      )}

      {/* 미션 목록 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-lg">{PERIOD_LABELS[period]} 미션 목록</CardTitle>
          <span className="text-sm text-gray-500">
            {stats.completed}/{stats.total} 완료
          </span>
        </CardHeader>
        <CardContent>
          {filteredMissions.length > 0 ? (
            <div className="space-y-2">
              {filteredMissions
                .sort((a, b) => {
                  // 날짜순 > 시간순
                  if (a.date !== b.date) return a.date.localeCompare(b.date);
                  return a.startTime.localeCompare(b.startTime);
                })
                .map((mission) => (
                  <MissionItem
                    key={mission.id}
                    mission={mission}
                    onComplete={handleComplete}
                    onComment={handleComment}
                  />
                ))}
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">
              <Calendar className="mx-auto mb-3 h-12 w-12 text-gray-300" />
              <p>해당 기간에 미션이 없습니다</p>
              <div className="mt-4 flex justify-center gap-2">
                <Link to="/plans">
                  <Button variant="outline">장기 계획 추가</Button>
                </Link>
                <Link to="/routine">
                  <Button variant="outline">주간 루틴 설정</Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 전체 진행률 */}
      {stats.total > 0 && (
        <Card className="mt-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{PERIOD_LABELS[period]} 진행률</p>
                <p className="text-ultrasonic-600 mt-1 text-2xl font-bold">{stats.avgProgress}%</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">완료</p>
                <p className="mt-1 text-xl font-semibold">
                  <span className="text-green-600">{stats.completed}</span>
                  <span className="text-gray-400"> / {stats.total}</span>
                </p>
              </div>
            </div>
            <Progress
              value={stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}
              className="mt-3 h-2"
            />
          </CardContent>
        </Card>
      )}

      {LoginGuardModal}

      {/* 코멘트 다이얼로그 */}
      {commentTarget && (
        <CommentDialog
          open={commentDialogOpen}
          onOpenChange={setCommentDialogOpen}
          target={{
            studentId: 1,
            missionId: commentTarget.id,
            title: commentTarget.title,
            subject: commentTarget.subject,
          }}
        />
      )}
    </div>
  );
}
