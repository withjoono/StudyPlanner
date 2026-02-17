import { createLazyFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useStudentConnections, useUpdateTeacherPermissions } from '@/stores/server/student/hooks';
import { User, Shield, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

export const Route = createLazyFileRoute('/connections')({
  component: ConnectionsPage,
});

function ConnectionsPage() {
  const { data: connections, isLoading } = useStudentConnections();
  const [activeTab, setActiveTab] = useState<'teacher' | 'parent' | 'student'>('teacher');

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">로딩 중...</div>;
  }

  return (
    <div className="mx-auto max-w-screen-md px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">계정 공유 및 권한 관리</h1>

      {/* Tabs */}
      <div className="mb-6 flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('teacher')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'teacher'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          선생님 ({connections?.teachers.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('parent')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'parent'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          학부모 ({connections?.parents.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('student')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'student'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          학생 (0)
        </button>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {activeTab === 'teacher' && <TeacherList teachers={connections?.teachers || []} />}
        {activeTab === 'parent' && <ParentList parents={connections?.parents || []} />}
        {activeTab === 'student' && (
          <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-500">
            준비 중인 기능입니다.
          </div>
        )}
      </div>
    </div>
  );
}

function TeacherList({ teachers }: { teachers: any[] }) {
  if (teachers.length === 0) {
    return (
      <div className="rounded-lg bg-gray-50 p-8 text-center text-gray-500">
        연결된 선생님이 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {teachers.map((teacher) => (
        <TeacherCard key={teacher.id} teacher={teacher} />
      ))}
    </div>
  );
}

function TeacherCard({ teacher }: { teacher: any }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const updatePermissions = useUpdateTeacherPermissions();

  // Mock Kyokwas for demo if not populated, otherwise use teacher.permissions to derive state
  // ideally we should fetch 'all available kyokwas' to show toggles for everything
  const availableKyokwas = ['국어', '수학', '영어', '사회', '과학', '한국사'];

  const handleToggle = (kyokwa: string, currentAllowed: boolean) => {
    updatePermissions.mutate(
      {
        teacherId: teacher.id,
        permissions: [{ kyokwa, allowed: !currentAllowed }],
      },
      {
        onSuccess: () => toast.success('권한이 수정되었습니다.'),
        onError: () => toast.error('권한 수정 실패'),
      },
    );
  };

  const allowedKyokwas = teacher.permissions.map((p: any) => p.kyokwa);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            {teacher.avatarUrl ? (
              <img src={teacher.avatarUrl} alt="" className="h-10 w-10 rounded-full" />
            ) : (
              <User className="h-5 w-5" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{teacher.name}</h3>
            <p className="text-xs text-gray-500">{teacher.email}</p>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
        >
          <Shield className="h-4 w-4" />
          권한 관리
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-100 bg-gray-50 p-4">
          <h4 className="mb-3 text-sm font-medium text-gray-700">과목별 코멘트 허용 설정</h4>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {availableKyokwas.map((kyokwa) => {
              const isAllowed = allowedKyokwas.includes(kyokwa);
              return (
                <button
                  key={kyokwa}
                  onClick={() => handleToggle(kyokwa, isAllowed)}
                  className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition-all ${
                    isAllowed
                      ? 'border-blue-200 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-100'
                  }`}
                  disabled={updatePermissions.isPending}
                >
                  <span className="font-medium">{kyokwa}</span>
                  {isAllowed ? (
                    <Check className="h-4 w-4 text-blue-500" />
                  ) : (
                    <X className="h-4 w-4 text-gray-300" />
                  )}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-gray-500">
            * 허용된 교과/과목의 플래너(일간/주간/월간)에만 코멘트를 남길 수 있습니다.
          </p>
        </div>
      )}
    </div>
  );
}

function ParentList({ parents }: { parents: any[] }) {
  if (parents.length === 0) {
    return (
      <div className="rounded-lg bg-gray-50 p-8 text-center text-gray-500">
        연결된 학부모님이 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {parents.map((parent) => (
        <div
          key={parent.id}
          className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600">
              {parent.avatarUrl ? (
                <img src={parent.avatarUrl} alt="" className="h-10 w-10 rounded-full" />
              ) : (
                <User className="h-5 w-5" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{parent.name}</h3>
              <p className="text-xs text-gray-500">
                {parent.relation} · {parent.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-green-600">
            <Shield className="h-4 w-4" />
            <span className="font-medium">전과목 허용됨</span>
          </div>
        </div>
      ))}
    </div>
  );
}
