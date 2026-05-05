/**
 * 마이 클래스(StudyRoom) API Hooks
 *
 * TanStack Query 기반 마이 클래스 CRUD + 리더보드
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { plannerClient } from '@/lib/api/instances';
import { useAuthStore } from '@/stores/client';

// ============================================
// Query Keys
// ============================================

export const myClassKeys = {
  all: ['myclass'] as const,
  list: () => [...myClassKeys.all, 'list'] as const,
  detail: (id: number) => [...myClassKeys.all, 'detail', id] as const,
  leaderboard: (id: number, period: string) =>
    [...myClassKeys.all, 'leaderboard', id, period] as const,
  byCode: (code: string) => [...myClassKeys.all, 'code', code] as const,
  search: (q?: string) => [...myClassKeys.all, 'search', q] as const,
};

// ============================================
// Types
// ============================================

export interface MyClassRoom {
  id: number;
  roomCode: string;
  name: string;
  description: string | null;
  subject: string | null;
  maxMembers: number;
  isPublic: boolean;
  weeklyGoal: number | null;
  memberCount: number;
  ownerName: string;
  myRole?: string;
  joinedAt?: string;
  isActive: boolean;
  createdAt: string;
}

export interface MyClassDetail extends MyClassRoom {
  members: {
    id: number;
    name: string;
    grade: string | null;
    role: string;
    joinedAt: string;
  }[];
  isMember: boolean;
  isOwner: boolean;
}

export interface LeaderboardEntry {
  studentId: number;
  name: string;
  grade: string | null;
  role: string;
  rank: number;
  totalScore: number;
  studyMinutes: number;
  missionCount: number;
  totalPages: number;
}

export interface RoomLeaderboard {
  leaderboard: LeaderboardEntry[];
  myRank: LeaderboardEntry | null;
  totalMembers: number;
  teamStats: {
    totalMinutes: number;
    totalScore: number;
    weeklyGoal: number | null;
    goalAchieved: boolean | null;
  } | null;
}

// ============================================
// Hooks
// ============================================

/** 내가 속한 마이 클래스 목록 */
export function useMyClassList() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return useQuery({
    queryKey: myClassKeys.list(),
    queryFn: async () => {
      const response = await plannerClient.get('/myclass');
      return response.data as MyClassRoom[];
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 2,
  });
}

/** 마이 클래스 상세 */
export function useMyClassDetail(id: number) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return useQuery({
    queryKey: myClassKeys.detail(id),
    queryFn: async () => {
      const response = await plannerClient.get(`/myclass/${id}`);
      return response.data as MyClassDetail;
    },
    enabled: isAuthenticated && id > 0,
  });
}

/** 마이 클래스 리더보드 */
export function useMyClassLeaderboard(id: number, period: string = 'weekly') {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return useQuery({
    queryKey: myClassKeys.leaderboard(id, period),
    queryFn: async () => {
      const response = await plannerClient.get(`/myclass/${id}/leaderboard`, {
        params: { period },
      });
      return response.data as RoomLeaderboard;
    },
    enabled: isAuthenticated && id > 0,
    staleTime: 1000 * 60 * 3,
  });
}

/** 초대 코드로 방 정보 조회 */
export function useMyClassByCode(code: string) {
  return useQuery({
    queryKey: myClassKeys.byCode(code),
    queryFn: async () => {
      const response = await plannerClient.get(`/myclass/code/${code}`);
      return response.data as MyClassRoom;
    },
    enabled: !!code && code.length >= 4,
  });
}

/** 공개 마이 클래스 검색 */
export function useSearchPublicRooms(query?: string) {
  return useQuery({
    queryKey: myClassKeys.search(query),
    queryFn: async () => {
      const response = await plannerClient.get('/myclass/search', {
        params: { q: query },
      });
      return response.data as MyClassRoom[];
    },
  });
}

/** 마이 클래스 생성 */
export function useCreateMyClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      subject?: string;
      isPublic?: boolean;
      weeklyGoal?: number;
    }) => {
      const response = await plannerClient.post('/myclass', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: myClassKeys.list() });
    },
  });
}

/** 초대 코드로 가입 */
export function useJoinMyClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ code, inviterId }: { code: string; inviterId?: string }) => {
      const response = await plannerClient.post(`/myclass/join/${code}`, { inviterId });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: myClassKeys.list() });
    },
  });
}

/** 마이 클래스 나가기 */
export function useLeaveMyClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (roomId: number) => {
      const response = await plannerClient.post(`/myclass/${roomId}/leave`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: myClassKeys.list() });
    },
  });
}

/** 마이 클래스 삭제 */
export function useDeleteMyClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (roomId: number) => {
      const response = await plannerClient.delete(`/myclass/${roomId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: myClassKeys.list() });
    },
  });
}
