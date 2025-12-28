/**
 * 플래너 API Hooks (Mock)
 *
 * TanStack Query 기반 데이터 패칭 훅
 * 실제 API 연결 전까지는 mock 데이터 사용
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  mockRoutines,
  mockPlans,
  mockPlannerItems,
  mockWeeklyProgress,
  mockDashboard,
  mockNotices,
  mockMentors,
  mockMaterials,
  mockDailyMissions,
  distributePlanToMissions,
  type Material,
  type DailyMission,
  type ExtendedLongTermPlan,
} from './mock-data';
import type { Routine, LongTermPlan } from '@/types/planner';

// ============================================
// Query Keys
// ============================================

export const plannerKeys = {
  all: ['planner'] as const,
  routines: () => [...plannerKeys.all, 'routines'] as const,
  plans: () => [...plannerKeys.all, 'plans'] as const,
  items: () => [...plannerKeys.all, 'items'] as const,
  dashboard: () => [...plannerKeys.all, 'dashboard'] as const,
  weeklyProgress: () => [...plannerKeys.all, 'weeklyProgress'] as const,
  notices: () => [...plannerKeys.all, 'notices'] as const,
  mentors: () => [...plannerKeys.all, 'mentors'] as const,
  rank: (period: string) => [...plannerKeys.all, 'rank', period] as const,
  // 교재 관련
  materials: () => [...plannerKeys.all, 'materials'] as const,
  material: (id: number) => [...plannerKeys.all, 'material', id] as const,
  materialsBySubject: (subject: string) =>
    [...plannerKeys.all, 'materials', 'subject', subject] as const,
  // 일간 미션
  dailyMissions: () => [...plannerKeys.all, 'dailyMissions'] as const,
  dailyMissionsByDate: (date: string) => [...plannerKeys.all, 'dailyMissions', date] as const,
};

// ============================================
// 대시보드 Hooks
// ============================================

export function useGetTodayDashboard() {
  return useQuery({
    queryKey: plannerKeys.dashboard(),
    queryFn: async () => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      return mockDashboard;
    },
  });
}

export function useGetNotices() {
  return useQuery({
    queryKey: plannerKeys.notices(),
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return mockNotices;
    },
  });
}

export function useGetPlannerMentors() {
  return useQuery({
    queryKey: plannerKeys.mentors(),
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return mockMentors;
    },
  });
}

// ============================================
// 루틴 Hooks
// ============================================

export function useGetRoutines() {
  return useQuery({
    queryKey: plannerKeys.routines(),
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return [...mockRoutines];
    },
  });
}

export function useCreateRoutine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<Routine, 'id'>) => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const newRoutine: Routine = { ...data, id: Date.now() };
      // Mock 데이터에도 추가
      mockRoutines.push(newRoutine);
      return newRoutine;
    },
    onSuccess: (newRoutine) => {
      // 캐시 직접 업데이트
      queryClient.setQueryData<Routine[]>(plannerKeys.routines(), (old) => {
        if (!old) return [newRoutine];
        // 이미 추가되어 있으면 무시
        if (old.find((r) => r.id === newRoutine.id)) return old;
        return [...old, newRoutine];
      });
    },
  });
}

export function useUpdateRoutine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Routine) => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      // Mock 데이터 업데이트
      const idx = mockRoutines.findIndex((r) => r.id === data.id);
      if (idx !== -1) {
        mockRoutines[idx] = data;
      }
      return data;
    },
    onSuccess: (updatedRoutine) => {
      // 캐시 직접 업데이트
      queryClient.setQueryData<Routine[]>(plannerKeys.routines(), (old) => {
        if (!old) return [updatedRoutine];
        return old.map((r) => (r.id === updatedRoutine.id ? updatedRoutine : r));
      });
    },
  });
}

export function useDeleteRoutine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      // Mock 데이터에서 삭제
      const idx = mockRoutines.findIndex((r) => r.id === id);
      if (idx !== -1) {
        mockRoutines.splice(idx, 1);
      }
      return id;
    },
    onSuccess: (deletedId) => {
      // 캐시 직접 업데이트
      queryClient.setQueryData<Routine[]>(plannerKeys.routines(), (old) => {
        if (!old) return [];
        return old.filter((r) => r.id !== deletedId);
      });
    },
  });
}

// ============================================
// 장기 계획 Hooks
// ============================================

export function useGetPlans() {
  return useQuery({
    queryKey: plannerKeys.plans(),
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return mockPlans;
    },
  });
}

export function useCreatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<LongTermPlan, 'id'>) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const newPlan: LongTermPlan = { ...data, id: Date.now() };
      return newPlan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: plannerKeys.plans() });
    },
  });
}

export function useUpdatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: LongTermPlan) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: plannerKeys.plans() });
    },
  });
}

export function useDeletePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: plannerKeys.plans() });
    },
  });
}

export function useUpdatePlanProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      planId,
      completedAmount,
    }: {
      planId: number;
      completedAmount: number;
    }) => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return { planId, completedAmount };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: plannerKeys.plans() });
    },
  });
}

// ============================================
// 플래너 아이템 Hooks
// ============================================

export function useGetPlannerItems() {
  return useQuery({
    queryKey: plannerKeys.items(),
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return mockPlannerItems;
    },
  });
}

export function useUpdateAchievement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, progress }: { itemId: number; progress: number }) => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return { itemId, progress };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: plannerKeys.items() });
      queryClient.invalidateQueries({ queryKey: plannerKeys.dashboard() });
    },
  });
}

export function useCompleteMission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: number) => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return itemId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: plannerKeys.items() });
      queryClient.invalidateQueries({ queryKey: plannerKeys.dashboard() });
    },
  });
}

// ============================================
// 통계 Hooks
// ============================================

export function useGetWeeklyStudyProgress() {
  return useQuery({
    queryKey: plannerKeys.weeklyProgress(),
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return mockWeeklyProgress;
    },
  });
}

export function useGetRank(period: 'D' | 'W' | 'M') {
  return useQuery({
    queryKey: plannerKeys.rank(period),
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return mockDashboard.rank;
    },
  });
}

// ============================================
// 교재 DB Hooks
// ============================================

/** 모든 교재 목록 조회 */
export function useGetMaterials() {
  return useQuery({
    queryKey: plannerKeys.materials(),
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return mockMaterials;
    },
  });
}

