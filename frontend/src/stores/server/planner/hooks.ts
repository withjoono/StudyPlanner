/**
 * 플래너 API Hooks
 *
 * TanStack Query 기반 실제 백엔드 API 연결
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  distributePlanToMissions,
  type Material,
  type ExtendedLongTermPlan,
  type DailyMission,
} from './planner-types';
import type { Routine, LongTermPlan } from '@/types/planner';
import { plannerClient } from '@/lib/api/instances';
import { useAuthStore } from '@/stores/client';

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
  // 교과/과목 (사용자 ID 기반)
  subjects: (userId?: string) => [...plannerKeys.all, 'subjects', userId] as const,
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
  const user = useAuthStore((state) => state.user);
  return useQuery({
    queryKey: plannerKeys.dashboard(),
    queryFn: async () => {
      const response = await plannerClient.get('/planner/dashboard', {
        params: { memberId: user?.id },
      });
      return response.data;
    },
    enabled: !!user?.id,
  });
}

export function useGetNotices() {
  return useQuery({
    queryKey: plannerKeys.notices(),
    queryFn: async () => {
      return [];
    },
    enabled: false,
  });
}

export function useGetPlannerMentors() {
  return useQuery({
    queryKey: plannerKeys.mentors(),
    queryFn: async () => {
      return [];
    },
    enabled: false,
  });
}

// ============================================
// 루틴 Hooks
// ============================================

export function useGetRoutines() {
  const user = useAuthStore((state) => state.user);
  return useQuery({
    queryKey: plannerKeys.routines(),
    queryFn: async () => {
      const response = await plannerClient.get('/planner/routines', {
        params: { memberId: user?.id },
      });
      return response.data as Routine[];
    },
    enabled: !!user?.id,
  });
}

export function useCreateRoutine() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  return useMutation({
    mutationFn: async (data: Omit<Routine, 'id'>) => {
      const response = await plannerClient.post('/planner/routines', {
        ...data,
        memberId: user?.id,
      });
      return response.data as Routine;
    },
    onSuccess: (newRoutine) => {
      queryClient.setQueryData<Routine[]>(plannerKeys.routines(), (old) => {
        if (!old) return [newRoutine];
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
      const response = await plannerClient.put(`/planner/routines/${data.id}`, data);
      return response.data as Routine;
    },
    onSuccess: (updatedRoutine) => {
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
      await plannerClient.delete(`/planner/routines/${id}`);
      return id;
    },
    onSuccess: (deletedId) => {
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
  const user = useAuthStore((state) => state.user);
  return useQuery({
    queryKey: plannerKeys.plans(),
    queryFn: async () => {
      const response = await plannerClient.get('/planner/plans', {
        params: { memberId: user?.id },
      });
      return response.data as ExtendedLongTermPlan[];
    },
    enabled: !!user?.id,
  });
}

export function useCreatePlan() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  return useMutation({
    mutationFn: async (data: Omit<LongTermPlan, 'id'>) => {
      const response = await plannerClient.post('/planner/plans', {
        ...data,
        memberId: user?.id,
      });
      return response.data as LongTermPlan;
    },
    onSuccess: (newPlan) => {
      queryClient.setQueryData(plannerKeys.plans(), (old: any) => {
        if (!old) return [newPlan];
        if (old.find((p: any) => p.id === newPlan.id)) return old;
        return [...old, newPlan];
      });
    },
  });
}

export function useUpdatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: LongTermPlan) => {
      const response = await plannerClient.put(`/planner/plans/${data.id}`, data);
      return response.data as LongTermPlan;
    },
    onSuccess: (updatedPlan) => {
      queryClient.setQueryData(plannerKeys.plans(), (old: any) => {
        if (!old) return [updatedPlan];
        return old.map((p: any) => (p.id === updatedPlan.id ? updatedPlan : p));
      });
    },
  });
}

export function useDeletePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await plannerClient.delete(`/planner/plans/${id}`);
      return id;
    },
    onSuccess: (deletedId) => {
      queryClient.setQueryData(plannerKeys.plans(), (old: any) => {
        if (!old) return [];
        return old.filter((p: any) => p.id !== deletedId);
      });
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
      const response = await plannerClient.put(`/planner/plans/${planId}/progress`, {
        completedAmount,
      });
      return response.data ?? { planId, completedAmount };
    },
    onSuccess: ({ planId, completedAmount }: any) => {
      queryClient.setQueryData(plannerKeys.plans(), (old: any) => {
        if (!old) return [];
        return old.map((p: any) => (p.id === planId ? { ...p, completedAmount } : p));
      });
    },
  });
}

// ============================================
// 플래너 아이템 Hooks
// ============================================

export function useGetPlannerItems() {
  const user = useAuthStore((state) => state.user);
  return useQuery({
    queryKey: plannerKeys.items(),
    queryFn: async () => {
      const response = await plannerClient.get('/planner/items', {
        params: { memberId: user?.id },
      });
      return response.data;
    },
    enabled: !!user?.id,
  });
}

export function useUpdateAchievement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, progress }: { itemId: number; progress: number }) => {
      const response = await plannerClient.put(`/planner/items/${itemId}/progress`, { progress });
      return response.data ?? { itemId, progress };
    },
    onSuccess: ({ itemId, progress }: any) => {
      queryClient.setQueryData(plannerKeys.items(), (old: any) => {
        if (!old) return [];
        return old.map((i: any) => (i.id === itemId ? { ...i, progress } : i));
      });
      queryClient.invalidateQueries({ queryKey: plannerKeys.dashboard() });
    },
  });
}

export function useCompleteMission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: number) => {
      const response = await plannerClient.put(`/planner/items/${itemId}/complete`);
      return response.data ?? itemId;
    },
    onSuccess: (completedId: any) => {
      const id = typeof completedId === 'object' ? completedId.id : completedId;
      queryClient.setQueryData(plannerKeys.items(), (old: any) => {
        if (!old) return [];
        return old.map((i: any) =>
          i.id === id ? { ...i, status: 'completed', progress: 100 } : i,
        );
      });
      queryClient.invalidateQueries({ queryKey: plannerKeys.dashboard() });
    },
  });
}

// ============================================
// 통계 Hooks
// ============================================

export function useGetWeeklyStudyProgress() {
  const user = useAuthStore((state) => state.user);
  return useQuery({
    queryKey: plannerKeys.weeklyProgress(),
    queryFn: async () => {
      const response = await plannerClient.get('/planner/weekly-progress', {
        params: { memberId: user?.id },
      });
      return response.data;
    },
    enabled: !!user?.id,
  });
}

export function useGetRank(period: 'D' | 'W' | 'M') {
  const user = useAuthStore((state) => state.user);
  return useQuery({
    queryKey: plannerKeys.rank(period),
    queryFn: async () => {
      const response = await plannerClient.get('/planner/rank', {
        params: { memberId: user?.id, period },
      });
      return response.data;
    },
    enabled: !!user?.id,
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
      const response = await plannerClient.get('/materials/search', {
        params: { q: '', limit: 50 },
      });
      return response.data as Material[];
    },
  });
}

/** 특정 교재 상세 조회 (목차 포함) */
export function useGetMaterial(id: number) {
  return useQuery({
    queryKey: plannerKeys.material(id),
    queryFn: async () => {
      const response = await plannerClient.get(`/materials/${id}`);
      return response.data as Material;
    },
    enabled: id > 0,
  });
}

