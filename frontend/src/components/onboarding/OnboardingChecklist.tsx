/**
 * 홈 온보딩 체크리스트.
 * 학습 플래너의 5가지 시작 단계와 완료 상태를 보여주고,
 * 각 단계의 '안내' 버튼은 거북 코치마크 투어의 해당 단계를 연다.
 * 5단계를 모두 완료하면 자동으로 사라진다.
 */
import { useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronRight } from 'lucide-react';
import {
  useGetDailyMissions,
  useGetGrowthStats,
  useGetPlans,
  useGetRoutines,
} from '@/stores/server/planner';
import { useStudentConnections } from '@/stores/server/student/hooks';
import { useOnboardingStore } from '@/stores/client/use-onboarding-store';
import { TurtleMascot } from './TurtleMascot';

const COLLAPSE_KEY = 'sp:onboarding-checklist:collapsed';

interface ChecklistItem {
  id: string;
  title: string;
  desc: string;
  done: boolean;
  href: string;
  goLabel: string;
  /** 거북 투어 단계 인덱스 (없으면 '안내' 버튼 숨김) */
  tourStep?: number;
}

export function OnboardingChecklist() {
  const startTourAt = useOnboardingStore((s) => s.startTourAt);
  const { data: plans } = useGetPlans();
  const { data: routines } = useGetRoutines();
  const { data: missions } = useGetDailyMissions();
  const { data: growth } = useGetGrowthStats();
  const { data: connections } = useStudentConnections();

  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return window.localStorage.getItem(COLLAPSE_KEY) === '1';
    } catch {
      return false;
    }
  });

  const toggle = () => {
    setCollapsed((v) => {
      const next = !v;
      try {
        window.localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0');
      } catch {
        // 저장 실패는 무시
      }
      return next;
    });
  };

  const items: ChecklistItem[] = [
    {
      id: 'plans',
      title: '장기계획 만들기',
      desc: '끝낼 교재와 목표 기간 정하기',
      done: (plans?.length ?? 0) > 0,
      href: '/plans',
      goLabel: '만들기',
      tourStep: 1,
    },
    {
      id: 'routine',
      title: '주간루틴 만들기',
      desc: '매주 반복할 공부 시간표 짜기',
      done: (routines?.length ?? 0) > 0,
      href: '/routine',
      goLabel: '만들기',
      tourStep: 2,
    },
    {
      id: 'missions',
      title: '금일계획 확인하기',
      desc: '자동으로 채워진 오늘 할 일 보기',
      done: (missions?.length ?? 0) > 0,
      href: '/missions',
      goLabel: '확인하기',
      tourStep: 3,
    },
    {
      id: 'timer',
      title: '집중 타이머 써보기',
      desc: '공부 시간을 기록해 분석에 활용',
      done: (growth?.thisWeek?.studyMinutes ?? 0) > 0,
      href: '/timer',
      goLabel: '써보기',
      tourStep: 4,
    },
    {
      id: 'connect',
      title: '선생님과 계정연동',
      desc: '플래너를 검사받고 점수 받기',
      done: (connections?.teachers?.length ?? 0) > 0,
      href: '/connections',
      goLabel: '연동하기',
    },
  ];

  const total = items.length;
  const doneCount = items.filter((i) => i.done).length;
  if (doneCount >= total) return null;

  const pct = Math.round((doneCount / total) * 100);

  return (
    <div className="overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-xl shadow-indigo-200/40">
      {/* 헤더 */}
      <div className="flex items-center gap-3 p-4 md:px-5">
        <TurtleMascot mood={doneCount === 0 ? 'wave' : 'happy'} size={46} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold text-gray-900">학습 플래너 시작하기</p>
          <p className="truncate text-xs text-gray-400">
            5단계를 마치면 매일 할 일이 자동으로 채워져요
          </p>
        </div>
        <span className="flex-shrink-0 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-600">
          {doneCount} / {total}
        </span>
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? '펼치기' : '접기'}
          className="flex-shrink-0 rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100"
        >
          <ChevronDown
            className={`h-5 w-5 transition-transform ${collapsed ? '' : 'rotate-180'}`}
          />
        </button>
      </div>

      {/* 진행 바 */}
      <div className="px-4 md:px-5">
        <div className="h-1.5 overflow-hidden rounded-full bg-indigo-50">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-indigo-600 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* 단계 목록 */}
      {!collapsed && (
        <div className="space-y-1.5 p-3 md:p-4">
          {items.map((item, idx) => {
            const ts = item.tourStep;
            return (
              <ChecklistRow
                key={item.id}
                n={idx + 1}
                item={item}
                onGuide={ts !== undefined ? () => startTourAt(ts) : undefined}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function ChecklistRow({
  n,
  item,
  onGuide,
}: {
  n: number;
  item: ChecklistItem;
  onGuide?: () => void;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border p-3 ${
        item.done ? 'border-green-100 bg-green-50/60' : 'border-gray-100 bg-white'
      }`}
    >
      <div
        className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
          item.done ? 'bg-green-500 text-white' : 'bg-indigo-100 text-indigo-600'
        }`}
      >
        {item.done ? <CheckCircle2 className="h-4 w-4" /> : n}
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-bold ${item.done ? 'text-green-700' : 'text-gray-900'}`}>
          {item.title}
        </p>
        <p className="truncate text-xs text-gray-400">{item.done ? '완료했어요' : item.desc}</p>
      </div>
      {!item.done && (
        <div className="flex flex-shrink-0 items-center gap-1.5">
          {onGuide && (
            <button
              type="button"
              onClick={onGuide}
              title="거북이 안내 보기"
              aria-label="거북이 안내 보기"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-indigo-100 transition-colors hover:bg-indigo-50"
            >
              <TurtleMascot mood="point" size={22} />
            </button>
          )}
          <a
            href={item.href}
            className="inline-flex items-center gap-0.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-[11px] font-bold text-white transition-colors hover:bg-indigo-700"
          >
            {item.goLabel}
            <ChevronRight className="h-3 w-3" />
          </a>
        </div>
      )}
    </div>
  );
}
