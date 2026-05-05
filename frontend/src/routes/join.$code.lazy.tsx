/**
 * 초대 코드 가입 페이지 — /join/:code
 *
 * SNS에서 공유된 링크를 통해 접속 시:
 * - 비회원: 방 미리보기 + 가입 안내
 * - 회원: 바로 가입 처리
 */

import { createLazyFileRoute, useParams, useNavigate } from '@tanstack/react-router';
import { useMyClassByCode, useJoinMyClass } from '@/stores/server/myclass';
import { useAuthStore } from '@/stores/client';
import { Users, Target, Crown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const Route = createLazyFileRoute('/join/$code')({
  component: JoinPage,
});

function JoinPage() {
  const { code } = useParams({ from: '/join/$code' });
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { data: room, isLoading, error } = useMyClassByCode(code);
  const joinMutation = useJoinMyClass();

  const handleJoin = () => {
    if (!isAuthenticated) {
      // Hub 로그인으로 리다이렉트 후 복귀
      const HUB_URL =
        import.meta.env.VITE_HUB_URL ||
        (import.meta.env.PROD ? 'https://tskool.kr' : 'http://localhost:5173');
      window.location.href = `${HUB_URL}/login?redirect=${encodeURIComponent(window.location.href)}`;
      return;
    }

    joinMutation.mutate(
      { code },
      {
        onSuccess: (result) => {
          toast.success(`"${result.roomName}"에 가입했습니다! 🎉`);
          navigate({ to: '/myclass' });
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || '가입에 실패했습니다.');
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <div className="mb-4 text-5xl">😕</div>
        <h2 className="mb-2 text-xl font-bold text-gray-800">유효하지 않은 초대 코드</h2>
        <p className="mb-6 text-sm text-gray-500">이 초대 코드는 만료되었거나 존재하지 않습니다.</p>
        <button
          onClick={() => navigate({ to: '/myclass' })}
          className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-indigo-700"
        >
          마이 클래스 목록으로
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-xl">
        {/* 상단 그라디언트 */}
        <div
          className="px-6 py-8 text-center"
          style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #a855f7 100%)' }}
        >
          <div className="mb-3 text-5xl">🏠</div>
          <h1 className="text-xl font-black text-white">{room.name}</h1>
          {room.description && <p className="mt-2 text-sm text-white/70">{room.description}</p>}
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-sm text-white backdrop-blur-sm">
            <Crown className="h-3.5 w-3.5" />
            방장: {room.ownerName}
          </div>
        </div>

        {/* 상세 정보 */}
        <div className="space-y-4 p-6">
          <div className="flex justify-around text-center">
            <div>
              <div className="flex items-center justify-center gap-1 text-lg font-bold text-gray-900">
                <Users className="h-5 w-5 text-indigo-500" />
                {room.memberCount}/{room.maxMembers}
              </div>
              <div className="text-xs text-gray-400">멤버</div>
            </div>
            {room.subject && (
              <div>
                <div className="text-lg font-bold text-gray-900">{room.subject}</div>
                <div className="text-xs text-gray-400">과목</div>
              </div>
            )}
            {room.weeklyGoal && (
              <div>
                <div className="flex items-center justify-center gap-1 text-lg font-bold text-gray-900">
                  <Target className="h-5 w-5 text-green-500" />
                  {Math.floor(room.weeklyGoal / 60)}h
                </div>
                <div className="text-xs text-gray-400">주간 목표</div>
              </div>
            )}
          </div>

          {/* 초대 코드 */}
          <div className="rounded-xl bg-gray-50 p-4 text-center">
            <div className="text-xs text-gray-500">초대 코드</div>
            <div className="mt-1 font-mono text-xl font-black tracking-widest text-indigo-600">
              {room.roomCode}
            </div>
          </div>

          {/* 가입 버튼 */}
          <button
            onClick={handleJoin}
            disabled={joinMutation.isPending || room.memberCount >= room.maxMembers}
            className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 py-3.5 text-center text-sm font-bold text-white shadow-lg transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
          >
            {joinMutation.isPending
              ? '가입 중...'
              : room.memberCount >= room.maxMembers
                ? '정원이 찼습니다'
                : isAuthenticated
                  ? '지금 참여하기 🔥'
                  : '로그인 후 참여하기'}
          </button>

          {!isAuthenticated && (
            <p className="text-center text-xs text-gray-400">
              로그인하면 바로 이 클래스에 참여할 수 있습니다
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
