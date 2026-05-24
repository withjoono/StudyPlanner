import { useQuery } from '@tanstack/react-query';
import { plannerClient } from '@/lib/api/instances';

export interface LeaderboardEntry {
  rank: number;
  studentId: number;
  name: string;
  grade: string | null;
  totalScore: number;
  studyMinutes: number;
  missionCount: number;
  totalPages: number;
  rankChange: number | null;
}

export interface LeaderboardResponse {
  period: 'daily' | 'weekly' | 'monthly';
  dateRange: { start: string; end: string };
  leaderboard: LeaderboardEntry[];
  myRank: number | null;
  groupAverage: number;
  totalMembers: number;
  availableGroups?: { id: string; name: string }[];
}

export interface MyRankSummary {
  rank: number | null;
  totalMembers: number;
  totalScore?: number;
  studyMinutes?: number;
  rankChange?: number | null;
  period: string;
}

export function useLeaderboard(
  period: 'daily' | 'weekly' | 'monthly' = 'weekly',
  date?: string,
  groupId?: string,
) {
  return useQuery<LeaderboardResponse>({
    queryKey: ['ranking', 'leaderboard', period, date, groupId],
    queryFn: async () => {
      const params: Record<string, string> = { period };
      if (date) params.date = date;
      if (groupId) params.groupId = groupId;
      const { data } = await plannerClient.get('/ranking/leaderboard', { params });
      return data;
    },
    staleTime: 60_000, // 1분 캐시
  });
}

export function useMyRankSummary() {
  return useQuery<MyRankSummary>({
    queryKey: ['ranking', 'my-stats'],
    queryFn: async () => {
      const { data } = await plannerClient.get('/ranking/my-stats');
      return data;
    },
    staleTime: 60_000,
  });
}

/**
 * Hub 반(internal API · service token 기반) 리더보드.
 * - 백엔드가 Hub `/api/internal/groups/:id/members`를 호출해 SP DailyScore와 join
 * - 닉네임은 Hub 응답값이 사용됨 (학생 이름이 아닌 표시명)
 */
export function useHubGroupLeaderboard(
  groupId: string | null | undefined,
  period: 'daily' | 'weekly' | 'monthly' = 'weekly',
  date?: string,
) {
  return useQuery<LeaderboardResponse>({
    queryKey: ['ranking', 'hub-group', groupId, period, date],
    queryFn: async () => {
      const params: Record<string, string> = { period };
      if (date) params.date = date;
      const { data } = await plannerClient.get(`/ranking/hub-groups/${groupId}/leaderboard`, {
        params,
      });
      return data;
    },
    enabled: !!groupId,
    staleTime: 60_000,
  });
}
