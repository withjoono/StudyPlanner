/**
 * 플래너 Zustand Store
 *
 * 플래너 UI 상태 및 로컬 데이터 관리
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Routine, LongTermPlan, RoutineCategory, MissionStatus } from '@/types/planner';

// ============================================
// 타입 정의
// ============================================

interface SelectedDate {
  year: number;
  month: number;
  day: number;
}

interface PlannerViewState {
  // 현재 뷰
  currentView: 'daily' | 'weekly' | 'monthly';

  // 선택된 날짜
  selectedDate: SelectedDate;

  // 선택된 아이템
  selectedRoutineId: number | null;
  selectedPlanId: number | null;
  selectedItemId: number | null;

  // 모달/폼 상태
  isRoutineFormOpen: boolean;
  isPlanFormOpen: boolean;
  isItemFormOpen: boolean;
  isFeedbackFormOpen: boolean;

  // 필터
  routineCategoryFilter: RoutineCategory | 'all';
  missionStatusFilter: MissionStatus | 'all';
  subjectFilter: string | 'all';

  // 편집 모드
  editingRoutine: Routine | null;
  editingPlan: LongTermPlan | null;
}

interface PlannerActions {
  // 뷰 변경
  setCurrentView: (view: 'daily' | 'weekly' | 'monthly') => void;

  // 날짜 선택
  setSelectedDate: (date: Date) => void;
  goToToday: () => void;
  goToPrevDay: () => void;
  goToNextDay: () => void;
  goToPrevWeek: () => void;
  goToNextWeek: () => void;

  // 아이템 선택
  selectRoutine: (id: number | null) => void;
  selectPlan: (id: number | null) => void;
  selectItem: (id: number | null) => void;

  // 모달/폼 제어
  openRoutineForm: (routine?: Routine) => void;
  closeRoutineForm: () => void;
  openPlanForm: (plan?: LongTermPlan) => void;
  closePlanForm: () => void;
  openItemForm: () => void;
  closeItemForm: () => void;
  openFeedbackForm: () => void;
  closeFeedbackForm: () => void;

  // 필터
  setRoutineCategoryFilter: (filter: RoutineCategory | 'all') => void;
  setMissionStatusFilter: (filter: MissionStatus | 'all') => void;
  setSubjectFilter: (filter: string | 'all') => void;
  resetFilters: () => void;

  // 리셋
  reset: () => void;
}

type PlannerStore = PlannerViewState & PlannerActions;

// ============================================
// 초기 상태
// ============================================

const getInitialDate = (): SelectedDate => {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
  };
};

const initialState: PlannerViewState = {
  currentView: 'daily',
  selectedDate: getInitialDate(),
  selectedRoutineId: null,
  selectedPlanId: null,
  selectedItemId: null,
  isRoutineFormOpen: false,
  isPlanFormOpen: false,
  isItemFormOpen: false,
  isFeedbackFormOpen: false,
  routineCategoryFilter: 'all',
  missionStatusFilter: 'all',
  subjectFilter: 'all',
  editingRoutine: null,
  editingPlan: null,
};

// ============================================
// Store 생성
// ============================================

export const usePlannerStore = create<PlannerStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // ─────────────────────────────────────────
      // 뷰 변경
      // ─────────────────────────────────────────

      setCurrentView: (view) => set({ currentView: view }),

      // ─────────────────────────────────────────
      // 날짜 선택
      // ─────────────────────────────────────────

      setSelectedDate: (date) =>
        set({
          selectedDate: {
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            day: date.getDate(),
          },
        }),

      goToToday: () => set({ selectedDate: getInitialDate() }),

      goToPrevDay: () => {
        const { selectedDate } = get();
        const date = new Date(selectedDate.year, selectedDate.month - 1, selectedDate.day);
        date.setDate(date.getDate() - 1);
        set({
          selectedDate: {
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            day: date.getDate(),
          },
        });
      },

      goToNextDay: () => {
        const { selectedDate } = get();
        const date = new Date(selectedDate.year, selectedDate.month - 1, selectedDate.day);
        date.setDate(date.getDate() + 1);
        set({
          selectedDate: {
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            day: date.getDate(),
          },
        });
      },

      goToPrevWeek: () => {
        const { selectedDate } = get();
        const date = new Date(selectedDate.year, selectedDate.month - 1, selectedDate.day);
        date.setDate(date.getDate() - 7);
        set({
          selectedDate: {
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            day: date.getDate(),
          },
        });
      },

      goToNextWeek: () => {
        const { selectedDate } = get();
        const date = new Date(selectedDate.year, selectedDate.month - 1, selectedDate.day);
        date.setDate(date.getDate() + 7);
        set({
          selectedDate: {
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            day: date.getDate(),
          },
        });
      },

      // ─────────────────────────────────────────
      // 아이템 선택
      // ─────────────────────────────────────────

      selectRoutine: (id) => set({ selectedRoutineId: id }),
      selectPlan: (id) => set({ selectedPlanId: id }),
      selectItem: (id) => set({ selectedItemId: id }),

      // ─────────────────────────────────────────
      // 모달/폼 제어
      // ─────────────────────────────────────────

      openRoutineForm: (routine) =>
        set({
          isRoutineFormOpen: true,
          editingRoutine: routine ?? null,
        }),

      closeRoutineForm: () =>
        set({
          isRoutineFormOpen: false,
          editingRoutine: null,
        }),

      openPlanForm: (plan) =>
        set({
          isPlanFormOpen: true,
          editingPlan: plan ?? null,
        }),

      closePlanForm: () =>
        set({
          isPlanFormOpen: false,
          editingPlan: null,
        }),

      openItemForm: () =>
        set({
          isItemFormOpen: true,
        }),

      closeItemForm: () =>
        set({
          isItemFormOpen: false,
        }),

      openFeedbackForm: () =>
        set({
          isFeedbackFormOpen: true,
        }),

      closeFeedbackForm: () =>
        set({
          isFeedbackFormOpen: false,
        }),

      // ─────────────────────────────────────────
      // 필터
      // ─────────────────────────────────────────

      setRoutineCategoryFilter: (filter) => set({ routineCategoryFilter: filter }),
      setMissionStatusFilter: (filter) => set({ missionStatusFilter: filter }),
      setSubjectFilter: (filter) => set({ subjectFilter: filter }),

      resetFilters: () =>
        set({
          routineCategoryFilter: 'all',
          missionStatusFilter: 'all',
          subjectFilter: 'all',
        }),

      // ─────────────────────────────────────────
      // 리셋
      // ─────────────────────────────────────────

      reset: () => set(initialState),
    }),
    {
      name: 'planner-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // 유지할 상태만 선택
        currentView: state.currentView,
        selectedDate: state.selectedDate,
        routineCategoryFilter: state.routineCategoryFilter,
        missionStatusFilter: state.missionStatusFilter,
        subjectFilter: state.subjectFilter,
      }),
    },
  ),
);

// ============================================
// 편의 훅
// ============================================

/**
 * 선택된 날짜를 Date 객체로 반환
 */
export const useSelectedDateAsDate = () => {
  const { selectedDate } = usePlannerStore();
  return new Date(selectedDate.year, selectedDate.month - 1, selectedDate.day);
};

/**
 * 선택된 날짜를 ISO 문자열로 반환
 */
export const useSelectedDateString = () => {
  const { selectedDate } = usePlannerStore();
  const date = new Date(selectedDate.year, selectedDate.month - 1, selectedDate.day);
  return date.toISOString().split('T')[0];
};

/**
 * 오늘인지 확인
 */
export const useIsToday = () => {
  const { selectedDate } = usePlannerStore();
  const today = new Date();
  return (
    selectedDate.year === today.getFullYear() &&
    selectedDate.month === today.getMonth() + 1 &&
    selectedDate.day === today.getDate()
  );
};
