/**
 * 타이머 API Hooks (Mock)
 * 포모도로 타이머 세션 관리
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ============================================
// Types
// ============================================

export interface TimerSession {
  id: number;
  studentId: number;
  missionId: number | null;
  startedAt: string;
  endedAt: string | null;
  durationMin: number;
  targetMin: number;
  sessionType: 'focus' | 'break';
  isCompleted: boolean;
  subject: string | null;
  createdAt: string;
}

export interface TimerStats {
  totalMin: number;
  completedSessions: number;
}

// ============================================
// Mock Data
// ============================================

const mockSessions: TimerSession[] = [];
let mockActiveSession: TimerSession | null = null;
let sessionIdCounter = 1000;

// ============================================
// Query Keys
// ============================================

export const timerKeys = {
  all: ['timer'] as const,
  active: () => [...timerKeys.all, 'active'] as const,
  today: () => [...timerKeys.all, 'today'] as const,
  stats: () => [...timerKeys.all, 'stats'] as const,
};

// ============================================
// Hooks
// ============================================

/** 진행 중인 세션 조회 */
export function useTimerActiveSession() {
  return useQuery({
    queryKey: timerKeys.active(),
    queryFn: async (): Promise<TimerSession | null> => {
      await new Promise((r) => setTimeout(r, 100));
      return mockActiveSession;
    },
    refetchInterval: 1000, // 1초마다 폴링 (타이머 상태 동기화)
  });
}

/** 오늘 세션 목록 */
export function useTimerTodaySessions() {
  return useQuery({
    queryKey: timerKeys.today(),
    queryFn: async (): Promise<TimerSession[]> => {
      await new Promise((r) => setTimeout(r, 100));
      const today = new Date().toISOString().split('T')[0];
      return mockSessions.filter((s) => s.startedAt.startsWith(today));
    },
  });
}

/** 오늘 통계 */
export function useTimerStats() {
  return useQuery({
    queryKey: timerKeys.stats(),
    queryFn: async (): Promise<TimerStats> => {
      await new Promise((r) => setTimeout(r, 100));
      const today = new Date().toISOString().split('T')[0];
      const todaySessions = mockSessions.filter(
        (s) => s.startedAt.startsWith(today) && s.isCompleted && s.sessionType === 'focus',
      );
      return {
        totalMin: todaySessions.reduce((sum, s) => sum + s.durationMin, 0),
        completedSessions: todaySessions.length,
      };
    },
  });
}

/** 타이머 시작 */
export function useTimerStart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      missionId?: number;
      targetMin?: number;
      subject?: string;
    }): Promise<TimerSession> => {
      await new Promise((r) => setTimeout(r, 200));
      const session: TimerSession = {
        id: sessionIdCounter++,
        studentId: 1,
        missionId: data.missionId || null,
        startedAt: new Date().toISOString(),
        endedAt: null,
        durationMin: 0,
        targetMin: data.targetMin || 25,
        sessionType: 'focus',
        isCompleted: false,
        subject: data.subject || null,
        createdAt: new Date().toISOString(),
      };
      mockActiveSession = session;
      return session;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timerKeys.active() });
    },
  });
}

/** 타이머 종료 */
export function useTimerEnd() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: number): Promise<TimerSession> => {
      await new Promise((r) => setTimeout(r, 200));
      if (!mockActiveSession || mockActiveSession.id !== sessionId) {
        throw new Error('Active session not found');
      }

      const endedAt = new Date();
      const startedAt = new Date(mockActiveSession.startedAt);
      const durationMin = Math.round((endedAt.getTime() - startedAt.getTime()) / 60000);

      const completed: TimerSession = {
        ...mockActiveSession,
        endedAt: endedAt.toISOString(),
        durationMin,
        isCompleted: durationMin >= mockActiveSession.targetMin,
      };

      mockSessions.push(completed);
      mockActiveSession = null;
      return completed;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timerKeys.all });
    },
  });
}
