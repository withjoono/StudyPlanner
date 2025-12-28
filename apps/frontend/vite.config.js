import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { TanStackRouterVite } from '@tanstack/router-vite-plugin';
import path from 'path';
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react(), TanStackRouterVite()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        port: 3001,
        host: true,
        proxy: {
            // gb-planner 백엔드 (플래너 전용 API)
            '/api': {
                target: 'http://localhost:4000',
                changeOrigin: true,
                rewrite: function (path) { return path.replace(/^\/api/, ''); },
            },
            // GB-Back-Nest (인증, 결제, 회원 관리)
            '/api-main': {
                target: 'http://localhost:4001',
                changeOrigin: true,
                rewrite: function (path) { return path.replace(/^\/api-main/, ''); },
            },
        },
    },
});
