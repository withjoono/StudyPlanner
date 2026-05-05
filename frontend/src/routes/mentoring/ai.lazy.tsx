import { createLazyFileRoute } from '@tanstack/react-router';
import { Bot, Sparkles, BrainCircuit, Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Leaderboard from '@/components/mentoring/Leaderboard';
import { useMyRankSummary } from '@/stores/server/ranking';
import { useMentoringUnread } from '@/stores/server/mentoring';

export const Route = createLazyFileRoute('/mentoring/ai')({
  component: AIMentoringPage,
});

function AIMentoringPage() {
  const { data: rankSummary } = useMyRankSummary();
  const { data: unread } = useMentoringUnread();

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8">
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-indigo-200">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI 멘토링</h1>
            <p className="text-sm text-gray-500">AI가 분석한 학습 데이터와 반 친구들 랭킹</p>
          </div>
        </div>
      </div>

      {/* 내 랭킹 요약 배너 */}
      {rankSummary && rankSummary.rank && (
        <div className="mb-6 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 p-4 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-indigo-200">현재 내 순위</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-3xl font-bold">{rankSummary.rank}위</span>
                <span className="text-indigo-200">/ {rankSummary.totalMembers}명</span>
              </div>
            </div>
            <div className="text-right">
              {rankSummary.rankChange != null && rankSummary.rankChange !== 0 && (
                <RankChangeChip change={rankSummary.rankChange} />
              )}
              <p className="mt-1 text-sm text-indigo-200">{rankSummary.period} 기준</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 리더보드 메인 */}
        <div className="lg:col-span-2">
          <Leaderboard />
        </div>

        {/* 사이드바 */}
        <div className="space-y-4">
          {/* 선생님 피드백 알림 */}
          {unread && unread.unreadCount > 0 && (
            <a
              href="/mentoring/human"
              className="flex items-center gap-3 rounded-xl bg-indigo-600 p-4 text-white shadow-lg transition-transform hover:scale-[1.01]"
            >
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/20">
                <span className="text-sm font-bold">{unread.unreadCount}</span>
              </div>
              <div>
                <p className="font-semibold">새 피드백 도착!</p>
                <p className="text-xs text-indigo-200">선생님 멘토링 피드백 확인하기 →</p>
              </div>
            </a>
          )}

          {/* AI 코칭 카드 */}
          <div className="rounded-xl bg-gradient-to-br from-violet-50 to-indigo-50 p-5 ring-1 ring-indigo-100">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-500" />
              <h3 className="font-bold text-gray-900">AI 코칭</h3>
            </div>
            <p className="text-sm leading-relaxed text-gray-600">
              학습 패턴을 분석하여 맞춤형 피드백을 제공합니다. 성장 페이지에서 AI 코칭을 확인해
              보세요.
            </p>
            <a
              href="/growth"
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              성장 페이지로 이동 →
            </a>
          </div>

          {/* 학습 분석 카드 */}
          <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 p-5 ring-1 ring-emerald-100">
            <div className="mb-3 flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-emerald-500" />
              <h3 className="font-bold text-gray-900">학습 분석</h3>
            </div>
            <p className="text-sm leading-relaxed text-gray-600">
              과목별 학습 시간, 달성률, 취약 과목을 AI가 자동으로 분석합니다.
            </p>
            <a
              href="/learning"
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-500"
            >
              분석 페이지로 이동 →
            </a>
          </div>

          {/* 경쟁 시스템 카드 */}
          <div className="rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 p-5 ring-1 ring-amber-100">
            <div className="mb-3 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              <h3 className="font-bold text-gray-900">경쟁 시스템</h3>
            </div>
            <p className="text-sm leading-relaxed text-gray-600">
              같은 반 친구들과 학습량을 비교하고 순위를 확인하세요. 일간·주간·월간으로 전환하여
              경쟁할 수 있습니다.
            </p>
            <a
              href="/myclass"
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-amber-600 hover:text-amber-500"
            >
              마이 클래스 만들기 →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function RankChangeChip({ change }: { change: number }) {
  if (change > 0) {
    return (
      <span className="flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold">
        <TrendingUp className="h-3 w-3" />▲ {change}
      </span>
    );
  }
  if (change < 0) {
    return (
      <span className="flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold">
        <TrendingDown className="h-3 w-3" />▼ {Math.abs(change)}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold">
      <Minus className="h-3 w-3" />
      유지
    </span>
  );
}
