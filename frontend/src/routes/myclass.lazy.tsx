/**
 * 마이 클래스 — 사용자 생성 경쟁 반 + 목표대학반
 *
 * - 마이 그룹: 내가 속한 클래스 목록, 생성/초대코드 참여
 * - 목표대학반: Hub(모고/생기북)에서 시스템 배정 → 학습량·성적 비교 경쟁
 */

import { createLazyFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import {
  Plus,
  Trophy,
  Users,
  Crown,
  Copy,
  Share2,
  ChevronLeft,
  Target,
  Clock,
  Star,
  Trash2,
  LogOut,
  BrainCircuit,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  BarChart2,
  Bell,
  Search,
  X,
  UserPlus,
  Check,
  Shield,
  GraduationCap,
  Flame,
  ArrowUp,
  ArrowDown,
  BookOpen,
  ClipboardList,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useMyClassList,
  useMyClassDetail,
  useMyClassLeaderboard,
  useCreateMyClass,
  useJoinMyClass,
  useDeleteMyClass,
  useLeaveMyClass,
  useMyInvitations,
  useSearchStudents,
  useSendInvitation,
  useAcceptInvitation,
  useDeclineInvitation,
  type MyClassRoom,
  type StudentSearchResult,
  type InvitationItem,
} from '@/stores/server/myclass';
import { useHubGroupLeaderboard, useLeaderboard } from '@/stores/server/ranking';
import { GroupLeaderboard, type GroupPeriod } from '@/components/GroupLeaderboard';

export const Route = createLazyFileRoute('/myclass')({
  component: MyClassPage,
});

type TabType = 'mygroup' | 'university';

function MyClassPage() {
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('type') === 'university' ? 'university' : 'mygroup';
  });

  useEffect(() => {
    const url = new URL(window.location.href);
    if (activeTab === 'university') {
      url.searchParams.set('type', 'university');
    } else {
      url.searchParams.delete('type');
    }
    window.history.replaceState(null, '', url.toString());
  }, [activeTab]);

  return (
    <div className="mx-auto max-w-screen-lg px-4 py-6">
      {/* 탭 네비게이션 */}
      <div className="mb-6">
        <div className="flex gap-1 rounded-2xl bg-gray-100 p-1">
          <button
            onClick={() => setActiveTab('mygroup')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all ${
              activeTab === 'mygroup'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users className="h-4 w-4" />
            마이 그룹
          </button>
          <button
            onClick={() => setActiveTab('university')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all ${
              activeTab === 'university'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <GraduationCap className="h-4 w-4" />
            목표대학반
          </button>
        </div>
      </div>

      {activeTab === 'mygroup' ? <MyGroupTab /> : <UniversityClassTab />}
    </div>
  );
}

// ─────────── 마이 그룹 탭 ───────────

function MyGroupTab() {
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');

  const { data: rooms, isLoading } = useMyClassList();
  const { data: invitations } = useMyInvitations();
  const joinMutation = useJoinMyClass();
  const pendingCount = invitations?.length ?? 0;

  const handleJoin = () => {
    if (!joinCode.trim()) return;
    joinMutation.mutate(
      { code: joinCode.trim() },
      {
        onSuccess: (result) => {
          toast.success(`"${result.roomName}"에 가입했습니다! 🎉`);
          setJoinCode('');
        },
        onError: (err: Error) => {
          const _err = err as unknown as { response?: { data?: { message?: string } } };
          toast.error(_err?.response?.data?.message || '가입에 실패했습니다.');
        },
      },
    );
  };

  if (selectedRoomId) {
    return <RoomDetail roomId={selectedRoomId} onBack={() => setSelectedRoomId(null)} />;
  }

  return (
    <>
      {/* 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900">🏠 마이 그룹</h1>
          <p className="mt-1 text-sm text-gray-500">
            친구와 함께 학습 경쟁! 그룹을 만들고 초대하세요.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <div className="relative">
              <Bell className="h-6 w-6 text-amber-500" />
              <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {pendingCount}
              </span>
            </div>
          )}
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg transition-transform hover:scale-105"
          >
            <Plus className="h-4 w-4" />새 클래스 만들기
          </button>
        </div>
      </div>

      {pendingCount > 0 && <InvitationsPanel invitations={invitations!} />}

      {/* 초대 코드 입력 */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-purple-50 p-4">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-semibold text-indigo-700">
            초대 코드로 참여
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="MC-XXXXXX"
              className="flex-1 rounded-lg border border-indigo-200 bg-white px-3 py-2 font-mono text-sm tracking-widest text-indigo-900 placeholder:text-indigo-300 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              maxLength={9}
            />
            <button
              onClick={handleJoin}
              disabled={joinMutation.isPending || !joinCode.trim()}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
            >
              {joinMutation.isPending ? '...' : '참여'}
            </button>
          </div>
        </div>
      </div>

      {/* 클래스 목록 */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
            >
              <div className="mb-3 h-5 w-32 rounded bg-gray-200" />
              <div className="h-4 w-48 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      ) : rooms && rooms.length > 0 ? (
        <div className="space-y-4">
          {rooms.map((room) => (
            <RoomCard key={room.id} room={room} onClick={() => setSelectedRoomId(room.id)} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
          <div className="mb-4 text-5xl">🏠</div>
          <h3 className="mb-2 text-lg font-bold text-gray-700">아직 참여한 클래스가 없어요</h3>
          <p className="mb-4 text-sm text-gray-500">
            새 클래스를 만들거나, 친구의 초대 코드로 참여해보세요!
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="hover:bg-indiv-700 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white transition-colors"
          >
            첫 클래스 만들기
          </button>
        </div>
      )}

      {showCreateModal && <CreateClassModal onClose={() => setShowCreateModal(false)} />}
    </>
  );
}

// ─────────── 목표대학반 탭 ───────────

function UniversityClassTab() {
  const { data: rankingData, isLoading } = useLeaderboard('weekly');
  const [period, setPeriod] = useState<GroupPeriod>('weekly');

  // target_univ 타입 Hub 그룹만 필터 (teacher·mc- 제외)
  const univGroups = (rankingData?.availableGroups ?? []).filter(
    (g) => g.id !== 'teacher' && !g.id.startsWith('mc-'),
  );
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const activeGroupId = selectedGroupId ?? univGroups[0]?.id ?? null;

  const { data: leaderboard, isLoading: isLbLoading } = useHubGroupLeaderboard(
    activeGroupId,
    period,
  );

  const myEntry = leaderboard?.leaderboard.find((e) => e.rank === leaderboard.myRank);
  const myRank = leaderboard?.myRank ?? null;
  const totalMembers = leaderboard?.totalMembers ?? 0;

  // 강등보호: 내 학습 시간이 상위 30% 이내면 보호
  const myStudyMinutes = myEntry?.studyMinutes ?? 0;
  const sortedMinutes = [...(leaderboard?.leaderboard ?? [])]
    .map((e) => e.studyMinutes)
    .sort((a, b) => b - a);
  const top30idx = Math.ceil(sortedMinutes.length * 0.3);
  const isProtected =
    myRank !== null && myStudyMinutes > 0 && myStudyMinutes >= (sortedMinutes[top30idx - 1] ?? 0);

  const rankChange = myEntry?.rankChange ?? null;

  if (isLoading) {
    return <div className="h-48 animate-pulse rounded-2xl bg-gray-100" />;
  }

  // 배정된 반이 없는 경우
  if (univGroups.length === 0) {
    return <UniversityClassEmpty />;
  }

  return (
    <div className="space-y-4">
      {/* 반 선택 칩 (여러 반 배정 시) */}
      {univGroups.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {univGroups.map((g) => {
            const isActive = g.id === activeGroupId;
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => setSelectedGroupId(g.id)}
                className={`rounded-full px-4 py-1.5 text-sm font-bold transition-colors ${
                  isActive
                    ? 'bg-violet-600 text-white shadow'
                    : 'border border-violet-200 bg-white text-violet-700 hover:bg-violet-50'
                }`}
              >
                {g.name}
              </button>
            );
          })}
        </div>
      )}

      {/* 헤더 카드 */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-5 text-white shadow-lg">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <GraduationCap className="h-5 w-5 opacity-80" />
              <span className="text-sm font-semibold opacity-80">목표대학반</span>
            </div>
            <h2 className="text-xl font-black">
              {univGroups.find((g) => g.id === activeGroupId)?.name ?? '—'}
            </h2>
          </div>
          {isProtected && (
            <div className="flex items-center gap-1.5 rounded-xl bg-white/20 px-3 py-1.5 backdrop-blur-sm">
              <Shield className="h-4 w-4 text-emerald-300" />
              <span className="text-xs font-bold text-emerald-200">강등 보호 중</span>
            </div>
          )}
        </div>

        {/* 내 등수 */}
        <div className="flex items-end gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest opacity-60">내 등수</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl font-black">{myRank !== null ? myRank : '—'}</span>
              <span className="text-lg opacity-70">/ {totalMembers}위</span>
            </div>
          </div>
          {rankChange !== null && rankChange !== 0 && (
            <div
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-sm font-bold ${
                rankChange < 0 ? 'bg-emerald-400/30 text-emerald-200' : 'bg-red-400/30 text-red-200'
              }`}
            >
              {rankChange < 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
              {Math.abs(rankChange)}위
            </div>
          )}
          <div className="ml-auto text-right">
            <p className="text-xs opacity-60">
              이번 {period === 'daily' ? '일' : period === 'weekly' ? '주' : '월'} 학습
            </p>
            <p className="text-lg font-bold">
              {myStudyMinutes >= 60
                ? `${Math.floor(myStudyMinutes / 60)}h ${myStudyMinutes % 60}m`
                : `${myStudyMinutes}m`}
            </p>
          </div>
        </div>

        {/* 강등/월반 안내 */}
        <div className="mt-4 rounded-xl bg-white/10 px-3 py-2 text-xs text-white/70">
          💡 이 반의 강등·월반 기준:{' '}
          <span className="font-semibold text-white/90">모의고사 성적</span>
          &nbsp;—&nbsp;스터디플래너 학습량 우수 시 강등 면제
        </div>
      </div>

      {/* 강등보호 상세 안내 (보호 중일 때) */}
      {isProtected && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <Shield className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-500" />
          <div>
            <p className="text-sm font-bold text-emerald-800">학습량 우수 — 강등 보호 활성</p>
            <p className="mt-0.5 text-xs text-emerald-600">
              이번 {period === 'weekly' ? '주' : period === 'monthly' ? '달' : '일'} 학습량이 반
              상위 30% 이내입니다. 성적 기준 강등 대상이더라도 이 반에 유지됩니다.
            </p>
          </div>
        </div>
      )}

      {/* 비교 기간 탭 */}
      <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
        {(['daily', 'weekly', 'monthly'] as GroupPeriod[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-1 rounded-lg py-2 text-sm font-bold transition-all ${
              period === p
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {p === 'daily' ? '일간' : p === 'weekly' ? '주간' : '월간'}
          </button>
        ))}
      </div>

      {/* 비교 지표 설명 */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Clock, label: '학습량', desc: '스터디플래너 기록', color: 'indigo' },
          { icon: BarChart2, label: '모의고사', desc: '모고앱 연동 성적', color: 'violet' },
          { icon: ClipboardList, label: '내신·비교과', desc: '생기북앱 연동', color: 'purple' },
        ].map(({ icon: Icon, label, desc, color }) => (
          <div
            key={label}
            className={`rounded-xl border border-${color}-100 bg-${color}-50 p-3 text-center`}
          >
            <Icon className={`mx-auto mb-1.5 h-4 w-4 text-${color}-500`} />
            <p className={`text-xs font-bold text-${color}-700`}>{label}</p>
            <p className="mt-0.5 text-[10px] text-gray-500">{desc}</p>
          </div>
        ))}
      </div>

      {/* 리더보드 */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-gray-50 bg-gray-50 px-4 py-3">
          <Trophy className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-bold text-gray-700">학습량 순위</span>
          <span className="ml-auto text-[10px] text-gray-400">
            {period === 'daily' ? '오늘' : period === 'weekly' ? '이번 주' : '이번 달'} 기준
          </span>
        </div>
        <div className="px-4 py-4">
          <GroupLeaderboard
            members={(leaderboard?.leaderboard ?? []).map((e) => ({
              id: e.studentId,
              name: e.name,
              isMe: leaderboard?.myRank === e.rank,
              grade: e.grade,
              score: e.totalScore,
              studyMinutes: e.studyMinutes,
              totalPages: e.totalPages ?? 0,
            }))}
            period={period}
            onPeriodChange={setPeriod}
            loading={isLbLoading}
            emptyText="아직 이 반의 학습 데이터가 없어요"
          />
        </div>
      </div>

      {/* 강등·월반 기준 안내 */}
      <UniversityClassRules />
    </div>
  );
}

function UniversityClassEmpty() {
  const [showFaq, setShowFaq] = useState(false);

  return (
    <div className="space-y-4">
      {/* 메인 안내 카드 */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-6 text-white shadow-lg">
        <div className="mb-2 flex items-center gap-2">
          <GraduationCap className="h-6 w-6 opacity-80" />
          <span className="text-sm font-semibold opacity-80">목표대학반</span>
        </div>
        <h2 className="mb-1 text-2xl font-black">아직 배정된 반이 없어요</h2>
        <p className="text-sm leading-relaxed text-white/75">
          모의고사·내신 성적이 목표 대학 가능권에 진입하면
          <br />
          티스쿨 앱에서 배정 알림을 받게 됩니다.
        </p>
        <div className="mt-4 rounded-xl bg-white/15 px-4 py-3 text-sm text-white/80">
          🔔 배정 알림은 <span className="font-bold text-white">모고앱</span> 또는{' '}
          <span className="font-bold text-white">생기북앱</span>에서 확인하세요
        </div>
      </div>

      {/* 수시 vs 정시 카드 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Flame className="h-5 w-5 text-rose-500" />
            <span className="text-sm font-black text-rose-700">수시파이터반</span>
          </div>
          <p className="mb-3 text-xs leading-relaxed text-rose-600">
            내신 성적 + 비교과활동으로 경쟁
          </p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] text-rose-500">
              <Check className="h-3 w-3" />
              <span>생기북앱 성적 연동</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-rose-500">
              <Check className="h-3 w-3" />
              <span>비교과 활동 비교</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-rose-500">
              <Check className="h-3 w-3" />
              <span>학습량 강등 보호</span>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <div className="mb-2 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            <span className="text-sm font-black text-blue-700">정시파이터반</span>
          </div>
          <p className="mb-3 text-xs leading-relaxed text-blue-600">모의고사 성적으로 경쟁</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] text-blue-500">
              <Check className="h-3 w-3" />
              <span>모고앱 성적 연동</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-blue-500">
              <Check className="h-3 w-3" />
              <span>수능 영역별 비교</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-blue-500">
              <Check className="h-3 w-3" />
              <span>학습량 강등 보호</span>
            </div>
          </div>
        </div>
      </div>

      {/* 진입 조건 */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-gray-800">
          <Target className="h-4 w-4 text-indigo-500" />
          어떻게 진입하나요?
        </h3>
        <div className="space-y-3">
          {[
            {
              step: '01',
              text: '모의고사/내신 성적이 목표 대학 가능권에 1회 이상 진입',
              color: 'indigo',
            },
            {
              step: '02',
              text: '티스쿨 앱(모고앱 또는 생기북앱)에서 배정 알림 수신',
              color: 'violet',
            },
            {
              step: '03',
              text: '학생이 배정을 수락하면 스터디플래너에 반 자동 연동',
              color: 'purple',
            },
            {
              step: '04',
              text: '반 내 다른 학생들과 학습량·성적 비교 경쟁 시작',
              color: 'fuchsia',
            },
          ].map(({ step, text, color }) => (
            <div key={step} className="flex items-start gap-3">
              <span
                className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-${color}-100 text-[10px] font-black text-${color}-600`}
              >
                {step}
              </span>
              <p className="text-sm text-gray-600">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ 토글 */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        <button
          onClick={() => setShowFaq(!showFaq)}
          className="flex w-full items-center justify-between px-5 py-4 text-sm font-bold text-gray-700"
        >
          <span className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-gray-400" />
            강등·월반이 뭔가요?
          </span>
          {showFaq ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </button>
        {showFaq && (
          <div className="space-y-3 border-t border-gray-50 px-5 pb-5 pt-4 text-sm text-gray-600">
            <p>
              <span className="font-bold text-violet-600">월반</span>: 성적이 오르면 더 높은 목표
              대학 반으로 올라갑니다.
            </p>
            <p>
              <span className="font-bold text-rose-500">강등</span>: 성적이 하락하면 낮은 반으로
              이동할 수 있습니다.
            </p>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
              <p className="flex items-center gap-1.5 font-bold text-emerald-700">
                <Shield className="h-3.5 w-3.5" /> 강등 보호 조건
              </p>
              <p className="mt-1 text-emerald-600">
                스터디플래너 학습량이 반 상위 30% 이내이면, 성적 기준 강등 대상이더라도 현재 반에
                유지됩니다.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function UniversityClassRules() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-4 text-sm font-bold text-gray-700"
      >
        <span className="flex items-center gap-2">
          <Star className="h-4 w-4 text-amber-400" />
          강등·월반 기준 안내
        </span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>
      {open && (
        <div className="space-y-3 border-t border-gray-50 px-5 pb-5 pt-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-rose-100 bg-rose-50 p-3">
              <p className="flex items-center gap-1 text-xs font-bold text-rose-600">
                <ArrowDown className="h-3 w-3" /> 수시파이터 강등
              </p>
              <p className="mt-1 text-xs text-gray-600">내신 성적 하락 + 학습량 하위 70% 초과</p>
            </div>
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
              <p className="flex items-center gap-1 text-xs font-bold text-blue-600">
                <ArrowDown className="h-3 w-3" /> 정시파이터 강등
              </p>
              <p className="mt-1 text-xs text-gray-600">
                모의고사 성적 가능권 이탈 + 학습량 하위 70%
              </p>
            </div>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
              <p className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                <ArrowUp className="h-3 w-3" /> 수시파이터 월반
              </p>
              <p className="mt-1 text-xs text-gray-600">내신 성적 상위 목표 대학 가능권 진입</p>
            </div>
            <div className="rounded-xl border border-violet-100 bg-violet-50 p-3">
              <p className="flex items-center gap-1 text-xs font-bold text-violet-600">
                <ArrowUp className="h-3 w-3" /> 정시파이터 월반
              </p>
              <p className="mt-1 text-xs text-gray-600">모의고사 상위 목표 대학 가능권 진입</p>
            </div>
          </div>
          <div className="flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50 p-3">
            <Shield className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
            <p className="text-xs text-emerald-700">
              <span className="font-bold">강등 보호</span>: 스터디플래너 학습량 상위 30% 이내이면
              성적 기준 강등이 면제됩니다.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────── 클래스 카드 ───────────

function RoomCard({ room, onClick }: { room: MyClassRoom; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-2xl border border-gray-100 bg-white p-5 text-left shadow-sm transition-all hover:border-indigo-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-gray-900">{room.name}</h3>
            {room.myRole === 'owner' && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                👑 방장
              </span>
            )}
            {room.isPublic && (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
                공개
              </span>
            )}
          </div>
          {room.description && <p className="mt-1 text-sm text-gray-500">{room.description}</p>}
          <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {room.memberCount}/{room.maxMembers}명
            </span>
            {room.subject && (
              <span className="rounded bg-gray-100 px-1.5 py-0.5 text-gray-600">
                {room.subject}
              </span>
            )}
            {room.weeklyGoal && (
              <span className="flex items-center gap-1">
                <Target className="h-3.5 w-3.5" />주 {Math.floor(room.weeklyGoal / 60)}시간 목표
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 text-indigo-400">
          <Trophy className="h-5 w-5" />
        </div>
      </div>
    </button>
  );
}

// ─────────── 클래스 상세 + 리더보드 ───────────

function RoomDetail({ roomId, onBack }: { roomId: number; onBack: () => void }) {
  const { data: room } = useMyClassDetail(roomId);
  const [period, setPeriod] = useState<GroupPeriod>('weekly');
  const { data: leaderboard, isLoading: isLbLoading } = useMyClassLeaderboard(roomId, period);
  const deleteMutation = useDeleteMyClass();
  const leaveMutation = useLeaveMyClass();
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const handleCopyCode = () => {
    if (room?.roomCode) {
      navigator.clipboard.writeText(room.roomCode);
      toast.success('초대 코드가 복사되었습니다! 📋');
    }
  };

  const handleShareInvite = async () => {
    if (!room) return;
    const text = `🏠 "${room.name}" 마이 그룹에서 같이 공부하자!\n\n초대 코드: ${room.roomCode}\n\n🌱 StudyPlanner by 거북스쿨\nhttps://tskool.kr/join/${room.roomCode}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: `마이 그룹 초대 - ${room.name}`, text });
      } catch (e) {
        // cancelled
      }
    } else {
      navigator.clipboard.writeText(text);
      toast.success('초대 메시지가 복사되었습니다!');
    }
  };

  const handleDelete = () => {
    if (!confirm('정말 이 클래스를 삭제하시겠습니까? 모든 멤버가 퇴장됩니다.')) return;
    deleteMutation.mutate(roomId, {
      onSuccess: () => {
        toast.success('클래스가 삭제되었습니다.');
        onBack();
      },
    });
  };

  const handleLeave = () => {
    if (!confirm('이 클래스를 떠나시겠습니까?')) return;
    leaveMutation.mutate(roomId, {
      onSuccess: () => {
        toast.success('클래스를 떠났습니다.');
        onBack();
      },
    });
  };

  return (
    <div className="mx-auto max-w-screen-lg px-4 py-6">
      {/* 뒤로가기 */}
      <button
        onClick={onBack}
        className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ChevronLeft className="h-4 w-4" /> 목록으로
      </button>

      {room && (
        <>
          {/* 클래스 헤더 */}
          <div className="mb-6 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div
              className="px-6 py-5"
              style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-xl font-black text-white">{room.name}</h1>
                  {room.description && (
                    <p className="mt-1 text-sm text-white/70">{room.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  {room.isOwner ? (
                    <button
                      onClick={handleDelete}
                      className="rounded-lg bg-red-500/20 p-2 text-white hover:bg-red-500/40"
                      title="삭제"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleLeave}
                      className="rounded-lg bg-white/10 p-2 text-white hover:bg-white/20"
                      title="떠나기"
                    >
                      <LogOut className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* 초대 코드 */}
              <div className="mt-4 flex items-center gap-2">
                <div className="rounded-lg bg-white/15 px-3 py-1.5 font-mono text-sm tracking-widest text-white backdrop-blur-sm">
                  {room.roomCode}
                </div>
                <button
                  onClick={handleCopyCode}
                  className="rounded-lg bg-white/10 p-2 text-white hover:bg-white/20"
                  title="코드 복사"
                >
                  <Copy className="h-4 w-4" />
                </button>
                <button
                  onClick={handleShareInvite}
                  className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-indigo-700 transition-colors hover:bg-indigo-50"
                >
                  <Share2 className="h-3.5 w-3.5" /> 링크 공유 🌰+50
                </button>
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-indigo-400/30 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-indigo-400/50"
                >
                  <UserPlus className="h-3.5 w-3.5" /> 학생 초대
                </button>
              </div>
            </div>

            {/* 멤버 목록 */}
            <div className="border-t border-gray-100 px-6 py-4">
              <h3 className="mb-3 text-sm font-semibold text-gray-700">
                <Users className="mr-1 inline h-4 w-4" /> 멤버 ({room.members.length}/
                {room.maxMembers})
              </h3>
              <div className="flex flex-wrap gap-2">
                {room.members.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm"
                  >
                    {m.role === 'owner' && <Crown className="h-3 w-3 text-amber-500" />}
                    <span className="font-medium text-gray-700">{m.name}</span>
                    {m.grade && <span className="text-xs text-gray-400">{m.grade}</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 팀 통계 */}
          {leaderboard?.teamStats && (
            <div className="mb-6 grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-gray-100 bg-white p-4 text-center shadow-sm">
                <Clock className="mx-auto mb-1 h-5 w-5 text-blue-500" />
                <div className="text-lg font-black text-gray-900">
                  {Math.floor(leaderboard.teamStats.totalMinutes / 60)}h{' '}
                  {leaderboard.teamStats.totalMinutes % 60}m
                </div>
                <div className="text-xs text-gray-400">팀 총 학습시간</div>
              </div>
              <div className="rounded-xl border border-gray-100 bg-white p-4 text-center shadow-sm">
                <Star className="mx-auto mb-1 h-5 w-5 text-amber-500" />
                <div className="text-lg font-black text-gray-900">
                  {leaderboard.teamStats.totalScore.toLocaleString()}
                </div>
                <div className="text-xs text-gray-400">팀 총 점수</div>
              </div>
              <div className="rounded-xl border border-gray-100 bg-white p-4 text-center shadow-sm">
                <Target className="mx-auto mb-1 h-5 w-5 text-green-500" />
                <div className="text-lg font-black text-gray-900">
                  {leaderboard.teamStats.weeklyGoal
                    ? `${Math.floor(leaderboard.teamStats.weeklyGoal / 60)}h`
                    : '-'}
                </div>
                <div className="text-xs text-gray-400">
                  주간 목표 {leaderboard.teamStats.goalAchieved ? '✅' : ''}
                </div>
              </div>
            </div>
          )}

          {/* 리더보드 — 일/주/월 비교 */}
          <div className="mb-6">
            <GroupLeaderboard
              members={(leaderboard?.leaderboard ?? []).map((e) => ({
                id: e.studentId,
                name: e.name,
                isMe: e.studentId === leaderboard?.myRank?.studentId,
                grade: e.grade,
                score: e.totalScore,
                studyMinutes: e.studyMinutes,
                totalPages: e.totalPages ?? 0,
              }))}
              period={period}
              onPeriodChange={setPeriod}
              loading={isLbLoading}
              emptyText="아직 이 기간의 학습 기록이 없어요"
            />
          </div>

          {/* AI 성취율 평가 */}
          <AiEvaluationPanel
            open={aiPanelOpen}
            onToggle={() => setAiPanelOpen((v) => !v)}
            leaderboard={leaderboard}
          />
        </>
      )}

      {/* 학생 직접 초대 모달 */}
      {showInviteModal && room && (
        <InviteModal
          roomId={roomId}
          roomName={room.name}
          onClose={() => setShowInviteModal(false)}
        />
      )}
    </div>
  );
}

// ─────────── AI 성취율 평가 패널 ───────────

type AiLeaderboard = ReturnType<typeof useMyClassLeaderboard>['data'];

function AiEvaluationPanel({
  open,
  onToggle,
  leaderboard,
}: {
  open: boolean;
  onToggle: () => void;
  leaderboard: AiLeaderboard;
}) {
  const entries = leaderboard?.leaderboard ?? [];
  const myEntry = leaderboard?.myRank;

  const avgScore =
    entries.length > 0
      ? Math.round(entries.reduce((s, e) => s + e.totalScore, 0) / entries.length)
      : 0;
  const avgMinutes =
    entries.length > 0
      ? Math.round(entries.reduce((s, e) => s + e.studyMinutes, 0) / entries.length)
      : 0;
  const topScore = entries[0]?.totalScore ?? 0;
  const myScore = myEntry?.totalScore ?? 0;
  const myRate = topScore > 0 ? Math.round((myScore / topScore) * 100) : 0;

  const getAiComment = () => {
    if (entries.length === 0) return '이번 주 학습 데이터가 아직 없습니다.';
    if (myRate >= 90) return '🏆 최상위권입니다! 이번 주 반에서 뛰어난 성취율을 보이고 있어요.';
    if (myRate >= 70) return '📈 상위권입니다. 조금만 더 하면 1등도 가능해요!';
    if (myRate >= 50) return '📊 평균 수준입니다. 학습 시간을 조금 늘려보세요.';
    if (myScore > 0) return '💪 아직 성장 중입니다. 꾸준히 하면 반드시 올라갈 수 있어요!';
    return '📝 이번 주 학습 기록을 남기면 AI 평가를 받을 수 있어요.';
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-sm">
      {/* 헤더 — 항상 표시 */}
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-violet-50/40"
      >
        <div className="flex items-center gap-2">
          <BrainCircuit className="h-5 w-5 text-violet-500" />
          <span className="text-base font-bold text-gray-900">AI 성취율 평가</span>
          <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-600">
            BETA
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          {open ? (
            <>
              평가 닫기 <ChevronUp className="h-4 w-4" />
            </>
          ) : (
            <>
              평가 받기 <ChevronDown className="h-4 w-4" />
            </>
          )}
        </div>
      </button>

      {/* 평가 내용 — 토글 */}
      {open && (
        <div className="border-t border-violet-100 px-6 pb-6 pt-4">
          {entries.length === 0 ? (
            <p className="text-center text-sm text-gray-400">
              이번 주 학습 데이터가 없어 평가를 생성할 수 없습니다.
            </p>
          ) : (
            <div className="space-y-4">
              {/* AI 코멘트 */}
              <div className="rounded-xl bg-gradient-to-r from-violet-50 to-indigo-50 p-4 ring-1 ring-violet-100">
                <p className="text-sm font-medium leading-relaxed text-gray-700">
                  {getAiComment()}
                </p>
              </div>

              {/* 나의 성취율 게이지 */}
              {myScore > 0 && (
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">나의 성취율 (1위 대비)</span>
                    <span className="font-bold text-violet-600">{myRate}%</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-gray-100">
                    <div
                      className="h-2.5 rounded-full bg-gradient-to-r from-violet-400 to-indigo-500 transition-all"
                      style={{ width: `${myRate}%` }}
                    />
                  </div>
                </div>
              )}

              {/* 반 평균 통계 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-center">
                  <BarChart2 className="mx-auto mb-1 h-4 w-4 text-indigo-400" />
                  <div className="text-base font-bold text-gray-900">
                    {avgScore.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-400">반 평균 점수</div>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-center">
                  <TrendingUp className="mx-auto mb-1 h-4 w-4 text-emerald-400" />
                  <div className="text-base font-bold text-gray-900">
                    {Math.floor(avgMinutes / 60)}h {avgMinutes % 60}m
                  </div>
                  <div className="text-xs text-gray-400">반 평균 학습시간</div>
                </div>
              </div>

              {/* 멤버별 성취율 */}
              <div>
                <p className="mb-2 text-xs font-semibold text-gray-500">멤버별 성취율</p>
                <div className="space-y-2">
                  {entries.map((e) => {
                    const rate = topScore > 0 ? Math.round((e.totalScore / topScore) * 100) : 0;
                    const isMe = e.studentId === myEntry?.studentId;
                    return (
                      <div key={e.studentId}>
                        <div className="mb-0.5 flex items-center justify-between text-xs">
                          <span
                            className={`font-medium ${isMe ? 'text-indigo-600' : 'text-gray-600'}`}
                          >
                            {isMe ? '나' : e.name}
                            {e.rank === 1 && ' 👑'}
                          </span>
                          <span
                            className={`font-bold ${isMe ? 'text-indigo-600' : 'text-gray-500'}`}
                          >
                            {rate}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-gray-100">
                          <div
                            className={`h-1.5 rounded-full transition-all ${isMe ? 'bg-indigo-500' : 'bg-gray-300'}`}
                            style={{ width: `${rate}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <p className="text-center text-[11px] text-gray-400">
                * AI 평가는 이번 주 점수·학습시간 기반으로 자동 산출됩니다.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────── 클래스 생성 모달 ───────────

function CreateClassModal({ onClose }: { onClose: () => void }) {
  const createMutation = useCreateMyClass();
  const [form, setForm] = useState({
    name: '',
    description: '',
    subject: '',
    isPublic: false,
    weeklyGoal: '',
  });

  const subjects = ['', '국어', '영어', '수학', '과학', '사회', '한국사', '기타'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('클래스 이름을 입력해주세요.');
      return;
    }

    createMutation.mutate(
      {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        subject: form.subject || undefined,
        isPublic: form.isPublic,
        weeklyGoal: form.weeklyGoal ? parseInt(form.weeklyGoal, 10) * 60 : undefined, // 시간→분
      },
      {
        onSuccess: (result) => {
          toast.success(
            `"${form.name}" 클래스가 생성되었습니다! 🎉\n초대 코드: ${result.roomCode}` +
              (result.acorn?.success ? `\n🌰 +${result.acorn.amount} 도토리!` : ''),
          );
          onClose();
        },
        onError: (err: Error) => {
          const _err = err as unknown as { response?: { data?: { message?: string } } };
          toast.error(_err?.response?.data?.message || '생성에 실패했습니다.');
        },
      },
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="mx-4 w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* 헤더 */}
        <div
          className="px-6 py-5"
          style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}
        >
          <h2 className="text-lg font-bold text-white">🏠 새 클래스 만들기</h2>
          <p className="mt-1 text-sm text-white/70">
            클래스를 만들면 🌰+30 도토리! 친구 초대 시 🌰+50!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {/* 이름 */}
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">클래스 이름 *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="예: 수학 파이터즈 🔥"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              maxLength={50}
            />
          </div>

          {/* 설명 */}
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">설명</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="클래스 소개 한줄 (선택)"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              maxLength={200}
            />
          </div>

          {/* 과목 */}
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">과목 (선택)</label>
            <select
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              {subjects.map((s) => (
                <option key={s} value={s}>
                  {s || '전체 과목'}
                </option>
              ))}
            </select>
          </div>

          {/* 주간 목표 */}
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">
              팀 주간 학습 목표 (선택)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={form.weeklyGoal}
                onChange={(e) => setForm({ ...form, weeklyGoal: e.target.value })}
                placeholder="10"
                className="w-24 rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                min={1}
                max={200}
              />
              <span className="text-sm text-gray-500">시간 / 주 (팀 전체 합산)</span>
            </div>
          </div>

          {/* 공개 여부 */}
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
            <input
              type="checkbox"
              checked={form.isPublic}
              onChange={(e) => setForm({ ...form, isPublic: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <div>
              <span className="text-sm font-medium text-gray-700">공개 클래스</span>
              <p className="text-xs text-gray-400">누구나 검색하고 참여할 수 있습니다</p>
            </div>
          </label>

          {/* 버튼 */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 rounded-lg bg-indigo-600 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {createMutation.isPending ? '생성 중...' : '만들기 🌰+30'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────── 받은 초대 목록 패널 ───────────

function InvitationsPanel({ invitations }: { invitations: InvitationItem[] }) {
  const acceptMutation = useAcceptInvitation();
  const declineMutation = useDeclineInvitation();

  const handleAccept = (inv: InvitationItem) => {
    acceptMutation.mutate(inv.id, {
      onSuccess: (result) => {
        toast.success(`"${result.roomName}"에 가입했습니다! 🎉`);
      },
      onError: (err: Error) => {
        const _err = err as unknown as { response?: { data?: { message?: string } } };
        toast.error(_err?.response?.data?.message || '수락에 실패했습니다.');
      },
    });
  };

  const handleDecline = (inv: InvitationItem) => {
    declineMutation.mutate(inv.id, {
      onSuccess: () => {
        toast.success('초대를 거절했습니다.');
      },
    });
  };

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-amber-200 bg-amber-50">
      <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-100 px-4 py-3">
        <Bell className="h-4 w-4 text-amber-600" />
        <span className="text-sm font-bold text-amber-800">받은 초대</span>
        <span className="ml-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">
          {invitations.length}
        </span>
      </div>
      <div className="divide-y divide-amber-100">
        {invitations.map((inv) => (
          <div key={inv.id} className="flex items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-800">🏠 {inv.roomName}</p>
              <p className="text-xs text-gray-500">
                <span className="font-medium text-indigo-600">{inv.inviterName}</span>
                {inv.inviterGrade && ` (${inv.inviterGrade})`}님이 초대했습니다
                {inv.message && <span className="ml-1 italic text-gray-400">"{inv.message}"</span>}
              </p>
              <p className="mt-0.5 text-[10px] text-gray-400">
                {inv.memberCount}/{inv.maxMembers}명 •{' '}
                {new Date(inv.expiresAt).toLocaleDateString('ko-KR')} 만료
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleDecline(inv)}
                disabled={declineMutation.isPending}
                className="rounded-lg border border-gray-300 bg-white p-2 text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                title="거절"
              >
                <X className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleAccept(inv)}
                disabled={acceptMutation.isPending}
                className="rounded-lg bg-indigo-600 p-2 text-white hover:bg-indigo-700 disabled:opacity-50"
                title="수락"
              >
                <Check className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────── 학생 직접 초대 모달 ───────────

function InviteModal({
  roomId,
  roomName,
  onClose,
}: {
  roomId: number;
  roomName: string;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');
  const [sentIds, setSentIds] = useState<Set<number>>(new Set());

  const { data: results, isFetching } = useSearchStudents(query);
  const sendMutation = useSendInvitation();

  const handleSend = (student: StudentSearchResult) => {
    sendMutation.mutate(
      { roomId, inviteeId: student.id, message: message.trim() || undefined },
      {
        onSuccess: () => {
          toast.success(`${student.name}님에게 초대장을 보냈습니다! 🎉`);
          setSentIds((prev) => new Set(prev).add(student.id));
        },
        onError: (err: Error) => {
          const _err = err as unknown as { response?: { data?: { message?: string } } };
          toast.error(_err?.response?.data?.message || '초대 발송에 실패했습니다.');
        },
      },
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="mx-4 w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* 헤더 */}
        <div
          className="flex items-center justify-between px-6 py-5"
          style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}
        >
          <div>
            <h2 className="text-lg font-bold text-white">학생 초대</h2>
            <p className="mt-0.5 text-sm text-white/70">{roomName}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg bg-white/10 p-2 text-white hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          {/* 학생 검색 */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
              학생 이름으로 검색
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="이름 입력..."
                autoFocus
                className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
              {isFetching && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                  검색 중...
                </span>
              )}
            </div>
          </div>

          {/* 검색 결과 */}
          {query.trim().length >= 1 && (
            <div className="max-h-56 overflow-y-auto rounded-xl border border-gray-100 bg-gray-50">
              {!results || results.length === 0 ? (
                <p className="p-4 text-center text-sm text-gray-400">
                  {isFetching ? '검색 중...' : '검색 결과가 없습니다.'}
                </p>
              ) : (
                results.map((student) => {
                  const sent = sentIds.has(student.id);
                  return (
                    <div
                      key={student.id}
                      className="flex items-center gap-3 border-b border-gray-100 px-4 py-2.5 last:border-0"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                        {student.name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-800">{student.name}</p>
                        <p className="text-xs text-gray-400">
                          {student.grade && `${student.grade} · `}
                          {student.schoolName ?? '학교 미상'}
                        </p>
                      </div>
                      <button
                        onClick={() => handleSend(student)}
                        disabled={sent || sendMutation.isPending}
                        className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                          sent
                            ? 'bg-green-100 text-green-700'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50'
                        }`}
                      >
                        {sent ? (
                          <>
                            <Check className="h-3 w-3" /> 발송됨
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-3 w-3" /> 초대
                          </>
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* 초대 메시지 (선택) */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
              초대 메시지 <span className="font-normal text-gray-400">(선택)</span>
            </label>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="같이 공부해요! 🔥"
              maxLength={100}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          <p className="text-center text-xs text-gray-400">
            초대장은 7일간 유효하며, 수락 시 🌰+50 도토리를 받습니다.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─────────── Hub 학습 그룹 리더보드 (Phase 1 통합) ───────────
