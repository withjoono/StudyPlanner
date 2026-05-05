/**
 * 뱃지 컬렉션 페이지 — /badges
 *
 * - 카테고리별 뱃지 그리드
 * - 획득/미획득 구분 (미획득은 잠금 처리)
 * - Rarity별 스타일링 (common → legendary 글로우)
 * - 새 뱃지 알림 배지
 */

import { createLazyFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  useMyBadges,
  useAcknowledgeBadges,
  RARITY_CONFIG,
  CATEGORY_LABELS,
  type BadgeItem,
} from '@/stores/server/badge';
import { shareGeneral, buildBadgeShare } from '@/lib/share';
import { useEarnAcorn } from '@/stores/server/acorn';
import { useAuthStore } from '@/stores/client';

export const Route = createLazyFileRoute('/badges')({
  component: BadgesPage,
});

function BadgesPage() {
  const user = useAuthStore((state) => state.user);
  const { data, isLoading } = useMyBadges();
  const acknowledgeMutation = useAcknowledgeBadges();
  const earnAcorn = useEarnAcorn();
  const [selectedBadge, setSelectedBadge] = useState<BadgeItem | null>(null);

  // 페이지 진입 시 새 뱃지 확인 처리
  useEffect(() => {
    if (data && data.newCount > 0) {
      acknowledgeMutation.mutate();
    }
  }, [data?.newCount]);

  const earnedCount = data?.badges.filter((b) => b.earned).length ?? 0;
  const totalCount = data?.badges.length ?? 0;

  // 카테고리별 그룹핑
  const categories =
    data?.badges.reduce(
      (acc, badge) => {
        if (!acc[badge.category]) acc[badge.category] = [];
        acc[badge.category].push(badge);
        return acc;
      },
      {} as Record<string, BadgeItem[]>,
    ) ?? {};

  const handleShareBadge = async (badge: BadgeItem) => {
    const shareData = buildBadgeShare(badge.name, badge.emoji, user?.userName);
    const result = await shareGeneral({
      title: shareData.title,
      text: shareData.text,
      url: shareData.link,
    });

    if (result === 'shared') {
      const acornResult = await earnAcorn.mutateAsync({ type: 'sns_share' });
      if (acornResult.success) {
        toast.success(`공유 완료! 🌰 +${acornResult.amount} 도토리!`);
      } else {
        toast.success('공유 완료!');
      }
    } else if (result === 'copied') {
      const acornResult = await earnAcorn.mutateAsync({ type: 'sns_share' });
      if (acornResult.success) {
        toast.success(`링크 복사 완료! 🌰 +${acornResult.amount} 도토리! SNS에 공유해주세요!`);
      } else {
        toast.success('링크가 복사되었습니다!');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-screen-lg px-4 py-6">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight text-gray-900">🏅 뱃지 컬렉션</h1>
        <p className="mt-1 text-sm text-gray-500">학습 활동으로 뱃지를 모아보세요!</p>
      </div>

      {/* 진행 상황 */}
      <div className="mb-8 overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">수집 현황</span>
          <span className="text-sm font-bold text-indigo-600">
            {earnedCount}/{totalCount}
          </span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${totalCount > 0 ? (earnedCount / totalCount) * 100 : 0}%`,
              background: 'linear-gradient(90deg, #4f46e5, #7c3aed, #a855f7)',
            }}
          />
        </div>

        {/* Rarity 범례 */}
        <div className="mt-4 flex flex-wrap gap-3">
          {Object.entries(RARITY_CONFIG).map(([key, config]) => (
            <div key={key} className="flex items-center gap-1.5 text-xs">
              <div
                className="h-3 w-3 rounded-sm"
                style={{
                  backgroundColor: config.bgColor,
                  border: `1px solid ${config.borderColor}`,
                }}
              />
              <span style={{ color: config.color, fontWeight: 600 }}>{config.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 카테고리별 뱃지 */}
      {Object.entries(categories).map(([category, badges]) => {
        const catConfig = CATEGORY_LABELS[category];
        return (
          <div key={category} className="mb-8">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-800">
              <span>{catConfig?.emoji || '🏅'}</span>
              {catConfig?.label || category}
              <span className="text-sm font-normal text-gray-400">
                ({badges.filter((b) => b.earned).length}/{badges.length})
              </span>
            </h2>

            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
              {badges.map((badge) => (
                <BadgeCard key={badge.id} badge={badge} onClick={() => setSelectedBadge(badge)} />
              ))}
            </div>
          </div>
        );
      })}

      {/* 뱃지 상세 모달 */}
      {selectedBadge && (
        <BadgeDetailModal
          badge={selectedBadge}
          onClose={() => setSelectedBadge(null)}
          onShare={selectedBadge.earned ? () => handleShareBadge(selectedBadge) : undefined}
        />
      )}
    </div>
  );
}

// ─────────── 뱃지 카드 ───────────

function BadgeCard({ badge, onClick }: { badge: BadgeItem; onClick: () => void }) {
  const rarity = RARITY_CONFIG[badge.rarity] || RARITY_CONFIG.common;

  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col items-center rounded-xl border p-3 transition-all hover:scale-105"
      style={{
        backgroundColor: badge.earned ? rarity.bgColor : '#f3f4f6',
        borderColor: badge.earned ? rarity.borderColor : '#e5e7eb',
        boxShadow: badge.earned ? rarity.glow : 'none',
        opacity: badge.earned ? 1 : 0.5,
      }}
    >
      {/* 새 뱃지 표시 */}
      {badge.isNew && (
        <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-red-500 ring-2 ring-white" />
      )}

      <div className="mb-1 text-3xl" style={{ filter: badge.earned ? 'none' : 'grayscale(1)' }}>
        {badge.emoji}
      </div>
      <div
        className="text-center text-[11px] font-semibold leading-tight"
        style={{ color: badge.earned ? rarity.color : '#9ca3af' }}
      >
        {badge.name}
      </div>

      {/* Rarity 태그 */}
      {badge.earned && badge.rarity !== 'common' && (
        <div
          className="mt-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold"
          style={{ backgroundColor: `${rarity.color}15`, color: rarity.color }}
        >
          {rarity.label}
        </div>
      )}

      {/* 잠금 아이콘 */}
      {!badge.earned && <div className="mt-1 text-[10px] text-gray-400">🔒</div>}
    </button>
  );
}

// ─────────── 뱃지 상세 모달 ───────────

function BadgeDetailModal({
  badge,
  onClose,
  onShare,
}: {
  badge: BadgeItem;
  onClose: () => void;
  onShare?: () => void;
}) {
  const rarity = RARITY_CONFIG[badge.rarity] || RARITY_CONFIG.common;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="mx-4 w-full max-w-sm overflow-hidden rounded-3xl shadow-2xl"
        style={{
          background: `linear-gradient(135deg, ${rarity.bgColor}, white)`,
          border: `2px solid ${rarity.borderColor}`,
          boxShadow: badge.earned
            ? `${rarity.glow}, 0 25px 50px rgba(0,0,0,0.15)`
            : '0 25px 50px rgba(0,0,0,0.15)',
        }}
      >
        <div className="p-8 text-center">
          {/* 이모지 */}
          <div
            className="mb-4 text-7xl"
            style={{
              filter: badge.earned ? 'none' : 'grayscale(1)',
              animation: badge.earned ? 'badge-bounce 0.5s ease-out' : 'none',
            }}
          >
            {badge.emoji}
          </div>

          {/* Rarity 태그 */}
          <div
            className="mb-2 inline-block rounded-full px-3 py-1 text-xs font-bold"
            style={{ backgroundColor: `${rarity.color}15`, color: rarity.color }}
          >
            {rarity.label}
          </div>

          {/* 이름 */}
          <h2 className="mb-1 text-xl font-black text-gray-900">{badge.name}</h2>
          <p className="mb-4 text-sm text-gray-500">{badge.description}</p>

          {/* 획득 정보 */}
          {badge.earned ? (
            <div className="mb-4 text-xs text-gray-400">
              🎉 {new Date(badge.earnedAt!).toLocaleDateString('ko-KR')} 획득
            </div>
          ) : (
            <div className="mb-4 rounded-lg bg-gray-100 p-3 text-xs text-gray-500">
              🔒 조건: {badge.description}
            </div>
          )}

          {/* 버튼 */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-300 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              닫기
            </button>
            {onShare && (
              <button
                onClick={() => {
                  onShare();
                  onClose();
                }}
                className="flex-1 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 py-2.5 text-sm font-bold text-white shadow-md hover:shadow-lg"
              >
                자랑하기 🌰+10
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes badge-bounce {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
