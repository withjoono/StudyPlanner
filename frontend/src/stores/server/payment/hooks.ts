/**
 * 결제 API Hooks
 * TanStack Query 기반
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authClient } from '@/lib/api';
import type {
  PaymentHistory,
  PreRegisterRequest,
  PreRegisterResponse,
  VerifyPaymentRequest,
  VerifyPaymentResponse,
  ValidateCouponRequest,
  ValidateCouponResponse,
  FreePaymentRequest,
  StoreCodeResponse,
} from '@/types/payment';
import { useAuthStore } from '@/stores/client/use-auth-store';

// ============================================
// Query Keys
// ============================================

export const paymentKeys = {
  all: ['payments'] as const,
  history: () => [...paymentKeys.all, 'history'] as const,
  historyDetail: (id: number) => [...paymentKeys.all, 'history', id] as const,
  storeCode: () => [...paymentKeys.all, 'storeCode'] as const,
};

// ============================================
// 결제 내역 조회
// ============================================

/**
 * 결제 내역 목록 조회
 */
export function useGetPaymentHistory() {
  return useQuery({
    queryKey: paymentKeys.history(),
    queryFn: async () => {
      const response = await authClient.get<PaymentHistory[]>('/payments/history');
      return response.data;
    },
  });
}

/**
 * 결제 내역 상세 조회
 */
export function useGetPaymentHistoryDetail(id: number) {
  return useQuery({
    queryKey: paymentKeys.historyDetail(id),
    queryFn: async () => {
      const response = await authClient.get<PaymentHistory>(`/payments/history/${id}`);
      return response.data;
    },
    enabled: id > 0,
  });
}

// ============================================
// 결제 프로세스
// ============================================

/**
 * 아임포트 스토어 코드 조회
 */
export function useGetStoreCode() {
  return useQuery({
    queryKey: paymentKeys.storeCode(),
    queryFn: async () => {
      const response = await authClient.get<StoreCodeResponse>('/payments/store-code');
      return response.data;
    },
    staleTime: Infinity, // 스토어 코드는 변경되지 않음
  });
}

/**
 * 결제 사전 등록
 */
export function usePreRegisterPayment() {
  return useMutation({
    mutationFn: async (data: PreRegisterRequest) => {
      const response = await authClient.post<PreRegisterResponse>('/payments/pre-register', data);
      return response.data;
    },
  });
}

/**
 * 결제 검증 및 완료
 */
export function useVerifyPayment() {
  const queryClient = useQueryClient();
  const { setActiveServices } = useAuthStore();

  return useMutation({
    mutationFn: async (data: VerifyPaymentRequest) => {
      const response = await authClient.post<VerifyPaymentResponse>('/payments/verify', data);
      return response.data;
    },
    onSuccess: (data) => {
      // 활성 서비스 업데이트
      setActiveServices(data.activeServices);
      // 결제 내역 캐시 무효화
      queryClient.invalidateQueries({ queryKey: paymentKeys.history() });
    },
  });
}

/**
 * 쿠폰 유효성 검증
 */
export function useValidateCoupon() {
  return useMutation({
    mutationFn: async (data: ValidateCouponRequest) => {
      const response = await authClient.post<ValidateCouponResponse>('/payments/coupon/valid', data);
      return response.data;
    },
  });
}

/**
 * 무료 결제 (100% 할인 쿠폰)
 */
export function useFreePayment() {
  const queryClient = useQueryClient();
  const { setActiveServices } = useAuthStore();

  return useMutation({
    mutationFn: async (data: FreePaymentRequest) => {
      const response = await authClient.post<{ activeServices: string[] }>('/payments/free', data);
      return response.data;
    },
    onSuccess: (data) => {
      setActiveServices(data.activeServices);
      queryClient.invalidateQueries({ queryKey: paymentKeys.history() });
    },
  });
}




