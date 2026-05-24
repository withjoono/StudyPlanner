/**
 * 온보딩 코치마크 투어.
 * 거북 마스코트가 말풍선으로 핵심 메뉴를 단계별로 안내한다.
 * - 첫 로그인 시 자동 실행, 이후엔 플로팅 거북 버튼으로 다시 볼 수 있다.
 * - 대상 메뉴를 스포트라이트로 강조하고, 화면 폭에 따라 말풍선 위치를 잡는다.
 * - 모바일에서 대상이 보이지 않으면 화면 중앙 카드로 자연스럽게 대체된다.
 */
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useOnboardingStore } from '@/stores/client/use-onboarding-store';
import { TurtleMascot, type TurtleMood } from './TurtleMascot';

interface TourStep {
  id: string;
  title: string;
  body: string;
  mood: TurtleMood;
  /** 강조할 요소 후보 셀렉터(먼저 발견되는 것 사용). 없으면 화면 중앙 카드. */
  selectors?: string[];
}

const NAV = (path: string) => [
  `[data-tour-zone="desktop-nav"] a[href="${path}"]`,
  `[data-tour-zone="mobile-nav"] a[href="${path}"]`,
];

const STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: '안녕! 나는 거북이야 🐢',
    body: '스터디플래너 사용법을 30초만에 알려줄게. 천천히 따라와!',
    mood: 'wave',
  },
  {
    id: 'plans',
    title: '1단계 · 장기계획',
    body: "먼저 끝낼 교재와 목표 기간을 정해요. 예를 들면 '수학 기출문제집을 6월까지'처럼요.",
    mood: 'point',
    selectors: NAV('/plans'),
  },
  {
    id: 'routine',
    title: '2단계 · 주간루틴',
    body: '매주 반복되는 공부 시간표를 한 번 짜두면, 매일 계획을 새로 세울 필요가 없어요.',
    mood: 'point',
    selectors: ['[data-tour-zone="desktop-nav"] a[href="/routine"]'],
  },
  {
    id: 'missions',
    title: '3단계 · 금일계획',
    body: '장기계획과 루틴을 바탕으로 오늘 할 일이 자동으로 채워져요. 여기서 공부하고 체크하면 끝!',
    mood: 'happy',
    selectors: NAV('/missions'),
  },
  {
    id: 'timer',
    title: '집중 타이머',
    body: '공부할 땐 타이머를 켜요. 공부 시간이 자동으로 기록돼서 학습분석에 쓰여요.',
    mood: 'point',
    selectors: ['nav a[href="/timer"]'],
  },
  {
    id: 'mygroup',
    title: '마이 그룹',
    body: '친구들과 학습량을 비교하고, 선생님이 매긴 점수도 여기서 확인해요. 같이 경쟁해보자!',
    mood: 'cheer',
    selectors: ['[data-tour="nav-mygroup"]'],
  },
  {
    id: 'done',
    title: '준비 끝! 🐢',
    body: '이제 직접 해볼까? 막히면 오른쪽 아래 거북이 버튼을 눌러 다시 볼 수 있어. 화이팅!',
    mood: 'cheer',
  },
];

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

function findTarget(selectors?: string[]): HTMLElement | null {
  if (!selectors) return null;
  for (const sel of selectors) {
    const el = document.querySelector<HTMLElement>(sel);
    if (el) {
      const r = el.getBoundingClientRect();
      if (r.width > 8 && r.height > 8) return el;
    }
  }
  return null;
}

