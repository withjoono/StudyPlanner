/**
 * StudyPlanner 프로모 페이지
 *
 * 비로그인 사용자에게 StudyPlanner의 핵심 기능을 소개하는 프리미엄 랜딩 페이지입니다.
 */

import {
  CalendarDays,
  Target,
  TrendingUp,
  Clock,
  RotateCcw,
  BarChart3,
  Timer,
  Users,
  MessageSquare,
  ChevronRight,
  GraduationCap,
  Sparkles,
  CheckCircle,
  BookOpen,
  ArrowRight,
} from 'lucide-react';

const HUB_URL =
  import.meta.env.VITE_HUB_URL ||
  (import.meta.env.PROD ? 'https://geobukschool.kr' : 'http://localhost:5173');

const loginUrl = `${HUB_URL}/login?redirect=${encodeURIComponent(window.location.href)}`;

/* ═══════════════════════════════════════════
   Hero Section
   ═══════════════════════════════════════════ */

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-800 px-4 py-20 text-white md:py-32">
      {/* 배경 장식 */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-indigo-400/10 blur-3xl" />
        <div className="absolute left-1/2 top-1/3 h-48 w-48 -translate-x-1/2 rounded-full bg-blue-300/10 blur-2xl" />
      </div>

      <div className="relative mx-auto max-w-screen-xl">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* 왼쪽: 텍스트 */}
          <div className="animate-fade-in-up text-center lg:text-left">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-yellow-300" />
              AI 기반 스마트 학습 플래너
            </div>
            <h1 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight md:text-5xl lg:text-6xl">
              학습의 모든 것을,
              <br />
              <span className="bg-gradient-to-r from-yellow-300 to-amber-300 bg-clip-text text-transparent">
                하나의 플래너로
              </span>
            </h1>
            <p className="mb-8 max-w-lg text-lg leading-relaxed text-blue-100 md:text-xl">
              금일계획부터 장기목표까지, 학생·선생님·학부모가 함께 만들어가는 스마트 학습 플래너를
              경험하세요.
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row lg:justify-start">
              <a
                href={loginUrl}
                className="group inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-4 text-base font-bold text-indigo-700 shadow-xl shadow-indigo-900/20 transition-all hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-indigo-900/30"
              >
                지금 시작하기
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </a>
              <span className="text-sm text-blue-200">무료로 시작 · 설치 불필요</span>
            </div>
          </div>

          {/* 오른쪽: Mock 대시보드 미리보기 */}
          <div
            className="animate-fade-in-up flex justify-center"
            style={{ animationDelay: '0.2s' }}
          >
            <div className="animate-float w-full max-w-md">
              {/* 미니 대시보드 카드 */}
              <div className="rounded-2xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-md">
                {/* 상단바 */}
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-400">
                    <GraduationCap className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="text-sm font-bold text-white/90">Study Planner</span>
                  <div className="ml-auto flex gap-1">
                    <div className="h-2 w-2 rounded-full bg-red-400" />
                    <div className="h-2 w-2 rounded-full bg-yellow-400" />
                    <div className="h-2 w-2 rounded-full bg-green-400" />
                  </div>
                </div>

                {/* 통계 카드 모음 */}
                <div className="mb-4 grid grid-cols-3 gap-2">
                  {[
                    { label: '오늘 미션', value: '5/8', color: 'from-blue-400 to-blue-500' },
                    { label: '성취도', value: '72%', color: 'from-emerald-400 to-emerald-500' },
                    { label: '클래스 순위', value: '3위', color: 'from-amber-400 to-amber-500' },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className={`rounded-xl bg-gradient-to-br ${stat.color} p-3 text-center shadow-lg`}
                    >
                      <div className="text-lg font-extrabold text-white">{stat.value}</div>
                      <div className="text-[10px] font-medium text-white/80">{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* 타임라인 미리보기 */}
                <div className="space-y-2">
                  {[
                    { time: '09:00', title: '수학 - 미적분 문제풀이', color: '#eab308', prog: 100 },
                    { time: '11:00', title: '영어 - 독해 연습', color: '#f97316', prog: 60 },
                    { time: '14:00', title: '과학 - 물리 실험 정리', color: '#14b8a6', prog: 0 },
                  ].map((item) => (
                    <div
                      key={item.time}
                      className="flex items-center gap-3 rounded-lg bg-white/10 px-3 py-2"
                    >
                      <span className="w-10 text-xs font-medium text-white/60">{item.time}</span>
                      <div
                        className="h-6 w-1 flex-shrink-0 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-white/90">{item.title}</p>
                      </div>
                      {item.prog >= 100 ? (
                        <CheckCircle className="h-4 w-4 flex-shrink-0 text-green-400" />
                      ) : item.prog > 0 ? (
                        <span className="flex-shrink-0 text-[10px] font-bold text-yellow-300">
                          {item.prog}%
                        </span>
                      ) : (
                        <div className="h-3 w-3 flex-shrink-0 rounded-full border border-white/30" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   Feature Cards
   ═══════════════════════════════════════════ */

interface FeatureProps {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
  highlights: string[];
  preview: React.ReactNode;
  reversed?: boolean;
}

function FeatureSection({
  icon,
  iconBg,
  title,
  description,
  highlights,
  preview,
  reversed,
}: FeatureProps) {
  return (
    <section className="mx-auto max-w-screen-xl px-4 py-16 md:py-24">
      <div
        className={`grid items-center gap-12 lg:grid-cols-2 ${reversed ? 'lg:[direction:rtl]' : ''}`}
      >
        {/* 텍스트 */}
        <div className={reversed ? 'lg:[direction:ltr]' : ''}>
          <div
            className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl ${iconBg}`}
          >
            {icon}
          </div>
          <h2 className="mb-4 text-2xl font-extrabold text-gray-900 md:text-3xl">{title}</h2>
          <p className="mb-6 text-lg leading-relaxed text-gray-600">{description}</p>
          <ul className="space-y-3">
            {highlights.map((h, i) => (
              <li key={i} className="flex items-start gap-3">
                <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-indigo-500" />
                <span className="text-gray-700">{h}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 미리보기 */}
        <div className={reversed ? 'lg:[direction:ltr]' : ''}>{preview}</div>
      </div>
    </section>
  );
}

/* ── 미리보기 UI 조각들 ── */

function DailyPlanPreview() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xl shadow-gray-200/50">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-gray-900">19</span>
          <div>
            <div className="text-xs text-gray-500">2026년 2월</div>
            <div className="text-xs font-medium text-indigo-600">오늘</div>
          </div>
        </div>
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">
          5/8 완료
        </span>
      </div>
      {/* Mini timeline */}
      <div className="relative ml-3 border-l-2 border-gray-100 pl-4">
        {[
          { t: '09:00', s: '국어', title: '비문학 독해 3세트', c: '#ef4444', done: true },
          { t: '11:00', s: '수학', title: '미적분 개념 정리', c: '#eab308', done: true },
          { t: '14:00', s: '영어', title: '모의고사 풀이', c: '#f97316', done: false },
          { t: '16:00', s: '과학', title: '화학 문제은행', c: '#14b8a6', done: false },
        ].map((item) => (
          <div key={item.t} className="relative mb-4 last:mb-0">
            <div
              className="absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 border-white"
              style={{ backgroundColor: item.c }}
            />
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400">{item.t}</span>
              <span
                className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-white"
                style={{ backgroundColor: item.c }}
              >
                {item.s}
              </span>
            </div>
            <p
              className={`mt-0.5 text-sm font-medium ${item.done ? 'text-gray-400 line-through' : 'text-gray-800'}`}
            >
              {item.title}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function LongTermPlanPreview() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xl shadow-gray-200/50">
      <div className="mb-4 text-sm font-bold text-gray-900">📅 2026학년도 학습 로드맵</div>
      <div className="space-y-3">
        {[
          { month: '3월', goal: 'EBS 수능특강 1회독', prog: 85 },
          { month: '5월', goal: '모의고사 분석 완료', prog: 60 },
          { month: '7월', goal: '수능완성 시작', prog: 20 },
          { month: '9월', goal: '실전모의고사 주간', prog: 0 },
        ].map((item) => (
          <div key={item.month} className="rounded-lg bg-gray-50 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-700">
                  {item.month}
                </span>
                <span className="text-sm font-medium text-gray-800">{item.goal}</span>
              </div>
              <span
                className={`text-xs font-bold ${item.prog > 0 ? 'text-indigo-600' : 'text-gray-400'}`}
              >
                {item.prog}%
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all"
                style={{ width: `${item.prog}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WeeklyRoutinePreview() {
  const days = ['월', '화', '수', '목', '금', '토', '일'];
  const routineData = [
    [1, 1, 1, 0, 0],
    [1, 0, 1, 1, 0],
    [1, 1, 0, 1, 0],
    [0, 1, 1, 1, 0],
    [1, 1, 1, 1, 1],
    [0, 0, 1, 0, 1],
    [0, 0, 0, 0, 1],
  ];
  const subjects = ['국어', '수학', '영어', '과학', '자습'];
  const colors = ['#ef4444', '#eab308', '#f97316', '#14b8a6', '#8b5cf6'];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xl shadow-gray-200/50">
      <div className="mb-4 text-sm font-bold text-gray-900">🔄 주간 학습 루틴</div>
      <div className="overflow-x-auto">
        <table className="w-full text-center text-xs">
          <thead>
            <tr>
              <th className="pb-2 text-left text-gray-500" />
              {days.map((d) => (
                <th key={d} className="pb-2 font-semibold text-gray-600">
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {subjects.map((sub, si) => (
              <tr key={sub}>
                <td className="py-1 pr-2 text-left">
                  <span
                    className="inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold text-white"
                    style={{ backgroundColor: colors[si] }}
                  >
                    {sub}
                  </span>
                </td>
                {routineData.map((day, di) => (
                  <td key={di} className="py-1">
                    {day[si] ? (
                      <div
                        className="mx-auto h-4 w-4 rounded"
                        style={{ backgroundColor: colors[si], opacity: 0.7 }}
                      />
                    ) : (
                      <div className="mx-auto h-4 w-4 rounded bg-gray-100" />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AnalyticsPreview() {
  const data = [
    { subject: '국어', hours: 12, color: '#ef4444' },
    { subject: '수학', hours: 18, color: '#eab308' },
    { subject: '영어', hours: 10, color: '#f97316' },
    { subject: '과학', hours: 14, color: '#14b8a6' },
    { subject: '한국사', hours: 6, color: '#a855f7' },
  ];
  const maxH = Math.max(...data.map((d) => d.hours));

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xl shadow-gray-200/50">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-bold text-gray-900">📊 주간 학습 분석</span>
        <span className="text-xs text-gray-500">총 60시간</span>
      </div>
      <div className="flex items-end justify-between gap-2" style={{ height: '120px' }}>
        {data.map((d) => (
          <div key={d.subject} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-[10px] font-bold" style={{ color: d.color }}>
              {d.hours}h
            </span>
            <div
              className="w-full overflow-hidden rounded-t-md bg-gray-100"
              style={{ height: '80px' }}
            >
              <div
                className="mt-auto w-full rounded-t-md transition-all"
                style={{
                  backgroundColor: d.color,
                  height: `${(d.hours / maxH) * 100}%`,
                  marginTop: `${100 - (d.hours / maxH) * 100}%`,
                  opacity: 0.8,
                }}
              />
            </div>
            <span className="text-[10px] font-medium text-gray-600">{d.subject}</span>
          </div>
        ))}
      </div>
      {/* 트렌드 지표 */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        {[
          { label: '전주 대비', value: '+12%', positive: true },
          { label: '목표 달성률', value: '78%', positive: true },
          { label: '집중도', value: '85점', positive: true },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg bg-gray-50 p-2 text-center">
            <div className="text-xs font-bold text-emerald-600">{stat.value}</div>
            <div className="text-[10px] text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TimerPreview() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xl shadow-gray-200/50">
      <div className="mb-4 text-sm font-bold text-gray-900">⏱️ 집중 타이머</div>
      <div className="flex flex-col items-center">
        {/* Circular timer */}
        <div className="relative mb-4">
          <svg width="160" height="160" viewBox="0 0 160 160">
            <circle cx="80" cy="80" r="70" fill="none" stroke="#e5e7eb" strokeWidth="8" />
            <circle
              cx="80"
              cy="80"
              r="70"
              fill="none"
              stroke="url(#timerGrad)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 70 * 0.6} ${2 * Math.PI * 70 * 0.4}`}
              transform="rotate(-90 80 80)"
            />
            <defs>
              <linearGradient id="timerGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-extrabold tracking-tight text-gray-900">15:00</span>
            <span className="text-xs text-gray-500">남은 시간</span>
          </div>
        </div>
        <div className="mb-3 rounded-full bg-indigo-50 px-4 py-1.5 text-xs font-semibold text-indigo-600">
          🍅 포모도로 3/4 세션
        </div>
        <div className="grid w-full grid-cols-2 gap-2">
          <div className="rounded-lg bg-gray-50 p-2 text-center">
            <div className="text-sm font-bold text-gray-900">2h 15m</div>
            <div className="text-[10px] text-gray-500">오늘 총 학습</div>
          </div>
          <div className="rounded-lg bg-gray-50 p-2 text-center">
            <div className="text-sm font-bold text-gray-900">95점</div>
            <div className="text-[10px] text-gray-500">집중 점수</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Collaboration Section
   ═══════════════════════════════════════════ */

function CollaborationSection() {
  return (
    <section className="bg-gradient-to-b from-gray-50 to-white px-4 py-16 md:py-24">
      <div className="mx-auto max-w-screen-xl">
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-600">
            <Users className="h-4 w-4" />
            협업 기능
          </div>
          <h2 className="mb-4 text-2xl font-extrabold text-gray-900 md:text-4xl">
            학생 · 선생님 · 학부모가
            <br />
            <span className="text-indigo-600">함께 만들어가는</span> 학습 플래너
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            각자의 역할에 맞는 맞춤 기능으로, 학습의 모든 과정을 소통하고 관리합니다.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* 학생 */}
          <div className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-lg shadow-emerald-200">
              <BookOpen className="h-7 w-7" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-gray-900">학생</h3>
            <p className="mb-4 text-sm leading-relaxed text-gray-600">
              하루 일정을 계획하고, 과목별 미션을 관리하며, 성취도를 실시간으로 확인합니다.
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                24시간 일간 타임라인
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                과목별 미션 & 성취도 추적
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                포모도로 집중 타이머
              </li>
            </ul>
          </div>

          {/* 선생님 */}
          <div className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-400 to-indigo-600 text-white shadow-lg shadow-indigo-200">
              <GraduationCap className="h-7 w-7" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-gray-900">선생님</h3>
            <p className="mb-4 text-sm leading-relaxed text-gray-600">
              담당 학생의 플래너를 확인하고, 코멘트를 남기고, 학습 진도를 관리합니다.
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                학생 플래너 조회 & 코멘트
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                학습 진도 모니터링
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                과목별 피드백 & 쪽지
              </li>
            </ul>
          </div>

          {/* 학부모 */}
          <div className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-lg shadow-amber-200">
              <Users className="h-7 w-7" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-gray-900">학부모</h3>
            <p className="mb-4 text-sm leading-relaxed text-gray-600">
              자녀의 학습 현황을 한눈에 확인하고, 선생님과 함께 학습을 지원합니다.
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                자녀 플래너 열람 & 응원 메시지
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                학습 성취도 리포트
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                선생님과 비공개 소통
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   Final CTA
   ═══════════════════════════════════════════ */

function FinalCTA() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-16 text-center text-white md:py-24">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-indigo-400/10 blur-3xl" />
      </div>
      <div className="relative mx-auto max-w-2xl">
        <h2 className="mb-4 text-3xl font-extrabold md:text-4xl">지금 바로 시작하세요</h2>
        <p className="mb-8 text-lg text-blue-100">
          무료 계정으로 스마트 학습 플래너의 모든 기능을 경험해보세요.
          <br />
          학생, 선생님, 학부모 모두를 위한 올인원 학습 관리 도구입니다.
        </p>
        <a
          href={loginUrl}
          className="group inline-flex items-center gap-2 rounded-2xl bg-white px-10 py-4 text-lg font-bold text-indigo-700 shadow-xl transition-all hover:-translate-y-0.5 hover:shadow-2xl"
        >
          무료로 시작하기
          <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
        </a>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   Footer
   ═══════════════════════════════════════════ */

function PromoFooter() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50 px-4 py-8 text-center">
      <div className="mx-auto max-w-screen-xl">
        <div className="mb-2 flex items-center justify-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-600">
            <GraduationCap className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm font-bold text-gray-700">Study Planner</span>
        </div>
        <p className="text-xs text-gray-500">
          © 2026 G Skool. 학생, 선생님, 학부모를 위한 스마트 학습 플래너.
        </p>
      </div>
    </footer>
  );
}

/* ═══════════════════════════════════════════
   Main Export
   ═══════════════════════════════════════════ */

export default function PromoPage() {
  return (
    <div className="min-h-screen">
      <HeroSection />

      {/* 구분선 */}
      <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

      {/* 기능 소개 */}
      <FeatureSection
        icon={<CalendarDays className="h-6 w-6 text-blue-600" />}
        iconBg="bg-blue-100"
        title="금일계획 — 하루를 완벽하게 설계"
        description="24시간 타임라인에 과목별 미션을 배치하고, 실시간으로 진행률을 추적합니다. 시간 블록으로 학습 몰입도를 높여보세요."
        highlights={[
          '24시간 일간 타임라인 캘린더',
          '과목별 컬러 코딩 & 진행률 트래킹',
          '완료/미완료 한눈에 확인',
        ]}
        preview={<DailyPlanPreview />}
      />

      <div className="mx-auto max-w-screen-xl px-4">
        <div className="h-px bg-gray-100" />
      </div>

      <FeatureSection
        icon={<Target className="h-6 w-6 text-violet-600" />}
        iconBg="bg-violet-100"
        title="장기계획 — 큰 그림을 그리다"
        description="월간, 학기별 학습 목표를 설정하고 달성률을 추적합니다. 수능까지의 로드맵을 체계적으로 관리하세요."
        highlights={['월간/학기별 목표 설정', '진행률 프로그래스 바', '과목별 시간 배분 관리']}
        preview={<LongTermPlanPreview />}
        reversed
      />

      <div className="mx-auto max-w-screen-xl px-4">
        <div className="h-px bg-gray-100" />
      </div>

      <FeatureSection
        icon={<RotateCcw className="h-6 w-6 text-teal-600" />}
        iconBg="bg-teal-100"
        title="주간루틴 — 반복으로 습관을 만들다"
        description="요일별 반복 일정을 설정하면 매주 자동으로 플래너에 반영됩니다. 꾸준한 학습 패턴이 성적 향상의 핵심입니다."
        highlights={['요일별 반복 일정 자동화', '과목 X 요일 매트릭스 뷰', '학습 패턴 최적화']}
        preview={<WeeklyRoutinePreview />}
      />

      <div className="mx-auto max-w-screen-xl px-4">
        <div className="h-px bg-gray-100" />
      </div>

      <FeatureSection
        icon={<BarChart3 className="h-6 w-6 text-emerald-600" />}
        iconBg="bg-emerald-100"
        title="학습분석 — 데이터로 성장하다"
        description="과목별 학습 시간, 성취도 추이, 전주 대비 변화를 차트로 확인합니다. 자신만의 학습 패턴을 발견하세요."
        highlights={[
          '과목별 학습 시간 분석 차트',
          '주간/월간 트렌드 분석',
          '목표 달성률 & 집중도 점수',
        ]}
        preview={<AnalyticsPreview />}
        reversed
      />

      <div className="mx-auto max-w-screen-xl px-4">
        <div className="h-px bg-gray-100" />
      </div>

      <FeatureSection
        icon={<Timer className="h-6 w-6 text-rose-600" />}
        iconBg="bg-rose-100"
        title="집중 타이머 — 몰입의 시간"
        description="포모도로 기법 기반 집중 타이머로 학습 시간을 자동 기록하고, 집중도 점수로 자신의 몰입력을 측정합니다."
        highlights={[
          '포모도로 기법 기반 25분 집중 세션',
          '학습 시간 자동 기록',
          '집중 점수 & 통계 분석',
        ]}
        preview={<TimerPreview />}
      />

      {/* 협업 섹션 */}
      <CollaborationSection />

      {/* 최종 CTA */}
      <FinalCTA />

      {/* Footer */}
      <PromoFooter />
    </div>
  );
}
