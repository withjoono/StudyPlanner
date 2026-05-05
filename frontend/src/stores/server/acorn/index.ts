/**
 * 도토리(Acorn) API Hooks
 *
 * TanStack Query 기반 도토리 잔액/획득/사용 API
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { plannerClient } from '@/lib/api/instances';
import { useAuthStore } from '@/stores/client';

// ============================================
// Query Keys
// ============================================

export const acornKeys = {
  all: ['acorn'] as const,
  balance: () => [...acornKeys.all, 'balance'] as const,
};

// ============================================
// Types
// ============================================

export interface AcornTransaction {
  id: number;
  amount: number;
  type: string;
  description: string | null;
  createdAt: string;
}

export interface AcornBalanceData {
  balance: number;
  lifetime: number;
  recentTransactions: AcornTransaction[];
}

export interface AcornEarnResult {
  success: boolean;
  amount: number;
  newBalance: number;
  reason?: string;
}

// ============================================
// Hooks
// ============================================

/** 도토리 잔액 및 최근 거래내역 조회 */
export function useAcornBalance() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return useQuery({
    queryKey: acornKeys.balance(),
    queryFn: async () => {
      const response = await plannerClient.get('/acorn/balance');
      return response.data as AcornBalanceData;
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 2, // 2분 캐시
  });
}

/** 도토리 획득 (SNS 공유, 마일스톤 달성 등) */
export function useEarnAcorn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ type, referenceId }: { type: string; referenceId?: string }) => {
      const response = await plannerClient.post('/acorn/earn', { type, referenceId });
      return response.data as AcornEarnResult;
    },
    onSuccess: (result) => {
      if (result.success) {
        // 잔액 캐시 업데이트
        queryClient.setQueryData<AcornBalanceData>(acornKeys.balance(), (old) => {
          if (!old) return old;
          return { ...old, balance: result.newBalance };
        });
        // 전체 리패치 (트랜잭션 목록 갱신)
        queryClient.invalidateQueries({ queryKey: acornKeys.balance() });
      }
    },
  });
}

/** 도토리 사용 (프리미엄 기능 해금) */
export function useSpendAcorn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      amount,
      type,
      description,
    }: {
      amount: number;
      type: string;
      description?: string;
    }) => {
      const response = await plannerClient.post('/acorn/spend', { amount, type, description });
      return response.data as AcornEarnResult;
    },
    onSuccess: (result) => {
      if (result.success) {
        queryClient.setQueryData<AcornBalanceData>(acornKeys.balance(), (old) => {
          if (!old) return old;
          return { ...old, balance: result.newBalance };
        });
        queryClient.invalidateQueries({ queryKey: acornKeys.balance() });
      }
    },
  });
}
