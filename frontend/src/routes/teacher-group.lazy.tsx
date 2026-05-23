/**
 * 담당 선생님 그룹 — /teacher-group
 *
 * 선생님이 학생 플래너를 검사하고 매긴 1~10점 평가를
 * 같은 담당 선생님 반 학생들끼리 비교하는 경쟁 리더보드.
 * - 일간 / 주간 / 월간 기간 전환
 * - 선생님 점수 · 학습시간 · 분량 3개 지표 비교 차트
 * - 내가 받은 평가(점수 + 코멘트) 확인
 */

import { createLazyFileRoute } from '@tanstack/react-router';
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
import { GraduationCap, Loader2, MessageSquareText, Star, Trophy } from 'lucide-react';
import {
  useTeacherGroupLeaderboard,
  type TeacherGroupMember,
  type TeacherGroupPeriod,
} from '@/stores/server/teacher-group';

export const Route = createLazyFileRoute('/teacher-group')({
  component: TeacherGroupPage,
});

type Metric = 'score' | 'minutes' | 'pages';

const PERIODS: { value: TeacherGroupPeriod; label: string }[] = [
  { value: 'daily', label: '일간' },
  { value: 'weekly', label: '주간' },
  { value: 'monthly', label: '월간' },
];

const METRICS: { value: Metric; label: string; color: string }[] = [
  { value: 'score', label: '선생님 점수', color: '#6366f1' },
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

function fmtDate(iso: string): string {
  const parts = iso.split('-');
  if (parts.length !== 3) return iso;
  return `${Number(parts[1])}월 ${Number(parts[2])}일`;
}

function metricValue(m: TeacherGroupMember, metric: Metric): number {
  if (metric === 'score') return m.avgScore;
  if (metric === 'minutes') return m.studyMinutes;
  return m.totalPages;
}

function metricDisplay(value: number, metric: Metric): string {
  if (metric === 'score') return `${value} / 10`;
  if (metric === 'minutes') return fmtMinutes(value);
  return `${value}p`;
}

function TeacherGroupPage() {
  const [period, setPeriod] = useState<TeacherGroupPeriod>('weekly');
  const [metric, setMetric] = useState<Metric>('score');
  const { data, isLoading, error } = useTeacherGroupLeaderboard(period);

  const activeMetric = METRICS.find((x) => x.value === metric) ?? METRICS[0];

  const ranked = useMemo(() => {
    const list = data?.members ? [...data.members] : [];
    list.sort((a, b) => metricValue(b, metric) - metricValue(a, metric));
    return list;
  }, [data?.members, metric]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error || !data || !data.hasTeacher) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50">
          <GraduationCap className="h-8 w-8 text-indigo-400" />
        </div>
        <h2 className="mb-2 text-xl font-bold text-gray-800">아직 담당 선생님이 없어요</h2>
        <p className="text-sm leading-relaxed text-gray-500">
          담당 선생님과 계정이 연동되면, 선생님이 매긴 플래너 점수를 같은 반 친구들과 비교하며
          경쟁할 수 있어요.
        </p>
      </div>
    );
  }

  const me = data.members.find((m) => m.isMe) ?? null;
  const classAvg =
    metric === 'score'
      ? data.classAverage.score
      : metric === 'minutes'
        ? data.classAverage.studyMinutes
        : data.classAverage.totalPages;

  const chartData = ranked.map((m) => ({
    name: m.name.length > 5 ? `${m.name.slice(0, 5)}…` : m.name,
    fullName: m.name,
    value: metricValue(m, metric),
    isMe: m.isMe,
  }));

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-6">
      {/* 헤더 */}
      <div className="mb-5">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-indigo-600" />
          <h1 className="text-xl font-black text-gray-900">담당 선생님 그룹</h1>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          {data.teacherName} 선생님 · 전체 {data.totalMembers}명 · 선생님이 매긴 점수로 경쟁해요
        </p>
      </div>

      {/* 내 현황 */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatChip
          label="내 순위"
          value={data.myRank ? `${data.myRank}위` : '-'}
          sub={`선생님 점수 기준 · 전체 ${data.totalMembers}명`}
          tone="indigo"
        />
        <StatChip
          label="선생님 점수"
          value={me ? `${me.avgScore}점` : '-'}
          sub={me && me.ratingCount > 0 ? `${me.ratingCount}회 평가 평균` : '평가 없음'}
          tone="violet"
        />
        <StatChip
          label="학습시간"
          value={me ? fmtMinutes(me.studyMinutes) : '-'}
          sub="기간 합계"
          tone="emerald"
        />
        <StatChip
          label="분량"
          value={me ? `${me.totalPages}p` : '-'}
          sub="기간 합계"
          tone="amber"
        />
      </div>

      {/* 기간 토글 */}
      <div className="mb-4 inline-flex rounded-xl bg-gray-100 p-1">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
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

        <ResponsiveContainer width="100%" height={280}>
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
              domain={metric === 'score' ? [0, 10] : [0, 'auto']}
              allowDecimals={false}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: '#f8fafc' }}
              formatter={(value: number | string) => [
                metricDisplay(Number(value), metric),
                activeMetric.label,
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
            {classAvg > 0 && (
              <ReferenceLine
                y={classAvg}
                stroke={activeMetric.color}
                strokeDasharray="4 4"
                strokeOpacity={0.7}
              />
            )}
            <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={52}>
              {chartData.map((d, i) => (
                <Cell key={i} fill={d.isMe ? activeMetric.color : `${activeMetric.color}55`} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <p className="mt-2 text-center text-xs text-gray-400">
          진한 막대가 내 기록이에요 · 점선은 반 평균
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-12">
        {/* 순위 리스트 */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm lg:col-span-7">
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-gray-800">
            <Trophy className="h-4 w-4 text-amber-500" />
            순위 · {activeMetric.label} 기준
          </h2>
          <div className="space-y-1.5">
            {ranked.map((m, idx) => (
              <LeaderRow
                key={m.studentId}
                member={m}
                position={idx + 1}
                metric={metric}
                activeColor={activeMetric.color}
              />
            ))}
          </div>
        </div>

        {/* 내 평가 */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm lg:col-span-5">
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-gray-800">
            <MessageSquareText className="h-4 w-4 text-indigo-500" />
            내가 받은 선생님 평가
          </h2>
          {data.myRatings.length === 0 ? (
            <div className="rounded-xl bg-gray-50 py-10 text-center">
              <MessageSquareText className="mx-auto mb-2 h-7 w-7 text-gray-300" />
              <p className="text-xs text-gray-400">이번 기간에 받은 평가가 아직 없어요</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {data.myRatings.map((r) => (
                <div key={r.date} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500">{fmtDate(r.date)}</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-2 py-0.5 text-xs font-bold text-white">
                      <Star className="h-3 w-3" />
                      {r.score} / 10
                    </span>
                  </div>
                  {r.comment ? (
                    <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                      {r.comment}
                    </p>
                  ) : (
                    <p className="mt-1.5 text-xs italic text-gray-400">코멘트 없음</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- 하위 컴포넌트 ---------- */

const TONES: Record<string, string> = {
  indigo: 'bg-indigo-50 text-indigo-600',
  violet: 'bg-violet-50 text-violet-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
};

function StatChip({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm">
      <div
        className={`mb-2 inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold ${
          TONES[tone] ?? TONES.indigo
        }`}
      >
        {label}
      </div>
      <div className="text-lg font-black leading-tight text-gray-900">{value}</div>
      <div className="mt-0.5 text-[11px] leading-snug text-gray-400">{sub}</div>
    </div>
  );
}

function LeaderRow({
  member,
  position,
  metric,
  activeColor,
}: {
  member: TeacherGroupMember;
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
            점수 {member.avgScore}
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
        {metric === 'score' && member.ratingCount > 0 && (
          <div className="text-[10px] text-gray-400">{member.ratingCount}회 평가</div>
        )}
      </div>
    </div>
  );
}
