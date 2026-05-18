/**
 * NEIS 학교 일정 hooks
 *
 * 학교·학년·반 정보는 Hub의 /auth/me (studentProfile)에서 가져온다.
 * StudyPlanner 백엔드가 NEIS API를 직접 호출하고 DB에 캐싱한다.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { plannerClient } from '@/lib/api/instances';
import { useGetMe, authKeys } from '@/stores/server/auth';

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
  schulKind: string; // schoolLevel: 'high' | 'middle' | 'elementary'
  address?: string | null;
}

export interface TimetableItem {
  grade: string;
  classNm: string;
  period: string; // '1' ~ '7'
  subject: string;
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
  events: (year: number, month?: number) =>
    [...schoolScheduleKeys.all, 'events', year, month] as const,
  timetable: (dateStr: string, schulCode?: string) =>
    [...schoolScheduleKeys.all, 'timetable', dateStr, schulCode] as const,
};

/**
 * Hub studentProfile에서 학교 정보 조회.
 * 탭 복귀 시 자동 리패치(Hub 프로필 수정 후 반영).
 */
export function useGetLinkedSchool() {
  const queryClient = useQueryClient();
  const { data: me, isLoading } = useGetMe();

  // Hub 프로필에서 학교 수정 후 탭으로 돌아왔을 때 자동 새로고침
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        queryClient.invalidateQueries({ queryKey: authKeys.me(), refetchType: 'all' });
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [queryClient]);

  const profile = me?.studentProfile;
  const data: LinkedSchool | null =
    !profile?.neisAtptCode || !profile?.neisSchulCode
      ? null
      : {
          atptCode: profile.neisAtptCode,
          schulCode: profile.neisSchulCode,
          schulName: profile.schoolName || '',
          schulKind: profile.schoolLevel || '',
          atptName: '',
          address: null,
        };

  return { data, isLoading };
}

/** 학교 행사 일정 조회 (StudyPlanner 백엔드 → NEIS DB 캐시) */
export function useGetSchoolEvents(year: number, month?: number) {
  const { data: linkedSchool } = useGetLinkedSchool();

  return useQuery({
    queryKey: schoolScheduleKeys.events(year, month),
    queryFn: async () => {
      const res = await plannerClient.get('/neis/schedule', {
        params: {
          year,
          month,
          atptCode: linkedSchool!.atptCode,
          schulCode: linkedSchool!.schulCode,
        },
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

/** 특정 날짜 시간표 조회 (grade·classNm·schoolLevel은 studentProfile에서) */
export function useGetDayTimetable(dateStr: string) {
  const { data: linkedSchool } = useGetLinkedSchool();
  const { data: me } = useGetMe();
  const profile = me?.studentProfile;

  const grade = profile?.grade != null ? String(profile.grade) : undefined;
  const classNm = profile?.classNm ?? undefined;
  // schoolLevel: studentProfile 또는 linkedSchool.schulKind 에서 fallback
  const schoolLevel =
    (profile?.schoolLevel ?? undefined) ||
    (linkedSchool?.schulKind ? linkedSchool.schulKind : undefined);
  const yyyymmdd = dateStr.replace(/-/g, '');

  return useQuery({
    queryKey: schoolScheduleKeys.timetable(dateStr, linkedSchool?.schulCode),
    queryFn: async () => {
      const res = await plannerClient.get<TimetableItem[]>('/neis/timetable', {
        params: {
          date: yyyymmdd,
          atptCode: linkedSchool!.atptCode,
          schulCode: linkedSchool!.schulCode,
          ...(schoolLevel && { schoolLevel }),
          ...(grade && { grade }),
          ...(classNm && { classNm }),
        },
      });
      return res.data ?? [];
    },
    // schoolLevel 없이도 학교 연결되면 조회 시도 (백엔드가 학교코드+날짜만으로도 반환 가능)
    enabled: !!dateStr && !!linkedSchool,
    staleTime: 1000 * 60 * 60 * 24,
  });
}
