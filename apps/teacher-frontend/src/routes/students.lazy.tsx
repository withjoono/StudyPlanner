/**
 * 선생님 학생 관리 페이지
 */
import { createLazyFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { Users, Plus, Search, Trash2, BookOpen, Camera, BarChart } from 'lucide-react';

export const Route = createLazyFileRoute('/students')({
  component: StudentsPage,
});

const MOCK_STUDENTS = [
  { id: 1, name: '김민수', grade: '고2', school: '서울고등학교', subject: '수학', phone: '010-1111-2222', completionRate: 38 },
  { id: 2, name: '이수진', grade: '고2', school: '서울고등학교', subject: '수학', phone: '010-3333-4444', completionRate: 100 },
  { id: 3, name: '박지영', grade: '고1', school: '서울고등학교', subject: '영어', phone: '010-5555-6666', completionRate: 29 },
  { id: 4, name: '최동현', grade: '고3', school: '한양고등학교', subject: '수학', phone: '010-7777-8888', completionRate: 80 },
  { id: 5, name: '한미라', grade: '고2', school: '한양고등학교', subject: '영어', phone: '010-9999-0000', completionRate: 20 },
];

function StudentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredStudents = MOCK_STUDENTS.filter((s) =>
    s.name.includes(searchQuery) || s.school.includes(searchQuery) || s.subject.includes(searchQuery),
  );

  return (
    <div className="mx-auto w-full max-w-screen-xl px-4 py-6">
      {/* 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900">
          <Users className="h-5 w-5 text-emerald-500" />
          학생 관리
        </h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2 text-sm font-medium text-white shadow-md transition-all hover:shadow-lg"
        >
          <Plus className="h-4 w-4" />
          학생 추가
        </button>
      </div>

      {/* 검색 */}
      <div className="mb-4 flex items-center gap-2 rounded-xl bg-white p-2 shadow-sm">
        <Search className="ml-2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="학생 이름, 학교, 과목으로 검색..."
          className="flex-1 border-0 bg-transparent text-sm outline-none"
        />
      </div>

      {/* 학생 카드 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredStudents.map((student) => {
          const isAtRisk = student.completionRate < 50;
          return (
            <div key={student.id} className="rounded-xl bg-white p-5 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white ${
                    isAtRisk
                      ? 'bg-gradient-to-br from-red-400 to-red-500'
                      : 'bg-gradient-to-br from-emerald-400 to-teal-500'
                  }`}>
                    {student.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{student.name}</h3>
                    <p className="text-xs text-gray-500">{student.school} · {student.grade}</p>
                  </div>
                </div>
                <button className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">과목</span>
                  <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                    {student.subject}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">오늘 완료율</span>
                  <span className={`font-medium ${isAtRisk ? 'text-red-500' : 'text-emerald-600'}`}>
                    {student.completionRate}%
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isAtRisk ? 'bg-red-400' : 'bg-emerald-400'
                    }`}
                    style={{ width: `${student.completionRate}%` }}
                  />
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-gray-200 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50">
                  <BookOpen className="h-3 w-3" /> 미션
                </button>
                <button className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-gray-200 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50">
                  <Camera className="h-3 w-3" /> 사진
                </button>
                <button className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-gray-200 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50">
                  <BarChart className="h-3 w-3" /> 성적
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 학생 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">학생 추가</h3>
            <p className="mt-1 text-sm text-gray-500">학생 코드를 입력하여 학생을 추가하세요.</p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">학생 코드</label>
                <input
                  type="text"
                  placeholder="STU001"
                  className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">담당 과목</label>
                <input
                  type="text"
                  placeholder="수학"
                  className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 py-2 text-sm font-medium text-white hover:shadow-md"
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
