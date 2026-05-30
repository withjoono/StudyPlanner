import { createLazyFileRoute, Link } from '@tanstack/react-router';
import {
  ArrowRight,
  ListChecks,
  Target,
  Repeat,
  TrendingUp,
  BarChart3,
  Timer,
  Wand2,
  CheckCircle2,
  Sparkles,
  Zap,
  Flame,
} from 'lucide-react';

export const Route = createLazyFileRoute('/promo/')({
  component: PromoIndexPage,
});

const VALUE_PROPS = [
  {
    icon: Zap,
    title: '오늘 할 일이 3초 안에 정해진다',
    body: '장기 계획·주간 루틴이 매일 아침 자동으로 오늘 미션으로 펼쳐집니다. 무엇부터 해야 할지 고민하는 시간을 없앴어요.',
  },
  {
    icon: Flame,
    title: '꾸준함이 눈에 보인다',
    body: '학습 시간·달성률·스트릭이 매일 누적됩니다. 친구·반과 비교하는 주간 순위로 동기가 끊기지 않습니다.',
  },
  {
    icon: Sparkles,
    title: '선생님·학부모와 한 데이터로',
    body: 'Hub로 한 번 연동하면 내 학습 기록을 선생님은 채점·코멘트로, 학부모는 ParentAdmin에서 확인할 수 있어요.',
  },
];

const FEATURES = [
  {
    icon: ListChecks,
    title: '금일 계획',
    body: '하루 미션·체크리스트·진행률 — 오늘 한 일을 한눈에',
  },
  { icon: Target, title: '장기 계획', body: '목표·과목·D-day 단위로 장기 학습 로드맵 관리' },
  { icon: Repeat, title: '주간 루틴', body: '요일별 반복 일정을 한 번 설정하면 매주 자동 생성' },
  {
    icon: TrendingUp,
    title: '성장 기록',
    body: '주간 학습 시간·달성률·스트릭·반 순위로 동기 부여',
  },
  { icon: BarChart3, title: '학습 분석', body: '교과별·주차별 시간 분포 시각화로 약점·강점 진단' },
  {
    icon: Timer,
    title: '집중 타이머',
    body: '포모도로 25/50/90분 — 집중 시간이 학습 기록에 자동 적립',
  },
];

const ECOSYSTEM = [
  { name: 'Hub', desc: '계정연동·SSO·일정 공유' },
  { name: 'TeacherAdmin', desc: '담당 선생님의 1~10점 채점·코멘트' },
  { name: 'StudyArena', desc: '학습 시간 기반 그룹 경쟁·랭킹' },
  { name: 'ExamHub', desc: '시험 결과·오답·약점 자동 연결' },
  { name: 'ParentAdmin', desc: '학부모가 보는 자녀 학습 화면' },
];

const READY = [
  '오늘의 미션 추가·완료·진행률',
  '장기 계획·D-day 관리',
  '주간 루틴 반복 일정',
  '포모도로 타이머 25/50/90분',
  '교과별 학습 시간 분석',
  '주간 학습 시간·스트릭·달성률',
  '반·그룹 순위와 비교',
  '선생님 1~10점 채점·비공개 코멘트',
  'Hub·TeacherAdmin·StudyArena 자동 연동',
];

