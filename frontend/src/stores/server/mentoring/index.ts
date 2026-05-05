import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { plannerClient } from '@/lib/api/instances';

export const mentoringKeys = {
  all: ['mentoring'] as const,
  dashboard: (week?: string) => [...mentoringKeys.all, 'dashboard', week] as const,
  inspection: (studentId: number, week?: string) =>
    [...mentoringKeys.all, 'inspection', studentId, week] as const,
  sessions: (role: string, studentId?: number) =>
    [...mentoringKeys.all, 'sessions', role, studentId] as const,
  unread: () => [...mentoringKeys.all, 'unread'] as const,
};

export interface MentoringDashboardStudent {
  studentId: number;
  studentName: string;
  grade: string | null;
  missionRate: number;
  studyMinutes: number;
  sessionDone: boolean;
  sessionGrade: string | null;
  sessionId: number | null;
}

export interface MentoringDashboard {
  week: { start: string; end: string };
  total: number;
  done: number;
  atRisk: number;
  students: MentoringDashboardStudent[];
}

export interface InspectionSummary {
  student: { id: number; name: string; grade: string | null };
  week: { start: string; end: string };
  stats: {
    missionRate: number;
    totalMissions: number;
    completedMissions: number;
    totalScore: number;
    studyMinutes: number;
    studyMinutesDelta: number;
    scoreDelta: number;
  };
  subjectStats: { subject: string; total: number; done: number; rate: number }[];
  photos: { id: number; url: string; at: string }[];
  reflections: {
    date: string;
    mood: string | null;
    goodPoints: string | null;
    badPoints: string | null;
    tomorrowPlan: string | null;
  }[];
  existingSession: MentoringSessionDetail | null;
}

export interface MentoringSessionDetail {
  id: number;
  weekStart: string;
  weekEnd: string;
  checklist: Record<string, boolean> | null;
  grade: string | null;
  subjectComments: Record<string, string> | null;
  overallComment: string | null;
  nextWeekTask: string | null;
  studentAcked: boolean;
  studentAckedAt: string | null;
  createdAt: string;
}

export function useMentoringDashboard(week?: string) {
  return useQuery<MentoringDashboard>({
    queryKey: mentoringKeys.dashboard(week),
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (week) params.week = week;
      const { data } = await plannerClient.get('/mentoring/dashboard', { params });
      return data;
    },
    staleTime: 60_000,
  });
}

export function useInspectionSummary(studentId: number, week?: string) {
  return useQuery<InspectionSummary>({
    queryKey: mentoringKeys.inspection(studentId, week),
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (week) params.week = week;
      const { data } = await plannerClient.get(`/mentoring/inspection/${studentId}`, { params });
      return data;
    },
    enabled: studentId > 0,
    staleTime: 30_000,
  });
}

export function useMentoringSessions(role: 'teacher' | 'student', studentId?: number) {
  return useQuery<MentoringSessionDetail[]>({
    queryKey: mentoringKeys.sessions(role, studentId),
    queryFn: async () => {
      const params: Record<string, string> = { role };
      if (studentId) params.studentId = String(studentId);
      const { data } = await plannerClient.get('/mentoring/sessions', { params });
      return data;
    },
    staleTime: 60_000,
  });
}

export function useMentoringUnread() {
  return useQuery<{ unreadCount: number }>({
    queryKey: mentoringKeys.unread(),
    queryFn: async () => {
      const { data } = await plannerClient.get('/mentoring/unread');
      return data;
    },
    staleTime: 60_000,
  });
}

export function useSaveSession(studentId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      weekStart: string;
      weekEnd: string;
      checklist?: Record<string, boolean>;
      grade?: string;
      subjectComments?: Record<string, string>;
      overallComment?: string;
      nextWeekTask?: string;
    }) => {
      const { data } = await plannerClient.post(`/mentoring/sessions/${studentId}`, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: mentoringKeys.all });
    },
  });
}

export function useAckSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: number) => {
      const { data } = await plannerClient.patch(`/mentoring/sessions/${sessionId}/ack`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: mentoringKeys.all });
    },
  });
}
