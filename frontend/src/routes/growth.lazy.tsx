/**
 * 성장 페이지 — "계속 나아지는 나"
 *
 * 1. 오늘의 회고 카드 (기분 + 자유 서술)
 * 2. Streak & 달성률 트렌드
 * 3. 주간 비교 (이번 주 vs 지난 주)
 * 4. AI 코칭 인사이트
 * 5. 과목별 강점/약점 맵
 */

import { createLazyFileRoute } from '@tanstack/react-router';
import { useState, useMemo } from 'react';
import {
  Flame,
  Trophy,
  TrendingUp,
  TrendingDown,
  Brain,
  Lightbulb,
  Smile,
  Meh,
  Frown,
  Star,
  Target,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Save,
  Sparkles,
  Award,
  ArrowUp,
  ArrowDown,
  Minus,
} from 'lucide-react';
import {
  useGetGrowthStats,
  useGetReflection,
  useUpsertReflection,
  useGetAICoaching,
} from '@/stores/server/planner/hooks';
import { useAuthStore } from '@/stores/client';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export const Route = createLazyFileRoute('/growth')({
  component: GrowthPage,
});

// ============================================
// 상수
// ============================================

const MOOD_OPTIONS = [
  { value: 'great', emoji: '🤩', label: '최고', color: '#22c55e' },
  { value: 'good', emoji: '😊', label: '좋음', color: '#3b82f6' },
  { value: 'okay', emoji: '😐', label: '보통', color: '#eab308' },
  { value: 'bad', emoji: '😞', label: '안좋음', color: '#f97316' },
  { value: 'terrible', emoji: '😢', label: '최악', color: '#ef4444' },
] as const;

const UNDERSTANDING_LABELS = ['매우 낮음', '낮음', '보통', '높음', '매우 높음'];

const SUBJECT_COLORS: Record<string, string> = {
  국어: '#ef4444',
  수학: '#eab308',
  영어: '#f97316',
  사회: '#3b82f6',
  과학: '#14b8a6',
  한국사: '#a855f7',
  기타: '#6b7280',
};

function formatDateStr(date: Date): string {
  return date.toISOString().split('T')[0];
}

// ============================================
// 회고 입력 카드
// ============================================

