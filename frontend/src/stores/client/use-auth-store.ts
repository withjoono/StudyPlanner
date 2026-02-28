/**
 * 인증 상태 관리 (Zustand)
 * 클라이언트 사이드 인증 상태
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Member } from '@/types/auth';
import { hasAccessToken, clearTokens } from '@/lib/api';

interface AuthState {
  // 상태
  user: Member | null;
  isAuthenticated: boolean;
  activeServices: string[];
  isInitialized: boolean;

  // 액션
  setUser: (user: Member | null) => void;
  setActiveServices: (services: string[]) => void;
  setInitialized: (initialized: boolean) => void;
  clearAuth: () => void;

  // 헬퍼
  hasService: (serviceName: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // 초기 상태
      user: null,
      isAuthenticated: false,
      activeServices: [],
      isInitialized: false,

      // 사용자 설정
      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
        }),

      // 활성 서비스 설정
      setActiveServices: (services) =>
        set({
          activeServices: services,
        }),

      // 초기화 완료 설정
      setInitialized: (initialized) =>
        set({
          isInitialized: initialized,
        }),

      // 인증 상태 초기화
      clearAuth: () => {
        clearTokens();
        set({
          user: null,
          isAuthenticated: false,
          activeServices: [],
        });
      },

      // 특정 서비스 보유 여부 확인
      hasService: (serviceName) => {
        const { activeServices } = get();
        return activeServices.includes(serviceName);
      },
    }),
    {
      name: 'gb-planner-auth',
      partialize: (state) => ({
        // 로컬스토리지에 저장할 상태만 선택
        user: state.user,
        activeServices: state.activeServices,
      }),
      onRehydrateStorage: () => (state) => {
        // 스토리지에서 복원 후 토큰 존재 여부로 인증 상태 결정
        if (state) {
          state.isAuthenticated = hasAccessToken() && !!state.user;
          state.isInitialized = true;
        }
      },
    },
  ),
);

/**
 * 인증 상태 선택자 (성능 최적화용)
 */
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useActiveServices = () => useAuthStore((state) => state.activeServices);
export const useHasService = (serviceName: string) =>
  useAuthStore((state) => state.activeServices.includes(serviceName));




