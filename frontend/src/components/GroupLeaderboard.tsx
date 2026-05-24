/**
 * 그룹 리더보드 — 마이그룹 3개 반(담당 선생님 그룹·목표대학반·스터디반) 공용 비교 컴포넌트.
 * 일/주/월 기간 토글 + 점수·학습시간·분량 막대 차트 + 순위 도표.
 */
import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Loader2, Trophy } from 'lucide-react';

export type GroupPeriod = 'daily' | 'weekly' | 'monthly';

/** 리더보드 한 명의 정규화된 비교 지표 */
export interface GroupLeaderboardMember {
  id: number | string;
  name: string;
  isMe: boolean;
  grade?: string | null;
  score: number;
  studyMinutes: number;
  totalPages: number;
}

type Metric = 'score' | 'minutes' | 'pages';

const PERIODS: { value: GroupPeriod; label: string }[] = [
  { value: 'daily', label: '일간' },
  { value: 'weekly', label: '주간' },
  { value: 'monthly', label: '월간' },
];

const METRICS: { value: Metric; label: string; color: string }[] = [
  { value: 'score', label: '점수', color: '#6366f1' },
  { value: 'minutes', label: '학습시간', color: '#10b981' },
  { value: 'pages', label: '분량', color: '#f59e0b' },
];

function fmtMinutes(m: number): string {
  if (!m || m <= 0) return '0분';
  const h = Math.floor(m / 60);
  const min = m % 60;
  if (h > 0) return min > 0 ? `${h}시간 ${min}분` : `${h}시간`;
  return `${min}분`;
}

function metricValue(m: GroupLeaderboardMember, metric: Metric): number {
  if (metric === 'score') return m.score;
  if (metric === 'minutes') return m.studyMinutes;
  return m.totalPages;
}

function metricDisplay(value: number, metric: Metric): string {
  if (metric === 'minutes') return fmtMinutes(value);
  if (metric === 'pages') return `${value}p`;
  return `${value.toLocaleString()}점`;
}

interface GroupLeaderboardProps {
  members: GroupLeaderboardMember[];
  period: GroupPeriod;
  onPeriodChange: (p: GroupPeriod) => void;
  loading?: boolean;
  /** 기본 지표 (기본값: 학습시간) */
  defaultMetric?: Metric;
  emptyText?: string;
}

export function GroupLeaderboard({
  members,
  period,
  onPeriodChange,
  loading,
  defaultMetric = 'minutes',
  emptyText,
}: GroupLeaderboardProps) {
  const [metric, setMetric] = useState<Metric>(defaultMetric);
  const active = METRICS.find((x) => x.value === metric) ?? METRICS[1];

  const ranked = useMemo(() => {
    const list = [...members];
    list.sort((a, b) => metricValue(b, metric) - metricValue(a, metric));
    return list;
  }, [members, metric]);

  // 반 평균 (현재 지표 기준) — 차트 기준선
  const average = useMemo(() => {
    if (ranked.length === 0) return 0;
    const sum = ranked.reduce((s, m) => s + metricValue(m, metric), 0);
    return Math.round((sum / ranked.length) * 10) / 10;
  }, [ranked, metric]);

  const chartData = ranked.map((m) => ({
    name: m.name.length > 5 ? `${m.name.slice(0, 5)}…` : m.name,
    fullName: m.name,
    value: metricValue(m, metric),
    isMe: m.isMe,
  }));

  return (
    <div>
      {/* 기간 토글 */}
      <div className="mb-4 inline-flex rounded-xl bg-gray-100 p-1">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => onPeriodChange(p.value)}
            className={`rounded-lg px-4 py-1.5 text-sm font-bold transition ${
              period === p.value
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* 비교 차트 */}
      <div className="mb-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-gray-800">반 친구 비교</h2>
          <div className="inline-flex rounded-lg bg-gray-100 p-0.5">
            {METRICS.map((mc) => (
              <button
                key={mc.value}
                type="button"
                onClick={() => setMetric(mc.value)}
                className={`rounded-md px-3 py-1 text-xs font-bold transition ${
                  metric === mc.value ? 'bg-white shadow-sm' : 'text-gray-500'
                }`}
                style={metric === mc.value ? { color: mc.color } : undefined}
              >
                {mc.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex h-[260px] items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-indigo-400" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex h-[260px] items-center justify-center text-sm text-gray-400">
            {emptyText ?? '아직 비교할 학습 기록이 없어요'}
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 4, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  interval={0}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  domain={[0, 'auto']}
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  formatter={(value: number | string) => [
                    metricDisplay(Number(value), metric),
                    active.label,
                  ]}
                  labelFormatter={(
                    label: string,
                    payload: readonly { payload?: { fullName?: string; isMe?: boolean } }[],
                  ) => {
                    const p = payload && payload[0]?.payload;
                    if (!p) return label;
                    return `${p.fullName ?? label}${p.isMe ? ' (나)' : ''}`;
                  }}
                />
                {average > 0 && (
                  <ReferenceLine
                    y={average}
                    stroke={active.color}
                    strokeDasharray="4 4"
                    strokeOpacity={0.7}
                  />
                )}
                <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={52}>
                  {chartData.map((d, i) => (
                    <Cell key={i} fill={d.isMe ? active.color : `${active.color}55`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p className="mt-2 text-center text-xs text-gray-400">
              진한 막대가 내 기록이에요{average > 0 ? ' · 점선은 반 평균' : ''}
            </p>
          </>
        )}
      </div>

      {/* 순위 도표 */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-gray-800">
          <Trophy className="h-4 w-4 text-amber-500" />
          순위 · {active.label} 기준
        </h2>
        {ranked.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">
            {emptyText ?? '아직 순위가 없어요'}
          </p>
        ) : (
          <div className="space-y-1.5">
            {ranked.map((m, idx) => (
              <GroupLeaderRow
                key={m.id}
                member={m}
                position={idx + 1}
                metric={metric}
                activeColor={active.color}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function GroupLeaderRow({
  member,
  position,
  metric,
  activeColor,
}: {
  member: GroupLeaderboardMember;
  position: number;
  metric: Metric;
  activeColor: string;
}) {
  const medal =
    position === 1
      ? 'bg-amber-100 text-amber-700'
      : position === 2
        ? 'bg-slate-200 text-slate-600'
        : position === 3
          ? 'bg-orange-100 text-orange-700'
          : 'bg-gray-100 text-gray-400';

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${
        member.isMe ? 'border-indigo-200 bg-indigo-50/60' : 'border-transparent bg-gray-50'
      }`}
    >
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-black ${medal}`}
      >
        {position}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-bold text-gray-900">{member.name}</span>
          {member.isMe && (
            <span className="rounded bg-indigo-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
              나
            </span>
          )}
          {member.grade && (
            <span className="shrink-0 text-[11px] text-gray-400">{member.grade}</span>
          )}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-gray-400">
          <span className={metric === 'score' ? 'font-bold text-indigo-600' : undefined}>
            점수 {member.score.toLocaleString()}
          </span>
          <span className={metric === 'minutes' ? 'font-bold text-emerald-600' : undefined}>
            {fmtMinutes(member.studyMinutes)}
          </span>
          <span className={metric === 'pages' ? 'font-bold text-amber-600' : undefined}>
            {member.totalPages}p
          </span>
        </div>
      </div>

      <div className="shrink-0 text-right">
        <div className="text-sm font-black" style={{ color: activeColor }}>
          {metricDisplay(metricValue(member, metric), metric)}
        </div>
      </div>
    </div>
  );
}
