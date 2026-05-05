/**
 * 마이 클래스 — 사용자 생성 경쟁 반
 *
 * - 내가 속한 클래스 목록
 * - 클래스 생성 모달
 * - 클래스 상세 (멤버 + 리더보드)
 * - 초대 코드 공유
 */

import { createLazyFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
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
  type MyClassRoom,
  type LeaderboardEntry,
} from '@/stores/server/myclass';

export const Route = createLazyFileRoute('/myclass')({
  component: MyClassPage,
});

function MyClassPage() {
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');

  const { data: rooms, isLoading } = useMyClassList();
  const joinMutation = useJoinMyClass();

  const handleJoin = () => {
    if (!joinCode.trim()) return;
    joinMutation.mutate(
      { code: joinCode.trim() },
      {
        onSuccess: (result) => {
          toast.success(`"${result.roomName}"에 가입했습니다! 🎉`);
          setJoinCode('');
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || '가입에 실패했습니다.');
        },
      },
    );
  };

  if (selectedRoomId) {
    return <RoomDetail roomId={selectedRoomId} onBack={() => setSelectedRoomId(null)} />;
  }

  return (
    <div className="mx-auto max-w-screen-lg px-4 py-6">
      {/* 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900">🏠 마이 클래스</h1>
          <p className="mt-1 text-sm text-gray-500">
            친구와 함께 학습 경쟁! 클래스를 만들고 초대하세요.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg transition-transform hover:scale-105"
        >
          <Plus className="h-4 w-4" />새 클래스 만들기
        </button>
      </div>

      {/* 초대 코드 입력 */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-purple-50 p-4">
        <div className="flex items-center gap-3">
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
            className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-indigo-700"
          >
            첫 클래스 만들기
          </button>
        </div>
      )}

      {/* 생성 모달 */}
      {showCreateModal && <CreateClassModal onClose={() => setShowCreateModal(false)} />}
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
  const { data: leaderboard } = useMyClassLeaderboard(roomId, 'weekly');
  const deleteMutation = useDeleteMyClass();
  const leaveMutation = useLeaveMyClass();
  const [aiPanelOpen, setAiPanelOpen] = useState(false);

  const handleCopyCode = () => {
    if (room?.roomCode) {
      navigator.clipboard.writeText(room.roomCode);
      toast.success('초대 코드가 복사되었습니다! 📋');
    }
  };

  const handleShareInvite = async () => {
    if (!room) return;
    const text = `🏠 "${room.name}" 마이 클래스에서 같이 공부하자!\n\n초대 코드: ${room.roomCode}\n\n🌱 StudyPlanner by 거북스쿨\nhttps://geobukschool.kr/join/${room.roomCode}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: `마이 클래스 초대 - ${room.name}`, text });
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
                  <Share2 className="h-3.5 w-3.5" /> 친구 초대 🌰+50
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

          {/* 리더보드 */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-6 py-4">
              <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900">
                <Trophy className="h-5 w-5 text-amber-500" /> 이번 주 랭킹
              </h3>
            </div>
            <div className="divide-y divide-gray-50">
              {leaderboard?.leaderboard.map((entry) => (
                <LeaderboardRow
                  key={entry.studentId}
                  entry={entry}
                  isMe={entry.studentId === leaderboard.myRank?.studentId}
                />
              ))}
              {(!leaderboard?.leaderboard || leaderboard.leaderboard.length === 0) && (
                <div className="p-8 text-center text-sm text-gray-400">
                  아직 이번 주 학습 기록이 없습니다.
                </div>
              )}
            </div>
          </div>

          {/* AI 성취율 평가 */}
          <AiEvaluationPanel
            open={aiPanelOpen}
            onToggle={() => setAiPanelOpen((v) => !v)}
            leaderboard={leaderboard}
          />
        </>
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

function LeaderboardRow({ entry, isMe }: { entry: LeaderboardEntry; isMe: boolean }) {
  const getRankEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `${rank}`;
  };

  return (
    <div
      className={`flex items-center gap-4 px-6 py-3.5 transition-colors ${
        isMe ? 'bg-indigo-50' : 'hover:bg-gray-50'
      } ${entry.rank <= 3 ? 'font-semibold' : ''}`}
    >
      <div className="flex h-8 w-8 items-center justify-center text-lg">
        {getRankEmoji(entry.rank)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={`truncate ${isMe ? 'font-bold text-indigo-700' : 'text-gray-800'}`}>
            {entry.name}
          </span>
          {entry.role === 'owner' && <Crown className="h-3.5 w-3.5 flex-shrink-0 text-amber-500" />}
          {isMe && (
            <span className="flex-shrink-0 rounded-full bg-indigo-200 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700">
              나
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4 text-sm">
        <div className="text-right">
          <div className="font-bold text-gray-900">{entry.totalScore.toLocaleString()}</div>
          <div className="text-[10px] text-gray-400">점수</div>
        </div>
        <div className="text-right">
          <div className="text-gray-600">
            {Math.floor(entry.studyMinutes / 60)}h {entry.studyMinutes % 60}m
          </div>
          <div className="text-[10px] text-gray-400">학습</div>
        </div>
        <div className="text-right">
          <div className="text-gray-600">{(entry.totalPages ?? 0).toLocaleString()}p</div>
          <div className="text-[10px] text-gray-400">분량</div>
        </div>
      </div>
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
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || '생성에 실패했습니다.');
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