function ReflectionCard({ date }: { date: string }) {
  const { data: reflection, isLoading } = useGetReflection(date);
  const upsertMutation = useUpsertReflection();

  const [mood, setMood] = useState('');
  const [bestThing, setBestThing] = useState('');
  const [worstThing, setWorstThing] = useState('');
  const [improvement, setImprovement] = useState('');
  const [dailyGoal, setDailyGoal] = useState('');
  const [understanding, setUnderstanding] = useState(3);
  const [isEditing, setIsEditing] = useState(false);

  // reflection이 로드되면 상태 업데이트
  useState(() => {
    if (reflection) {
      setMood(reflection.mood);
      setBestThing(reflection.bestThing || '');
      setWorstThing(reflection.worstThing || '');
      setImprovement(reflection.improvement || '');
      setDailyGoal(reflection.dailyGoal || '');
      setUnderstanding(reflection.understanding || 3);
    }
  });

  // reflection 변경 시 동기화
  useMemo(() => {
    if (reflection) {
      setMood(reflection.mood);
      setBestThing(reflection.bestThing || '');
      setWorstThing(reflection.worstThing || '');
      setImprovement(reflection.improvement || '');
      setDailyGoal(reflection.dailyGoal || '');
      setUnderstanding(reflection.understanding || 3);
      setIsEditing(false);
    } else {
      setMood('');
      setBestThing('');
      setWorstThing('');
      setImprovement('');
      setDailyGoal('');
      setUnderstanding(3);
      setIsEditing(true);
    }
  }, [reflection]);

  const handleSave = () => {
    if (!mood) {
      toast.error('기분을 선택해주세요.');
      return;
    }
    upsertMutation.mutate(
      { date, mood, bestThing, worstThing, improvement, dailyGoal, understanding },
      {
        onSuccess: () => {
          toast.success('회고가 저장되었습니다! 🎉');
          setIsEditing(false);
        },
        onError: () => toast.error('저장에 실패했습니다.'),
      },
    );
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <Skeleton className="mb-4 h-6 w-32" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  const showForm = isEditing || !reflection;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900">
          <span className="text-2xl">📝</span> 오늘의 회고
        </h3>
        {reflection && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-indigo-600 transition-colors hover:bg-indigo-50"
          >
            수정
          </button>
        )}
      </div>

      {/* 기분 선택 */}
      <div className="mb-5">
        <p className="mb-2.5 text-sm font-medium text-gray-600">오늘의 기분</p>
        <div className="flex gap-2">
          {MOOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => showForm && setMood(opt.value)}
              className={`flex flex-1 flex-col items-center gap-1 rounded-xl border-2 py-3 transition-all ${
                mood === opt.value
                  ? 'scale-105 border-indigo-400 bg-indigo-50 shadow-md'
                  : showForm
                    ? 'border-gray-100 bg-gray-50 hover:border-gray-200 hover:bg-gray-100'
                    : 'cursor-default border-gray-100 bg-gray-50'
              }`}
            >
              <span className="text-2xl">{opt.emoji}</span>
              <span className="text-xs font-medium text-gray-500">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 자가 이해도 */}
      <div className="mb-5">
        <p className="mb-2.5 text-sm font-medium text-gray-600">오늘의 학습 이해도</p>
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((v) => (
              <button
                key={v}
                onClick={() => showForm && setUnderstanding(v)}
                className={`flex h-9 w-9 items-center justify-center rounded-full transition-all ${
                  v <= understanding
                    ? 'bg-amber-400 text-white shadow-sm'
                    : showForm
                      ? 'bg-gray-100 text-gray-300 hover:bg-gray-200'
                      : 'cursor-default bg-gray-100 text-gray-300'
                }`}
              >
                <Star className="h-4 w-4" fill={v <= understanding ? 'currentColor' : 'none'} />
              </button>
            ))}
          </div>
          <span className="text-sm font-medium text-gray-500">
            {UNDERSTANDING_LABELS[understanding - 1]}
          </span>
        </div>
      </div>

      {showForm && (
        <>
          {/* 오늘의 다짐 / 내일 목표 */}
          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-gray-600">
              💪 오늘의 다짐 / 내일 목표
            </label>
            <input
              type="text"
              value={dailyGoal}
              onChange={(e) => setDailyGoal(e.target.value)}
              placeholder="내일은 수학 개념 확실히 잡기!"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm transition-colors focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {/* 잘한 것 */}
          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-gray-600">
              ✅ 오늘 가장 잘한 것
            </label>
            <textarea
              value={bestThing}
              onChange={(e) => setBestThing(e.target.value)}
              placeholder="영어 단어 50개 모두 외웠다!"
              rows={2}
              className="w-full resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm transition-colors focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {/* 아쉬운 것 */}
          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-gray-600">😥 아쉬웠던 것</label>
            <textarea
              value={worstThing}
              onChange={(e) => setWorstThing(e.target.value)}
              placeholder="수학 문제집 6쪽밖에 못 풀었다"
              rows={2}
              className="w-full resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm transition-colors focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {/* 개선할 점 */}
          <div className="mb-5">
            <label className="mb-1.5 block text-sm font-medium text-gray-600">
              🔧 내일 개선할 점
            </label>
            <textarea
              value={improvement}
              onChange={(e) => setImprovement(e.target.value)}
              placeholder="수학 시간을 30분 더 확보하자"
              rows={2}
              className="w-full resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm transition-colors focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={upsertMutation.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
          >
            {upsertMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            회고 저장하기
          </button>
        </>
      )}

      {/* 저장된 회고 요약 표시 */}
      {reflection && !isEditing && (
        <div className="space-y-3 rounded-xl bg-gray-50 p-4">
          {reflection.dailyGoal && (
            <div>
              <span className="text-xs font-medium text-gray-400">💪 다짐</span>
              <p className="text-sm text-gray-700">{reflection.dailyGoal}</p>
            </div>
          )}
          {reflection.bestThing && (
            <div>
              <span className="text-xs font-medium text-gray-400">✅ 잘한 것</span>
              <p className="text-sm text-gray-700">{reflection.bestThing}</p>
            </div>
          )}
          {reflection.worstThing && (
            <div>
              <span className="text-xs font-medium text-gray-400">😥 아쉬운 것</span>
              <p className="text-sm text-gray-700">{reflection.worstThing}</p>
            </div>
          )}
          {reflection.improvement && (
            <div>
              <span className="text-xs font-medium text-gray-400">🔧 개선할 점</span>
              <p className="text-sm text-gray-700">{reflection.improvement}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// Streak & 달성률 트렌드
// ============================================

function StreakCard({
  streak,
  longestStreak,
  weeklyAchievements,
}: {
  streak: number;
  longestStreak: number;
  weeklyAchievements: number[];
}) {
  const maxVal = Math.max(...weeklyAchievements, 1);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <h3 className="mb-5 flex items-center gap-2 text-lg font-bold text-gray-900">
        <Flame className="h-5 w-5 text-orange-500" /> 연속 달성
      </h3>

      {/* Streak 카운터 */}
      <div className="mb-6 flex items-center gap-6">
        <div className="flex flex-col items-center">
          <div
            className="flex h-20 w-20 items-center justify-center rounded-full shadow-lg"
            style={{
              background:
                streak > 0
                  ? 'linear-gradient(135deg, #f97316, #ef4444)'
                  : 'linear-gradient(135deg, #d1d5db, #9ca3af)',
            }}
          >
            <span className="text-3xl font-black text-white">{streak}</span>
          </div>
          <span className="mt-2 text-sm font-semibold text-gray-600">현재 연속</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 shadow-sm">
            <Trophy className="h-7 w-7 text-amber-500" />
          </div>
          <span className="mt-2 text-2xl font-bold text-amber-600">{longestStreak}</span>
          <span className="text-xs font-medium text-gray-400">최장 기록</span>
        </div>
      </div>

      {/* 주간 달성률 바 차트 */}
      <div>
        <p className="mb-3 text-sm font-medium text-gray-500">최근 8주 달성률</p>
        <div className="flex items-end gap-1.5" style={{ height: 80 }}>
          {weeklyAchievements.map((val, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-[10px] font-medium text-gray-400">{val}%</span>
              <div
                className="w-full rounded-t-md transition-all"
                style={{
                  height: `${Math.max((val / maxVal) * 60, 4)}px`,
                  background:
                    val >= 80
                      ? 'linear-gradient(180deg, #22c55e, #16a34a)'
                      : val >= 50
                        ? 'linear-gradient(180deg, #eab308, #ca8a04)'
                        : 'linear-gradient(180deg, #f87171, #ef4444)',
                }}
              />
              <span className="text-[10px] text-gray-300">
                {i === weeklyAchievements.length - 1
                  ? '이번주'
                  : `${weeklyAchievements.length - 1 - i}주전`}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================
// 주간 비교 카드
// ============================================

function WeekCompareCard({
  thisWeek,
  lastWeek,
}: {
  thisWeek: { totalMissions: number; completedMissions: number; achievementRate: number };
  lastWeek: { totalMissions: number; completedMissions: number; achievementRate: number };
}) {
  const rateDiff = thisWeek.achievementRate - lastWeek.achievementRate;
  const missionDiff = thisWeek.completedMissions - lastWeek.completedMissions;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <h3 className="mb-5 flex items-center gap-2 text-lg font-bold text-gray-900">
        <Target className="h-5 w-5 text-indigo-500" /> 주간 비교
      </h3>

      <div className="grid grid-cols-2 gap-4">
        {/* 이번 주 */}
        <div className="rounded-xl bg-indigo-50 p-4">
          <p className="mb-1 text-xs font-semibold text-indigo-400">이번 주</p>
          <p className="text-3xl font-black text-indigo-600">{thisWeek.achievementRate}%</p>
          <p className="mt-1 text-xs text-gray-500">
            {thisWeek.completedMissions}/{thisWeek.totalMissions} 완료
          </p>
        </div>

        {/* 지난 주 */}
        <div className="rounded-xl bg-gray-50 p-4">
          <p className="mb-1 text-xs font-semibold text-gray-400">지난 주</p>
          <p className="text-3xl font-black text-gray-500">{lastWeek.achievementRate}%</p>
          <p className="mt-1 text-xs text-gray-500">
            {lastWeek.completedMissions}/{lastWeek.totalMissions} 완료
          </p>
        </div>
      </div>

      {/* 변화 요약 */}
      <div className="mt-4 flex items-center justify-center gap-4 rounded-xl bg-gray-50 p-3">
        <div className="flex items-center gap-1.5">
          {rateDiff > 0 ? (
            <ArrowUp className="h-4 w-4 text-green-500" />
          ) : rateDiff < 0 ? (
            <ArrowDown className="h-4 w-4 text-red-500" />
          ) : (
            <Minus className="h-4 w-4 text-gray-400" />
          )}
          <span
            className={`text-sm font-bold ${
              rateDiff > 0 ? 'text-green-600' : rateDiff < 0 ? 'text-red-600' : 'text-gray-500'
            }`}
          >
            달성률 {rateDiff > 0 ? '+' : ''}
            {rateDiff}%p
          </span>
        </div>
        <div className="h-4 w-px bg-gray-200" />
        <div className="flex items-center gap-1.5">
          {missionDiff > 0 ? (
            <TrendingUp className="h-4 w-4 text-green-500" />
          ) : missionDiff < 0 ? (
            <TrendingDown className="h-4 w-4 text-red-500" />
          ) : (
            <Minus className="h-4 w-4 text-gray-400" />
          )}
          <span
            className={`text-sm font-bold ${
              missionDiff > 0
                ? 'text-green-600'
                : missionDiff < 0
                  ? 'text-red-600'
                  : 'text-gray-500'
            }`}
          >
            완료 {missionDiff > 0 ? '+' : ''}
            {missionDiff}개
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================
// AI 코칭 카드
// ============================================

function AICoachingCard() {
  const { data: coaching, isLoading } = useGetAICoaching();

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <Skeleton className="mb-4 h-6 w-40" />
        <Skeleton className="mb-2 h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (!coaching) return null;

  return (
    <div className="rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50 via-white to-indigo-50 p-6 shadow-sm">
      <h3 className="mb-5 flex items-center gap-2 text-lg font-bold text-gray-900">
        <Sparkles className="h-5 w-5 text-purple-500" /> AI 코칭
      </h3>

      {/* 인사이트 */}
      <div className="mb-5 space-y-2.5">
        {coaching.insights.map((insight, i) => (
          <div key={i} className="flex items-start gap-2.5 rounded-xl bg-white/80 p-3.5 shadow-sm">
            <Lightbulb className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
            <p className="text-sm leading-relaxed text-gray-700">{insight}</p>
          </div>
        ))}
      </div>

      {/* 제안 */}
      <div className="space-y-2.5">
        <p className="text-xs font-semibold uppercase tracking-wider text-purple-400">
          💡 추천 액션
        </p>
        {coaching.suggestions.map((suggestion, i) => (
          <div
            key={i}
            className="flex items-start gap-2.5 rounded-xl border border-purple-100 bg-purple-50/50 p-3.5"
          >
            <Brain className="mt-0.5 h-4 w-4 flex-shrink-0 text-purple-500" />
            <p className="text-sm leading-relaxed text-gray-700">{suggestion}</p>
          </div>
        ))}
      </div>

      {/* 강/약 과목 */}
      {(coaching.strongestSubject || coaching.weakestSubject) && (
        <div className="mt-5 grid grid-cols-2 gap-3">
          {coaching.strongestSubject && (
            <div className="rounded-xl bg-green-50 p-3 text-center">
              <Award className="mx-auto mb-1 h-5 w-5 text-green-500" />
              <p className="text-xs font-medium text-green-400">가장 잘하는</p>
              <p className="text-sm font-bold text-green-700">
                {coaching.strongestSubject.subject}
              </p>
              <p className="text-xs text-green-500">{coaching.strongestSubject.rate}%</p>
            </div>
          )}
          {coaching.weakestSubject && (
            <div className="rounded-xl bg-red-50 p-3 text-center">
              <Target className="mx-auto mb-1 h-5 w-5 text-red-400" />
              <p className="text-xs font-medium text-red-400">집중 필요</p>
              <p className="text-sm font-bold text-red-700">{coaching.weakestSubject.subject}</p>
              <p className="text-xs text-red-500">{coaching.weakestSubject.rate}%</p>
            </div>
          )}
        </div>
      )}

      {/* 기분 평균 */}
      <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-white/80 p-3">
        {coaching.moodAverage >= 4 ? (
          <Smile className="h-5 w-5 text-green-500" />
        ) : coaching.moodAverage >= 3 ? (
          <Meh className="h-5 w-5 text-yellow-500" />
        ) : (
          <Frown className="h-5 w-5 text-red-500" />
        )}
        <span className="text-sm text-gray-600">
          기분 평균 <span className="font-bold">{coaching.moodAverage}/5</span>
        </span>
      </div>
    </div>
  );
}

// ============================================
// 과목별 강점/약점 맵
// ============================================

function SubjectTrendCard({
  subjectTrend,
}: {
  subjectTrend: { subject: string; thisWeek: number; lastWeek: number; change: number }[];
}) {
  if (subjectTrend.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
          📊 과목별 트렌드
        </h3>
        <p className="text-center text-sm text-gray-400">
          미션 데이터가 쌓이면 과목별 트렌드가 표시됩니다.
        </p>
      </div>
    );
  }

  const maxCount = Math.max(...subjectTrend.map((s) => Math.max(s.thisWeek, s.lastWeek)), 1);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <h3 className="mb-5 flex items-center gap-2 text-lg font-bold text-gray-900">
        📊 과목별 트렌드
      </h3>

      <div className="space-y-4">
        {subjectTrend.map((item) => {
          const color = SUBJECT_COLORS[item.subject] || '#6b7280';
          return (
            <div key={item.subject}>
              <div className="mb-1.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-sm font-semibold text-gray-700">{item.subject}</span>
                </div>
                <div className="flex items-center gap-1">
                  {item.change > 0 ? (
                    <ArrowUp className="h-3.5 w-3.5 text-green-500" />
                  ) : item.change < 0 ? (
                    <ArrowDown className="h-3.5 w-3.5 text-red-500" />
                  ) : (
                    <Minus className="h-3.5 w-3.5 text-gray-300" />
                  )}
                  <span
                    className={`text-xs font-bold ${
                      item.change > 0
                        ? 'text-green-600'
                        : item.change < 0
                          ? 'text-red-600'
                          : 'text-gray-400'
                    }`}
                  >
                    {item.change > 0 ? '+' : ''}
                    {item.change}%
                  </span>
                </div>
              </div>

              {/* 이번 주 vs 지난 주 바 */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-12 text-right text-[10px] text-gray-400">이번주</span>
                  <div className="h-3 flex-1 rounded-full bg-gray-100">
                    <div
                      className="h-3 rounded-full transition-all"
                      style={{
                        width: `${(item.thisWeek / maxCount) * 100}%`,
                        backgroundColor: color,
                        minWidth: item.thisWeek > 0 ? '8px' : '0',
                      }}
                    />
                  </div>
                  <span className="w-6 text-xs font-medium text-gray-500">{item.thisWeek}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-12 text-right text-[10px] text-gray-400">지난주</span>
                  <div className="h-3 flex-1 rounded-full bg-gray-100">
                    <div
                      className="h-3 rounded-full transition-all"
                      style={{
                        width: `${(item.lastWeek / maxCount) * 100}%`,
                        backgroundColor: color,
                        opacity: 0.4,
                        minWidth: item.lastWeek > 0 ? '8px' : '0',
                      }}
                    />
                  </div>
                  <span className="w-6 text-xs font-medium text-gray-400">{item.lastWeek}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// 기분 트렌드 차트
// ============================================

function MoodTrendCard({
  moodTrend,
}: {
  moodTrend: { date: string; mood: string; understanding: number }[];
}) {
  if (moodTrend.length === 0) return null;

  const moodToY: Record<string, number> = {
    great: 5,
    good: 4,
    okay: 3,
    bad: 2,
    terrible: 1,
  };
  const moodToEmoji: Record<string, string> = {
    great: '🤩',
    good: '😊',
    okay: '😐',
    bad: '😞',
    terrible: '😢',
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <h3 className="mb-5 flex items-center gap-2 text-lg font-bold text-gray-900">
        😊 기분 & 이해도 추이
      </h3>

      <div className="flex items-end gap-1" style={{ height: 120 }}>
        {moodTrend.map((entry, i) => {
          const moodVal = moodToY[entry.mood] || 3;
          const dayStr = new Date(entry.date).getDate().toString();
          return (
            <div
              key={i}
              className="flex flex-1 flex-col items-center gap-1"
              title={`${entry.date}: ${entry.mood} / 이해도 ${entry.understanding}`}
            >
              <span className="text-lg">{moodToEmoji[entry.mood] || '😐'}</span>
              {/* 이해도 바 */}
              <div
                className="w-full rounded-t-md bg-gradient-to-t from-indigo-400 to-indigo-300 transition-all"
                style={{
                  height: `${(entry.understanding / 5) * 60}px`,
                  opacity: 0.7 + (moodVal / 5) * 0.3,
                }}
              />
              <span className="text-[10px] text-gray-400">{dayStr}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex items-center justify-center gap-4 text-[10px] text-gray-400">
        <span>📊 이해도 바 높이 = 자가 이해도(1~5)</span>
      </div>
    </div>
  );
}

// ============================================
// 메인 페이지 컴포넌트
// ============================================

function GrowthPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const dateStr = formatDateStr(selectedDate);

  const { data: stats, isLoading: statsLoading } = useGetGrowthStats();

  const navigateDate = (dir: 'prev' | 'next') => {
    setSelectedDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + (dir === 'prev' ? -1 : 1));
      return d;
    });
  };

  const isToday = formatDateStr(selectedDate) === formatDateStr(new Date());

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <p className="text-6xl">🌱</p>
          <h2 className="mt-4 text-xl font-bold text-gray-700">성장 페이지</h2>
          <p className="mt-2 text-gray-500">로그인하면 나의 성장 기록을 관리할 수 있어요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-screen-lg px-4 py-6">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight text-gray-900">🌱 나의 성장</h1>
        <p className="mt-1 text-sm text-gray-500">
          매일 회고하고, 성장을 시각화하고, AI 코칭을 받아보세요.
        </p>
      </div>

      {/* 날짜 네비게이션 */}
      <div className="mb-6 flex items-center justify-center gap-4">
        <button
          onClick={() => navigateDate('prev')}
          className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="text-center">
          <p className="text-lg font-bold text-gray-800">
            {selectedDate.getFullYear()}년 {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}
            일
          </p>
          <p className="text-xs text-gray-400">
            {['일', '월', '화', '수', '목', '금', '토'][selectedDate.getDay()]}요일
            {isToday && (
              <span className="ml-1.5 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-600">
                오늘
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => navigateDate('next')}
          className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* 콘텐츠 그리드 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* 좌측: 회고 + AI 코칭 */}
        <div className="space-y-6">
          <ReflectionCard date={dateStr} />
          <AICoachingCard />
        </div>

        {/* 우측: Streak + 주간비교 + 과목트렌드 + 기분추이 */}
        <div className="space-y-6">
          {statsLoading ? (
            <>
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <Skeleton className="mb-4 h-6 w-32" />
                <Skeleton className="mb-2 h-20 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <Skeleton className="mb-4 h-6 w-32" />
                <Skeleton className="h-24 w-full" />
              </div>
            </>
          ) : stats ? (
            <>
              <StreakCard
                streak={stats.streak}
                longestStreak={stats.longestStreak}
                weeklyAchievements={stats.weeklyAchievements}
              />
              <WeekCompareCard thisWeek={stats.thisWeek} lastWeek={stats.lastWeek} />
              <SubjectTrendCard subjectTrend={stats.subjectTrend} />
              <MoodTrendCard moodTrend={stats.moodTrend} />
            </>
          ) : (
            <div className="rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm">
              <p className="text-sm text-gray-400">데이터를 불러오는 중...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
