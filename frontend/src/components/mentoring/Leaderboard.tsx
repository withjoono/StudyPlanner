import { useState } from 'react';
import { useLeaderboard, type LeaderboardEntry } from '@/stores/server/ranking';
import { useAuthStore } from '@/stores/client/use-auth-store';
import { Trophy, TrendingUp, TrendingDown, Minus, Clock, Target, Medal } from 'lucide-react';

const periodLabels: Record<string, string> = {
  daily: '일간',
  weekly: '주간',
  monthly: '월간',
};

function formatMinutes(min: number): string {
  if (min < 60) return `${min}분`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}시간 ${m}분` : `${h}시간`;
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-2xl">🥇</span>;
  if (rank === 2) return <span className="text-2xl">🥈</span>;
  if (rank === 3) return <span className="text-2xl">🥉</span>;
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-500">
      {rank}
    </span>
  );
}

function RankChangeIndicator({ change }: { change: number | null }) {
  if (change === null) return <Minus className="h-4 w-4 text-gray-300" />;
  if (change > 0)
    return (
      <span className="flex items-center gap-0.5 text-xs font-semibold text-emerald-600">
        <TrendingUp className="h-3.5 w-3.5" />
        {change}
      </span>
    );
  if (change < 0)
    return (
      <span className="flex items-center gap-0.5 text-xs font-semibold text-red-500">
        <TrendingDown className="h-3.5 w-3.5" />
        {Math.abs(change)}
      </span>
    );
  return <Minus className="h-4 w-4 text-gray-300" />;
}

export default function Leaderboard() {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [groupId, setGroupId] = useState<string | undefined>(undefined);
  const { data, isLoading, error } = useLeaderboard(period, undefined, groupId);
  const { user } = useAuthStore();

  return (
    <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          <h2 className="text-lg font-bold text-gray-900">학습 랭킹</h2>
        </div>
        {/* 기간 전환 탭 */}
        <div className="flex rounded-lg bg-gray-100 p-0.5">
          {(['daily', 'weekly', 'monthly'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                period === p
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>
      </div>

      {/* 그룹 선택기 */}
      {data?.availableGroups && data.availableGroups.length > 1 && (
        <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-2.5">
          <select
            value={groupId || data.availableGroups[0].id}
            onChange={(e) => setGroupId(e.target.value)}
            className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-sm font-medium text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600"
          >
            {data.availableGroups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 내용 */}
      <div className="px-6 py-4">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-center text-sm text-red-600">
            랭킹 데이터를 불러올 수 없습니다.
          </div>
        )}

        {data && !isLoading && (
          <>
            {/* 기간 표시 */}
            <div className="mb-4 text-center text-xs text-gray-400">
              {data.dateRange.start} ~ {data.dateRange.end}
            </div>

            {/* 리더보드 목록 */}
            {data.leaderboard.length === 0 ? (
              <div className="rounded-lg bg-gray-50 py-12 text-center">
                <Medal className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                <p className="text-sm text-gray-500">아직 랭킹 데이터가 없습니다.</p>
                <p className="mt-1 text-xs text-gray-400">
                  선생님에게 연결되면 반 친구들과 경쟁할 수 있어요!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {data.leaderboard.map((entry) => (
                  <LeaderboardRow
                    key={entry.studentId}
                    entry={entry}
                    isMe={entry.rank === data.myRank}
                  />
                ))}
              </div>
            )}

            {/* 하단 요약 */}
            {data.leaderboard.length > 0 && (
              <div className="mt-4 flex items-center justify-between rounded-lg bg-indigo-50 px-4 py-3">
                <span className="text-xs text-indigo-600">
                  📊 전체 평균: <strong>{data.groupAverage.toFixed(1)}pt</strong>
                </span>
                {data.myRank && (
                  <span className="text-xs text-indigo-600">
                    내 위치: 상위{' '}
                    <strong>{Math.round((data.myRank / data.totalMembers) * 100)}%</strong>
                  </span>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function LeaderboardRow({ entry, isMe }: { entry: LeaderboardEntry; isMe: boolean }) {
  return (
    <div
      className={`flex items-center gap-3 rounded-lg px-3 py-3 transition-colors ${
        isMe ? 'bg-indigo-50 ring-1 ring-indigo-200' : 'hover:bg-gray-50'
      }`}
    >
      {/* 순위 */}
      <div className="flex w-10 justify-center">
        <RankBadge rank={entry.rank} />
      </div>

      {/* 이름 + 학년 */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span
            className={`truncate text-sm font-semibold ${
              isMe ? 'text-indigo-700' : 'text-gray-900'
            }`}
          >
            {entry.name}
          </span>
          {isMe && (
            <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold text-indigo-600">
              나
            </span>
          )}
        </div>
        {entry.grade && <span className="text-[11px] text-gray-400">{entry.grade}</span>}
      </div>

      {/* 학습시간 + 미션 */}
      <div className="hidden flex-col items-end gap-0.5 text-[11px] text-gray-400 sm:flex">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatMinutes(entry.studyMinutes)}
        </span>
        <span className="flex items-center gap-1">
          <Target className="h-3 w-3" />
          {entry.missionCount}개
        </span>
      </div>

      {/* 점수 */}
      <div className="w-16 text-right">
        <div className={`text-sm font-bold ${isMe ? 'text-indigo-600' : 'text-gray-900'}`}>
          {entry.totalScore.toFixed(1)}
        </div>
        <div className="text-[10px] text-gray-400">pt</div>
      </div>

      {/* 순위 변동 */}
      <div className="flex w-8 justify-center">
        <RankChangeIndicator change={entry.rankChange} />
      </div>
    </div>
  );
}
