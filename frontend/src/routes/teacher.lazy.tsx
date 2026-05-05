/**
 * 선생님 페이지 — 학생 플래너 열람 + 1~10점 평가 + 비교
 *
 * 접근: 선생님 역할 계정만 (JWT role=teacher)
 * 주요 기능:
 *   1. 담당 학생 목록 + 학생 코드로 추가
 *   2. 날짜별 미션 열람
 *   3. 1~10점 평가 입력
 *   4. 학생 간 비교표
 */

import { createLazyFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import {
  Users,
  UserPlus,
  Star,
  Trophy,
  Clock,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  BarChart3,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useTeacherStudents,
  useAddTeacherStudent,
  useRemoveTeacherStudent,
  useTeacherStudentMissions,
  useRateStudent,
  useCompareStudents,
  type TeacherStudentSummary,
  type CompareEntry,
} from '@/stores/server/teacher';
import { useAuthStore } from '@/stores/client';

export const Route = createLazyFileRoute('/teacher')({
  component: TeacherPage,
});

const DAYS_KR = ['일', '월', '화', '수', '목', '금', '토'] as const;

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function TeacherPage() {
  const user = useAuthStore((s) => s.user);
  const [view, setView] = useState<'list' | 'compare'>('list');
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [selectedStudent, setSelectedStudent] = useState<TeacherStudentSummary | null>(null);

  const { data: students = [], isLoading } = useTeacherStudents();

  // 역할 체크 — 선생님이 아닌 경우 안내
  if (user && user.role !== 'teacher') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-center text-gray-500">
        <div>
          <Star className="mx-auto mb-3 h-10 w-10 text-gray-300" />
          <p className="font-semibold">선생님 계정으로 로그인해야 이용 가능합니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-screen-lg px-4 py-6">
      {/* 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900">📋 학생 플래너 평가</h1>
          <p className="mt-1 text-sm text-gray-500">
            학생의 플래너를 열람하고 1~10점 평가를 남기세요.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setView('list')}
            className={`rounded-xl px-4 py-2 text-sm font-bold transition-colors ${
              view === 'list'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Users className="mr-1.5 inline h-4 w-4" /> 학생 목록
          </button>
          <button
            onClick={() => setView('compare')}
            className={`rounded-xl px-4 py-2 text-sm font-bold transition-colors ${
              view === 'compare'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <BarChart3 className="mr-1.5 inline h-4 w-4" /> 비교
          </button>
        </div>
      </div>

      {/* 날짜 선택 */}
      <DatePicker value={selectedDate} onChange={setSelectedDate} />

      {view === 'list' ? (
        selectedStudent ? (
          <StudentDetail
            student={selectedStudent}
            date={selectedDate}
            onBack={() => setSelectedStudent(null)}
          />
        ) : (
          <StudentList students={students} isLoading={isLoading} onSelect={setSelectedStudent} />
        )
      ) : (
        <CompareView students={students} date={selectedDate} />
      )}
    </div>
  );
}

// ─────────── 날짜 선택기 ───────────

function DatePicker({ value, onChange }: { value: string; onChange: (d: string) => void }) {
  const shift = (days: number) => {
    const d = new Date(value);
    d.setDate(d.getDate() + days);
    onChange(d.toISOString().split('T')[0]);
  };
  const d = new Date(value);
  const label = `${d.getMonth() + 1}월 ${d.getDate()}일 (${DAYS_KR[d.getDay()]})`;

  return (
    <div className="mb-5 flex items-center justify-center gap-3">
      <button onClick={() => shift(-1)} className="rounded-lg p-2 hover:bg-gray-100">
        <ChevronLeft className="h-4 w-4 text-gray-500" />
      </button>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl border border-gray-200 px-3 py-1.5 text-sm font-semibold text-gray-700 focus:outline-none"
      />
      <span className="text-sm text-gray-500">{label}</span>
      <button onClick={() => shift(1)} className="rounded-lg p-2 hover:bg-gray-100">
        <ChevronRight className="h-4 w-4 text-gray-500" />
      </button>
    </div>
  );
}

// ─────────── 학생 목록 + 추가 ───────────

