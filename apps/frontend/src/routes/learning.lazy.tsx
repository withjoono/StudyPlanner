/**
 * 학습 현황 페이지
 */

import { createLazyFileRoute, Link } from '@tanstack/react-router';
import { useState, useMemo } from 'react';
import { ArrowLeft, TrendingUp, Target, BookOpen, Award, Clock, FileText } from 'lucide-react';
import {
  useGetPlannerItems,
  useGetWeeklyStudyProgress,
  useGetRank,
  useGetRoutines,
} from '@/stores/server/planner';
import type { PlannerItem } from '@/types/planner';
import { SUBJECT_COLORS } from '@/types/planner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

export const Route = createLazyFileRoute('/learning')({
  component: PlannerLearningPage,
});

// ============================================
// 상수
// ============================================

type PeriodType = 'daily' | 'weekly' | 'monthly';
type MetricType = 'time' | 'amount';

const PERIOD_LABELS: Record<PeriodType, string> = {
  daily: '일간',
  weekly: '주간',
  monthly: '월간',
};

const METRIC_LABELS: Record<MetricType, { label: string; icon: React.ReactNode }> = {
  time: { label: '학습시간', icon: <Clock className="h-4 w-4" /> },
  amount: { label: '분량', icon: <FileText className="h-4 w-4" /> },
};

