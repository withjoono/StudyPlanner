/**
 * NEIS 학교 일정 hooks
 *
 * NEIS API는 Hub Backend가 중앙 관리한다.
 * StudyPlanner는 Hub의 /neis/* 엔드포인트를 authClient(JWT 쿠키)로 호출한다.
 * Hub가 NEIS 키·캐시·파싱 로직을 단일 소유한다.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { plannerClient } from '@/lib/api/instances';

export interface NeisSchoolInfo {
  atptCode: string;
  atptName: string;
  schulCode: string;
  schulName: string;
  schulKind: string;
  address?: string | null;
}

export interface SchoolEvent {
  id: number;
  date: string; // YYYY-MM-DD
  eventName: string;
  isHoliday: boolean;
}

export interface LinkedSchool {
  atptCode: string;
  atptName: string;
  schulCode: string;
  schulName: string;
  schulKind: string; // '고등학교' | '중학교' | '초등학교'
  address?: string | null;
}

export interface TimetableItem {
  grade: string; // '1' | '2' | '3'
  classNm: string; // '1' | '2' | '3' ...
  period: string; // '1' ~ '7'
  subject: string; // 과목명
  teacher: string | null;
}

// 교시별 표준 시간 (일반 고등학교 기준)
export const PERIOD_TIMES: Record<string, { start: string; end: string }> = {
  '1': { start: '08:40', end: '09:30' },
  '2': { start: '09:40', end: '10:30' },
  '3': { start: '10:40', end: '11:30' },
  '4': { start: '11:40', end: '12:30' },
  '5': { start: '13:30', end: '14:20' },
  '6': { start: '14:30', end: '15:20' },
  '7': { start: '15:30', end: '16:20' },
};

export const schoolScheduleKeys = {
  all: ['schoolSchedule'] as const,
  mySchool: () => [...schoolScheduleKeys.all, 'mySchool'] as const,
  events: (year: number, month?: number) =>
    [...schoolScheduleKeys.all, 'events', year, month] as const,
  search: (q: string) => [...schoolScheduleKeys.all, 'search', q] as const,
  timetable: (dateStr: string, schulCode?: string) =>
    [...schoolScheduleKeys.all, 'timetable', dateStr, schulCode] as const,
};

/** StudyPlanner 백엔드에서 연결된 학교 정보 조회 */
export function useGetLinkedSchool() {
  return useQuery({
    queryKey: schoolScheduleKeys.mySchool(),
    queryFn: async () => {
      const res = await plannerClient.get<LinkedSchool | null>('/neis/my-school');
      return res.data;
    },
  });
}

/** StudyPlanner 백엔드에서 학교 행사 일정 조회 (월별 캐시) */
export function useGetSchoolEvents(year: number, month?: number) {
  const { data: linkedSchool } = useGetLinkedSchool();

  return useQuery({
    queryKey: schoolScheduleKeys.events(year, month),
    queryFn: async () => {
      const res = await plannerClient.get('/neis/schedule', {
        params: { year, month },
      });
      const raw = res.data;
      if (Array.isArray(raw)) return raw as SchoolEvent[];
      if (raw && Array.isArray(raw.data)) return raw.data as SchoolEvent[];
      if (raw && Array.isArray(raw.events)) return raw.events as SchoolEvent[];
      return [] as SchoolEvent[];
    },
    enabled: !!linkedSchool,
    staleTime: 1000 * 60 * 60,
  });
}

/** StudyPlanner 백엔드 → NEIS API 학교 검색 */
export function useSearchSchools(q: string) {
  return useQuery({
    queryKey: schoolScheduleKeys.search(q),
    queryFn: async () => {
      if (!q.trim() || q.length < 2) return [];
      const res = await plannerClient.get<NeisSchoolInfo[]>('/neis/schools', {
        params: { q },
      });
      return res.data ?? [];
    },
    enabled: q.length >= 2,
    staleTime: 1000 * 60 * 5,
  });
}

/** StudyPlanner 백엔드에 학교 연결 저장 */
export function useLinkSchool() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (school: NeisSchoolInfo) => {
      const res = await plannerClient.post<LinkedSchool>('/neis/my-school', school);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: schoolScheduleKeys.mySchool() });
      queryClient.invalidateQueries({ queryKey: schoolScheduleKeys.all });
    },
  });
}

/** StudyPlanner 백엔드에서 학교 연결 해제 */
export function useUnlinkSchool() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await plannerClient.delete('/neis/my-school');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: schoolScheduleKeys.mySchool() });
      queryClient.invalidateQueries({ queryKey: schoolScheduleKeys.all });
    },
  });
}

/** StudyPlanner 백엔드 → NEIS 학교 일정 강제 새로고침 */
export function useRefreshSchoolSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (year: number) => {
      await plannerClient.post('/neis/schedule/refresh', { year });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: schoolScheduleKeys.all });
    },
  });
}

/**
 * 특정 날짜의 시간표 조회
 * - StudyPlanner 백엔드가 JWT로 학교/학년 정보를 DB에서 조회
 * @param dateStr YYYY-MM-DD 형식
 */
export function useGetDayTimetable(dateStr: string) {
  const { data: linkedSchool } = useGetLinkedSchool();

  const yyyymmdd = dateStr.replace(/-/g, '');

  return useQuery({
    queryKey: schoolScheduleKeys.timetable(dateStr, linkedSchool?.schulCode),
    queryFn: async () => {
      const res = await plannerClient.get<TimetableItem[]>('/neis/timetable', {
        params: { date: yyyymmdd },
      });
      return res.data ?? [];
    },
    enabled: !!dateStr && !!linkedSchool,
    staleTime: 1000 * 60 * 60 * 24,
  });
}
