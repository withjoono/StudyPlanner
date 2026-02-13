/**
 * 학부모 대시보드
 * 자녀 목록 + 선택된 자녀의 학습 요약을 보여줍니다.
 */
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import {
  Users, BookOpen, Clock, Trophy, TrendingUp,
  Camera, ChevronRight, AlertTriangle, CheckCircle, Circle,
} from 'lucide-react';

export const Route = createFileRoute('/')(
  { component: ParentDashboard },
);

// ==============================
// Mock Data (API 연동 전)
// ==============================

const MOCK_CHILDREN = [
  { id: 1, name: '김민수', grade: '고2', school: '서울고등학교', studentCode: 'STU001' },
  { id: 2, name: '김수진', grade: '중3', school: '서울중학교', studentCode: 'STU002' },
];

const MOCK_DASHBOARD: Record<number, {
  totalMissions: number;
  completedMissions: number;
  completionRate: number;
  score: number;
  studyMinutes: number;
  weeklyScores: { date: string; score: number }[];
  missions: { id: number; subject: string; title: string; status: string; startTime: string; endTime: string }[];
}> = {
  1: {
    totalMissions: 8,
    completedMissions: 5,
    completionRate: 63,
    score: 42.0,
    studyMinutes: 185,
    weeklyScores: [
      { date: '월', score: 38 }, { date: '화', score: 42 }, { date: '수', score: 35 },
      { date: '목', score: 48 }, { date: '금', score: 42 }, { date: '토', score: 0 }, { date: '일', score: 0 },
    ],
    missions: [
      { id: 1, subject: '수학', title: '미적분 기본 문제', status: 'completed', startTime: '09:00', endTime: '10:00' },
      { id: 2, subject: '영어', title: '단어 50개 암기', status: 'completed', startTime: '10:30', endTime: '11:30' },
      { id: 3, subject: '국어', title: '비문학 독해 3지문', status: 'completed', startTime: '13:00', endTime: '14:00' },
      { id: 4, subject: '과학', title: '물리 1단원 정리', status: 'in_progress', startTime: '14:30', endTime: '15:30' },
      { id: 5, subject: '수학', title: '확률과 통계 연습', status: 'pending', startTime: '16:00', endTime: '17:00' },
    ],
  },
  2: {
    totalMissions: 6,
    completedMissions: 6,
    completionRate: 100,
    score: 55.5,
    studyMinutes: 240,
    weeklyScores: [
      { date: '월', score: 55 }, { date: '화', score: 50 }, { date: '수', score: 60 },
      { date: '목', score: 52 }, { date: '금', score: 55 }, { date: '토', score: 0 }, { date: '일', score: 0 },
    ],
    missions: [
      { id: 1, subject: '국어', title: '시 감상문 작성', status: 'completed', startTime: '09:00', endTime: '10:00' },
      { id: 2, subject: '수학', title: '함수 기본 문제', status: 'completed', startTime: '10:30', endTime: '11:30' },
      { id: 3, subject: '영어', title: 'Reading 5 passages', status: 'completed', startTime: '13:00', endTime: '14:00' },
    ],
  },
};

const SUBJECT_COLORS: Record<string, string> = {
  '국어': '#ef4444', '수학': '#eab308', '영어': '#f97316',
  '사회': '#3b82f6', '과학': '#14b8a6', '한국사': '#a855f7',
};

// ==============================
// Dashboard Component
// ==============================

