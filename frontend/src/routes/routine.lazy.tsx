/**
 * 주간 루틴 설정 페이지
 */

import { createLazyFileRoute, Link } from '@tanstack/react-router';
import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Loader2,
  MessageSquare,
  Calendar,
  BookOpen,
  Target,
  Sparkles,
  BarChart3,
  Pencil,
  Trash2,
} from 'lucide-react';
import { useLoginGuard } from '@/hooks/useLoginGuard';
import {
  useGetRoutines,
  useCreateRoutine,
  useUpdateRoutine,
  useDeleteRoutine,
  useGetSubjects,
  useGetPlans,
} from '@/stores/server/planner';
import {
  useGetDayTimetable,
  PERIOD_TIMES,
  useGetLinkedSchool,
  useGetSchoolEvents,
  type SchoolEvent,
} from '@/stores/server/planner/school-schedule';
import { useSchoolDisplayPrefs } from '@/stores/client';
import { env } from '@/lib/config/env';
import type { Routine, RoutineMajorCategory, LongTermPlan } from '@/types/planner';
import { MAJOR_CATEGORY_LABELS, MAJOR_CATEGORY_COLORS, getSubjectColor } from '@/types/planner';
import { Button } from 'geobuk-shared/ui';
import { Card, CardContent } from 'geobuk-shared/ui';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from 'geobuk-shared/ui';
import { Input } from 'geobuk-shared/ui';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { CommentDialog } from '@/components/planner/CommentDialog';

export const Route = createLazyFileRoute('/routine')({
  component: PlannerRoutinePage,
});

// ============================================
// 상수
// ============================================

const DAYS_KR = ['일', '월', '화', '수', '목', '금', '토'];

// 주 시작일 계산 (월요일 기준)
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// 날짜를 YYYY-MM-DD 형식으로
function formatDateStr(date: Date): string {
  return date.toISOString().split('T')[0];
}

// ============================================
// 원형 차트 컴포넌트
// ============================================

interface PieChartData {
  label: string;
  value: number;
  color: string;
}

