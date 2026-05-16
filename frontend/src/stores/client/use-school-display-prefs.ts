/**
 * 학교 일정·시간표 표시 여부 사용자 선호.
 * localStorage에 영속. 기본값은 둘 다 표시.
 */
import { useCallback, useEffect, useState } from 'react';

const KEY_EVENTS = 'sp:show-school-events';
const KEY_TIMETABLE = 'sp:show-school-timetable';

function readBool(key: string, fallback: boolean): boolean {
  if (typeof window === 'undefined') return fallback;
  const v = window.localStorage.getItem(key);
  if (v === null) return fallback;
  return v !== 'false';
}

export function useSchoolDisplayPrefs() {
  const [showSchoolEvents, setShowSchoolEvents] = useState(() => readBool(KEY_EVENTS, true));
  const [showSchoolTimetable, setShowSchoolTimetable] = useState(() =>
    readBool(KEY_TIMETABLE, true),
  );

  useEffect(() => {
    window.localStorage.setItem(KEY_EVENTS, String(showSchoolEvents));
  }, [showSchoolEvents]);
  useEffect(() => {
    window.localStorage.setItem(KEY_TIMETABLE, String(showSchoolTimetable));
  }, [showSchoolTimetable]);

  const toggleEvents = useCallback(() => setShowSchoolEvents((v) => !v), []);
  const toggleTimetable = useCallback(() => setShowSchoolTimetable((v) => !v), []);

  return {
    showSchoolEvents,
    showSchoolTimetable,
    setShowSchoolEvents,
    setShowSchoolTimetable,
    toggleEvents,
    toggleTimetable,
  };
}