/** 과목별 교재 목록 조회 */
export function useGetMaterialsBySubject(subjectCode: string) {
  return useQuery({
    queryKey: plannerKeys.materialsBySubject(subjectCode),
    queryFn: async () => {
      const response = await plannerClient.get('/materials/search', {
        params: { q: '', category: subjectCode, limit: 50 },
      });
      return response.data as Material[];
    },
    enabled: !!subjectCode,
  });
}

/** 교재 검색 (자동완성) */
export function useSearchMaterials(keyword: string, category?: string) {
  const user = useAuthStore((state) => state.user);
  return useQuery({
    queryKey: [...plannerKeys.materials(), 'search', keyword, category],
    queryFn: async () => {
      const response = await plannerClient.get('/materials/search', {
        params: { q: keyword, category, limit: 10, userId: user?.id },
      });
      return response.data as Material[];
    },
    enabled: keyword.length >= 1,
  });
}

// ============================================
// 일간 미션 Hooks
// ============================================

/** 모든 일간 미션 조회 */
export function useGetDailyMissions() {
  const user = useAuthStore((state) => state.user);
  const memberId = user?.id || 1;
  return useQuery({
    queryKey: plannerKeys.dailyMissions(),
    queryFn: async () => {
      const response = await plannerClient.get('/planner/daily-missions', {
        params: { member_id: memberId },
      });
      return response.data as DailyMission[];
    },
  });
}