function PieChart({
  data,
  title,
  size = 120,
}: {
  data: PieChartData[];
  title: string;
  size?: number;
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) {
    return (
      <div className="flex flex-col items-center">
        <div
          className="flex items-center justify-center rounded-full bg-gray-100 text-xs text-gray-400"
          style={{ width: size, height: size }}
        >
          데이터 없음
        </div>
        <p className="mt-2 text-sm font-medium text-gray-700">{title}</p>
      </div>
    );
  }

  let currentAngle = 0;
  const paths = data
    .filter((d) => d.value > 0)
    .map((d) => {
      const angle = (d.value / total) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle = endAngle;

      const startRad = ((startAngle - 90) * Math.PI) / 180;
      const endRad = ((endAngle - 90) * Math.PI) / 180;

      const x1 = 50 + 45 * Math.cos(startRad);
      const y1 = 50 + 45 * Math.sin(startRad);
      const x2 = 50 + 45 * Math.cos(endRad);
      const y2 = 50 + 45 * Math.sin(endRad);

      const largeArc = angle > 180 ? 1 : 0;

      return {
        ...d,
        path:
          angle >= 360
            ? `M 50 5 A 45 45 0 1 1 49.99 5 A 45 45 0 1 1 50 5`
            : `M 50 50 L ${x1} ${y1} A 45 45 0 ${largeArc} 1 ${x2} ${y2} Z`,
        percentage: Math.round((d.value / total) * 100),
      };
    });

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox="0 0 100 100">
        {paths.map((p, i) => (
          <path key={i} d={p.path} fill={p.color} stroke="white" strokeWidth="1" />
        ))}
        <circle cx="50" cy="50" r="25" fill="white" />
        <text x="50" y="54" textAnchor="middle" className="fill-gray-700 text-[10px] font-bold">
          {Math.round(total / 60)}h
        </text>
      </svg>
      <p className="mt-2 text-sm font-medium text-gray-700">{title}</p>
      <div className="mt-1 flex flex-wrap justify-center gap-1">
        {paths.map((p, i) => (
          <div key={i} className="flex items-center gap-1 text-[10px]">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span>
              {p.label} {p.percentage}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// 주간 루틴 요약 카드 컴포넌트 (캘린더 상단)
// ============================================

interface RoutineSummary {
  subject: string;
  category: RoutineMajorCategory;
  count: number;
  totalTime: number; // 분
  titles: string[];
}

function WeeklyRoutineSummaryCard({
  routines,
  weekStart,
  weekEnd,
}: {
  routines: Routine[];
  weekStart: Date;
  weekEnd: Date;
}) {
  // 해당 주에 유효한 루틴 필터링 + 과목별로 그룹화
  const summaryBySubject = useMemo(() => {
    const map = new Map<string, RoutineSummary>();

    routines.forEach((routine) => {
      // 루틴 기간 체크
      if (routine.startDate && routine.endDate) {
        const routineStart = new Date(routine.startDate);
        const routineEnd = new Date(routine.endDate);
        routineStart.setHours(0, 0, 0, 0);
        routineEnd.setHours(23, 59, 59, 999);
        if (weekStart > routineEnd || weekEnd < routineStart) return;
      }

      // 학습 관련 루틴만 (수업, 자습)
      if (routine.majorCategory !== 'class' && routine.majorCategory !== 'self_study') return;

      const subject = routine.subject || '기타';
      const existing = map.get(subject) || {
        subject,
        category: routine.majorCategory,
        count: 0,
        totalTime: 0,
        titles: [],
      };

      const [startH, startM] = routine.startTime.split(':').map(Number);
      const [endH, endM] = routine.endTime.split(':').map(Number);
      const duration = endH * 60 + endM - (startH * 60 + startM);
      const activeDays = routine.days.filter(Boolean).length;

      existing.count += activeDays;
      existing.totalTime += duration * activeDays;
      if (existing.titles.length < 2) {
        existing.titles.push(routine.title);
      }

      map.set(subject, existing);
    });

    return Array.from(map.values()).sort((a, b) => b.totalTime - a.totalTime);
  }, [routines, weekStart, weekEnd]);

  // 수업/자습/전체 과목별 시간 통계
  const subjectStats = useMemo(() => {
    const classSubjects: Record<string, number> = {};
    const selfStudySubjects: Record<string, number> = {};
    const combinedSubjects: Record<string, number> = {};

    routines.forEach((routine) => {
      // 기간 체크
      if (routine.startDate && routine.endDate) {
        const routineStart = new Date(routine.startDate);
        const routineEnd = new Date(routine.endDate);
        routineStart.setHours(0, 0, 0, 0);
        routineEnd.setHours(23, 59, 59, 999);
        if (weekStart > routineEnd || weekEnd < routineStart) return;
      }

      if (routine.majorCategory !== 'class' && routine.majorCategory !== 'self_study') return;
      if (!routine.subject) return;

      const [startH, startM] = routine.startTime.split(':').map(Number);
      const [endH, endM] = routine.endTime.split(':').map(Number);
      const duration = endH * 60 + endM - (startH * 60 + startM);
      const activeDays = routine.days.filter(Boolean).length;
      const weeklyMinutes = duration * activeDays;

      if (routine.majorCategory === 'class') {
        classSubjects[routine.subject] = (classSubjects[routine.subject] || 0) + weeklyMinutes;
      } else {
        selfStudySubjects[routine.subject] =
          (selfStudySubjects[routine.subject] || 0) + weeklyMinutes;
      }
      combinedSubjects[routine.subject] = (combinedSubjects[routine.subject] || 0) + weeklyMinutes;
    });

    return { classSubjects, selfStudySubjects, combinedSubjects };
  }, [routines, weekStart, weekEnd]);

  const getSubjectPieData = (subjects: Record<string, number>): PieChartData[] => {
    return Object.entries(subjects).map(([label, value]) => ({
      label,
      value,
      color: getSubjectColor(label),
    }));
  };

  const totalMinutes = summaryBySubject.reduce((sum, s) => sum + s.totalTime, 0);
  const totalSessions = summaryBySubject.reduce((sum, s) => sum + s.count, 0);

  // 수업 / 자습 총 시간
  const classTotal = Object.values(subjectStats.classSubjects).reduce((sum, v) => sum + v, 0);
  const selfStudyTotal = Object.values(subjectStats.selfStudySubjects).reduce(
    (sum, v) => sum + v,
    0,
  );

  if (totalSessions === 0) {
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
          <h3 className="font-semibold text-gray-800">주간 학습 요약</h3>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-500">
              총 <span className="font-semibold text-gray-700">{totalSessions}</span>회
            </span>
            <span className="text-blue-600">
              학습 <span className="font-semibold">{formatTime(totalMinutes)}</span>
            </span>
          </div>
        </div>

        {/* 수업/자습 총 시간 요약 바 */}
        <div className="mb-4 rounded-lg bg-gradient-to-r from-blue-50 to-orange-50 p-3">
          <div className="flex items-center justify-center gap-6">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-blue-500" />
              <span className="text-sm font-medium text-blue-700">
                수업 {formatTime(classTotal)}
              </span>
            </div>
            <div className="text-gray-300">|</div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-orange-500" />
              <span className="text-sm font-medium text-orange-700">
                자습 {formatTime(selfStudyTotal)}
              </span>
            </div>
          </div>
          {totalMinutes > 0 && (
            <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-gray-200">
              <div
                className="bg-blue-500 transition-all"
                style={{ width: `${(classTotal / totalMinutes) * 100}%` }}
              />
              <div
                className="bg-orange-500 transition-all"
                style={{ width: `${(selfStudyTotal / totalMinutes) * 100}%` }}
              />
            </div>
          )}
        </div>

        {/* 과목별 원형 차트 */}
        <div className="mb-4 rounded-lg border border-gray-100 bg-gray-50 p-4">
          <h4 className="mb-3 text-center text-sm font-semibold text-gray-600">과목별 시간 비중</h4>
          <div className="grid grid-cols-3 gap-4">
            <PieChart
              data={getSubjectPieData(subjectStats.classSubjects)}
              title="수업시간"
              size={110}
            />
            <PieChart
              data={getSubjectPieData(subjectStats.selfStudySubjects)}
              title="자습시간"
              size={110}
            />
            <PieChart
              data={getSubjectPieData(subjectStats.combinedSubjects)}
              title="전체 학습"
              size={110}
            />
          </div>
        </div>

        {/* 과목별 루틴 목록 */}
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {summaryBySubject.map((summary) => {
            const color = getSubjectColor(summary.subject);
            const categoryLabel = summary.category === 'class' ? '수업' : '자습';

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
                  {/* 과목명 */}
                  <div className="flex items-center gap-2">
                    <span
                      className="rounded px-2 py-0.5 text-xs font-medium text-white"
                      style={{ backgroundColor: color }}
                    >
                      {summary.subject}
                    </span>
                    <span className="text-xs text-gray-400">{categoryLabel}</span>
                  </div>

                  {/* 루틴 제목들 */}
                  <div className="mt-1.5 space-y-0.5">
                    {summary.titles.map((title, idx) => (
                      <p key={idx} className="truncate text-xs text-gray-600">
                        • {title}
                      </p>
                    ))}
                  </div>

                  {/* 학습 시간 */}
                  <p className="mt-1 text-[10px] text-gray-400">
                    주 {summary.count}회 · {formatTime(summary.totalTime)}
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
// 주간 캘린더 컴포넌트
// ============================================

// 주간 시간표: 각 요일 날짜로 5개 쿼리 (월~금)
function useTimetableForWeek(weekDays: Date[]) {
  const weekdayDates = weekDays
    .filter((d) => d.getDay() >= 1 && d.getDay() <= 5)
    .map((d) => d.toISOString().split('T')[0]);

  const mon = useGetDayTimetable(weekdayDates[0] ?? '');
  const tue = useGetDayTimetable(weekdayDates[1] ?? '');
  const wed = useGetDayTimetable(weekdayDates[2] ?? '');
  const thu = useGetDayTimetable(weekdayDates[3] ?? '');
  const fri = useGetDayTimetable(weekdayDates[4] ?? '');

  return [mon.data, tue.data, wed.data, thu.data, fri.data];
}

// 해당 주의 학교 행사 맵 반환 (날짜 → 행사 목록)
function useSchoolEventsForWeek(weekStart: Date, weekEnd: Date): Map<string, SchoolEvent[]> {
  const sy = weekStart.getFullYear();
  const sm = weekStart.getMonth() + 1;
  const ey = weekEnd.getFullYear();
  const em = weekEnd.getMonth() + 1;
  const r1 = useGetSchoolEvents(sy, sm);
  const r2 = useGetSchoolEvents(ey, em);
  return useMemo(() => {
    const all = [...(r1.data ?? []), ...(sm !== em ? (r2.data ?? []) : [])];
    const map = new Map<string, SchoolEvent[]>();
    all.forEach((e) => {
      const list = map.get(e.date) ?? [];
      map.set(e.date, [...list, e]);
    });
    return map;
  }, [r1.data, r2.data, sm, em]);
}

const MAJOR_COLOR_HEX: Record<string, string> = {
  class: '#3b82f6',
  self_study: '#f97316',
  exercise: '#22c55e',
  schedule: '#64748b',
};

function WeeklyCalendar({ routines }: { routines: Routine[] }) {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const { data: linkedSchool, isLoading: isSchoolLoading } = useGetLinkedSchool();
  const { showSchoolEvents, showSchoolTimetable, toggleEvents, toggleTimetable } =
    useSchoolDisplayPrefs();
  const scrollRef = useRef<HTMLDivElement>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const HOUR_PX = 60;
  const START_HOUR = 6;
  const END_HOUR = 24;
  const GRID_HEIGHT = (END_HOUR - START_HOUR) * HOUR_PX; // 1080px
  const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => i + START_HOUR);

  const toTopPx = (totalMinutes: number) =>
    Math.max(0, Math.min(totalMinutes, END_HOUR * 60) - START_HOUR * 60);

  const formatKoreanHour = (hour: number) => {
    if (hour === 0 || hour === 24) return '자정';
    if (hour < 12) return `오전 ${hour}시`;
    if (hour === 12) return '오후 12시';
    return `오후 ${hour - 12}시`;
  };

  const navigate = (direction: 'prev' | 'next') => {
    const newStart = new Date(weekStart);
    newStart.setDate(newStart.getDate() + (direction === 'next' ? 7 : -7));
    setWeekStart(newStart);
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

  const formatDate = (date: Date) => `${date.getMonth() + 1}월 ${date.getDate()}일`;

  const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const isRoutineActiveInWeek = useCallback(
    (routine: Routine) => {
      if (!routine.startDate || !routine.endDate) return true;
      const routineStart = new Date(routine.startDate);
      const routineEnd = new Date(routine.endDate);
      routineStart.setHours(0, 0, 0, 0);
      routineEnd.setHours(23, 59, 59, 999);
      return weekStart <= routineEnd && weekEnd >= routineStart;
    },
    [weekStart, weekEnd],
  );

  const getRoutinesForDay = (dayIndex: number) =>
    routines.filter((r) => r.days[dayIndex] && isRoutineActiveInWeek(r));

  const weekdayTimetables = useTimetableForWeek(weekDays);
  const schoolEventsMap = useSchoolEventsForWeek(weekStart, weekEnd);
  const getTimetableForDay = (dayIdx: number) => {
    if (dayIdx < 1 || dayIdx > 5) return [];
    return weekdayTimetables[dayIdx - 1] ?? [];
  };

  const now = new Date();
  const currentTopPx = toTopPx(now.getHours() * 60 + now.getMinutes());
  const isCurrentWeek = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d >= weekStart && d <= weekEnd;
  }, [weekStart, weekEnd]);

  useEffect(() => {
    if (scrollRef.current && isCurrentWeek) {
      scrollRef.current.scrollTop = Math.max(0, currentTopPx - 120);
    }
  }, [isCurrentWeek]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <WeeklyRoutineSummaryCard routines={routines} weekStart={weekStart} weekEnd={weekEnd} />

      <Card className="mb-6">
        <CardContent className="p-4">
          {/* 헤더 */}
          <div className="mb-3 flex items-center justify-between">
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

          {/* 캘린더 */}
          <div className="overflow-hidden rounded-lg border border-gray-200">
            {/* 요일 헤더 (고정) */}
            <div className="flex flex-shrink-0 border-b border-gray-200">
              <div className="w-14 flex-shrink-0 border-r border-gray-200 bg-white" />
              {weekDays.map((date, idx) => {
                const isToday = date.getTime() === today.getTime();
                const dayEvts =
                  linkedSchool && showSchoolEvents
                    ? (schoolEventsMap.get(formatDateStr(date)) ?? [])
                    : [];
                const nonHolidayEvts = dayEvts.filter((e) => !e.isHoliday);
                return (
                  <div
                    key={`header-${idx}`}
                    className={`flex flex-1 flex-col items-center justify-center border-l border-gray-200 py-2 ${
                      isToday ? 'bg-ultrasonic-500' : 'bg-gray-50'
                    }`}
                  >
                    <span
                      className={`text-xs font-medium ${
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
                    <span
                      className={`text-sm font-bold ${isToday ? 'text-white' : 'text-gray-900'}`}
                    >
                      {date.getDate()}
                    </span>
                    {nonHolidayEvts.length > 0 && (
                      <span
                        className={`mt-0.5 max-w-[90%] truncate rounded px-1 text-center text-[8px] font-semibold leading-tight ${isToday ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'}`}
                        title={nonHolidayEvts.map((e) => e.eventName).join(', ')}
                      >
                        {nonHolidayEvts[0].eventName}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 스크롤 타임라인 */}
            <div ref={scrollRef} className="overflow-y-auto" style={{ maxHeight: '560px' }}>
              <div className="flex" style={{ height: `${GRID_HEIGHT}px` }}>
                {/* 시간 레이블 열 */}
                <div className="relative w-14 flex-shrink-0 border-r border-gray-200 bg-white">
                  {HOURS.map((hour) => (
                    <div
                      key={hour}
                      className="absolute right-2 text-right text-[10px] leading-none text-gray-400"
                      style={{
                        top: `${(hour - START_HOUR) * HOUR_PX}px`,
                        transform: 'translateY(-50%)',
                      }}
                    >
                      {formatKoreanHour(hour)}
                    </div>
                  ))}
                </div>

                {/* 요일 컬럼들 */}
                {weekDays.map((date, dayIdx) => {
                  const isToday = date.getTime() === today.getTime();
                  const dayRoutines = getRoutinesForDay(dayIdx);
                  const dayTimetable = showSchoolTimetable ? getTimetableForDay(dayIdx) : [];
                  const isHoliday =
                    linkedSchool != null &&
                    showSchoolEvents &&
                    (schoolEventsMap.get(formatDateStr(date))?.some((e) => e.isHoliday) ?? false);

                  return (
                    <div
                      key={`col-${dayIdx}`}
                      className={`relative flex-1 border-l border-gray-200 ${
                        isToday ? 'bg-blue-50/20' : 'bg-white'
                      }`}
                    >
                      {/* 수평 시간선 */}
                      {HOURS.map((hour) => (
                        <div
                          key={hour}
                          className={`absolute left-0 right-0 border-t ${
                            hour % 2 === 0 ? 'border-gray-200' : 'border-gray-100'
                          }`}
                          style={{ top: `${(hour - START_HOUR) * HOUR_PX}px` }}
                        />
                      ))}

                      {/* 현재 시각선 */}
                      {isToday && isCurrentWeek && (
                        <div
                          className="pointer-events-none absolute left-0 right-0 z-20 flex items-center"
                          style={{ top: `${currentTopPx}px` }}
                        >
                          <div
                            className="h-2 w-2 flex-shrink-0 rounded-full bg-red-500"
                            style={{ marginLeft: '-4px' }}
                          />
                          <div className="h-px flex-1 bg-red-400" />
                        </div>
                      )}

                      {/* 방학 배경 */}
                      {isHoliday && (
                        <div className="pointer-events-none absolute inset-0 z-10 flex items-start justify-center bg-amber-50/40 pt-3">
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[8px] font-semibold text-amber-500">
                            {schoolEventsMap.get(formatDateStr(date))?.find((e) => e.isHoliday)
                              ?.eventName ?? '방학'}
                          </span>
                        </div>
                      )}

                      {/* 학교 행사 배너 (회색) */}
                      {!isHoliday &&
                        linkedSchool &&
                        showSchoolEvents &&
                        (() => {
                          const evts =
                            schoolEventsMap.get(formatDateStr(date))?.filter((e) => !e.isHoliday) ??
                            [];
                          return evts.length > 0 ? (
                            <div className="absolute left-0 right-0 top-0 z-10 border-b border-gray-200 bg-gray-100/90 px-0.5 py-0.5">
                              {evts.map((ev, i) => (
                                <div
                                  key={i}
                                  className="truncate text-[8px] font-medium text-gray-500"
                                  title={ev.eventName}
                                >
                                  {ev.eventName}
                                </div>
                              ))}
                            </div>
                          ) : null;
                        })()}

                      {/* 학교 시간표 블록 (회색) */}
                      {!isHoliday &&
                        dayTimetable
                          .sort((a, b) => Number(a.period) - Number(b.period))
                          .map((item) => {
                            const times = PERIOD_TIMES[item.period];
                            if (!times) return null;
                            const [sh, sMin] = times.start.split(':').map(Number);
                            const [eh, eMin] = times.end.split(':').map(Number);
                            const startM = sh * 60 + sMin;
                            const endM = eh * 60 + eMin;
                            const topPx = toTopPx(startM);
                            const heightPx = Math.max(endM - startM, 20);
                            return (
                              <div
                                key={`tt-${item.period}`}
                                className="absolute left-0.5 right-0.5 overflow-hidden rounded border-l-2 border-gray-300 bg-gray-100 px-1 py-0.5"
                                style={{ top: `${topPx}px`, height: `${heightPx}px` }}
                                title={`${item.period}교시 ${item.subject} (${times.start}~${times.end})`}
                              >
                                <div className="truncate text-[9px] font-semibold leading-tight text-gray-500">
                                  {item.subject}
                                </div>
                              </div>
                            );
                          })}

                      {/* 루틴 블록 (교과 색상) */}
                      {dayRoutines.map((routine) => {
                        const startM = timeToMinutes(routine.startTime);
                        const endM = timeToMinutes(routine.endTime);
                        const topPx = toTopPx(startM);
                        const heightPx = Math.max(
                          Math.min(END_HOUR * 60, endM) - Math.max(START_HOUR * 60, startM),
                          20,
                        );
                        const color = routine.subject
                          ? getSubjectColor(routine.subject)
                          : (MAJOR_COLOR_HEX[routine.majorCategory] ?? '#94a3b8');
                        return (
                          <div
                            key={routine.id}
                            className="absolute left-0.5 right-0.5 overflow-hidden rounded"
                            style={{
                              top: `${topPx}px`,
                              height: `${heightPx}px`,
                              backgroundColor: `${color}28`,
                              borderLeft: `3px solid ${color}`,
                            }}
                            title={`${routine.title} (${routine.startTime}~${routine.endTime})`}
                          >
                            <div
                              className="truncate px-1 pt-0.5 text-[10px] font-semibold leading-tight"
                              style={{ color }}
                            >
                              {routine.title}
                            </div>
                            {heightPx >= 32 && (
                              <div
                                className="px-1 text-[9px] leading-none"
                                style={{ color: `${color}99` }}
                              >
                                {routine.startTime}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 범례 */}
          <div className="mt-4 flex flex-wrap items-center gap-3 border-t pt-3">
            {Object.entries(MAJOR_CATEGORY_LABELS).map(([key, label]) => {
              const c = MAJOR_COLOR_HEX[key] ?? '#94a3b8';
              return (
                <div key={key} className="flex items-center gap-1.5 text-xs text-gray-600">
                  <div
                    className="h-3 w-3 rounded"
                    style={{ backgroundColor: `${c}44`, borderLeft: `3px solid ${c}` }}
                  />
                  <span>{label}</span>
                </div>
              );
            })}
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <div className="h-3 w-3 rounded border-l-2 border-gray-300 bg-gray-100" />
              <span>학교 시간표</span>
            </div>
            <div className="ml-auto">
              {isSchoolLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-300" />
              ) : linkedSchool ? (
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <span>🏫</span>
                  <span>{linkedSchool.schulName}</span>
                </span>
              ) : (
                <a
                  href={`${env.hubFrontUrl}/users/profile`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-600 hover:bg-sky-100"
                >
                  🏫 학교 연결하기
                </a>
              )}
            </div>
          </div>

          {linkedSchool && (
            <div className="mt-2 flex flex-wrap items-center gap-4 border-t pt-2 text-xs text-gray-500">
              <span className="font-semibold text-gray-600">표시 옵션</span>
              <label className="flex cursor-pointer select-none items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={showSchoolEvents}
                  onChange={toggleEvents}
                  className="h-3.5 w-3.5 rounded border-gray-300 text-indigo-500 focus:ring-indigo-300"
                />
                <span>🏫 학교 일정</span>
              </label>
              <label className="flex cursor-pointer select-none items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={showSchoolTimetable}
                  onChange={toggleTimetable}
                  className="h-3.5 w-3.5 rounded border-gray-300 text-sky-500 focus:ring-sky-300"
                />
                <span>📚 시간표</span>
              </label>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

// ============================================
// 루틴 폼 다이얼로그
// ============================================

interface RoutineFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  routine?: Routine;
  onSubmit: (data: Omit<Routine, 'id'>) => void;
  isLoading?: boolean;
}

function RoutineFormDialog({
  open,
  onOpenChange,
  routine,
  onSubmit,
  isLoading,
}: RoutineFormDialogProps) {
  const { data: subjectsData } = useGetSubjects();
  const { data: plans } = useGetPlans();
  const defaultStartDate = formatDateStr(getWeekStart(new Date()));
  const defaultEndDate = formatDateStr(new Date(new Date().setMonth(new Date().getMonth() + 3)));

  const [formData, setFormData] = useState({
    title: routine?.title || '',
    majorCategory: routine?.majorCategory || ('self_study' as RoutineMajorCategory),
    subject: routine?.subject || ('' as string),
    startTime: routine?.startTime || '09:00',
    endTime: routine?.endTime || '10:00',
    repeat: routine?.repeat ?? true,
    days: routine?.days || [false, true, true, true, true, true, false],
    startDate: routine?.startDate || defaultStartDate,
    endDate: routine?.endDate || defaultEndDate,
  });

  // 교과 선택 상태
  const [selectedKyokwa, setSelectedKyokwa] = useState<string>('');

  // 교과/과목 그룹
  const subjectGroups = subjectsData?.groups || [];
  const curriculumLabel = subjectsData?.curriculum === '2015' ? '2015 교육과정' : '2022 교육과정';

  // 선택된 교과의 과목 목록
  const selectedGroup = subjectGroups.find((g) => g.kyokwa === selectedKyokwa);
  const availableSubjects = selectedGroup?.subjects || [];

  // 진행 중인 장기계획 (새 루틴 생성 시만)
  const activePlans = useMemo(() => {
    if (routine || !plans) return [];
    const now = new Date();
    return plans.filter((p) => {
      if (!p.startDate || !p.endDate) return false;
      const end = new Date(p.endDate);
      end.setHours(23, 59, 59, 999);
      return end >= now;
    });
  }, [plans, routine]);

  // 미션 선택 시 폼 자동 채우기
  const handleSelectMission = (plan: LongTermPlan) => {
    const subject = plan.subject || '';
    // 교과 역추적
    const matchGroup = subjectGroups.find((g) =>
      g.subjects.some((s: any) => s.subjectName === subject),
    );
    if (matchGroup) setSelectedKyokwa(matchGroup.kyokwa);

    setFormData({
      ...formData,
      title: plan.title,
      majorCategory: 'self_study',
      subject,
      startDate: plan.startDate || defaultStartDate,
      endDate: plan.endDate || defaultEndDate,
    });
  };

  // 폼이 열릴 때 초기값 설정
  useState(() => {
    if (routine) {
      setFormData({
        title: routine.title,
        majorCategory: routine.majorCategory,
        subject: routine.subject || '',
        startTime: routine.startTime,
        endTime: routine.endTime,
        repeat: routine.repeat,
        days: routine.days,
        startDate: routine.startDate,
        endDate: routine.endDate,
      });
      // 기존 과목에서 교과 역추적
      if (routine.subject) {
        const matchGroup = subjectGroups.find((g) =>
          g.subjects.some((s) => s.subjectName === routine.subject),
        );
        if (matchGroup) setSelectedKyokwa(matchGroup.kyokwa);
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      subject: formData.subject || undefined,
    } as Omit<Routine, 'id'>);
  };

  const toggleDay = (index: number) => {
    const newDays = [...formData.days];
    newDays[index] = !newDays[index];
    setFormData({ ...formData, days: newDays });
  };

  // 대분류 변경 시 과목 초기화
  const handleMajorCategoryChange = (category: RoutineMajorCategory) => {
    setFormData({
      ...formData,
      majorCategory: category,
      subject: category === 'class' || category === 'self_study' ? formData.subject : '',
    });
    if (category !== 'class' && category !== 'self_study') {
      setSelectedKyokwa('');
    }
  };

  // 교과 변경 시 과목 초기화
  const handleKyokwaChange = (kyokwa: string) => {
    setSelectedKyokwa(kyokwa);
    setFormData({ ...formData, subject: '' });
  };

  const needsSubject =
    formData.majorCategory === 'class' || formData.majorCategory === 'self_study';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{routine ? '루틴 수정' : '새 루틴 추가'}</DialogTitle>
        </DialogHeader>

        {/* 주간 미션 리스트 — 새 루틴 생성 시만 */}
        {!routine && activePlans.length > 0 && (
          <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 p-3">
            <div className="mb-2 flex items-center gap-1.5">
              <Target className="h-4 w-4 text-indigo-500" />
              <span className="text-sm font-semibold text-indigo-700">주간 미션에서 선택</span>
            </div>
            <div className="max-h-36 space-y-1.5 overflow-y-auto">
              {activePlans.map((plan) => {
                const color = getSubjectColor(plan.subject || '기타');
                const isSelected =
                  formData.title === plan.title && formData.subject === plan.subject;
                const unitLabel = plan.type === 'lecture' ? '강' : 'p';
                const weeklyTarget = plan.weeklyTarget || 0;
                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => handleSelectMission(plan)}
                    className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors ${
                      isSelected
                        ? 'border border-indigo-300 bg-indigo-100 shadow-sm'
                        : 'border border-transparent bg-white hover:bg-indigo-50'
                    }`}
                  >
                    <div
                      className="h-6 w-1 flex-shrink-0 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-800">{plan.title}</p>
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <span
                          className="rounded px-1.5 py-0.5 text-[10px] font-medium text-white"
                          style={{ backgroundColor: color }}
                        >
                          {plan.subject || '미지정'}
                        </span>
                        {weeklyTarget > 0 && (
                          <span>
                            주 {weeklyTarget}
                            {unitLabel}
                          </span>
                        )}
                      </div>
                    </div>
                    {isSelected && <span className="text-xs font-semibold text-indigo-600">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 제목 */}
          <div>
            <Label htmlFor="title">주간 루틴 제목</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="예: 아침 영단어"
              required
            />
          </div>

          {/* 기간 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate" className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-blue-500" />
                <span>시작</span>
              </Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
                className="mt-1 cursor-pointer border-blue-200 text-sm font-medium text-gray-700 hover:border-blue-400 focus:border-blue-500 focus:ring-blue-200"
              />
            </div>
            <div>
              <Label htmlFor="endDate" className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-orange-500" />
                <span>종료</span>
              </Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                required
                className="mt-1 cursor-pointer border-orange-200 text-sm font-medium text-gray-700 hover:border-orange-400 focus:border-orange-500 focus:ring-orange-200"
              />
            </div>
          </div>

          {/* 대분류 */}
          <div>
            <Label>대분류</Label>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {(Object.entries(MAJOR_CATEGORY_LABELS) as [RoutineMajorCategory, string][]).map(
                ([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleMajorCategoryChange(key)}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      formData.majorCategory === key
                        ? `${MAJOR_CATEGORY_COLORS[key].bg} text-white`
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {label}
                  </button>
                ),
              )}
            </div>
          </div>

          {/* 교과 / 과목 선택 - 수업/자습일 때만 */}
          {needsSubject && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label>교과 / 과목</Label>
                <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                  {curriculumLabel}
                </span>
              </div>

              {/* 교과 선택 드롭다운 */}
              <div>
                <select
                  value={selectedKyokwa}
                  onChange={(e) => handleKyokwaChange(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 shadow-sm transition-colors hover:border-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="">교과를 선택하세요</option>
                  {subjectGroups.map((group) => (
                    <option key={group.kyokwaCode} value={group.kyokwa}>
                      {group.kyokwa}
                    </option>
                  ))}
                </select>
              </div>

              {/* 과목 선택 드롭다운 */}
              {selectedKyokwa && (
                <div>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 shadow-sm transition-colors hover:border-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="">과목을 선택하세요</option>
                    {availableSubjects.map((subj) => (
                      <option key={subj.id} value={subj.subjectName}>
                        {subj.subjectName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* 선택된 과목 표시 */}
              {formData.subject && (
                <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2">
                  <span className="text-xs text-blue-500">선택됨:</span>
                  <span className="text-sm font-medium text-blue-700">
                    {selectedKyokwa} &gt; {formData.subject}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* 시간 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startTime">시작 시간</Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="endTime">종료 시간</Label>
              <Input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                required
              />
            </div>
          </div>

          {/* 반복 요일 */}
          <div>
            <Label>반복 요일</Label>
            <div className="mt-2 flex justify-between">
              {DAYS_KR.map((day, idx) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(idx)}
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                    formData.days[idx]
                      ? 'bg-ultrasonic-500 text-white'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {routine ? '수정' : '추가'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 금주 미션 섹션 (장기계획 주간 할당)
// ============================================

function WeeklyMissionSection() {
  const { data: plans } = useGetPlans();
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));

  const weekEnd = useMemo(() => {
    const end = new Date(weekStart);
    end.setDate(weekStart.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return end;
  }, [weekStart]);

  const navigate = (direction: 'prev' | 'next') => {
    const newStart = new Date(weekStart);
    newStart.setDate(newStart.getDate() + (direction === 'next' ? 7 : -7));
    setWeekStart(newStart);
  };

  const formatDate = (date: Date) => `${date.getMonth() + 1}월 ${date.getDate()}일`;

  // 이번 주 범위표시
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isCurrentWeek = weekStart <= today && today <= weekEnd;

  // 해당 주에 진행 중인 장기계획 필터링 + 과목별 그룹화
  const missionGroups = useMemo(() => {
    if (!plans || plans.length === 0) return [];

    const activePlans = plans.filter((plan) => {
      if (!plan.startDate || !plan.endDate) return false;
      const planStart = new Date(plan.startDate);
      const planEnd = new Date(plan.endDate);
      planStart.setHours(0, 0, 0, 0);
      planEnd.setHours(23, 59, 59, 999);
      return weekStart <= planEnd && weekEnd >= planStart;
    });

    // 과목별 그룹화
    const groupMap = new Map<
      string,
      {
        subject: string;
        plans: (LongTermPlan & {
          weekNumber: number;
          totalWeeks: number;
          weeklyAmount: number;
          cumulativeTarget: number;
        })[];
        totalWeeklyAmount: number;
      }
    >();

    activePlans.forEach((plan) => {
      const subject = plan.subject || '기타';
      const planStart = new Date(plan.startDate!);
      planStart.setHours(0, 0, 0, 0);

      // 몇 주차인지 계산
      const daysSinceStart = Math.floor(
        (weekStart.getTime() - planStart.getTime()) / (1000 * 60 * 60 * 24),
      );
      const weekNumber = Math.max(1, Math.floor(daysSinceStart / 7) + 1);

      // 총 주 수 계산
      const planEnd = new Date(plan.endDate!);
      const totalDays =
        Math.floor((planEnd.getTime() - planStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const totalWeeks = Math.max(1, Math.ceil(totalDays / 7));

      // 주간 할당량
      const weeklyAmount = plan.weeklyTarget || Math.ceil((plan.totalAmount || 0) / totalWeeks);

      // 누적 목표
      const cumulativeTarget = Math.min(weeklyAmount * weekNumber, plan.totalAmount || 0);

      const existing = groupMap.get(subject) || { subject, plans: [], totalWeeklyAmount: 0 };
      existing.plans.push({ ...plan, weekNumber, totalWeeks, weeklyAmount, cumulativeTarget });
      existing.totalWeeklyAmount += weeklyAmount;
      groupMap.set(subject, existing);
    });

    return Array.from(groupMap.values()).sort((a, b) => b.totalWeeklyAmount - a.totalWeeklyAmount);
  }, [plans, weekStart, weekEnd]);

  const unitLabel = (plan: LongTermPlan) => (plan.type === 'lecture' ? '강' : 'p');

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        {/* 헤더 + 주 네비게이션 */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-indigo-500" />
            <h3 className="font-semibold text-gray-800">주간 미션</h3>
            {isCurrentWeek && (
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-600">
                금주
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('prev')} className="rounded-full p-1 hover:bg-gray-100">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium text-gray-600">
              {formatDate(weekStart)} ~ {formatDate(weekEnd)}
            </span>
            <button onClick={() => navigate('next')} className="rounded-full p-1 hover:bg-gray-100">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {missionGroups.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 py-8 text-center">
            <BookOpen className="mx-auto mb-2 h-8 w-8 text-gray-300" />
            <p className="text-sm text-gray-400">이 주에 해당하는 장기계획이 없습니다</p>
            <p className="mt-1 text-xs text-gray-300">장기계획 페이지에서 계획을 추가하세요</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="pb-2 pl-1 pr-3 text-left text-xs font-semibold text-gray-400">
                    과목
                  </th>
                  <th className="pb-2 pr-3 text-left text-xs font-semibold text-gray-400">
                    계획명
                  </th>
                  <th className="pb-2 pr-3 text-center text-xs font-semibold text-gray-400">
                    주차
                  </th>
                  <th className="pb-2 pr-3 text-center text-xs font-semibold text-gray-400">
                    이번 주
                  </th>
                  <th className="pb-2 text-right text-xs font-semibold text-gray-400">진행</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {missionGroups.flatMap((group) => {
                  const color = getSubjectColor(group.subject);
                  return group.plans.map((plan, idx) => {
                    const progress =
                      plan.totalAmount > 0
                        ? Math.round((plan.completedAmount / plan.totalAmount) * 100)
                        : 0;
                    return (
                      <tr key={plan.id} className="hover:bg-gray-50/60">
                        {idx === 0 && (
                          <td
                            rowSpan={group.plans.length}
                            className="py-2.5 pl-1 pr-3 align-middle"
                          >
                            <span
                              className="inline-block whitespace-nowrap rounded px-2 py-0.5 text-xs font-bold text-white"
                              style={{ backgroundColor: color }}
                            >
                              {group.subject}
                            </span>
                          </td>
                        )}
                        <td className="py-2.5 pr-3 font-medium text-gray-800">
                          <span className="line-clamp-1">{plan.title}</span>
                        </td>
                        <td className="py-2.5 pr-3 text-center text-xs text-gray-500">
                          <span className="font-semibold text-gray-700">{plan.weekNumber}</span>
                          <span className="text-gray-300">/{plan.totalWeeks}</span>주
                        </td>
                        <td className="py-2.5 pr-3 text-center">
                          <span className="font-semibold text-indigo-600">
                            {plan.weeklyAmount}
                            {unitLabel(plan)}
                          </span>
                        </td>
                        <td className="py-2.5">
                          <div className="flex items-center justify-end gap-2">
                            <div className="hidden h-1 w-14 overflow-hidden rounded-full bg-gray-100 sm:block">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${progress}%`, backgroundColor: color }}
                              />
                            </div>
                            <span className="w-8 text-right text-xs font-bold" style={{ color }}>
                              {progress}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  });
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// 메인 페이지 컴포넌트
// ============================================

function PlannerRoutinePage() {
  const { data: routines, isLoading } = useGetRoutines();
  const createMutation = useCreateRoutine();
  const updateMutation = useUpdateRoutine();
  const deleteMutation = useDeleteRoutine();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | undefined>();
  const { guard, LoginGuardModal } = useLoginGuard();

  // 루틴 목록 아코디언 상태 (기본: 모두 열림)
  const [openCategories, setOpenCategories] = useState<Set<string>>(
    () => new Set(Object.keys(MAJOR_CATEGORY_LABELS)),
  );
  const toggleCategory = useCallback(
    (key: string) =>
      setOpenCategories((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      }),
    [],
  );

  // 코멘트 다이얼로그 상태
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentTarget, setCommentTarget] = useState<Routine | null>(null);

  const handleCreate = () => {
    guard(() => {
      setEditingRoutine(undefined);
      setIsFormOpen(true);
    });
  };

  const handleEdit = (routine: Routine) => {
    guard(() => {
      setEditingRoutine(routine);
      setIsFormOpen(true);
    });
  };

  const handleSubmit = async (data: Omit<Routine, 'id'>) => {
    if (editingRoutine) {
      await updateMutation.mutateAsync({ ...data, id: editingRoutine.id } as Routine);
    } else {
      await createMutation.mutateAsync(data);
    }
    setIsFormOpen(false);
    setEditingRoutine(undefined);
  };

  const handleDelete = async (id: number) => {
    guard(() => {
      if (confirm('정말 삭제하시겠습니까?')) {
        deleteMutation.mutateAsync(id);
      }
    });
  };

  const handleComment = (routine: Routine) => {
    setCommentTarget(routine);
    setCommentOpen(true);
  };

  // 통계 계산 (hooks must be before any early return)
  const totalRoutines = routines?.length || 0;
  const studyRoutines =
    routines?.filter((r) => r.majorCategory === 'class' || r.majorCategory === 'self_study')
      .length || 0;
  const totalWeeklyHours = useMemo(() => {
    if (!routines) return 0;
    return routines.reduce((sum, r) => {
      const [sh, sm] = r.startTime.split(':').map(Number);
      const [eh, em] = r.endTime.split(':').map(Number);
      const dur = (eh * 60 + em - (sh * 60 + sm)) * r.days.filter(Boolean).length;
      return sum + dur;
    }, 0);
  }, [routines]);

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-screen-xl px-4 py-6">
        <Skeleton className="mb-6 h-8 w-32" />
        <Skeleton className="h-[600px] w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ═══════ 히어로 헤더 ═══════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-800 px-4 pb-20 pt-6 text-white md:pb-24 md:pt-8">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-indigo-400/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link to="/" className="rounded-full p-1.5 transition-colors hover:bg-white/10">
                <ChevronLeft className="h-5 w-5" />
              </Link>
              <h1 className="text-lg font-bold tracking-tight md:text-xl">주간 루틴</h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur-sm">
                <Sparkles className="h-3 w-3 text-yellow-300" />
                반복 학습
              </div>
            </div>
          </div>

          <div className="mb-4 text-center">
            <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">나의 주간 루틴</h2>
            <p className="mt-1 text-sm text-blue-200">반복되는 학습 일정을 관리하세요</p>
          </div>

          {/* 통계 3카드 */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-gradient-to-br from-blue-400 to-blue-500 p-3 text-center shadow-lg">
              <div className="text-lg font-extrabold text-white">{totalRoutines}</div>
              <div className="text-[10px] font-medium text-white/80">전체 루틴</div>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-500 p-3 text-center shadow-lg">
              <div className="text-lg font-extrabold text-white">{studyRoutines}</div>
              <div className="text-[10px] font-medium text-white/80">학습 루틴</div>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 p-3 text-center shadow-lg">
              <div className="text-lg font-extrabold text-white">
                {totalWeeklyHours > 0 ? `${Math.round(totalWeeklyHours / 60)}h` : '-'}
              </div>
              <div className="text-[10px] font-medium text-white/80">주간 학습</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ 캘린더 (max-w-4xl 중앙 정렬) ═══════ */}
      <div className="relative -mt-10 w-full px-4 pb-4">
        <WeeklyCalendar routines={routines || []} />
      </div>

      {/* ═══════ 주간 미션 ═══════ */}
      <div className="mx-auto w-full max-w-screen-xl px-4 pb-4">
        <WeeklyMissionSection />
      </div>

      {/* ═══════ 루틴 목록 (카테고리별 아코디언) ═══════ */}
      <div className="mx-auto w-full max-w-screen-xl px-4 pb-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-700">📋 루틴 목록</h3>
        </div>
        {routines && routines.length > 0 ? (
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            {(Object.entries(MAJOR_CATEGORY_LABELS) as [RoutineMajorCategory, string][]).map(
              ([key, label], sectionIdx) => {
                const categoryRoutines = routines.filter((r) => r.majorCategory === key);
                if (categoryRoutines.length === 0) return null;
                const colors = MAJOR_CATEGORY_COLORS[key];
                const isOpen = openCategories.has(key);
                return (
                  <div key={key} className={sectionIdx > 0 ? 'border-t border-gray-100' : ''}>
                    {/* 섹션 헤더 */}
                    <button
                      onClick={() => toggleCategory(key)}
                      className="flex w-full items-center gap-2.5 px-4 py-3 hover:bg-gray-50"
                    >
                      <span className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${colors.bg}`} />
                      <span className="text-sm font-semibold text-gray-700">{label}</span>
                      <span className="text-xs text-gray-400">{categoryRoutines.length}개</span>
                      <ChevronRight
                        className={`ml-auto h-4 w-4 text-gray-300 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
                      />
                    </button>
                    {/* 루틴 행 */}
                    {isOpen && (
                      <div className="border-t border-gray-50">
                        {categoryRoutines.map((routine) => {
                          const subjectColor = routine.subject
                            ? getSubjectColor(routine.subject)
                            : undefined;
                          const activeDays = DAYS_KR.filter((_, idx) => routine.days[idx]).join('');
                          return (
                            <div
                              key={routine.id}
                              className="group/row flex items-center gap-3 border-b border-gray-50 px-4 py-2.5 last:border-0 hover:bg-gray-50/70"
                            >
                              <span
                                className="h-2 w-2 flex-shrink-0 rounded-full"
                                style={{ backgroundColor: subjectColor ?? '#94a3b8' }}
                              />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-gray-800">
                                  {routine.title}
                                </p>
                                <div className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-400">
                                  {routine.subject && (
                                    <>
                                      <span style={{ color: subjectColor }} className="font-medium">
                                        {routine.subject}
                                      </span>
                                      <span>·</span>
                                    </>
                                  )}
                                  <span className="font-medium text-gray-500">
                                    {activeDays || '-'}
                                  </span>
                                  <span>·</span>
                                  <span>
                                    {routine.startTime}~{routine.endTime}
                                  </span>
                                </div>
                              </div>
                              <div className="flex flex-shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover/row:opacity-100">
                                <button
                                  onClick={() => handleComment(routine)}
                                  className="rounded p-1.5 text-gray-300 hover:bg-indigo-50 hover:text-indigo-500"
                                >
                                  <MessageSquare className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleEdit(routine)}
                                  className="rounded p-1.5 text-gray-300 hover:bg-gray-100 hover:text-gray-600"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(routine.id)}
                                  className="rounded p-1.5 text-gray-300 hover:bg-red-50 hover:text-red-500"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              },
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center rounded-2xl border border-gray-100 bg-white py-16 shadow-sm">
            <Calendar className="mb-3 h-12 w-12 text-gray-200" />
            <p className="mb-1 text-sm font-medium text-gray-500">2단계 · 주간루틴 만들기</p>
            <p className="mb-4 max-w-xs text-center text-xs text-gray-400">
              매주 반복할 공부 요일과 시간을 정하세요. 장기계획의 분량이 이 시간표에 맞춰 자동
              배분됩니다
            </p>
            <button
              onClick={handleCreate}
              className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-5 py-2 text-xs font-semibold text-indigo-600 transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <Plus className="h-3.5 w-3.5" />
              루틴 추가하기
            </button>
          </div>
        )}
      </div>

      {/* ═══════ 분석 ═══════ */}
      <div className="mx-auto w-full max-w-screen-xl px-4 pb-24">
        <div className="mb-3">
          <h3 className="text-sm font-bold text-gray-700">📊 분석</h3>
        </div>
        <div className="space-y-4">
          {routines && routines.length > 0 ? (
            <>
              {/* 카테고리별 분석 */}
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h4 className="mb-3 text-sm font-bold text-gray-700">카테고리별 루틴</h4>
                <div className="space-y-2.5">
                  {Object.entries(MAJOR_CATEGORY_LABELS).map(([key, label]) => {
                    const count = routines.filter((r) => r.majorCategory === key).length;
                    const maxCount = Math.max(
                      ...Object.keys(MAJOR_CATEGORY_LABELS).map(
                        (k) => routines.filter((r) => r.majorCategory === k).length,
                      ),
                      1,
                    );
                    const catColors = MAJOR_CATEGORY_COLORS[key as RoutineMajorCategory];
                    return (
                      <div key={key}>
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className={`inline-block h-2 w-2 rounded-full ${catColors.bg}`} />
                            <span className="font-medium text-gray-700">{label}</span>
                          </div>
                          <span className="font-bold text-gray-500">{count}개</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                          <div
                            className={`h-full rounded-full ${catColors.bg} transition-all duration-500`}
                            style={{ width: `${(count / maxCount) * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 요일별 분석 */}
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h4 className="mb-3 text-sm font-bold text-gray-700">📅 요일별 루틴 수</h4>
                <div className="grid grid-cols-7 gap-2">
                  {DAYS_KR.map((day, idx) => {
                    const count = routines.filter((r) => r.days[idx]).length;
                    return (
                      <div key={day} className="text-center">
                        <div
                          className={`mx-auto flex h-10 w-10 items-center justify-center rounded-xl ${count > 0 ? 'bg-indigo-50' : 'bg-gray-50'}`}
                        >
                          <span
                            className={`text-sm font-bold ${count > 0 ? 'text-indigo-600' : 'text-gray-300'}`}
                          >
                            {count}
                          </span>
                        </div>
                        <span className="mt-1 block text-[10px] font-medium text-gray-400">
                          {day}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 달성 요약 */}
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h4 className="mb-3 text-sm font-bold text-gray-700">🎯 요약</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-blue-50 p-3 text-center">
                    <div className="text-xl font-extrabold text-blue-600">{totalRoutines}</div>
                    <div className="text-[10px] font-medium text-blue-500">전체</div>
                  </div>
                  <div className="rounded-xl bg-emerald-50 p-3 text-center">
                    <div className="text-xl font-extrabold text-emerald-600">{studyRoutines}</div>
                    <div className="text-[10px] font-medium text-emerald-500">학습</div>
                  </div>
                  <div className="rounded-xl bg-amber-50 p-3 text-center">
                    <div className="text-xl font-extrabold text-amber-600">
                      {Math.round(totalWeeklyHours / 60)}
                    </div>
                    <div className="text-[10px] font-medium text-amber-500">주간 시간(h)</div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center rounded-2xl border border-gray-100 bg-white py-12 shadow-sm">
              <BarChart3 className="mb-3 h-10 w-10 text-gray-200" />
              <p className="text-sm text-gray-400">분석할 데이터가 없습니다</p>
            </div>
          )}
        </div>
      </div>

      {/* FAB */}
      <button
        onClick={handleCreate}
        aria-label="새 루틴 추가"
        className="fixed bottom-24 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-200 transition-all hover:scale-105 hover:shadow-xl active:scale-95 md:bottom-6 md:right-[calc(50%-28rem)]"
      >
        <Plus className="h-7 w-7" />
      </button>

      {/* 폼 다이얼로그 */}
      <RoutineFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        routine={editingRoutine}
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {LoginGuardModal}

      {/* 코멘트 다이얼로그 */}
      {commentTarget && (
        <CommentDialog
          open={commentOpen}
          onOpenChange={setCommentOpen}
          target={{
            studentId: 1,
            routineId: commentTarget.id,
            title: commentTarget.title,
            subject: commentTarget.subject,
          }}
        />
      )}
    </div>
  );
}
