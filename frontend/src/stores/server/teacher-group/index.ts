import { useQuery } from '@tanstack/react-query';
import { plannerClient } from '@/lib/api/instances';

export type TeacherGroupPeriod = 'daily' | 'weekly' | 'monthly';

/** 담당 선생님 그룹 내 한 학생의 비교 지표 */
export interface TeacherGroupMember {
  studentId: number;
  name: string;
  grade: string | null;
  /** 기간 내 선생님 평가 평균 (0 = 평가 없음) */
  avgScore: number;
  ratingCount: number;
  studyMinutes: number;
  totalPages: number;
  rank: number;
  isMe: boolean;
}

/** 내가 선생님에게 받은 평가 1건 */
export interface MyRatingItem {
  date: string; // YYYY-MM-DD
  score: number;
  comment: string | null;
}

export interface TeacherGroupLeaderboard {
  hasTeacher: boolean;
  teacherName: string | null;
  period: TeacherGroupPeriod;
  dateRange: { start: string; end: string };
  members: TeacherGroupMember[];
  myRatings: MyRatingItem[];
  myRank: number | null;
  totalMembers: number;
  classAverage: { score: number; studyMinutes: number; totalPages: number };
}

/**
 * 담당 선생님 그룹 리더보드 조회.
 * - 선생님이 채점한 1~10점(PlannerRating)을 같은 반 학생끼리 비교
 * - period: 일간 / 주간 / 월간
 */
export function useTeacherGroupLeaderboard(period: TeacherGroupPeriod = 'weekly', date?: string) {
  return useQuery<TeacherGroupLeaderboard>({
    queryKey: ['teacher-group', 'leaderboard', period, date],
    queryFn: async () => {
      const params: Record<string, string> = { period };
      if (date) params.date = date;
      const { data } = await plannerClient.get('/teacher-group/leaderboard', { params });
      return data;
    },
    staleTime: 60_000,
  });
}
