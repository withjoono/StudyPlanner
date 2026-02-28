/**
 * 플래너 코멘트 API Hooks
 *
 * TanStack Query 기반 코멘트 CRUD
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { plannerClient } from '@/lib/api/instances';

// ============================================
// Query Keys
// ============================================

export const commentKeys = {
  all: ['planner', 'comments'] as const,
  list: (filters: Record<string, any>) => [...commentKeys.all, 'list', filters] as const,
  unreadCount: (studentId: number) => [...commentKeys.all, 'unread', studentId] as const,
  recentUnread: (studentId: number) => [...commentKeys.all, 'recent-unread', studentId] as const,
};

// ============================================
// Types
// ============================================

export interface PlannerComment {
  id: number;
  studentId: number;
  authorId: string;
  authorRole: string;
  missionId: number | null;
  routineId: number | null;
  planId: number | null;
  content: string;
  subject: string | null;
  period: string | null;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    role: string;
    avatarUrl: string | null;
  } | null;
}

export interface CreateCommentDto {
  studentId: number;
  authorId: string;
  authorRole: string;
  missionId?: number;
  routineId?: number;
  planId?: number;
  content: string;
  subject?: string;
  period?: string;
}

// ============================================
// Hooks
// ============================================

/** 코멘트 목록 조회 */
export function useGetComments(filters: {
  studentId?: number;
  missionId?: number;
  routineId?: number;
  planId?: number;
  period?: string;
}) {
  return useQuery({
    queryKey: commentKeys.list(filters),
    queryFn: async () => {
      const response = await plannerClient.get('/planner/comments', { params: filters });
      return response.data as { comments: PlannerComment[]; total: number };
    },
    enabled: !!(filters.studentId || filters.missionId || filters.routineId || filters.planId),
  });
}

/** 코멘트 작성 */
export function useCreateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateCommentDto) => {
      const response = await plannerClient.post('/planner/comments', dto);
      return response.data as PlannerComment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentKeys.all });
    },
  });
}

/** 읽음 처리 */
export function useMarkCommentAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commentId: number) => {
      const response = await plannerClient.patch(`/planner/comments/${commentId}/read`);
      return response.data as PlannerComment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentKeys.all });
    },
  });
}

/** 읽지 않은 코멘트 수 */
export function useGetUnreadCount(studentId: number) {
  return useQuery({
    queryKey: commentKeys.unreadCount(studentId),
    queryFn: async () => {
      const response = await plannerClient.get('/planner/comments/unread', {
        params: { studentId },
      });
      return response.data as { unreadCount: number };
    },
    enabled: studentId > 0,
    refetchInterval: 30000, // 30초마다 갱신
  });
}

/** 최근 읽지 않은 코멘트 (대시보드용) */
export function useGetRecentUnread(studentId: number, limit: number = 3) {
  return useQuery({
    queryKey: commentKeys.recentUnread(studentId),
    queryFn: async () => {
      const response = await plannerClient.get('/planner/comments/recent-unread', {
        params: { studentId, limit },
      });
      return response.data as PlannerComment[];
    },
    enabled: studentId > 0,
    refetchInterval: 30000, // 30초마다 갱신
  });
}
