/**
 * 로그인 가드 훅
 *
 * 비로그인 상태에서 액션을 시도하면 로그인 모달을 표시합니다.
 *
 * 사용법:
 *   const { guard, LoginGuardModal } = useLoginGuard();
 *   <Button onClick={() => guard(() => doSomething())}>액션</Button>
 *   {LoginGuardModal}
 */

import { useState, useCallback, useMemo } from 'react';
import { useAuthStore } from '@/stores/client/use-auth-store';
import { LoginRequiredModal } from '@/components/auth/LoginRequiredModal';

export function useLoginGuard() {
  const { isAuthenticated } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const guard = useCallback(
    (callback: () => void) => {
      if (isAuthenticated) {
        callback();
      } else {
        setIsModalOpen(true);
      }
    },
    [isAuthenticated],
  );

  const LoginGuardModal = useMemo(
    () => <LoginRequiredModal open={isModalOpen} onOpenChange={setIsModalOpen} />,
    [isModalOpen],
  );

  return { guard, LoginGuardModal, isAuthenticated };
}
