import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { routeTree } from './routeTree.gen';
import { setupInterceptors } from './lib/api';
import { SSOHandler } from './components/auth';
import './index.css';

// API 인터셉터 설정 (앱 시작 시 한 번만)
setupInterceptors();

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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <SSOHandler>
        <RouterProvider router={router} />
      </SSOHandler>
    </QueryClientProvider>
  </React.StrictMode>,
);
