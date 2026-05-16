/**
 * Axios 인스턴스 설정
 * GB-Front의 인스턴스 패턴 적용
 *
 * - publicClient: 인증 불필요 (로그인, 회원가입 등) - Hub Backend (GB-Back-Nest)
 * - authClient: 인증 필요 (회원 관련 API) - Hub Backend (GB-Back-Nest)
 * - plannerClient: 플래너 전용 API - StudyPlanner 백엔드
 */

import axios, { type AxiosInstance } from 'axios';
import { camelizeKeys, decamelizeKeys } from 'humps';
import { env } from '@/lib/config/env';

/**
 * Public API Client (인증 불필요) - Hub Backend
 * - 로그인, 회원가입, 공개 데이터 등
 */
export const publicClient = axios.create({
  baseURL: env.apiUrlHub,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

/**
 * Authenticated API Client (인증 필요) - Hub Backend
 * - 회원 정보, 결제 등
 */
export const authClient = axios.create({
  baseURL: env.apiUrlHub,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

/**
 * Planner API Client - StudyPlanner 백엔드
 * - 플래너 전용 API (루틴, 계획, 미션 등)
 */
export const plannerClient = axios.create({
  baseURL: env.apiUrl,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

/**
 * 케이스 변환 인터셉터 설정 함수
 */
const setupCaseConversion = (client: AxiosInstance) => {
  // Request: camelCase → snake_case
  client.interceptors.request.use(
    (config) => {
      if (config.data) {
        config.data = decamelizeKeys(config.data);
      }
      if (config.params) {
        config.params = decamelizeKeys(config.params);
      }
      return config;
    },
    (error) => Promise.reject(error),
  );

  // Response: envelope 해제 + snake_case → camelCase
  client.interceptors.response.use(
    (response) => {
      // Hub 응답 envelope `{ success, data, message? }` 자동 해제
      const body = response.data as unknown;
      if (
        body &&
        typeof body === 'object' &&
        !Array.isArray(body) &&
        !(body instanceof Blob) &&
        typeof (body as { success?: unknown }).success === 'boolean' &&
        'data' in (body as Record<string, unknown>)
      ) {
        response.data = (body as { data: unknown }).data;
      }
      if (response.data && typeof response.data === 'object' && !(response.data instanceof Blob)) {
        response.data = camelizeKeys(response.data);
      }
      return response;
    },
    (error) => {
      if (error.response?.data) {
        // 에러 envelope도 동일하게 풀어줘 message/statusCode 접근 일관화
        const body = error.response.data as unknown;
        if (
          body &&
          typeof body === 'object' &&
          typeof (body as { success?: unknown }).success === 'boolean' &&
          'data' in (body as Record<string, unknown>)
        ) {
          error.response.data = (body as { data: unknown }).data ?? body;
        }
        error.response.data = camelizeKeys(error.response.data);
      }
      return Promise.reject(error);
    },
  );
};

// 모든 클라이언트에 케이스 변환 적용
setupCaseConversion(publicClient);
setupCaseConversion(authClient);
setupCaseConversion(plannerClient);
