import { createLazyFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import {
  ClipboardList,
  CheckCircle2,
  Circle,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Clock,
  Target,
  Star,
  Camera,
  MessageSquare,
  Save,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useMentoringDashboard,
  useInspectionSummary,
  useSaveSession,
  useMentoringSessions,
  useAckSession,
  type MentoringSessionDetail,
} from '@/stores/server/mentoring';
import { useAuthStore } from '@/stores/client/use-auth-store';

export const Route = createLazyFileRoute('/mentoring/human')({
  component: HumanMentoringPage,
});

const GRADES = ['A', 'B', 'C', 'D', 'F'] as const;
const GRADE_COLORS: Record<string, string> = {
  A: 'bg-emerald-500 text-white',
  B: 'bg-blue-500 text-white',
  C: 'bg-amber-500 text-white',
  D: 'bg-orange-500 text-white',
  F: 'bg-red-500 text-white',
};
const CHECKLIST_LABELS: Record<string, string> = {
  planAdherence: '장기계획 일정 준수',
  missionRate: '일일 미션 성실도 (50% 이상)',
  routinePractice: '루틴 실천 여부',
  photoUpload: '인증사진 업로드',
  reflection: '자기 회고 작성',
};

function formatMinutes(min: number) {
  if (min < 60) return `${min}분`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}시간 ${m}분` : `${h}시간`;
}

function HumanMentoringPage() {
  const user = useAuthStore((s) => s.user);
  const isTeacher = user?.role === 'teacher';
  return isTeacher ? <TeacherView /> : <StudentView />;
}

// ================================================================
// 선생님 뷰: 대시보드 → 학생 상세 검사
// ================================================================

function TeacherView() {
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const { data: dashboard, isLoading } = useMentoringDashboard();

  if (selectedStudentId) {
    return (
      <InspectionView
        studentId={selectedStudentId}
        week={dashboard?.week}
        onBack={() => setSelectedStudentId(null)}
      />
    );
  }

  return (
    <div className="mx-auto max-w-screen-lg px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 shadow">
          <ClipboardList className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">주간 멘토링 검사</h1>
          {dashboard && (
            <p className="text-sm text-gray-500">
              {dashboard.week.start} ~ {dashboard.week.end}
            </p>
          )}
        </div>
      </div>

      {dashboard && (
        <div className="mb-6 grid grid-cols-3 gap-4">
          <StatCard label="전체 학생" value={dashboard.total} color="blue" />
          <StatCard label="검사 완료" value={dashboard.done} color="emerald" />
          <StatCard label="위험 학생" value={dashboard.atRisk} color="red" />
        </div>
      )}

      <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
        {isLoading ? (
          <div className="py-16 text-center text-gray-400">로딩 중...</div>
        ) : !dashboard || dashboard.students.length === 0 ? (
          <div className="py-16 text-center text-gray-400">등록된 학생이 없습니다.</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {dashboard.students.map((s) => (
              <li key={s.studentId}>
                <button
                  onClick={() => setSelectedStudentId(s.studentId)}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-gray-50"
                >
                  <span className="text-xl">
                    {s.sessionDone ? '✅' : s.missionRate < 50 ? '🔴' : '🟡'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{s.studentName}</span>
                      {s.grade && (
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
                          {s.grade}학년
                        </span>
                      )}
                      {s.sessionDone && s.sessionGrade && (
                        <span
                          className={`rounded px-1.5 py-0.5 text-xs font-bold ${GRADE_COLORS[s.sessionGrade] ?? 'bg-gray-200 text-gray-700'}`}
                        >
                          {s.sessionGrade}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
                      <span>달성률 {s.missionRate}%</span>
                      <span>·</span>
                      <span>{formatMinutes(s.studyMinutes)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {s.sessionDone ? (
                      <span className="font-medium text-emerald-600">검사 완료</span>
                    ) : (
                      <span className="text-gray-400">미검사</span>
                    )}
                    <ChevronRight className="h-4 w-4 text-gray-300" />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: 'blue' | 'emerald' | 'red';
}) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    red: 'bg-red-50 text-red-700 border-red-100',
  };
  return (
    <div className={`rounded-xl border p-4 ${colorMap[color]}`}>
      <div className="text-3xl font-bold">{value}</div>
      <div className="mt-1 text-sm opacity-80">{label}</div>
    </div>
  );
}

// ================================================================
// 선생님: 학생별 상세 검사
// ================================================================

function InspectionView({
  studentId,
  week,
  onBack,
}: {
  studentId: number;
  week?: { start: string; end: string };
  onBack: () => void;
}) {
  const { data, isLoading } = useInspectionSummary(studentId, week?.start);
  const saveMutation = useSaveSession(studentId);

  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [grade, setGrade] = useState('');
  const [subjectComments, setSubjectComments] = useState<Record<string, string>>({});
  const [overallComment, setOverallComment] = useState('');
  const [nextWeekTask, setNextWeekTask] = useState('');
  const [initialized, setInitialized] = useState(false);

  if (data && !initialized) {
    const ex = data.existingSession;
    if (ex) {
      setChecklist((ex.checklist as Record<string, boolean>) ?? {});
      setGrade(ex.grade ?? '');
      setSubjectComments((ex.subjectComments as Record<string, string>) ?? {});
      setOverallComment(ex.overallComment ?? '');
      setNextWeekTask(ex.nextWeekTask ?? '');
    }
    setInitialized(true);
  }

  async function handleSave() {
    if (!data) return;
    try {
      await saveMutation.mutateAsync({
        weekStart: data.week.start,
        weekEnd: data.week.end,
        checklist,
        grade: grade || undefined,
        subjectComments,
        overallComment: overallComment || undefined,
        nextWeekTask: nextWeekTask || undefined,
      });
      toast.success('피드백이 저장됐습니다.');
    } catch {
      toast.error('저장에 실패했습니다.');
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-screen-lg px-4 py-16 text-center text-gray-400">
        주간 데이터를 불러오는 중...
      </div>
    );
  }
  if (!data) return null;

  const { stats } = data;

  return (
    <div className="mx-auto max-w-screen-lg space-y-6 px-4 py-8">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="rounded-lg p-2 transition-colors hover:bg-gray-100">
          <ChevronLeft className="h-5 w-5 text-gray-500" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            {data.student.name} — {data.week.start.slice(5)} ~ {data.week.end.slice(5)} 주간 검사
          </h2>
          {data.student.grade && <p className="text-sm text-gray-500">{data.student.grade}학년</p>}
        </div>
      </div>

      {/* 주간 요약 카드 */}
      <div className="grid grid-cols-3 gap-4">
        <SummaryCard
          icon={<Target className="h-5 w-5 text-indigo-500" />}
          label="미션 달성률"
          value={`${stats.missionRate}%`}
          sub={`${stats.completedMissions}/${stats.totalMissions}`}
          danger={stats.missionRate < 50}
        />
        <SummaryCard
          icon={<Clock className="h-5 w-5 text-blue-500" />}
          label="학습 시간"
          value={formatMinutes(stats.studyMinutes)}
          sub={
            stats.studyMinutesDelta > 0
              ? `▲ ${formatMinutes(stats.studyMinutesDelta)}`
              : stats.studyMinutesDelta < 0
                ? `▼ ${formatMinutes(Math.abs(stats.studyMinutesDelta))}`
                : '지난 주와 동일'
          }
        />
        <SummaryCard
          icon={<Star className="h-5 w-5 text-amber-500" />}
          label="성과 점수"
          value={`${stats.totalScore}pt`}
          sub={
            stats.scoreDelta > 0
              ? `▲ +${stats.scoreDelta}`
              : stats.scoreDelta < 0
                ? `▼ ${stats.scoreDelta}`
                : '지난 주와 동일'
          }
        />
      </div>

      {/* 과목별 달성률 */}
      {data.subjectStats.length > 0 && (
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-900/5">
          <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
            <BookOpen className="h-4 w-4 text-indigo-500" />
            과목별 달성률
          </h3>
          <div className="space-y-3">
            {data.subjectStats
              .sort((a, b) => b.rate - a.rate)
              .map((s) => (
                <div key={s.subject}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-gray-700">{s.subject}</span>
                    <span
                      className={`font-semibold ${s.rate >= 80 ? 'text-emerald-600' : s.rate >= 50 ? 'text-amber-600' : 'text-red-600'}`}
                    >
                      {s.rate}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100">
                    <div
                      className={`h-2 rounded-full transition-all ${s.rate >= 80 ? 'bg-emerald-400' : s.rate >= 50 ? 'bg-amber-400' : 'bg-red-400'}`}
                      style={{ width: `${s.rate}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* 학생 회고 */}
      {data.reflections.length > 0 && (
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-900/5">
          <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
            <MessageSquare className="h-4 w-4 text-violet-500" />
            학생 자기 회고
          </h3>
          <div className="space-y-3">
            {data.reflections.slice(0, 3).map((r, i) => (
              <div key={i} className="rounded-lg bg-gray-50 p-3 text-sm">
                <div className="mb-1 text-xs text-gray-400">
                  {r.date ? String(r.date).slice(0, 10) : ''} {r.mood && `· ${r.mood}`}
                </div>
                {r.goodPoints && (
                  <p className="text-emerald-700">
                    <span className="font-medium">잘한 점: </span>
                    {r.goodPoints}
                  </p>
                )}
                {r.badPoints && (
                  <p className="mt-1 text-red-700">
                    <span className="font-medium">아쉬운 점: </span>
                    {r.badPoints}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 인증사진 */}
      {data.photos.length > 0 && (
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-900/5">
          <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
            <Camera className="h-4 w-4 text-pink-500" />
            인증사진 ({data.photos.length}장)
          </h3>
          <div className="flex gap-2 overflow-x-auto">
            {data.photos.map((p) => (
              <img
                key={p.id}
                src={p.url}
                alt="인증사진"
                className="h-20 w-20 flex-shrink-0 rounded-lg object-cover ring-1 ring-gray-200"
              />
            ))}
          </div>
        </div>
      )}

      {/* 피드백 폼 */}
      <div className="space-y-5 rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-900/5">
        <h3 className="flex items-center gap-2 font-semibold text-gray-900">
          <ClipboardList className="h-4 w-4 text-indigo-500" />
          주간 피드백 작성
        </h3>

        {/* 체크리스트 */}
        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">검사 체크리스트</p>
          <div className="space-y-2">
            {Object.entries(CHECKLIST_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setChecklist((prev) => ({ ...prev, [key]: !prev[key] }))}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-gray-50"
              >
                {checklist[key] ? (
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-500" />
                ) : (
                  <Circle className="h-4 w-4 flex-shrink-0 text-gray-300" />
                )}
                <span className={checklist[key] ? 'text-gray-900' : 'text-gray-500'}>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 종합 등급 */}
        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">종합 등급</p>
          <div className="flex gap-2">
            {GRADES.map((g) => (
              <button
                key={g}
                onClick={() => setGrade(g === grade ? '' : g)}
                className={`h-9 w-9 rounded-lg text-sm font-bold transition-all ${grade === g ? (GRADE_COLORS[g] ?? 'bg-gray-200') : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* 과목별 코멘트 */}
        {data.subjectStats.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">과목별 코멘트</p>
            <div className="space-y-2">
              {data.subjectStats.map((s) => (
                <div key={s.subject} className="flex items-start gap-2">
                  <span className="mt-2 w-14 flex-shrink-0 text-xs font-medium text-gray-600">
                    {s.subject}
                  </span>
                  <input
                    type="text"
                    placeholder={`${s.subject} 코멘트`}
                    value={subjectComments[s.subject] ?? ''}
                    onChange={(e) =>
                      setSubjectComments((prev) => ({ ...prev, [s.subject]: e.target.value }))
                    }
                    className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-indigo-400 focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 종합 코멘트 */}
        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">종합 코멘트</p>
          <textarea
            rows={3}
            placeholder="이번 주 전반적인 피드백을 입력하세요..."
            value={overallComment}
            onChange={(e) => setOverallComment(e.target.value)}
            className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
          />
        </div>

        {/* 다음 주 과제 */}
        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">다음 주 과제</p>
          <input
            type="text"
            placeholder="다음 주 학생에게 줄 과제나 목표를 입력하세요..."
            value={nextWeekTask}
            onChange={(e) => setNextWeekTask(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {saveMutation.isPending ? '저장 중...' : '피드백 저장 및 전송'}
        </button>
      </div>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  sub,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  danger?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-4 shadow-sm ring-1 ${danger ? 'bg-red-50 ring-red-100' : 'bg-white ring-gray-900/5'}`}
    >
      <div className="mb-1 flex items-center gap-2">
        {icon}
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <div className={`text-xl font-bold ${danger ? 'text-red-600' : 'text-gray-900'}`}>
        {value}
      </div>
      <div className="mt-1 text-xs text-gray-400">{sub}</div>
    </div>
  );
}

// ================================================================
// 학생 뷰: 피드백 수신함
// ================================================================

function StudentView() {
  const { data: sessions, isLoading } = useMentoringSessions('student');
  const ackMutation = useAckSession();

  async function handleAck(id: number) {
    try {
      await ackMutation.mutateAsync(id);
      toast.success('확인했습니다.');
    } catch {
      toast.error('오류가 발생했습니다.');
    }
  }

  return (
    <div className="mx-auto max-w-screen-md px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 shadow">
          <MessageSquare className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">선생님 피드백</h1>
          <p className="text-sm text-gray-500">주간 멘토링 피드백 수신함</p>
        </div>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-gray-400">불러오는 중...</div>
      ) : !sessions || sessions.length === 0 ? (
        <div className="rounded-xl bg-white p-12 text-center shadow-sm ring-1 ring-gray-900/5">
          <MessageSquare className="mx-auto mb-3 h-10 w-10 text-gray-200" />
          <p className="text-gray-500">아직 받은 피드백이 없습니다.</p>
          <p className="mt-1 text-sm text-gray-400">
            선생님이 주간 검사를 완료하면 여기에 표시됩니다.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <SessionCard key={session.id} session={session} onAck={handleAck} />
          ))}
        </div>
      )}
    </div>
  );
}

function SessionCard({
  session,
  onAck,
}: {
  session: MentoringSessionDetail;
  onAck: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(!session.studentAcked);
  const isNew = !session.studentAcked;

  return (
    <div
      className={`rounded-xl shadow-sm ring-1 transition-all ${isNew ? 'bg-indigo-50 ring-indigo-200' : 'bg-white ring-gray-900/5'}`}
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4"
      >
        <div className="flex items-center gap-3">
          {isNew && <span className="h-2 w-2 animate-pulse rounded-full bg-indigo-500" />}
          <div className="text-left">
            <div className="font-semibold text-gray-900">
              {session.weekStart.slice(0, 10)} ~ {session.weekEnd.slice(0, 10)}
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-sm">
              {session.grade && (
                <span
                  className={`rounded px-1.5 py-0.5 text-xs font-bold ${GRADE_COLORS[session.grade] ?? 'bg-gray-200 text-gray-700'}`}
                >
                  {session.grade}등급
                </span>
              )}
              {isNew ? (
                <span className="font-medium text-indigo-600">새 피드백</span>
              ) : (
                <span className="text-xs text-gray-400">확인 완료</span>
              )}
            </div>
          </div>
        </div>
        <ChevronRight
          className={`h-4 w-4 text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`}
        />
      </button>

      {expanded && (
        <div className="space-y-4 border-t border-gray-100 px-5 pb-5 pt-4">
          {session.overallComment && (
            <div className="rounded-lg bg-white p-4 ring-1 ring-gray-100">
              <p className="mb-1 text-xs font-medium text-gray-400">종합 코멘트</p>
              <p className="text-sm leading-relaxed text-gray-700">{session.overallComment}</p>
            </div>
          )}

          {session.subjectComments && Object.keys(session.subjectComments).length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium text-gray-400">과목별 피드백</p>
              <div className="space-y-2">
                {Object.entries(session.subjectComments as Record<string, string>)
                  .filter(([, v]) => v)
                  .map(([subject, comment]) => (
                    <div key={subject} className="flex gap-2 text-sm">
                      <span className="w-10 flex-shrink-0 font-medium text-gray-600">
                        {subject}
                      </span>
                      <span className="text-gray-700">{comment}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {session.nextWeekTask && (
            <div className="rounded-lg bg-amber-50 p-4 ring-1 ring-amber-100">
              <p className="mb-1 text-xs font-medium text-amber-600">📌 다음 주 과제</p>
              <p className="text-sm text-gray-700">{session.nextWeekTask}</p>
            </div>
          )}

          {!session.studentAcked && (
            <button
              onClick={() => onAck(session.id)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
            >
              <Check className="h-4 w-4" />
              확인했습니다
            </button>
          )}
        </div>
      )}
    </div>
  );
}