function ParentDashboard() {
  const [selectedChildId, setSelectedChildId] = useState(MOCK_CHILDREN[0].id);
  const selectedChild = MOCK_CHILDREN.find((c) => c.id === selectedChildId)!;
  const dashboard = MOCK_DASHBOARD[selectedChildId];

  return (
    <div className="mx-auto w-full max-w-screen-xl px-4 py-6">
      {/* 자녀 선택 탭 */}
      <div className="mb-6">
        <div className="flex items-center gap-2 rounded-xl bg-white p-1.5 shadow-sm">
          {MOCK_CHILDREN.map((child) => (
            <button
              key={child.id}
              onClick={() => setSelectedChildId(child.id)}
              className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                selectedChildId === child.id
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Users className="h-4 w-4" />
                <span>{child.name}</span>
                <span className="text-xs opacity-75">{child.grade}</span>
              </div>
            </button>
          ))}
        </div>
        <p className="mt-2 text-center text-xs text-gray-500">
          {selectedChild.school} · {selectedChild.grade}
        </p>
      </div>

      {/* 요약 카드 */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          icon={<CheckCircle className="h-5 w-5 text-green-500" />}
          label="미션 완료"
          value={`${dashboard.completedMissions}/${dashboard.totalMissions}`}
          subtext={`${dashboard.completionRate}%`}
          color="green"
        />
        <SummaryCard
          icon={<Trophy className="h-5 w-5 text-amber-500" />}
          label="오늘 점수"
          value={`${dashboard.score}`}
          subtext="점"
          color="amber"
        />
        <SummaryCard
          icon={<Clock className="h-5 w-5 text-blue-500" />}
          label="학습 시간"
          value={`${Math.floor(dashboard.studyMinutes / 60)}시간 ${dashboard.studyMinutes % 60}분`}
          color="blue"
        />
        <SummaryCard
          icon={<TrendingUp className="h-5 w-5 text-purple-500" />}
          label="주간 평균"
          value={`${Math.round(dashboard.weeklyScores.filter(s => s.score > 0).reduce((a, b) => a + b.score, 0) / Math.max(dashboard.weeklyScores.filter(s => s.score > 0).length, 1))}`}
          subtext="점"
          color="purple"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 주간 점수 추이 */}
        <div className="lg:col-span-2">
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-800">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              이번 주 점수 추이
            </h3>
            <div className="flex items-end gap-2">
              {dashboard.weeklyScores.map((day) => {
                const maxScore = Math.max(...dashboard.weeklyScores.map(d => d.score), 1);
                const height = day.score > 0 ? Math.max((day.score / maxScore) * 140, 8) : 8;
                const isToday = day.date === ['일','월','화','수','목','금','토'][new Date().getDay()];
                return (
                  <div key={day.date} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-xs font-medium text-gray-600">{day.score > 0 ? day.score : ''}</span>
                    <div
                      className={`w-full rounded-t-lg transition-all ${
                        isToday
                          ? 'bg-gradient-to-t from-blue-500 to-blue-400'
                          : day.score > 0
                            ? 'bg-gradient-to-t from-blue-200 to-blue-100'
                            : 'bg-gray-100'
                      }`}
                      style={{ height: `${height}px` }}
                    />
                    <span className={`text-[10px] font-medium ${isToday ? 'text-blue-600' : 'text-gray-400'}`}>
                      {day.date}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 오늘 미션 목록 */}
          <div className="mt-4 rounded-xl bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-base font-semibold text-gray-800">
                <BookOpen className="h-4 w-4 text-indigo-500" />
                오늘의 미션
              </h3>
              <span className="text-sm text-gray-500">
                {dashboard.completedMissions}/{dashboard.totalMissions} 완료
              </span>
            </div>
            <div className="space-y-2">
              {dashboard.missions.map((mission) => {
                const color = SUBJECT_COLORS[mission.subject] || '#6b7280';
                const isCompleted = mission.status === 'completed';
                return (
                  <div
                    key={mission.id}
                    className={`flex items-center gap-3 rounded-lg border p-3 transition-all ${
                      isCompleted ? 'border-gray-200 bg-gray-50 opacity-60' : 'border-gray-200'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-500" />
                    ) : mission.status === 'in_progress' ? (
                      <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-500" />
                    ) : (
                      <Circle className="h-5 w-5 flex-shrink-0 text-gray-300" />
                    )}
                    <div className="h-8 w-1 flex-shrink-0 rounded-full" style={{ backgroundColor: color }} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded px-2 py-0.5 text-xs font-medium text-white" style={{ backgroundColor: color }}>
                          {mission.subject}
                        </span>
                      </div>
                      <p className={`mt-1 text-sm font-medium ${isCompleted ? 'text-gray-400 line-through' : ''}`}>
                        {mission.title}
                      </p>
                    </div>
                    <div className="text-right text-xs text-gray-500">
                      {mission.startTime} - {mission.endTime}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 사이드바 */}
        <div className="space-y-4">
          {/* 완료율 가이지 */}
          <div className="rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-5 text-white shadow-lg">
            <p className="text-sm font-medium opacity-80">오늘 미션 완료율</p>
            <p className="mt-2 text-4xl font-bold">{dashboard.completionRate}%</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-white transition-all"
                style={{ width: `${dashboard.completionRate}%` }}
              />
            </div>
            <p className="mt-2 text-xs opacity-70">
              {dashboard.completedMissions}개 완료 / {dashboard.totalMissions}개 중
            </p>
          </div>

          {/* 인증 사진 */}
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-gray-800">
              <Camera className="h-4 w-4 text-purple-500" />
              인증 사진
            </h3>
            <div className="rounded-lg border-2 border-dashed border-gray-200 p-6 text-center">
              <Camera className="mx-auto h-8 w-8 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">오늘 인증 사진 {dashboard.completedMissions}장</p>
              <button className="mt-2 text-xs font-medium text-blue-600 hover:text-blue-700">
                모두 보기 <ChevronRight className="inline h-3 w-3" />
              </button>
            </div>
          </div>

          {/* 빠른 알림 */}
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-base font-semibold text-gray-800">알림</h3>
            <div className="space-y-2">
              {dashboard.completionRate < 80 && (
                <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
                  <div>
                    <p className="text-xs font-medium text-amber-800">미션 완료율 미달</p>
                    <p className="text-[10px] text-amber-600">목표 80% 대비 {dashboard.completionRate}% 달성</p>
                  </div>
                </div>
              )}
              {dashboard.completionRate >= 80 && (
                <div className="flex items-start gap-2 rounded-lg bg-green-50 p-3">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                  <div>
                    <p className="text-xs font-medium text-green-800">학습 순항 중!</p>
                    <p className="text-[10px] text-green-600">미션 완료율 {dashboard.completionRate}% 달성 🎉</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==============================
// Sub Components
// ==============================

function SummaryCard({
  icon,
  label,
  value,
  subtext,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext?: string;
  color: string;
}) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`rounded-lg bg-${color}-50 p-2`}>{icon}</div>
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-gray-900">{value}</span>
            {subtext && <span className="text-sm text-gray-400">{subtext}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
