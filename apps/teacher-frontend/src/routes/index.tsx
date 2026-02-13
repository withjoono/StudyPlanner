/**
 * 선생님 대시보드
 * 전체 학생 요약, 위험 학생 표시, 빠른 접근
 */
import { createFileRoute } from '@tanstack/react-router';
import {
  Users, AlertTriangle, CheckCircle, TrendingUp,
  BookOpen, Clock, Eye,
} from 'lucide-react';

export const Route = createFileRoute('/')(
  { component: TeacherDashboard },
);

const MOCK_DASHBOARD = {
  totalStudents: 12,
  atRiskStudents: 3,
  avgCompletionRate: 72,
  students: [
    { studentId: 1, studentName: '김민수', grade: '고2', subject: '수학', totalMissions: 8, completedMissions: 3, completionRate: 38 },
    { studentId: 2, studentName: '이수진', grade: '고2', subject: '수학', totalMissions: 6, completedMissions: 6, completionRate: 100 },
    { studentId: 3, studentName: '박지영', grade: '고1', subject: '영어', totalMissions: 7, completedMissions: 2, completionRate: 29 },
    { studentId: 4, studentName: '최동현', grade: '고3', subject: '수학', totalMissions: 10, completedMissions: 8, completionRate: 80 },
    { studentId: 5, studentName: '한미라', grade: '고2', subject: '영어', totalMissions: 5, completedMissions: 1, completionRate: 20 },
    { studentId: 6, studentName: '정승호', grade: '고1', subject: '수학', totalMissions: 6, completedMissions: 5, completionRate: 83 },
    { studentId: 7, studentName: '윤서연', grade: '고3', subject: '영어', totalMissions: 8, completedMissions: 7, completionRate: 88 },
    { studentId: 8, studentName: '강준영', grade: '고2', subject: '수학', totalMissions: 7, completedMissions: 6, completionRate: 86 },
  ],
};

function TeacherDashboard() {
  const { totalStudents, atRiskStudents, avgCompletionRate, students } = MOCK_DASHBOARD;
  const atRiskStudentList = students.filter((s) => s.completionRate < 50);
  const onTrackStudentList = students.filter((s) => s.completionRate >= 50);

  return (
    <div className="mx-auto w-full max-w-screen-xl px-4 py-6">
      {/* 요약 카드 */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 p-5 text-white shadow-lg">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 opacity-80" />
            <div>
              <p className="text-sm opacity-80">담당 학생</p>
              <p className="text-3xl font-bold">{totalStudents}명</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-red-50 p-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500">주의 학생</p>
              <p className="text-2xl font-bold text-red-600">{atRiskStudents}명</p>
              <p className="text-[10px] text-gray-400">완료율 50% 미만</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-50 p-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500">평균 완료율</p>
              <p className="text-2xl font-bold text-emerald-600">{avgCompletionRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* 주의 학생 */}
      {atRiskStudentList.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-gray-800">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            주의 필요 학생
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {atRiskStudentList.map((student) => (
              <div
                key={student.studentId}
                className="flex items-center gap-3 rounded-xl border-l-4 border-red-400 bg-white p-4 shadow-sm"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-sm font-bold text-red-600">
                  {student.studentName.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{student.studentName}</span>
                    <span className="text-xs text-gray-400">{student.grade}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-red-400 transition-all"
                        style={{ width: `${student.completionRate}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-red-500">{student.completionRate}%</span>
                  </div>
                  <p className="text-[10px] text-gray-500">
                    {student.completedMissions}/{student.totalMissions} 미션 · {student.subject}
                  </p>
                </div>
                <button className="rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-emerald-500">
                  <Eye className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 전체 학생 목록 */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-gray-800">
          <BookOpen className="h-4 w-4 text-emerald-500" />
          전체 학생 현황
        </h2>
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">학생</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">학년</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">과목</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">미션</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">완료율</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {students.map((student) => {
                  const isAtRisk = student.completionRate < 50;
                  return (
                    <tr key={student.studentId} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white ${
                            isAtRisk ? 'bg-red-400' : 'bg-emerald-400'
                          }`}>
                            {student.studentName.charAt(0)}
                          </div>
                          <span className="text-sm font-medium text-gray-900">{student.studentName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{student.grade}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{student.subject}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {student.completedMissions}/{student.totalMissions}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-100">
                            <div
                              className={`h-full rounded-full ${isAtRisk ? 'bg-red-400' : 'bg-emerald-400'}`}
                              style={{ width: `${student.completionRate}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-600">{student.completionRate}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {isAtRisk ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                            <AlertTriangle className="h-3 w-3" /> 주의
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600">
                            <CheckCircle className="h-3 w-3" /> 양호
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
