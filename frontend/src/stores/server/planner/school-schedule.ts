/**
 * NEIS 학교 일정 hooks
 *
 * NEIS API는 Hub Backend가 중앙 관리한다.
 * StudyPlanner는 Hub의 /neis/* 엔드포인트를 authClient(JWT 쿠키)로 호출한다.
 * Hub가 NEIS 키·캐시·파싱 로직을 단일 소유한다.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authClient, publicClient } from '@/lib/api/instances';
import { useAuthStore } from '@/stores/client/use-auth-store';

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

function getSchoolLevel(schulKind?: string): 'high' | 'middle' | 'elementary' | null {
  if (!schulKind) return null;
  if (schulKind.includes('고등')) return 'high';
  if (schulKind.includes('중학') || schulKind.includes('중등')) return 'middle';
  if (schulKind.includes('초등') || schulKind.includes('초교')) return 'elementary';
  return 'high'; // 기본값
}

export const schoolScheduleKeys = {
  all: ['schoolSchedule'] as const,
  mySchool: () => [...schoolScheduleKeys.all, 'mySchool'] as const,
  events: (year: number, month?: number) =>
    [...schoolScheduleKeys.all, 'events', year, month] as const,
  search: (q: string) => [...schoolScheduleKeys.all, 'search', q] as const,
  timetable: (dateStr: string, schulCode?: string) =>
    [...schoolScheduleKeys.all, 'timetable', dateStr, schulCode] as const,
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

/**
 * 특정 날짜의 시간표 조회
 * - Hub @Public 엔드포인트 (atptCode, schulCode 필요)
 * - grade + classNm으로 필터링
 * @param dateStr YYYY-MM-DD 형식
 */
export function useGetDayTimetable(dateStr: string) {
  const { data: linkedSchool } = useGetLinkedSchool();
  const user = useAuthStore((state) => state.user);

  const grade = user?.studentProfile?.grade != null ? String(user.studentProfile.grade) : undefined;
  const classNm = user?.studentProfile?.classNm ?? undefined;
  const schoolLevel = getSchoolLevel(linkedSchool?.schulKind);

  const yyyymmdd = dateStr.replace(/-/g, '');

  return useQuery({
    queryKey: schoolScheduleKeys.timetable(dateStr, linkedSchool?.schulCode),
    queryFn: async () => {
      const res = await publicClient.get<TimetableItem[]>('/neis/timetable', {
        params: {
          atptCode: linkedSchool!.atptCode,
          schulCode: linkedSchool!.schulCode,
          date: yyyymmdd,
          schoolLevel,
          ...(grade && { grade }),
          ...(classNm && { classNm }),
        },
      });
      return res.data ?? [];
    },
    enabled: !!dateStr && !!linkedSchool?.atptCode && !!linkedSchool?.schulCode && !!schoolLevel,
    staleTime: 1000 * 60 * 60 * 24, // 시간표는 하루 캐시
  });
}
