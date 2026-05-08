import { useState, useEffect, useRef, useCallback } from 'react';
import { createLazyFileRoute } from '@tanstack/react-router';
import { Play, Pause, RotateCcw, Flame, Clock, Zap } from 'lucide-react';
import { plannerClient } from '@/lib/api/instances';

// ── 타이머 설정 ──
const FOCUS_PRESETS = [
  { label: '25분', value: 25 },
  { label: '50분', value: 50 },
  { label: '90분', value: 90 },
];
const BREAK_MIN = 5;

type TimerPhase = 'idle' | 'focus' | 'break';

export const Route = createLazyFileRoute('/timer')({
  component: TimerPage,
});

function TimerPage() {
  const [phase, setPhase] = useState<TimerPhase>('idle');
  const [targetMin, setTargetMin] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [todayStats, setTodayStats] = useState({ totalMin: 0, completedSessions: 0 });
  const [subject, setSubject] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 오늘 통계 로드
  useEffect(() => {
    loadTodayStats();
  }, []);

  const loadTodayStats = async () => {
    try {
      const { data } = await plannerClient.get('/timer/stats', { params: { studentId: 1 } });
      setTodayStats(data);
    } catch {
      /* ignore */
    }
  };

  // 타이머 카운트다운
  useEffect(() => {
    if (isRunning && secondsLeft > 0) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0 && isRunning) {
      handleTimerComplete();
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, secondsLeft]);

  const handleTimerComplete = useCallback(async () => {
    setIsRunning(false);
    if (phase === 'focus' && sessionId) {
      try {
        await plannerClient.put(`/timer/${sessionId}/end`);
        await loadTodayStats();
      } catch {
        /* ignore */
      }
      // 자동으로 휴식 모드 전환
      setPhase('break');
      setSecondsLeft(BREAK_MIN * 60);
    } else if (phase === 'break') {
      setPhase('idle');
      setSecondsLeft(targetMin * 60);
    }
  }, [phase, sessionId, targetMin]);

  const startTimer = async () => {
    if (phase === 'idle') {
      try {
        const { data } = await plannerClient.post('/timer/start', {
          studentId: 1,
          targetMin,
          subject: subject || undefined,
        });
        setSessionId(data.id);
      } catch {
        /* ignore */
      }
      setPhase('focus');
      setSecondsLeft(targetMin * 60);
    }
    setIsRunning(true);
  };

  const pauseTimer = () => setIsRunning(false);

  const resetTimer = async () => {
    setIsRunning(false);
    if (sessionId && phase === 'focus') {
      try {
        await plannerClient.put(`/timer/${sessionId}/end`);
      } catch {
        /* ignore */
      }
      await loadTodayStats();
    }
    setPhase('idle');
    setSecondsLeft(targetMin * 60);
    setSessionId(null);
  };

  const selectPreset = (min: number) => {
    if (phase !== 'idle') return;
    setTargetMin(min);
    setSecondsLeft(min * 60);
  };

  // 포맷 헬퍼
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const progress =
    phase === 'focus'
      ? 1 - secondsLeft / (targetMin * 60)
      : phase === 'break'
        ? 1 - secondsLeft / (BREAK_MIN * 60)
        : 0;

  const circumference = 2 * Math.PI * 140;
  const strokeOffset = circumference * (1 - progress);

  const phaseColors = {
    idle: { ring: '#6366f1', bg: 'from-indigo-50 to-purple-50', text: 'text-indigo-600' },
    focus: { ring: '#ef4444', bg: 'from-red-50 to-orange-50', text: 'text-red-600' },
    break: { ring: '#10b981', bg: 'from-emerald-50 to-teal-50', text: 'text-emerald-600' },
  };

  const colors = phaseColors[phase];

  return (
    <div className={`min-h-screen bg-gradient-to-br ${colors.bg} flex flex-col items-center p-4`}>
      {/* Header */}
      <div className="w-full max-w-md">
        <h1 className="mb-2 flex items-center gap-2 text-2xl font-bold text-gray-900">
          <Flame className="h-6 w-6 text-orange-500" />
          포모도로 타이머
        </h1>
        <p className="mb-6 text-sm text-gray-500">
          {phase === 'idle'
            ? '집중 시간을 선택하고 시작하세요'
            : phase === 'focus'
              ? '🔥 집중 모드 진행 중...'
              : '☕ 잠시 쉬어가세요!'}
        </p>
      </div>

      {/* 과목 선택 */}
      {phase === 'idle' && (
        <div className="mb-6 w-full max-w-md">
          <input
            type="text"
            placeholder="과목 입력 (선택)"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-2.5 text-sm backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
      )}

      {/* 시간 프리셋 */}
      {phase === 'idle' && (
        <div className="mb-8 flex gap-3">
          {FOCUS_PRESETS.map((p) => (
            <button
              key={p.value}
              onClick={() => selectPreset(p.value)}
              className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                targetMin === p.value
                  ? 'scale-105 bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                  : 'bg-white/80 text-gray-600 hover:bg-white hover:shadow-md'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      {/* 타이머 원형 */}
      <div className="relative mb-8 h-80 w-80">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 300 300">
          <circle cx="150" cy="150" r="140" fill="none" stroke="#e5e7eb" strokeWidth="8" />
          <circle
            cx="150"
            cy="150"
            r="140"
            fill="none"
            stroke={colors.ring}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeOffset}
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={`font-mono text-6xl font-bold ${colors.text}`}>
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
          <div className="mt-2 text-sm text-gray-400">
            {phase === 'focus'
              ? `집중 ${targetMin}분`
              : phase === 'break'
                ? `휴식 ${BREAK_MIN}분`
                : `${targetMin}분 세션`}
          </div>
        </div>
      </div>

      {/* 컨트롤 버튼 */}
      <div className="mb-10 flex gap-4">
        {!isRunning ? (
          <button
            onClick={startTimer}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 transition-all hover:bg-indigo-600 active:scale-95"
          >
            <Play className="ml-1 h-7 w-7" />
          </button>
        ) : (
          <button
            onClick={pauseTimer}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500 text-white shadow-lg shadow-amber-500/30 transition-all hover:bg-amber-600 active:scale-95"
          >
            <Pause className="h-7 w-7" />
          </button>
        )}
        <button
          onClick={resetTimer}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-200 text-gray-600 transition-all hover:bg-gray-300 active:scale-95"
        >
          <RotateCcw className="h-6 w-6" />
        </button>
      </div>

      {/* 오늘 통계 */}
      <div className="grid w-full max-w-md grid-cols-2 gap-4">
        <div className="rounded-2xl border border-white/50 bg-white/70 p-4 backdrop-blur-sm">
          <div className="mb-1 flex items-center gap-2 text-xs text-gray-500">
            <Clock className="h-3.5 w-3.5" />
            오늘 총 집중
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {todayStats.totalMin >= 60
              ? `${Math.floor(todayStats.totalMin / 60)}시간 ${todayStats.totalMin % 60}분`
              : `${todayStats.totalMin}분`}
          </div>
        </div>
        <div className="rounded-2xl border border-white/50 bg-white/70 p-4 backdrop-blur-sm">
          <div className="mb-1 flex items-center gap-2 text-xs text-gray-500">
            <Zap className="h-3.5 w-3.5" />
            완료 세션
          </div>
          <div className="text-2xl font-bold text-gray-900">{todayStats.completedSessions}회</div>
        </div>
      </div>
    </div>
  );
}
