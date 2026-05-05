import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { routeTree } from './routeTree.gen';
import { setupInterceptors } from './lib/api';
import { initKakaoSDK } from './lib/share';
import './styles/design-system/index.css';
import './index.css';

// API 인터셉터 설정 (앱 시작 시 한 번만)
setupInterceptors();

// 카카오톡 SDK 초기화 (VITE_KAKAO_APP_KEY 설정 시 활성화)
const kakaoAppKey = import.meta.env.VITE_KAKAO_APP_KEY;
if (kakaoAppKey) {
  initKakaoSDK(kakaoAppKey).catch((err) => {
    console.warn('Kakao SDK init failed:', err);
  });
}

// Create a new router instance
const router = createRouter({ routeTree });

// Create a new query client instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5분
      refetchOnWindowFocus: false,
    },
  },
});

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

// PWA 서비스 워커 업데이트 감지
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      // 새 버전 배포 후 SW가 교체되면 자동 새로고침
      window.location.reload();
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>,
);