/** 특정 날짜의 일간 미션 조회 */
export function useGetDailyMissionsByDate(date: string) {
  const user = useAuthStore((state) => state.user);
  const memberId = user?.id || 1;
  return useQuery({
    queryKey: plannerKeys.dailyMissionsByDate(date),
    queryFn: async () => {
      const response = await plannerClient.get('/planner/daily-missions', {
        params: { member_id: memberId, date },
      });
      return response.data as DailyMission[];
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
      const missions = distributePlanToMissions(plan, routines, startDate, endDate);
      // 서버에 분배 결과 전송
      const response = await plannerClient.post('/planner/daily-missions/distribute', {
        planId: plan.id,
        missions,
      });
      return response.data ?? missions;
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
      const response = await plannerClient.put(`/planner/daily-missions/${missionId}/progress`, {
        progress,
      });
      return response.data ?? { missionId, progress };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: plannerKeys.dailyMissions() });
      queryClient.invalidateQueries({ queryKey: plannerKeys.plans() });
      queryClient.invalidateQueries({ queryKey: plannerKeys.dashboard() });
    },
  });
}

/** 일간 미션 생성 */
export function useCreateMission() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  return useMutation({
    mutationFn: async (dto: {
      date: string;
      startTime?: string;
      endTime?: string;
      subject?: string;
      content?: string;
      startPage?: number;
      endPage?: number;
      amount?: number;
    }) => {
      const response = await plannerClient.post('/planner/daily-missions', {
        member_id: user?.id || 1,
        date: dto.date,
        start_time: dto.startTime,
        end_time: dto.endTime,
        subject: dto.subject,
        content: dto.content,
        start_page: dto.startPage,
        end_page: dto.endPage,
        amount: dto.amount,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: plannerKeys.dailyMissions() });
      queryClient.invalidateQueries({ queryKey: plannerKeys.dashboard() });
    },
  });
}

/** 일간 미션 수정 (계획 + 결과) */
export function useUpdateMission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      missionId,
      data,
    }: {
      missionId: number;
      data: {
        startTime?: string;
        endTime?: string;
        subject?: string;
        content?: string;
        startPage?: number;
        endPage?: number;
        amount?: number;
        status?: string;
        result?: {
          startPage?: number;
          endPage?: number;
          amount?: number;
          achievementRate?: number;
          note?: string;
        };
      };
    }) => {
      // Convert camelCase to snake_case for backend
      const payload: any = {};
      if (data.startTime !== undefined) payload.start_time = data.startTime;
      if (data.endTime !== undefined) payload.end_time = data.endTime;
      if (data.subject !== undefined) payload.subject = data.subject;
      if (data.content !== undefined) payload.content = data.content;
      if (data.startPage !== undefined) payload.start_page = data.startPage;
      if (data.endPage !== undefined) payload.end_page = data.endPage;
      if (data.amount !== undefined) payload.amount = data.amount;
      if (data.status !== undefined) payload.status = data.status;
      if (data.result) {
        payload.result = {
          start_page: data.result.startPage,
          end_page: data.result.endPage,
          amount: data.result.amount,
          achievement_rate: data.result.achievementRate,
          note: data.result.note,
        };
      }
      const response = await plannerClient.put(`/planner/daily-missions/${missionId}`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: plannerKeys.dailyMissions() });
      queryClient.invalidateQueries({ queryKey: plannerKeys.plans() });
      queryClient.invalidateQueries({ queryKey: plannerKeys.dashboard() });
    },
  });
}

