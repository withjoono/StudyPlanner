/**
 * NEIS 학교 일정 hooks
 *
 * NEIS API는 Hub Backend가 중앙 관리한다.
 * StudyPlanner는 Hub의 /neis/* 엔드포인트를 authClient(JWT 쿠키)로 호출한다.
 * Hub가 NEIS 키·캐시·파싱 로직을 단일 소유한다.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authClient } from '@/lib/api/instances';

export interface NeisSchoolInfo {
  atptCode: string;
  atptNm: string;
  schulCode: string;
  schulNm: string;
  schulKnd: string;
  address?: string | null;
}

export interface SchoolEvent {
  id: number;
  date: string; // YYYY-MM-DD
  eventName: string;
  isHoliday: boolean;
}

export interface LinkedSchool {
  id: number;
  schulNm: string;
  atptNm: string;
  schulKnd: string;
}

export const schoolScheduleKeys = {
  all: ['schoolSchedule'] as const,
  mySchool: () => [...schoolScheduleKeys.all, 'mySchool'] as const,
  events: (year: number, month?: number) =>
    [...schoolScheduleKeys.all, 'events', year, month] as const,
  search: (q: string) => [...schoolScheduleKeys.all, 'search', q] as const,
};

/** Hub에서 연결된 학교 정보 조회 */
export function useGetLinkedSchool() {
  return useQuery({
    queryKey: schoolScheduleKeys.mySchool(),
    queryFn: async () => {
      const res = await authClient.get<LinkedSchool | null>('/neis/my-school');
      return res.data;
    },
  });
}

/** Hub에서 학교 행사 일정 조회 (월별 캐시) */
export function useGetSchoolEvents(year: number, month?: number) {
  const { data: linkedSchool } = useGetLinkedSchool();

  return useQuery({
    queryKey: schoolScheduleKeys.events(year, month),
    queryFn: async () => {
      const res = await authClient.get<SchoolEvent[]>('/neis/schedule', {
        params: { year, month },
      });
      return res.data ?? [];
    },
    enabled: !!linkedSchool,
    staleTime: 1000 * 60 * 60, // 1시간
  });
}

/** Hub NEIS API로 학교 검색 */
export function useSearchSchools(q: string) {
  return useQuery({
    queryKey: schoolScheduleKeys.search(q),
    queryFn: async () => {
      if (!q.trim() || q.length < 2) return [];
      const res = await authClient.get<NeisSchoolInfo[]>('/neis/schools', {
        params: { q },
      });
      return res.data ?? [];
    },
    enabled: q.length >= 2,
    staleTime: 1000 * 60 * 5,
  });
}

/** Hub에 학교 연결 저장 */
export function useLinkSchool() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (school: NeisSchoolInfo) => {
      const res = await authClient.post<LinkedSchool>('/neis/my-school', school);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: schoolScheduleKeys.mySchool() });
      queryClient.invalidateQueries({ queryKey: schoolScheduleKeys.all });
    },
  });
}

/** Hub에서 학교 연결 해제 */
export function useUnlinkSchool() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await authClient.delete('/neis/my-school');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: schoolScheduleKeys.mySchool() });
      queryClient.invalidateQueries({ queryKey: schoolScheduleKeys.all });
    },
  });
}

/** Hub에서 학교 일정 강제 새로고침 (NEIS 재조회) */
export function useRefreshSchoolSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (year: number) => {
      await authClient.post('/neis/schedule/refresh', { year });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: schoolScheduleKeys.all });
    },
  });
}
