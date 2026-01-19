/**
 * 주간 루틴 설정 페이지
 */

import { createLazyFileRoute, Link } from '@tanstack/react-router';
import { useState, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Plus, ArrowLeft, Loader2 } from 'lucide-react';
import {
  useGetRoutines,
  useCreateRoutine,
  useUpdateRoutine,
  useDeleteRoutine,
} from '@/stores/server/planner';
import type { Routine, RoutineMajorCategory, RoutineSubject } from '@/types/planner';
import {
  MAJOR_CATEGORY_LABELS,
  MAJOR_CATEGORY_COLORS,
  ROUTINE_SUBJECTS,
  SUBJECT_COLORS,
} from '@/types/planner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

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
      const duration = (endH * 60 + endM) - (startH * 60 + startM);
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

  const totalMinutes = summaryBySubject.reduce((sum, s) => sum + s.totalTime, 0);
  const totalSessions = summaryBySubject.reduce((sum, s) => sum + s.count, 0);

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

        {/* 과목별 루틴 목록 */}
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {summaryBySubject.map((summary) => {
            const color = SUBJECT_COLORS[summary.subject] || '#6b7280';
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

function WeeklyCalendar({ routines }: { routines: Routine[] }) {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const HOURS = Array.from({ length: 24 }, (_, i) => i);

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

  const getRoutinePosition = (routine: Routine) => {
    const startMinutes = timeToMinutes(routine.startTime);
    const endMinutes = timeToMinutes(routine.endTime);
    const top = (startMinutes / (24 * 60)) * 100;
    const height = ((endMinutes - startMinutes) / (24 * 60)) * 100;
    return { top, height: Math.max(height, 2) };
  };

  // 해당 주에 유효한 루틴인지 체크
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

  const getRoutinesForDay = (dayIndex: number) => {
    return routines.filter((r) => r.days[dayIndex] && isRoutineActiveInWeek(r));
  };

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const currentPosition = (currentMinutes / (24 * 60)) * 100;

  // 통계 계산
  const stats = useMemo(() => {
    const activeRoutines = routines.filter((r) => isRoutineActiveInWeek(r));

    // 대분류별 시간
    const byMajorCategory: Record<RoutineMajorCategory, number> = {
      class: 0,
      self_study: 0,
      exercise: 0,
      schedule: 0,
    };

    // 수업 과목별 시간
    const classSubjects: Record<string, number> = {};
    // 자습 과목별 시간
    const selfStudySubjects: Record<string, number> = {};
    // 수업+자습 과목별 시간
    const studySubjects: Record<string, number> = {};

    activeRoutines.forEach((routine) => {
      const duration = timeToMinutes(routine.endTime) - timeToMinutes(routine.startTime);
      const activeDays = routine.days.filter(Boolean).length;
      const weeklyMinutes = duration * activeDays;

      byMajorCategory[routine.majorCategory] += weeklyMinutes;

      if (routine.majorCategory === 'class' && routine.subject) {
        classSubjects[routine.subject] = (classSubjects[routine.subject] || 0) + weeklyMinutes;
        studySubjects[routine.subject] = (studySubjects[routine.subject] || 0) + weeklyMinutes;
      }

      if (routine.majorCategory === 'self_study' && routine.subject) {
        selfStudySubjects[routine.subject] =
          (selfStudySubjects[routine.subject] || 0) + weeklyMinutes;
        studySubjects[routine.subject] = (studySubjects[routine.subject] || 0) + weeklyMinutes;
      }
    });

    return { byMajorCategory, classSubjects, selfStudySubjects, studySubjects };
  }, [routines, isRoutineActiveInWeek]);

  // 원형 차트 데이터 변환
  const getSubjectPieData = (subjects: Record<string, number>): PieChartData[] => {
    return Object.entries(subjects).map(([label, value]) => ({
      label,
      value,
      color: SUBJECT_COLORS[label] || '#6b7280',
    }));
  };

  const majorCategoryPieData: PieChartData[] = Object.entries(stats.byMajorCategory).map(
    ([key, value]) => ({
      label: MAJOR_CATEGORY_LABELS[key as RoutineMajorCategory],
      value,
      color:
        key === 'class'
          ? '#3b82f6'
          : key === 'self_study'
            ? '#f97316'
            : key === 'exercise'
              ? '#22c55e'
              : '#64748b',
    }),
  );

  return (
    <>
      {/* 주간 루틴 요약 (캘린더 상단) */}
      <WeeklyRoutineSummaryCard routines={routines} weekStart={weekStart} weekEnd={weekEnd} />

      <Card className="mb-6">
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

          {/* 주간 타임라인 */}
        <div className="flex">
          {/* 시간 라벨 (왼쪽) */}
          <div className="w-10 flex-shrink-0">
            <div className="h-12" />
            <div className="relative h-[480px]">
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

          {/* 요일 컬럼들 */}
          <div className="grid flex-1 grid-cols-7 gap-0.5">
            {/* 요일 헤더 */}
            {weekDays.map((date, idx) => {
              const isToday = date.getTime() === today.getTime();
              return (
                <div
                  key={`header-${idx}`}
                  className={`flex h-12 flex-col items-center justify-center rounded-t-lg ${
                    isToday ? 'bg-ultrasonic-500 text-white' : 'bg-gray-100'
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
                  <span className={`text-sm font-bold ${isToday ? 'text-white' : 'text-gray-900'}`}>
                    {date.getDate()}
                  </span>
                </div>
              );
            })}

            {/* 타임라인 그리드 */}
            {weekDays.map((date, dayIdx) => {
              const isToday = date.getTime() === today.getTime();
              const dayRoutines = getRoutinesForDay(dayIdx);

              return (
                <div
                  key={`timeline-${dayIdx}`}
                  className={`relative h-[480px] border-l border-gray-200 ${
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

                  {isToday && (
                    <div
                      className="bg-ultrasonic-500 absolute left-0 right-0 z-10 h-0.5"
                      style={{ top: `${currentPosition}%` }}
                    >
                      <div className="bg-ultrasonic-500 absolute -left-1 -top-1 h-2.5 w-2.5 rounded-full" />
                    </div>
                  )}

                  {dayRoutines.map((routine) => {
                    const pos = getRoutinePosition(routine);
                    const colors = MAJOR_CATEGORY_COLORS[routine.majorCategory];
                    return (
                      <div
                        key={routine.id}
                        className={`absolute left-0.5 right-0.5 overflow-hidden rounded border-l-2 px-1 text-xs text-white ${colors.bg} ${colors.border}`}
                        style={{
                          top: `${pos.top}%`,
                          height: `${pos.height}%`,
                          minHeight: '20px',
                        }}
                        title={`${routine.title} (${routine.startTime}~${routine.endTime})`}
                      >
                        <div className="truncate font-medium">{routine.title}</div>
                        {pos.height > 4 && (
                          <div className="text-[10px] opacity-80">{routine.startTime}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* 시간 라벨 (오른쪽) */}
          <div className="w-10 flex-shrink-0">
            <div className="h-12" />
            <div className="relative h-[480px]">
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

        {/* 범례 */}
        <div className="mt-4 flex flex-wrap items-center gap-4 border-t pt-3">
          {Object.entries(MAJOR_CATEGORY_LABELS).map(([key, label]) => (
            <div key={key} className="flex items-center gap-1.5 text-xs text-gray-600">
              <div
                className={`h-3 w-3 rounded ${MAJOR_CATEGORY_COLORS[key as RoutineMajorCategory].bg}`}
              />
              <span>{label}</span>
            </div>
          ))}
        </div>

        {/* 주간 통계 - 원형 차트 */}
        <div className="mt-6 border-t pt-4">
          <h4 className="mb-4 text-center font-semibold text-gray-700">주간 시간 통계</h4>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <PieChart data={majorCategoryPieData} title="대분류별" />
            <PieChart data={getSubjectPieData(stats.classSubjects)} title="수업 (과목별)" />
            <PieChart data={getSubjectPieData(stats.selfStudySubjects)} title="자습 (과목별)" />
            <PieChart data={getSubjectPieData(stats.studySubjects)} title="수업+자습 (과목별)" />
          </div>
        </div>
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
  const defaultStartDate = formatDateStr(getWeekStart(new Date()));
  const defaultEndDate = formatDateStr(new Date(new Date().setMonth(new Date().getMonth() + 3)));

  const [formData, setFormData] = useState({
    title: routine?.title || '',
    majorCategory: routine?.majorCategory || ('self_study' as RoutineMajorCategory),
    subject: routine?.subject || ('' as RoutineSubject | ''),
    startTime: routine?.startTime || '09:00',
    endTime: routine?.endTime || '10:00',
    repeat: routine?.repeat ?? true,
    days: routine?.days || [false, true, true, true, true, true, false],
    startDate: routine?.startDate || defaultStartDate,
    endDate: routine?.endDate || defaultEndDate,
  });

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
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      subject: formData.subject as RoutineSubject | undefined,
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
  };

  const needsSubject =
    formData.majorCategory === 'class' || formData.majorCategory === 'self_study';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{routine ? '루틴 수정' : '새 루틴 추가'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 제목 */}
          <div>
            <Label htmlFor="title">루틴 이름</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="예: 아침 영단어"
              required
            />
          </div>

          {/* 기간 (주 단위) - 필수 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">시작 날짜</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="endDate">종료 날짜</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                required
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

          {/* 소분류 (과목) - 수업/자습일 때만 */}
          {needsSubject && (
            <div>
              <Label>소분류 (과목)</Label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {ROUTINE_SUBJECTS.map((subject) => (
                  <button
                    key={subject}
                    type="button"
                    onClick={() => setFormData({ ...formData, subject })}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      formData.subject === subject
                        ? 'bg-gray-800 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {subject}
                  </button>
                ))}
              </div>
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
// 메인 페이지 컴포넌트
// ============================================

function PlannerRoutinePage() {
  const { data: routines, isLoading } = useGetRoutines();
  const createMutation = useCreateRoutine();
  const updateMutation = useUpdateRoutine();
  const deleteMutation = useDeleteRoutine();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | undefined>();

  const handleCreate = () => {
    setEditingRoutine(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (routine: Routine) => {
    setEditingRoutine(routine);
    setIsFormOpen(true);
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
    if (confirm('정말 삭제하시겠습니까?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-screen-xl px-4 py-6">
        <Skeleton className="mb-6 h-8 w-32" />
        <Skeleton className="h-[600px] w-full rounded-xl" />
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
            <h1 className="text-2xl font-bold">주간 루틴</h1>
            <p className="mt-1 text-gray-500">반복되는 학습 루틴을 설정하세요</p>
          </div>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          루틴 추가
        </Button>
      </div>

      {/* 주간 캘린더 */}
      <WeeklyCalendar routines={routines || []} />

      {/* 루틴 목록 */}
      <div className="space-y-3">
        {routines && routines.length > 0 ? (
          routines.map((routine) => {
            const colors = MAJOR_CATEGORY_COLORS[routine.majorCategory];
            return (
              <Card key={routine.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-1 rounded-full ${colors.bg}`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded px-2 py-0.5 text-xs font-medium ${colors.bg} text-white`}
                        >
                          {MAJOR_CATEGORY_LABELS[routine.majorCategory]}
                        </span>
                        {routine.subject && (
                          <span className="rounded bg-gray-200 px-2 py-0.5 text-xs text-gray-600">
                            {routine.subject}
                          </span>
                        )}
                      </div>
                      <h3 className="mt-1 font-semibold">{routine.title}</h3>
                      <p className="text-sm text-gray-500">
                        {routine.startTime} ~ {routine.endTime}
                      </p>
                      <p className="text-xs text-gray-400">
                        {routine.startDate} ~ {routine.endDate}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex gap-1">
                      {DAYS_KR.map((day, idx) => (
                        <span
                          key={day}
                          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                            routine.days[idx]
                              ? 'bg-ultrasonic-500 text-white'
                              : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          {day}
                        </span>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(routine)}>
                        수정
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDelete(routine.id)}
                      >
                        삭제
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="mb-4 text-gray-500">등록된 루틴이 없습니다.</p>
              <Button onClick={handleCreate}>첫 루틴 추가하기</Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 폼 다이얼로그 */}
      <RoutineFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        routine={editingRoutine}
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
