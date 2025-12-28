/**
 * Axios 인스턴스 설정
 * GB-Front의 인스턴스 패턴 적용
 *
 * - publicClient: 인증 불필요 (로그인, 회원가입 등) - GB-Back-Nest
 * - authClient: 인증 필요 (회원 관련 API) - GB-Back-Nest
 * - plannerClient: 플래너 전용 API - gb-planner 백엔드
 */

import axios from 'axios';
import { camelizeKeys, decamelizeKeys } from 'humps';
import { env } from '@/lib/config/env';

/**
 * Public API Client (인증 불필요) - GB-Back-Nest
 * - 로그인, 회원가입, 공개 데이터 등
 */
export const publicClient = axios.create({
  baseURL: env.apiUrlMain,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

/**
 * Authenticated API Client (인증 필요) - GB-Back-Nest
 * - 회원 정보, 결제 등
 */
export const authClient = axios.create({
  baseURL: env.apiUrlMain,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

/**
 * Planner API Client - gb-planner 백엔드
 * - 플래너 전용 API (루틴, 계획, 미션 등)
 */
export const plannerClient = axios.create({
  baseURL: env.apiUrlPlanner,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

/**
 * 케이스 변환 인터셉터 설정 함수
 */
const setupCaseConversion = (client: typeof axios) => {
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

  // Response: snake_case → camelCase
  client.interceptors.response.use(
    (response) => {
      if (
        response.data &&
        typeof response.data === 'object' &&
        !(response.data instanceof Blob)
      ) {
        response.data = camelizeKeys(response.data);
      }
      return response;
    },
    (error) => {
      if (error.response?.data) {
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




