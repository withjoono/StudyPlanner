/**
 * SSO Handler 컴포넌트
 * 앱 시작 시 SSO 토큰을 처리하고 자동 로그인 수행
 */

import { useEffect, useState } from 'react';
import { processSSOTokens } from '@/lib/auth/sso-receiver';

interface SSOHandlerProps {
  children: React.ReactNode;
}

export function SSOHandler({ children }: SSOHandlerProps) {
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    processSSOTokens().finally(() => setIsProcessing(false));
  }, []);

  if (isProcessing) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