function PromoIndexPage() {
  return (
    <main>
      {/* ===== HERO ===== */}
      <section className="via-background to-background relative overflow-hidden bg-gradient-to-br from-indigo-50">
        <div className="mx-auto max-w-5xl px-6 py-20 text-center sm:px-12 sm:py-28">
          <div className="bg-card text-muted-foreground mb-6 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium">
            <Sparkles className="text-primary h-3.5 w-3.5" />
            거북스쿨 생태계
          </div>
          <h1 className="text-foreground text-4xl font-bold tracking-tight sm:text-6xl">
            오늘 공부, <span className="text-primary">한 줄로 정리</span>
          </h1>
          <p className="text-muted-foreground mx-auto mt-6 max-w-2xl text-lg sm:text-xl">
            학생·선생님·학부모가 함께하는 스마트 학습 플래너 — 장기 목표·주간 루틴·오늘의 미션을
            하나의 흐름으로.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/"
              className="bg-primary text-primary-foreground inline-flex items-center gap-2 rounded-xl px-6 py-3 text-base font-semibold shadow-sm transition-opacity hover:opacity-90"
            >
              시작하기
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="https://www.tskool.kr"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-background text-foreground hover:bg-accent inline-flex items-center rounded-xl border px-6 py-3 text-base font-medium transition-colors"
            >
              Hub에서 가입
            </a>
          </div>
        </div>
      </section>

      {/* ===== VALUE PROPS ===== */}
      <section className="mx-auto max-w-6xl px-6 py-20 sm:px-12">
        <div className="grid gap-5 md:grid-cols-3">
          {VALUE_PROPS.map((v) => {
            const Icon = v.icon;
            return (
              <div key={v.title} className="bg-card rounded-2xl border p-6">
                <div className="bg-primary/10 text-primary mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-foreground text-lg font-semibold">{v.title}</h3>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{v.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ===== FEATURE GRID ===== */}
      <section className="bg-secondary/30 px-6 py-20 sm:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl">
              무엇이 들어 있나
            </h2>
            <p className="text-muted-foreground mx-auto mt-4 max-w-2xl">
              계획부터 회고까지 — 매일 쓰는 7개 도구가 한 화면에 모여 있습니다.
            </p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="bg-card rounded-2xl border p-5">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-foreground text-base font-semibold">{f.title}</h3>
                      <p className="text-muted-foreground mt-1 text-sm leading-relaxed">{f.body}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== ECOSYSTEM ===== */}
      <section className="mx-auto max-w-5xl px-6 py-20 sm:px-12">
        <div className="text-center">
          <h2 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl">
            혼자 쓰는 플래너가 아닙니다
          </h2>
          <p className="text-muted-foreground mx-auto mt-4 max-w-2xl">
            거북스쿨 5개 앱이 한 계정·한 데이터로 묶여 있어, 내 학습이 선생님·학부모·그룹과
            자연스럽게 이어집니다.
          </p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="bg-primary text-primary-foreground rounded-2xl p-5 sm:col-span-2 lg:col-span-1">
            <p className="text-xs font-semibold uppercase tracking-wide opacity-80">중심</p>
            <p className="mt-2 text-lg font-bold">학습 플래너</p>
            <p className="mt-1 text-xs opacity-80">계획 · 실행 · 회고</p>
          </div>
          {ECOSYSTEM.map((e) => (
            <div key={e.name} className="bg-card rounded-2xl border p-5">
              <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
                앱
              </p>
              <p className="text-foreground mt-2 text-lg font-bold">{e.name}</p>
              <p className="text-muted-foreground mt-1 text-xs">{e.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== READY ===== */}
      <section className="bg-secondary/30 px-6 py-20 sm:px-12">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl">
            지금 바로 가능한 것
          </h2>
          <p className="text-muted-foreground mt-4">아래 모든 기능이 작동 중입니다.</p>
        </div>
        <ul className="mx-auto mt-10 grid max-w-3xl gap-2 sm:grid-cols-2">
          {READY.map((r) => (
            <li
              key={r}
              className="bg-card text-foreground flex items-center gap-2 rounded-xl border px-4 py-3 text-sm"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
              {r}
            </li>
          ))}
        </ul>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="mx-auto max-w-3xl px-6 py-20 text-center sm:px-12">
        <div className="bg-primary/10 text-primary inline-flex h-12 w-12 items-center justify-center rounded-2xl">
          <Wand2 className="h-6 w-6" />
        </div>
        <h2 className="text-foreground mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
          첫 미션을 적는 데 30초면 됩니다
        </h2>
        <p className="text-muted-foreground mt-4">
          Hub 계정으로 로그인하고 오늘 할 일을 한 줄 적어보세요. 장기 계획과 주간 루틴은 익숙해진
          다음에 만들어도 늦지 않습니다.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/"
            className="bg-primary text-primary-foreground inline-flex items-center gap-2 rounded-xl px-6 py-3 text-base font-semibold shadow-sm transition-opacity hover:opacity-90"
          >
            시작하기
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