const SUBJECT_COLOR_MAP: Record<string, { bg: string; text: string; light: string; hex: string }> =
  {
    국어: { bg: 'bg-red-500', text: 'text-red-600', light: 'bg-red-100', hex: '#ef4444' },
    수학: { bg: 'bg-yellow-500', text: 'text-yellow-600', light: 'bg-yellow-100', hex: '#eab308' },
    영어: { bg: 'bg-orange-500', text: 'text-orange-600', light: 'bg-orange-100', hex: '#f97316' },
    사회: { bg: 'bg-blue-500', text: 'text-blue-600', light: 'bg-blue-100', hex: '#3b82f6' },
    과학: { bg: 'bg-teal-500', text: 'text-teal-600', light: 'bg-teal-100', hex: '#14b8a6' },
    한국사: {
      bg: 'bg-purple-500',
      text: 'text-purple-600',
      light: 'bg-purple-100',
      hex: '#a855f7',
    },
    기타: { bg: 'bg-gray-500', text: 'text-gray-600', light: 'bg-gray-100', hex: '#6b7280' },
  };

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
  size = 160,
  unit = '',
}: {
  data: PieChartData[];
  title: string;
  size?: number;
  unit?: string;
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return (
      <div className="flex flex-col items-center">
        <div
          className="flex items-center justify-center rounded-full bg-gray-100 text-sm text-gray-400"
          style={{ width: size, height: size }}
        >
          데이터 없음
        </div>
        <p className="mt-3 text-sm font-semibold text-gray-700">{title}</p>
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

      const x1 = 50 + 40 * Math.cos(startRad);
      const y1 = 50 + 40 * Math.sin(startRad);
      const x2 = 50 + 40 * Math.cos(endRad);
      const y2 = 50 + 40 * Math.sin(endRad);

      const largeArc = angle > 180 ? 1 : 0;

      return {
        ...d,
        path:
          angle >= 360
            ? `M 50 10 A 40 40 0 1 1 49.99 10 A 40 40 0 1 1 50 10`
            : `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`,
        percentage: Math.round((d.value / total) * 100),
      };
    });

  // 중앙 텍스트 포맷
  const centerText = unit === '시간' ? `${Math.round(total)}h` : `${total}`;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox="0 0 100 100">
        {paths.map((p, i) => (
          <path key={i} d={p.path} fill={p.color} stroke="white" strokeWidth="1.5" />
        ))}
        <circle cx="50" cy="50" r="22" fill="white" />
        <text x="50" y="48" textAnchor="middle" className="fill-gray-600 text-[8px]">
          총 {unit}
        </text>
        <text x="50" y="58" textAnchor="middle" className="fill-gray-800 text-[11px] font-bold">
          {centerText}
        </text>
      </svg>
      <p className="mt-3 text-sm font-semibold text-gray-700">{title}</p>
      {/* 범례 */}
      <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
        {paths.map((p, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-gray-600">{p.label}</span>
            <span className="font-medium text-gray-800">{p.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// 기간 선택 탭 컴포넌트
// ============================================

function PeriodTabs({ value, onChange }: { value: PeriodType; onChange: (v: PeriodType) => void }) {
  return (
    <div className="flex rounded-lg bg-gray-100 p-1">
      {(Object.entries(PERIOD_LABELS) as [PeriodType, string][]).map(([key, label]) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            value === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// ============================================
// 메트릭 선택 탭 컴포넌트
// ============================================

function MetricTabs({ value, onChange }: { value: MetricType; onChange: (v: MetricType) => void }) {
  return (
    <div className="flex gap-2">
      {(
        Object.entries(METRIC_LABELS) as [MetricType, { label: string; icon: React.ReactNode }][]
      ).map(([key, { label, icon }]) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
            value === key
              ? 'border-ultrasonic-500 bg-ultrasonic-50 text-ultrasonic-600'
              : 'border-gray-200 text-gray-500 hover:border-gray-300'
          }`}
        >
          {icon}
          {label}
        </button>
      ))}
    </div>
  );
}

// ============================================
// 과목별 성취도 바 컴포넌트
// ============================================

function SubjectProgressBar({ subject, items }: { subject: string; items: PlannerItem[] }) {
  const colors = SUBJECT_COLOR_MAP[subject] || SUBJECT_COLOR_MAP['기타'];

  const subjectItems = items.filter((i) => i.subject === subject);
  const completedCount = subjectItems.filter((i) => i.progress >= 100).length;
  const avgProgress =
    subjectItems.length > 0
      ? Math.round(
          subjectItems.reduce((sum, i) => sum + (i.progress || 0), 0) / subjectItems.length,
        )
      : 0;

  return (
    <div className="flex items-center gap-4 rounded-lg bg-gray-50 p-4">
      <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${colors.light}`}>
        <BookOpen className={`h-6 w-6 ${colors.text}`} />
      </div>
      <div className="flex-1">
        <div className="mb-1 flex items-center justify-between">
          <span className="font-medium">{subject}</span>
          <span className={`text-sm font-medium ${colors.text}`}>{avgProgress}%</span>
        </div>
        <Progress value={avgProgress} className="h-2" />
        <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
          <span>
            완료: {completedCount}/{subjectItems.length}
          </span>
          <span>총 {subjectItems.length}개 학습</span>
        </div>
      </div>
    </div>
  );
}

// ============================================
// 최근 학습 아이템 컴포넌트
// ============================================

function RecentLearningItem({ item }: { item: PlannerItem }) {
  const colors = SUBJECT_COLOR_MAP[item.subject ?? ''] || SUBJECT_COLOR_MAP['기타'];
  const isCompleted = item.progress >= 100;

  return (
    <div className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-gray-50">
      <div className={`h-2 w-2 rounded-full ${colors.bg}`} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={`rounded px-2 py-0.5 text-xs font-medium text-white ${colors.bg}`}>
            {item.subject}
          </span>
          {isCompleted && (
            <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-600">
              완료
            </span>
          )}
        </div>
        <p className="mt-1 truncate font-medium">{item.title}</p>
      </div>
      <div className={`text-lg font-bold ${isCompleted ? 'text-green-500' : colors.text}`}>
        {item.progress || 0}%
      </div>
    </div>
  );
}

// ============================================
// 메인 페이지 컴포넌트
// ============================================

function PlannerLearningPage() {
  const { data: allItems, isLoading: isItemsLoading } = useGetPlannerItems();
  const { isLoading: isProgressLoading } = useGetWeeklyStudyProgress();
  const { data: rank, isLoading: isRankLoading } = useGetRank('W');
  const { data: routines, isLoading: isRoutinesLoading } = useGetRoutines();

  const [period, setPeriod] = useState<PeriodType>('weekly');
  const [metric, setMetric] = useState<MetricType>('time');

  // 학습 아이템만 필터링
  const studyItems = useMemo(() => {
    if (!allItems) return [];
    return allItems.filter((item) => item.primaryType === '학습');
  }, [allItems]);

  // 과목별 그룹화
  const subjects = useMemo(() => {
    const subjectSet = new Set(studyItems.map((i) => i.subject).filter(Boolean));
    return Array.from(subjectSet) as string[];
  }, [studyItems]);

  // 통계 계산
  const stats = useMemo(() => {
    if (!studyItems.length) return { total: 0, completed: 0, avgProgress: 0 };

    const completed = studyItems.filter((i) => i.progress >= 100).length;
    const avgProgress = Math.round(
      studyItems.reduce((sum, i) => sum + (i.progress || 0), 0) / studyItems.length,
    );

    return { total: studyItems.length, completed, avgProgress };
  }, [studyItems]);

  // 최근 학습 (최신 10개)
  const recentItems = useMemo(() => {
    return [...studyItems]
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
      .slice(0, 10);
  }, [studyItems]);

  // 과목별 학습시간 계산 (루틴 기반)
  const subjectTimeData = useMemo(() => {
    if (!routines) return [];

    const timeBySubject: Record<string, number> = {};

    routines.forEach((routine) => {
      // 수업이나 자습인 경우만
      if (
        (routine.majorCategory === 'class' || routine.majorCategory === 'self_study') &&
        routine.subject
      ) {
        const [startH, startM] = routine.startTime.split(':').map(Number);
        const [endH, endM] = routine.endTime.split(':').map(Number);
        const durationMinutes = endH * 60 + endM - (startH * 60 + startM);

        // 활성 요일 수
        const activeDays = routine.days.filter(Boolean).length;

        // 일간: 하루 평균, 주간: 주 합계, 월간: 월 합계 (근사)
        let totalMinutes = 0;
        if (period === 'daily') {
          totalMinutes = activeDays > 0 ? durationMinutes : 0;
        } else if (period === 'weekly') {
          totalMinutes = durationMinutes * activeDays;
        } else {
          totalMinutes = durationMinutes * activeDays * 4; // 약 4주
        }

        timeBySubject[routine.subject] = (timeBySubject[routine.subject] || 0) + totalMinutes;
      }
    });

    return Object.entries(timeBySubject).map(([label, value]) => ({
      label,
      value: Math.round(value / 60), // 시간 단위로 변환
      color: SUBJECT_COLOR_MAP[label]?.hex || SUBJECT_COLORS[label] || '#6b7280',
    }));
  }, [routines, period]);

  // 과목별 분량 데이터 (플래너 아이템 기반)
  const subjectAmountData = useMemo(() => {
    const amountBySubject: Record<string, number> = {};

    // 기간 필터
    const now = new Date();
    const filterDate = new Date();
    if (period === 'daily') {
      filterDate.setDate(now.getDate() - 1);
    } else if (period === 'weekly') {
      filterDate.setDate(now.getDate() - 7);
    } else {
      filterDate.setMonth(now.getMonth() - 1);
    }

    studyItems.forEach((item) => {
      const itemDate = new Date(item.startDate);
      if (itemDate >= filterDate && item.subject) {
        amountBySubject[item.subject] = (amountBySubject[item.subject] || 0) + 1;
      }
    });

    return Object.entries(amountBySubject).map(([label, value]) => ({
      label,
      value,
      color: SUBJECT_COLOR_MAP[label]?.hex || SUBJECT_COLORS[label] || '#6b7280',
    }));
  }, [studyItems, period]);

  // 성취도 데이터 (과목별 완료율)
  const subjectAchievementData = useMemo(() => {
    const achievementBySubject: Record<string, { total: number; completed: number }> = {};

    // 기간 필터
    const now = new Date();
    const filterDate = new Date();
    if (period === 'daily') {
      filterDate.setDate(now.getDate() - 1);
    } else if (period === 'weekly') {
      filterDate.setDate(now.getDate() - 7);
    } else {
      filterDate.setMonth(now.getMonth() - 1);
    }

    studyItems.forEach((item) => {
      const itemDate = new Date(item.startDate);
      if (itemDate >= filterDate && item.subject) {
        if (!achievementBySubject[item.subject]) {
          achievementBySubject[item.subject] = { total: 0, completed: 0 };
        }
        achievementBySubject[item.subject].total += 1;
        if (item.progress >= 100) {
          achievementBySubject[item.subject].completed += 1;
        }
      }
    });

    return Object.entries(achievementBySubject).map(([label, data]) => ({
      label,
      value: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
      color: SUBJECT_COLOR_MAP[label]?.hex || SUBJECT_COLORS[label] || '#6b7280',
    }));
  }, [studyItems, period]);

  const isLoading = isItemsLoading || isProgressLoading || isRankLoading || isRoutinesLoading;

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-screen-xl px-4 py-6">
        <Skeleton className="mb-6 h-8 w-32" />
        <div className="mb-6 grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  // 현재 선택된 데이터
  const pieChartData = metric === 'time' ? subjectTimeData : subjectAmountData;
  const chartUnit = metric === 'time' ? '시간' : '개';
  const chartTitle =
    metric === 'time' ? `${PERIOD_LABELS[period]} 학습시간` : `${PERIOD_LABELS[period]} 학습 분량`;

  return (
    <div className="mx-auto w-full max-w-screen-xl px-4 py-6">
      {/* 헤더 */}
      <div className="mb-6 flex items-center gap-4">
        <Link to="/" className="rounded-lg p-2 hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">학습 현황</h1>
          <p className="mt-1 text-gray-500">학습 성취도를 확인하세요</p>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-blue-100 p-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">전체 학습</p>
              <p className="text-xl font-bold">{stats.total}개</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-green-100 p-2">
              <Target className="h-5 w-5 text-green-600" />
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
              <p className="text-sm text-gray-500">평균 성취도</p>
              <p className="text-xl font-bold">{stats.avgProgress}%</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-purple-100 p-2">
              <Award className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">클래스 순위</p>
              <p className="text-xl font-bold">
                {rank?.myRank ? `${rank.myRank}위` : '-'}
                {rank?.totalStudents ? (
                  <span className="text-sm text-gray-400">/{rank.totalStudents}</span>
                ) : (
                  ''
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 기간 선택 및 과목별 성취도 원형 차트 */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg">과목별 성취도</CardTitle>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <PeriodTabs value={period} onChange={setPeriod} />
              <MetricTabs value={metric} onChange={setMetric} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* 학습시간/분량 차트 */}
            <div className="flex justify-center">
              <PieChart data={pieChartData} title={chartTitle} unit={chartUnit} size={180} />
            </div>

            {/* 성취도 차트 */}
            <div className="flex justify-center">
              <PieChart
                data={subjectAchievementData}
                title={`${PERIOD_LABELS[period]} 성취도`}
                unit="%"
                size={180}
              />
            </div>

            {/* 기간별 요약 */}
            <div className="flex flex-col justify-center space-y-3">
              <h4 className="text-center text-sm font-semibold text-gray-700">기간별 성취도</h4>
              <div className="flex items-center justify-between rounded-lg bg-blue-50 p-3">
                <span className="text-sm font-medium text-blue-700">일간</span>
                <span className="text-lg font-bold text-blue-600">
                  {rank?.dailyAchievement ?? 0}%
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-green-50 p-3">
                <span className="text-sm font-medium text-green-700">주간</span>
                <span className="text-lg font-bold text-green-600">
                  {rank?.weeklyAchievement ?? 0}%
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-purple-50 p-3">
                <span className="text-sm font-medium text-purple-700">월간</span>
                <span className="text-lg font-bold text-purple-600">
                  {rank?.monthlyAchievement ?? 0}%
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 과목별 상세 성취도 */}
      {subjects.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">과목별 상세</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {subjects.map((subject) => (
                <SubjectProgressBar key={subject} subject={subject} items={studyItems} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 최근 학습 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">최근 학습</CardTitle>
        </CardHeader>
        <CardContent>
          {recentItems.length > 0 ? (
            <div className="space-y-2">
              {recentItems.map((item) => (
                <RecentLearningItem key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">
              <BookOpen className="mx-auto mb-3 h-12 w-12 text-gray-300" />
              <p>학습 기록이 없습니다</p>
              <Link to="/">
                <Button variant="outline" className="mt-4">
                  학습 추가하기
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
