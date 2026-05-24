/**
 * 온보딩 코치마크 투어 상태.
 * - 완료 여부(hasSeenTour)는 localStorage 에 영속한다.
 * - 진행 상태(isTourOpen, stepIndex)는 메모리에만 유지한다.
 * - 키에 버전(v1)을 붙여, 추후 투어가 개편되면 다시 노출할 수 있다.
 */
import { create } from 'zustand';

const STORAGE_KEY = 'sp:onboarding-tour:v1';

function readSeen(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'done';
  } catch {
    // localStorage 접근 불가(시크릿 모드 등) → 자동 실행하지 않음
    return true;
  }
}

interface OnboardingState {
  /** 투어 오버레이 노출 여부 */
  isTourOpen: boolean;
  /** 현재 단계 인덱스 */
  stepIndex: number;
  /** 첫 방문 투어를 본 적이 있는지 */
  hasSeenTour: boolean;
  /** 투어 시작(첫 단계부터) */
  startTour: () => void;
  /** 특정 단계부터 투어 시작 (체크리스트 '안내' 버튼 연동) */
  startTourAt: (index: number) => void;
  /** 투어 종료. markSeen=true 면 완료로 기록 */
  endTour: (markSeen?: boolean) => void;
  /** 특정 단계로 이동 */
  goToStep: (index: number) => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  isTourOpen: false,
  stepIndex: 0,
  hasSeenTour: readSeen(),
  startTour: () => set({ isTourOpen: true, stepIndex: 0 }),
  startTourAt: (index) => set({ isTourOpen: true, stepIndex: index }),
  endTour: (markSeen = true) => {
    if (markSeen && typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(STORAGE_KEY, 'done');
      } catch {
        // 저장 실패는 무시 (다음 세션에 다시 노출될 수 있음)
      }
    }
    set((s) => ({ isTourOpen: false, hasSeenTour: markSeen ? true : s.hasSeenTour }));
  },
  goToStep: (index) => set({ stepIndex: index }),
}));