/** 특정 교재 상세 조회 (목차 포함) */
export function useGetMaterial(id: number) {
  return useQuery({
    queryKey: plannerKeys.material(id),
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
      return mockMaterials.find((m) => m.id === id);
    },
    enabled: id > 0,
  });
}

/** 과목별 교재 목록 조회 */
export function useGetMaterialsBySubject(subjectCode: string) {
  return useQuery({
    queryKey: plannerKeys.materialsBySubject(subjectCode),
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
      return mockMaterials.filter((m) => m.subjectCode === subjectCode);
    },
    enabled: !!subjectCode,
  });
}

/** 교재 검색 */
export function useSearchMaterials(keyword: string) {
  return useQuery({
    queryKey: [...plannerKeys.materials(), 'search', keyword],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
      if (!keyword) return mockMaterials;
      const lower = keyword.toLowerCase();
      return mockMaterials.filter(
        (m) =>
          m.name.toLowerCase().includes(lower) ||
          m.publisher?.toLowerCase().includes(lower) ||
          m.author?.toLowerCase().includes(lower),
      );
    },
  });
}

// ============================================
// 일간 미션 Hooks (자동 분배 결과)
// ============================================

/** 모든 일간 미션 조회 */
export function useGetDailyMissions() {
  return useQuery({
    queryKey: plannerKeys.dailyMissions(),
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return mockDailyMissions;
    },
  });
}

/** 특정 날짜의 일간 미션 조회 */
export function useGetDailyMissionsByDate(date: string) {
  return useQuery({
    queryKey: plannerKeys.dailyMissionsByDate(date),
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
      return mockDailyMissions.filter((m) => m.date === date);
    },
    enabled: !!date,
  });
}

/** 장기 계획 분배 실행 */
export function useDistributePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      plan,
      routines,
      startDate,
      endDate,
    }: {
      plan: ExtendedLongTermPlan;
      routines: Routine[];
      startDate: Date;
      endDate: Date;
    }) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const missions = distributePlanToMissions(plan, routines, startDate, endDate);
      // Mock 데이터에 추가
      mockDailyMissions.push(...missions);
      return missions;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: plannerKeys.dailyMissions() });
      queryClient.invalidateQueries({ queryKey: plannerKeys.plans() });
      queryClient.invalidateQueries({ queryKey: plannerKeys.items() });
    },
  });
}

/** 일간 미션 완료 처리 */
export function useCompleteDailyMission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ missionId, progress }: { missionId: number; progress: number }) => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      // Mock 데이터 업데이트
      const mission = mockDailyMissions.find((m) => m.id === missionId);
      if (mission) {
        mission.progress = progress;
        mission.status = progress >= 100 ? 'completed' : 'pending';
      }
      return { missionId, progress };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: plannerKeys.dailyMissions() });
      queryClient.invalidateQueries({ queryKey: plannerKeys.plans() });
      queryClient.invalidateQueries({ queryKey: plannerKeys.dashboard() });
    },
  });
}

// ============================================
// 장기 계획 + 교재 연결 Hooks
// ============================================

/** 교재 선택해서 장기 계획 생성 */
export function useCreatePlanWithMaterial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      material,
      startChapter,
      endChapter,
      startDate,
      endDate,
    }: {
      material: Material;
      startChapter: number;
      endChapter: number;
      startDate: string;
      endDate: string;
    }) => {
      await new Promise((resolve) => setTimeout(resolve, 500));

      // 선택된 챕터 범위의 페이지/강의 수 계산
      const selectedChapters = material.chapters.filter(
        (c) => c.chapterNumber >= startChapter && c.chapterNumber <= endChapter,
      );

      const startPage = selectedChapters[0]?.startPage || 1;
      const endPage =
        selectedChapters[selectedChapters.length - 1]?.endPage || material.totalPages || 100;
      const totalPages = endPage - startPage;

      // 일수 계산
      const days = Math.ceil(
        (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24),
      );
      const dailyTarget = Math.ceil(totalPages / days);
      const weeklyTarget = dailyTarget * 5; // 주 5일 기준

      const newPlan: ExtendedLongTermPlan = {
        id: Date.now(),
        title: `${material.name} ${startChapter}~${endChapter}장`,
        subject: subjectCodeToKorean(material.subjectCode),
        type: material.category === 'lecture' ? 'lecture' : 'textbook',
        material: material.name,
        materialId: material.id,
        startPage,
        endPage,
        totalAmount: totalPages,
        completedAmount: 0,
        startDate,
        endDate,
        dailyTarget,
        weeklyTarget,
        isDistributed: false,
      };

      mockPlans.push(newPlan);
      return newPlan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: plannerKeys.plans() });
    },
  });
}

// 과목 코드를 한글로 변환
function subjectCodeToKorean(code: string): string {
  const map: Record<string, string> = {
    korean: '국어',
    math: '수학',
    english: '영어',
    science: '과학',
    social: '사회',
    history: '한국사',
    foreign: '제2외국어',
    other: '기타',
  };
  return map[code] || '기타';
}