function StudentList({
  students,
  isLoading,
  onSelect,
}: {
  students: TeacherStudentSummary[];
  isLoading: boolean;
  onSelect: (s: TeacherStudentSummary) => void;
}) {
  const [addCode, setAddCode] = useState('');
  const addMutation = useAddTeacherStudent();
  const removeMutation = useRemoveTeacherStudent();

  const handleAdd = () => {
    if (!addCode.trim()) return;
    addMutation.mutate(addCode.trim(), {
      onSuccess: () => {
        toast.success('학생이 추가되었습니다.');
        setAddCode('');
      },
      onError: (e: any) => toast.error(e?.response?.data?.message || '추가에 실패했습니다.'),
    });
  };

  const handleRemove = (e: React.MouseEvent, studentId: number) => {
    e.stopPropagation();
    removeMutation.mutate(studentId, {
      onSuccess: () => toast.success('학생이 제거되었습니다.'),
    });
  };

  return (
    <div className="space-y-4">
      {/* 학생 추가 */}
      <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
        <p className="mb-2 text-xs font-semibold text-indigo-700">학생 코드로 추가</p>
        <div className="flex gap-2">
          <input
            value={addCode}
            onChange={(e) => setAddCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="예: SP00123"
            className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          <button
            onClick={handleAdd}
            disabled={addMutation.isPending}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            <UserPlus className="h-4 w-4" /> 추가
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-sm text-gray-400">불러오는 중...</div>
      ) : students.length === 0 ? (
        <div className="py-8 text-center text-sm text-gray-400">
          담당 학생이 없습니다. 학생 코드로 추가하세요.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {students.map((s) => (
            <button
              key={s.id}
              onClick={() => onSelect(s)}
              className="rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-gray-900">{s.name}</p>
                  <p className="mt-0.5 text-xs text-gray-400">
                    {s.grade || ''} · {s.schoolName || '학교 미등록'} · 코드 {s.studentCode}
                  </p>
                </div>
                <button
                  onClick={(e) => handleRemove(e, s.id)}
                  className="rounded-lg p-1 text-gray-300 hover:bg-red-50 hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────── 학생 상세 (미션 + 평가) ───────────

function StudentDetail({
  student,
  date,
  onBack,
}: {
  student: TeacherStudentSummary;
  date: string;
  onBack: () => void;
}) {
  const { data: missions = [], isLoading } = useTeacherStudentMissions(student.id, date);
  const rateMutation = useRateStudent();
  const [score, setScore] = useState(5);
  const [comment, setComment] = useState('');

  const completed = missions.filter((m) => m.status === 'completed').length;
  const total = missions.length;

  const handleRate = () => {
    rateMutation.mutate(
      { studentId: student.id, date, score, comment },
      {
        onSuccess: () => toast.success(`${student.name} 학생에게 ${score}점 평가를 저장했습니다.`),
        onError: (e: any) => toast.error(e?.response?.data?.message || '평가 저장에 실패했습니다.'),
      },
    );
  };

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
      >
        <ChevronLeft className="h-4 w-4" /> 목록으로
      </button>

      <div className="mb-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-gray-900">{student.name}</h2>
            <p className="text-xs text-gray-400">
              {student.grade} · {student.studentCode}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-indigo-600">
              {total > 0 ? Math.round((completed / total) * 100) : 0}%
            </div>
            <div className="text-xs text-gray-400">
              {completed}/{total} 완료
            </div>
          </div>
        </div>
      </div>

      {/* 미션 목록 */}
      <div className="mb-4 space-y-2">
        {isLoading ? (
          <div className="py-4 text-center text-sm text-gray-400">미션 불러오는 중...</div>
        ) : missions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 py-6 text-center text-sm text-gray-400">
            이 날짜에 미션이 없습니다.
          </div>
        ) : (
          missions.map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3"
            >
              {m.status === 'completed' ? (
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-500" />
              ) : (
                <Circle className="h-4 w-4 flex-shrink-0 text-gray-300" />
              )}
              <div className="min-w-0 flex-1">
                <span className="text-xs font-bold text-indigo-600">{m.subject}</span>
                <span className="ml-2 truncate text-sm text-gray-700">{m.content}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-400">
                {m.studyMinutes != null && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {m.studyMinutes}분
                  </span>
                )}
                {m.amount != null && (
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-3 w-3" /> {m.amount}p
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 평가 입력 */}
      <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-amber-800">
          <Star className="h-4 w-4" /> 오늘 플래너 평가
        </h3>
        <div className="mb-3">
          <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
            <span>1점</span>
            <span className="text-2xl font-black text-amber-600">{score}점</span>
            <span>10점</span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            step={1}
            value={score}
            onChange={(e) => setScore(Number(e.target.value))}
            className="w-full cursor-pointer accent-amber-500"
          />
          <div className="mt-1 flex justify-between">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => (
              <button
                key={v}
                onClick={() => setScore(v)}
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold transition-colors ${
                  score === v ? 'bg-amber-500 text-white' : 'text-gray-400 hover:text-amber-500'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="평가 코멘트 (선택사항)"
          rows={2}
          className="mb-3 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
        />
        <button
          onClick={handleRate}
          disabled={rateMutation.isPending}
          className="w-full rounded-xl bg-amber-500 py-2.5 text-sm font-bold text-white hover:bg-amber-600 disabled:opacity-50"
        >
          {rateMutation.isPending ? '저장 중...' : '평가 저장'}
        </button>
      </div>
    </div>
  );
}

// ─────────── 비교표 ───────────

function CompareView({ students, date }: { students: TeacherStudentSummary[]; date: string }) {
  const [selected, setSelected] = useState<number[]>([]);

  const toggleStudent = (id: number) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 5 ? [...prev, id] : prev,
    );
  };

  const { data: compareData = [], isLoading } = useCompareStudents(selected, date);

  return (
    <div>
      {/* 학생 선택 체크박스 */}
      <div className="mb-4">
        <p className="mb-2 text-xs font-semibold text-gray-500">비교할 학생 선택 (최대 5명)</p>
        <div className="flex flex-wrap gap-2">
          {students.map((s) => (
            <button
              key={s.id}
              onClick={() => toggleStudent(s.id)}
              className={`rounded-full border px-3 py-1 text-sm font-semibold transition-colors ${
                selected.includes(s.id)
                  ? 'border-indigo-600 bg-indigo-600 text-white'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-indigo-300'
              }`}
            >
              {s.name}
            </button>
          ))}
          {students.length === 0 && (
            <span className="text-sm text-gray-400">학생을 먼저 추가하세요.</span>
          )}
        </div>
      </div>

      {selected.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 py-10 text-center text-sm text-gray-400">
          위에서 비교할 학생을 선택하세요.
        </div>
      ) : isLoading ? (
        <div className="py-8 text-center text-sm text-gray-400">데이터 불러오는 중...</div>
      ) : (
        <CompareTable data={compareData} date={date} />
      )}
    </div>
  );
}

function CompareTable({ data, date }: { data: CompareEntry[]; date: string }) {
  const d = new Date(date);
  const dateLabel = `${d.getMonth() + 1}/${d.getDate()} (${DAYS_KR[d.getDay()]})`;

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-6 py-4">
        <h3 className="flex items-center gap-2 font-bold text-gray-900">
          <Trophy className="h-5 w-5 text-amber-500" /> {dateLabel} 학생 비교
        </h3>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs text-gray-500">
            <th className="px-4 py-3 font-semibold">학생</th>
            <th className="px-4 py-3 text-center font-semibold">완료율</th>
            <th className="px-4 py-3 text-center font-semibold">학습 시간</th>
            <th className="px-4 py-3 text-center font-semibold">분량</th>
            <th className="px-4 py-3 text-center font-semibold">선생님 평가</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {data.map((entry) => (
            <tr key={entry.studentId} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <div className="font-semibold text-gray-900">{entry.name}</div>
                <div className="text-[10px] text-gray-400">{entry.grade}</div>
              </td>
              <td className="px-4 py-3 text-center">
                <div className="inline-flex flex-col items-center">
                  <span
                    className={`text-base font-black ${
                      entry.completionRate >= 80
                        ? 'text-green-600'
                        : entry.completionRate >= 50
                          ? 'text-amber-500'
                          : 'text-red-500'
                    }`}
                  >
                    {entry.completionRate}%
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {entry.completedMissions}/{entry.totalMissions}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 text-center text-gray-700">
                {entry.studyMinutes > 0
                  ? `${Math.floor(entry.studyMinutes / 60)}h ${entry.studyMinutes % 60}m`
                  : '-'}
              </td>
              <td className="px-4 py-3 text-center text-gray-700">
                {entry.totalPages > 0 ? `${entry.totalPages}p` : '-'}
              </td>
              <td className="px-4 py-3 text-center">
                {entry.rating ? (
                  <div>
                    <span className="text-xl font-black text-amber-500">{entry.rating.score}</span>
                    <span className="text-xs text-gray-400">/10</span>
                    {entry.rating.comment && (
                      <div className="mt-0.5 max-w-[120px] truncate text-[10px] text-gray-400">
                        {entry.rating.comment}
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-gray-300">미평가</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 미션 상세 (각 학생) */}
      <div className="border-t border-gray-100 p-6">
        <h4 className="mb-4 text-xs font-bold uppercase tracking-wide text-gray-500">미션 상세</h4>
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${data.length}, 1fr)` }}>
          {data.map((entry) => (
            <div key={entry.studentId}>
              <div className="mb-2 font-semibold text-gray-800">{entry.name}</div>
              <div className="space-y-1">
                {entry.missions.length === 0 ? (
                  <div className="text-xs text-gray-400">미션 없음</div>
                ) : (
                  entry.missions.map((m) => (
                    <div key={m.id} className="flex items-center gap-1.5 text-xs">
                      {m.status === 'completed' ? (
                        <CheckCircle2 className="h-3 w-3 flex-shrink-0 text-green-500" />
                      ) : (
                        <Circle className="h-3 w-3 flex-shrink-0 text-gray-300" />
                      )}
                      <span className="font-semibold text-indigo-600">{m.subject}</span>
                      <span className="truncate text-gray-500">{m.content}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
