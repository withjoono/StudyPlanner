/**
 * 뱃지(Badge) API Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { plannerClient } from '@/lib/api/instances';
import { useAuthStore } from '@/stores/client';

export const badgeKeys = {
  all: ['badge'] as const,
  list: () => [...badgeKeys.all, 'list'] as const,
};

// ═══════════════════════════════════════════
// Types
// ═══════════════════════════════════════════

export interface BadgeItem {
  id: string;
  name: string;
  description: string;
  emoji: string;
  category: string;
  rarity: string;
  condition: string;
  sortOrder: number;
  earned: boolean;
  earnedAt: string | null;
  isNew: boolean;
}

export interface BadgeListResponse {
  badges: BadgeItem[];
  newCount: number;
}

// ═══════════════════════════════════════════
// Rarity 설정 (프론트 표시용)
// ═══════════════════════════════════════════

export const RARITY_CONFIG: Record<
  string,
  { label: string; color: string; bgColor: string; borderColor: string; glow: string }
> = {
  common: {
    label: '일반',
    color: '#6b7280',
    bgColor: '#f9fafb',
    borderColor: '#e5e7eb',
    glow: 'none',
  },
  rare: {
    label: '희귀',
    color: '#3b82f6',
    bgColor: '#eff6ff',
    borderColor: '#93c5fd',
    glow: '0 0 8px rgba(59,130,246,0.3)',
  },
  epic: {
    label: '영웅',
    color: '#8b5cf6',
    bgColor: '#f5f3ff',
    borderColor: '#a78bfa',
    glow: '0 0 12px rgba(139,92,246,0.4)',
  },
  legendary: {
    label: '전설',
    color: '#f59e0b',
    bgColor: '#fffbeb',
    borderColor: '#fbbf24',
    glow: '0 0 16px rgba(245,158,11,0.5)',
  },
};

export const CATEGORY_LABELS: Record<string, { label: string; emoji: string }> = {
  streak: { label: '연속 달성', emoji: '🔥' },
  mission: { label: '미션', emoji: '🎯' },
  social: { label: '소셜', emoji: '🤝' },
  growth: { label: '성장', emoji: '📈' },
  special: { label: '스페셜', emoji: '✨' },
};

// ═══════════════════════════════════════════
// Hooks
// ═══════════════════════════════════════════

/** 내 뱃지 목록 (획득 + 미획득 카탈로그) */
export function useMyBadges() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return useQuery({
    queryKey: badgeKeys.list(),
    queryFn: async () => {
      const response = await plannerClient.get('/badge');
      return response.data as BadgeListResponse;
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5,
  });
}

/** 새 뱃지 확인 처리 */
export function useAcknowledgeBadges() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const response = await plannerClient.post('/badge/acknowledge');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: badgeKeys.list() });
    },
  });
}
