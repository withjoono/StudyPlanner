/**
 * 선생님 API Hooks — 학생 플래너 열람 + 평가
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { plannerClient } from '@/lib/api/instances';
import { useAuthStore } from '@/stores/client';

export const teacherKeys = {
  all: ['teacher'] as const,
  students: () => [...teacherKeys.all, 'students'] as const,
  studentDetail: (id: number) => [...teacherKeys.all, 'student', id] as const,
  studentMissions: (id: number, date: string) =>
    [...teacherKeys.all, 'missions', id, date] as const,
  studentRatings: (id: number) => [...teacherKeys.all, 'ratings', id] as const,
  compare: (ids: number[], date: string) =>
    [...teacherKeys.all, 'compare', ids.join(','), date] as const,
  dashboard: () => [...teacherKeys.all, 'dashboard'] as const,
};

export interface TeacherStudentSummary {
  id: number;
  name: string;
  studentCode: string;
  grade: string | null;
  schoolName: string | null;
  teacherStudentId: number;
  totalMissions: number;
  completedMissions: number;
  completionRate: number;
}

export interface StudentMission {
  id: number;
  date: string;
  subject: string;
  content: string;
  status: string;
  startTime: string;
  endTime: string;
  amount: number | null;
  studyMinutes: number | null;
}

export interface PlannerRating {
  id: number;
  score: number;
  comment: string | null;
  ratingDate: string;
}

export interface CompareEntry {
  studentId: number;
  name: string;
  grade: string | null;
  date: string;
  totalMissions: number;
  completedMissions: number;
  completionRate: number;
  studyMinutes: number;
  totalPages: number;
  rating: { score: number; comment: string | null } | null;
  missions: {
    id: number;
    subject: string;
    content: string;
    status: string;
    studyMinutes: number | null;
    amount: number | null;
  }[];
}

/** 내 학생 목록 */
export function useTeacherStudents() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: teacherKeys.students(),
    queryFn: async () => {
      const res = await plannerClient.get('/teacher/students');
      return res.data as TeacherStudentSummary[];
    },
    enabled: isAuthenticated,
  });
}

/** 학생 추가 (studentCode로) */
export function useAddTeacherStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (studentCode: string) => {
      const res = await plannerClient.post('/teacher/students', { studentCode });
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: teacherKeys.students() }),
  });
}

/** 학생 제거 */
export function useRemoveTeacherStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (studentId: number) => {
      const res = await plannerClient.delete(`/teacher/students/${studentId}`);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: teacherKeys.students() }),
  });
}

/** 학생 미션 조회 */
export function useTeacherStudentMissions(studentId: number, date: string) {
  return useQuery({
    queryKey: teacherKeys.studentMissions(studentId, date),
    queryFn: async () => {
      const res = await plannerClient.get(`/teacher/students/${studentId}/missions`, {
        params: { date },
      });
      return res.data as StudentMission[];
    },
    enabled: studentId > 0,
  });
}

/** 학생 평가 목록 */
export function useStudentRatings(studentId: number) {
  return useQuery({
    queryKey: teacherKeys.studentRatings(studentId),
    queryFn: async () => {
      const res = await plannerClient.get(`/teacher/students/${studentId}/ratings`);
      return res.data as PlannerRating[];
    },
    enabled: studentId > 0,
  });
}

/** 학생 평가 저장/수정 */
export function useRateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      studentId,
      date,
      score,
      comment,
    }: {
      studentId: number;
      date: string;
      score: number;
      comment?: string;
    }) => {
      const res = await plannerClient.put(`/teacher/students/${studentId}/rating`, {
        date,
        score,
        comment,
      });
      return res.data;
    },
    onSuccess: (_data, { studentId }) => {
      queryClient.invalidateQueries({ queryKey: teacherKeys.studentRatings(studentId) });
      queryClient.invalidateQueries({ queryKey: teacherKeys.all });
    },
  });
}

/** 다수 학생 비교 */
export function useCompareStudents(studentIds: number[], date: string) {
  return useQuery({
    queryKey: teacherKeys.compare(studentIds, date),
    queryFn: async () => {
      const res = await plannerClient.get('/teacher/compare', {
        params: { studentIds: studentIds.join(','), date },
      });
      return res.data as CompareEntry[];
    },
    enabled: studentIds.length > 0,
    staleTime: 1000 * 60 * 2,
  });
}
