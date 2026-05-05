import { createLazyFileRoute } from '@tanstack/react-router';
import Leaderboard from '@/components/mentoring/Leaderboard';
import { Bot, Sparkles, BrainCircuit, Trophy } from 'lucide-react';

export const Route = createLazyFileRoute('/mentoring/ai')({
  component: AIMentoringPage,
});

function AIMentoringPage() {
  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8">
      {/* 페이지 헤더 */}
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

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 리더보드 (메인) */}
        <div className="lg:col-span-2">
          <Leaderboard />
        </div>

        {/* 사이드바 — 예정 기능 카드 */}
        <div className="space-y-4">
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

          {/* 경쟁 동기부여 카드 */}
          <div className="rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 p-5 ring-1 ring-amber-100">
            <div className="mb-3 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              <h3 className="font-bold text-gray-900">경쟁 시스템</h3>
            </div>
            <p className="text-sm leading-relaxed text-gray-600">
              같은 반 친구들과 학습량을 비교하고 순위를 확인하세요. 일간·주간·월간으로 전환하여
              경쟁할 수 있습니다.
            </p>
            <p className="mt-2 text-xs text-amber-600">
              🔜 수능 파이터반, 수시 파이터반 — 곧 출시!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