/** 일간 미션 삭제 */
export function useDeleteMission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (missionId: number) => {
      const response = await plannerClient.delete(`/planner/daily-missions/${missionId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: plannerKeys.dailyMissions() });
      queryClient.invalidateQueries({ queryKey: plannerKeys.dashboard() });
    },
  });
}

// ============================================
// 교과/과목 Hooks (사용자 ID 기반)
// ============================================

export interface SubjectItem {
  id: number;
  subjectName: string;
  subjectCode: string;
  classification: string;
  classificationCode: string;
  evaluationMethod: string;
}

export interface SubjectGroup {
  kyokwa: string;
  kyokwaCode: string;
  subjects: SubjectItem[];
}

export interface SubjectsResponse {
  curriculum: '2015' | '2022';
  groups: SubjectGroup[];
}

/** 사용자 ID 기반 교육과정 판별 (백엔드 로직과 동일) */
function getCurriculumFromUserId(userId?: string): '2015' | '2022' {
  if (!userId) return '2022';
  // sp_ 접두사 제거
  let idBody = userId.startsWith('sp_') ? userId.substring(3) : userId;
  // S(학생)/T(선생)/P(학부모) 역할 접두사 제거
  if (/^[STP]/i.test(idBody)) {
    idBody = idBody.substring(1);
  }
  const prefix = idBody.substring(0, 4).toUpperCase();
  if (['26H3', '26H4', '26H0'].includes(prefix)) return '2015';
  return '2022';
}

/** 사용자 ID 기반 교과/과목 목록 조회 */
export function useGetSubjects(): { data: SubjectsResponse | undefined; isLoading: boolean } {
  const user = useAuthStore((state) => state.user);
  // user.id는 이미 "sp_S26H208011" 형태의 string
  const userId = user?.id || undefined;
  const curriculum = getCurriculumFromUserId(userId);

  const query = useQuery({
    queryKey: plannerKeys.subjects(userId),
    queryFn: async (): Promise<SubjectsResponse> => {
      const response = await plannerClient.get('/planner/subjects', {
        params: { userId },
      });
      return response.data;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 30,
    retry: 1,
  });

  // API 실패 시 빈 그룹 반환 (더미 데이터 없음)
  const data: SubjectsResponse = query.data ?? {
    curriculum,
    groups: [],
  };

  return { data, isLoading: query.isLoading };
}

/** 과목명 flat 리스트 (루틴 폼의 소분류 선택에 사용) */
export function useSubjectNames(): string[] {
  const { data } = useGetSubjects();
  if (!data?.groups?.length) return ['국어', '영어', '수학', '과학', '사회', '기타'];

  // 교과 목록을 교과명으로 반환 (중복 제거)
  const kyokwaNames = data.groups.map((g) => g.kyokwa);
  return [...kyokwaNames, '기타'];
}

// ============================================
// 장기 계획 + 교재 연결 Hooks
// ============================================

/** 교재 선택해서 장기 계획 생성 */
export function useCreatePlanWithMaterial() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

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
      const selectedChapters = material.chapters.filter(
        (c) => c.chapterNumber >= startChapter && c.chapterNumber <= endChapter,
      );

      const startPage = selectedChapters[0]?.startPage || 1;
      const lastEndPage =
        selectedChapters[selectedChapters.length - 1]?.endPage || material.totalPages || 100;
      const totalPages = lastEndPage - startPage;

      const start = new Date(startDate);
      const end = new Date(endDate);
      const startDay = start.getDay();
      const firstMondayOffset = startDay === 0 ? 1 : startDay === 1 ? 0 : 8 - startDay;
      const firstMonday = new Date(start);
      firstMonday.setDate(start.getDate() + firstMondayOffset);
      const totalDays = Math.floor((end.getTime() - firstMonday.getTime()) / (1000 * 60 * 60 * 24));
      const nWeeks = Math.max(1, Math.floor(totalDays / 7));
      const weeklyTarget = Math.ceil(totalPages / nWeeks);
      const dailyTarget = Math.ceil(totalPages / (nWeeks * 5));

      const response = await plannerClient.post('/planner/plans', {
        memberId: user?.id,
        title: `${material.name} ${startChapter}~${endChapter}장`,
        subject: subjectCodeToKorean(material.subjectCode),
        type: material.category === 'lecture' ? 'lecture' : 'textbook',
        material: material.name,
        materialId: material.id,
        startPage,
        endPage: lastEndPage,
        totalAmount: totalPages,
        completedAmount: 0,
        startDate,
        endDate,
        dailyTarget,
        weeklyTarget,
        nWeeks,
        isDistributed: false,
      });

      return response.data;
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
