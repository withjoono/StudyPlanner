/**
 * 인터셉터 설정
 * authClient, plannerClient에 모든 인터셉터 적용
 */

import { authClient, plannerClient } from '../instances';
import { authRequestInterceptor, authRequestErrorInterceptor } from './request';
import { authResponseInterceptor } from './response';
import { authResponseErrorInterceptor } from './token-refresh';

/**
 * 인증 클라이언트에 인터셉터 설정
 * 애플리케이션 시작 시 한 번만 호출
 */
export const setupInterceptors = () => {
  // authClient 인터셉터 설정
  authClient.interceptors.request.use(authRequestInterceptor, authRequestErrorInterceptor);
  authClient.interceptors.response.use(authResponseInterceptor, authResponseErrorInterceptor);

  // plannerClient 인터셉터 설정 (동일한 인증 토큰 사용)
  plannerClient.interceptors.request.use(authRequestInterceptor, authRequestErrorInterceptor);
  plannerClient.interceptors.response.use(authResponseInterceptor, authResponseErrorInterceptor);
};




