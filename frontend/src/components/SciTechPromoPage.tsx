/**
 * 과기원 특화 프로모 페이지 (SciTechPromoPage)
 *
 * 비로그인 사용자에게 과기원 입시 특화 기능(생기북, 플래너, 프리미엄 멘토링)을 소개합니다.
 */

import {
  CalendarDays,
  Target,
  BarChart3,
  Users,
  ChevronRight,
  GraduationCap,
  Sparkles,
  CheckCircle,
  BookOpen,
  ArrowRight,
  FlaskConical,
  Microscope,
  Award,
} from 'lucide-react';

const HUB_URL =
  import.meta.env.VITE_HUB_URL ||
  (import.meta.env.PROD ? 'https://www.tskool.kr' : 'http://localhost:5173');

const loginUrl = `${HUB_URL}/login?redirect=${encodeURIComponent(window.location.href)}`;

/* ═══════════════════════════════════════════
   Hero Section
   ═══════════════════════════════════════════ */

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 px-4 py-20 text-white md:py-32">
      {/* 배경 장식 */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute left-1/2 top-1/3 h-48 w-48 -translate-x-1/2 rounded-full bg-blue-400/10 blur-2xl" />
      </div>

      <div className="relative mx-auto max-w-screen-xl">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* 왼쪽: 텍스트 */}
          <div className="animate-fade-in-up text-center lg:text-left">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              국내 유일 과기원 진학 특화 플랫폼
            </div>
            <h1 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight md:text-5xl lg:text-6xl">
              KAIST, GIST 합격의 비밀,
              <br />
              <span className="bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">
                데이터로 증명합니다
              </span>
            </h1>
            <p className="mb-8 max-w-lg text-lg leading-relaxed text-indigo-100 md:text-xl">
              일반 대학과는 다른 과기원만의 깐깐한 평가 기준. 수학/과학 심화 역량부터 R&E 실적까지,
              완벽하게 분석하고 계획하세요.
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row lg:justify-start">
              <a
                href={loginUrl}
                className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 px-8 py-4 text-base font-bold text-slate-900 shadow-xl transition-all hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-emerald-500/30"
              >
                내 과기원 합격률 무료 진단
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </a>
              <span className="text-sm text-indigo-200">1분 만에 AI 분석 시작</span>
            </div>
          </div>

          {/* 오른쪽: Mock 미리보기 */}
          <div
            className="animate-fade-in-up flex justify-center"
            style={{ animationDelay: '0.2s' }}
          >
            <div className="animate-float w-full max-w-md">
              <div className="rounded-2xl border border-white/10 bg-slate-800/80 p-6 shadow-2xl backdrop-blur-md">
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500">
                    <FlaskConical className="h-3.5 w-3.5 text-slate-900" />
                  </div>
                  <span className="text-sm font-bold text-white/90">과기원 합격 예측 리포트</span>
                </div>

                <div className="mb-4 grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 p-3 text-center shadow-lg">
                    <div className="text-lg font-extrabold text-white">상위 12%</div>
                    <div className="text-[10px] font-medium text-indigo-100">수/과 심화 역량</div>
                  </div>
                  <div className="rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 p-3 text-center shadow-lg">
                    <div className="text-lg font-extrabold text-white">우수</div>
                    <div className="text-[10px] font-medium text-teal-100">R&E 탐구 적합도</div>
                  </div>
                </div>

                <div className="space-y-2">
                  {[
                    {
                      title: '[물리] 전자기력 응용 탐구 보고서 완성',
                      color: '#14b8a6',
                      done: true,
                    },
                    { title: 'KAIST 자소서 1번 문항 초안 작성', color: '#8b5cf6', done: false },
                    { title: '수학 심화 미적분 기출 분석', color: '#3b82f6', done: false },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2"
                    >
                      <div
                        className="h-6 w-1 flex-shrink-0 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <div className="min-w-0 flex-1">
                        <p
                          className={`truncate text-xs font-medium ${item.done ? 'text-white/50 line-through' : 'text-white/90'}`}
                        >
                          {item.title}
                        </p>
                      </div>
                      {item.done ? (
                        <CheckCircle className="h-4 w-4 flex-shrink-0 text-emerald-400" />
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
        <div className={reversed ? 'lg:[direction:ltr]' : ''}>
          <div
            className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl ${iconBg}`}
          >
            {icon}
          </div>
          <h2 className="mb-4 text-2xl font-extrabold text-slate-900 md:text-3xl">{title}</h2>
          <p className="mb-6 text-lg leading-relaxed text-slate-600">{description}</p>
          <ul className="space-y-3">
            {highlights.map((h, i) => (
              <li key={i} className="flex items-start gap-3">
                <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-teal-500" />
                <span className="text-slate-700">{h}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className={reversed ? 'lg:[direction:ltr]' : ''}>{preview}</div>
      </div>
    </section>
  );
}

function SanggibookPreview() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/50">
      <div className="mb-4 text-sm font-bold text-slate-900">
        🔬 과기원 입학사정관 AI 분석 리포트
      </div>
      <div className="space-y-3">
        {[
          { label: '수학 심화 학업역량', score: 95, color: 'bg-indigo-500' },
          { label: '과학 탐구(R&E) 실적', score: 88, color: 'bg-teal-500' },
          { label: '논리적 문제해결력', score: 92, color: 'bg-blue-500' },
        ].map((item) => (
          <div key={item.label}>
            <div className="mb-1 flex justify-between text-xs font-semibold text-slate-700">
              <span>{item.label}</span>
              <span className="text-slate-900">{item.score}점</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div className={`h-full ${item.color}`} style={{ width: `${item.score}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-lg bg-indigo-50 p-3">
        <p className="text-xs font-medium leading-relaxed text-indigo-900">
          "물리학Ⅱ 교과에서의 심화 탐구 활동이 돋보입니다. 다만, 프로그래밍 역량을 어필할 수 있는
          동아리 활동 내용 보완이 필요합니다."
        </p>
      </div>
    </div>
  );
}

function PlannerPreview() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/50">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-bold text-slate-900">📅 과기원 심화 학습 플래너</span>
        <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-bold text-teal-600">
          D-210
        </span>
      </div>
      <div className="relative ml-3 border-l-2 border-slate-100 pl-4">
        {[
          {
            time: '14:00',
            subj: 'R&E',
            title: '초전도체 현상 논문 리뷰',
            color: '#14b8a6',
            done: true,
          },
          {
            time: '16:00',
            subj: '수학',
            title: '고급수학 심화 문제 풀이',
            color: '#6366f1',
            done: false,
          },
          {
            time: '19:00',
            subj: '면접',
            title: 'GIST 기출 제시문 면접 연습',
            color: '#8b5cf6',
            done: false,
          },
        ].map((item) => (
          <div key={item.title} className="relative mb-4 last:mb-0">
            <div
              className="absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 border-white"
              style={{ backgroundColor: item.color }}
            />
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400">{item.time}</span>
              <span
                className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-white"
                style={{ backgroundColor: item.color }}
              >
                {item.subj}
              </span>
            </div>
            <p
              className={`mt-0.5 text-sm font-medium ${item.done ? 'text-slate-400 line-through' : 'text-slate-800'}`}
            >
              {item.title}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Consulting Upsell Section
   ═══════════════════════════════════════════ */

function ConsultingSection() {
  return (
    <section className="bg-slate-50 px-4 py-16 md:py-24">
      <div className="mx-auto max-w-screen-xl">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
              <Award className="h-4 w-4" />
              프리미엄 1:1 컨설팅
            </div>
            <h2 className="mb-4 text-3xl font-extrabold text-slate-900 md:text-4xl">
              AI의 정교한 데이터 위에서,
              <br />
              <span className="text-indigo-600">최상위 전문가의 터치</span>를 더하세요
            </h2>
            <p className="mb-6 text-lg text-slate-600">
              과기원 입시는 미묘한 디테일이 합격을 가릅니다. 플랫폼에서 수집된 데이터를 바탕으로,
              무면접 전형부터 자소서 대필까지 과기원 전문 컨설턴트가 1:1로 밀착 관리합니다.
            </p>
            <ul className="mb-8 space-y-2 text-slate-600">
              <li>• 과기원 입학사정관 출신 및 전문 멘토진</li>
              <li>• 무면접 전형 완벽 대비 (특수 자소서 대필)</li>
              <li>• R&E 포트폴리오 기획 및 첨삭 가이드</li>
            </ul>
            <a
              href="#"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 font-bold text-white transition-colors hover:bg-slate-800"
            >
              전문가 1:1 컨설팅 문의하기
              <ChevronRight className="h-4 w-4" />
            </a>
          </div>
          <div className="relative">
            <div className="aspect-video overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">
              <div className="flex h-full items-center justify-center rounded-xl bg-slate-100">
                <Users className="h-16 w-16 text-slate-300" />
                <span className="ml-4 text-xl font-bold text-slate-400">1:1 화상 멘토링 화면</span>
              </div>
            </div>
            <div className="absolute -bottom-6 -left-6 rounded-xl border border-slate-100 bg-white p-4 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <div>
                  <div className="font-bold text-slate-900">KAIST 합격!</div>
                  <div className="text-xs text-slate-500">2026학년도 일반전형</div>
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
   Final CTA & Footer
   ═══════════════════════════════════════════ */

function FinalCTA() {
  return (
    <section className="relative overflow-hidden bg-slate-900 px-4 py-16 text-center text-white md:py-24">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
      </div>
      <div className="relative mx-auto max-w-2xl">
        <h2 className="mb-4 text-3xl font-extrabold md:text-4xl">지금 바로 합격률을 확인하세요</h2>
        <p className="mb-8 text-lg text-slate-300">
          지금 가입하면 과기원 전용 생기부 AI 진단 1회를 무료로 제공합니다.
        </p>
        <a
          href={loginUrl}
          className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 px-10 py-4 text-lg font-bold text-slate-900 shadow-xl transition-all hover:-translate-y-0.5 hover:shadow-2xl"
        >
          무료로 플랫폼 시작하기
          <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
        </a>
      </div>
    </section>
  );
}

function PromoFooter() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 px-4 py-8 text-center text-slate-400">
      <div className="mx-auto max-w-screen-xl">
        <div className="mb-2 flex items-center justify-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500">
            <FlaskConical className="h-3.5 w-3.5 text-slate-900" />
          </div>
          <span className="text-sm font-bold text-slate-200">과기원 특화 플랫폼</span>
        </div>
        <p className="text-xs">
          © 2026 T Skool x Kwakiwon. KAIST, GIST 등 과학기술원 전문 입시 플랫폼.
        </p>
      </div>
    </footer>
  );
}

/* ═══════════════════════════════════════════
   Main Export
   ═══════════════════════════════════════════ */

export default function SciTechPromoPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      <HeroSection />

      <FeatureSection
        icon={<Microscope className="h-6 w-6 text-indigo-600" />}
        iconBg="bg-indigo-100"
        title="과기원 전용 생기북 — AI 진단"
        description="일반 대학과는 다른 과기원의 깐깐한 평가 기준. AI가 수학/과학 심화 역량과 탐구 능력을 중심으로 내 생기부의 과기원 적합성을 냉철하게 분석합니다."
        highlights={[
          '수학/과학 교과 심화 역량 중점 분석',
          'R&E 및 탐구 활동 키워드 추출',
          'KAIST, GIST 등 목표 대학별 맞춤 진단',
        ]}
        preview={<SanggibookPreview />}
      />

      <div className="mx-auto max-w-screen-xl px-4">
        <div className="h-px bg-slate-100" />
      </div>

      <FeatureSection
        icon={<Target className="h-6 w-6 text-teal-600" />}
        iconBg="bg-teal-100"
        title="과기원 맞춤 플래너 — 탐구를 계획하다"
        description="단순한 수능 공부를 넘어, 논문 리뷰, 실험 스터디, 심화 기출 분석 등 과기원 진학에 반드시 필요한 깊이 있는 학습을 체계적으로 관리합니다."
        highlights={[
          '논문/탐구 활동 일정 관리',
          '과기원 기출/면접 준비 타임라인',
          '루틴화를 통한 꾸준한 탐구력 향상',
        ]}
        preview={<PlannerPreview />}
        reversed
      />

      <ConsultingSection />
      <FinalCTA />
      <PromoFooter />
    </div>
  );
}