export function OnboardingTour() {
  const isTourOpen = useOnboardingStore((s) => s.isTourOpen);
  const stepIndex = useOnboardingStore((s) => s.stepIndex);
  const hasSeenTour = useOnboardingStore((s) => s.hasSeenTour);
  const startTour = useOnboardingStore((s) => s.startTour);
  const endTour = useOnboardingStore((s) => s.endTour);
  const goToStep = useOnboardingStore((s) => s.goToStep);

  const [rect, setRect] = useState<DOMRect | null>(null);
  const [vp, setVp] = useState(() => ({
    w: typeof window !== 'undefined' ? window.innerWidth : 1024,
    h: typeof window !== 'undefined' ? window.innerHeight : 768,
  }));
  const autoStarted = useRef(false);

  const safeIndex = clamp(stepIndex, 0, STEPS.length - 1);
  const step = STEPS[safeIndex];
  const isFirst = safeIndex === 0;
  const isLast = safeIndex === STEPS.length - 1;

  // 첫 방문 자동 실행 (마운트 후 레이아웃이 안정된 뒤)
  useEffect(() => {
    if (autoStarted.current || hasSeenTour) return;
    autoStarted.current = true;
    const t = window.setTimeout(() => startTour(), 900);
    return () => window.clearTimeout(t);
  }, [hasSeenTour, startTour]);

  // 대상 요소 위치 추적
  useLayoutEffect(() => {
    if (!isTourOpen) return;
    const update = () => {
      const el = findTarget(STEPS[safeIndex].selectors);
      setRect(el ? el.getBoundingClientRect() : null);
      setVp({ w: window.innerWidth, h: window.innerHeight });
    };
    update();
    const t = window.setTimeout(update, 80);
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [isTourOpen, safeIndex]);

  // ESC 로 종료
  useEffect(() => {
    if (!isTourOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') endTour(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isTourOpen, endTour]);

  if (!isTourOpen) return null;

  const PAD = 8;
  const CARD_W = Math.min(vp.w - 24, 360);
  const CARD_H_EST = 184;

  let cardTop: number;
  let cardLeft: number;
  let tailLeft: number | null = null;
  let tailOnTop = true;

  if (rect) {
    const holeCenterX = rect.left + rect.width / 2;
    cardLeft = clamp(holeCenterX - CARD_W / 2, 12, vp.w - CARD_W - 12);
    const placeBelow = rect.bottom < vp.h * 0.5;
    if (placeBelow) {
      cardTop = rect.bottom + PAD + 14;
      tailOnTop = true;
    } else {
      cardTop = Math.max(12, rect.top - PAD - 14 - CARD_H_EST);
      tailOnTop = false;
    }
    tailLeft = clamp(holeCenterX - cardLeft, 28, CARD_W - 28);
  } else {
    cardLeft = (vp.w - CARD_W) / 2;
    cardTop = clamp(vp.h / 2 - CARD_H_EST / 2, 16, vp.h - CARD_H_EST - 16);
  }

  const handleNext = () => {
    if (isLast) endTour(true);
    else goToStep(safeIndex + 1);
  };
  const handlePrev = () => {
    if (!isFirst) goToStep(safeIndex - 1);
  };

  return (
    <div className="fixed inset-0 z-[9000]" role="dialog" aria-modal="true" aria-label="사용 안내">
      {/* 클릭 차단 레이어 (투어 중 배경 조작 방지) */}
      <div className="absolute inset-0" />

      {/* 딤 + 스포트라이트 */}
      {rect ? (
        <motion.div
          className="pointer-events-none absolute rounded-xl"
          initial={false}
          animate={{
            top: rect.top - PAD,
            left: rect.left - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
          }}
          transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          style={{
            boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.62)',
            outline: '3px solid #818cf8',
            outlineOffset: '2px',
          }}
        />
      ) : (
        <div className="pointer-events-none absolute inset-0 bg-slate-900/60" />
      )}

      {/* 말풍선 카드 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          className="absolute"
          style={{ top: cardTop, left: cardLeft, width: CARD_W }}
          initial={{ opacity: 0, y: 10, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.97 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >
          {/* 말풍선 꼬리 */}
          {tailLeft !== null && (
            <div
              className="absolute h-4 w-4 rotate-45 border-indigo-100 bg-white"
              style={
                tailOnTop
                  ? { top: -8, left: tailLeft - 8, borderLeftWidth: 1, borderTopWidth: 1 }
                  : { bottom: -8, left: tailLeft - 8, borderRightWidth: 1, borderBottomWidth: 1 }
              }
            />
          )}

          <div className="relative overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-2xl">
            {/* 진행 바 */}
            <div className="h-1 w-full bg-indigo-50">
              <motion.div
                className="h-full bg-gradient-to-r from-indigo-400 to-indigo-600"
                initial={false}
                animate={{ width: `${((safeIndex + 1) / STEPS.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            <div className="flex gap-3 p-4">
              {/* 거북 마스코트 */}
              <motion.div
                className="flex-shrink-0 self-start"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <TurtleMascot mood={step.mood} size={74} />
              </motion.div>

              {/* 안내 텍스트 */}
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
                    거북이의 팁
                  </span>
                  <span className="text-[11px] font-semibold text-gray-400">
                    {safeIndex + 1} / {STEPS.length}
                  </span>
                </div>
                <p className="text-sm font-extrabold text-gray-900">{step.title}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-gray-600">{step.body}</p>
              </div>
            </div>

            {/* 하단 컨트롤 */}
            <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
              <button
                type="button"
                onClick={() => endTour(true)}
                className="text-xs font-medium text-gray-400 transition-colors hover:text-gray-600"
              >
                건너뛰기
              </button>
              <div className="flex items-center gap-2">
                {!isFirst && (
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-500 transition-colors hover:bg-gray-100"
                  >
                    이전
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleNext}
                  className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-md"
                >
                  {isLast ? '시작하기' : '다음'}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
