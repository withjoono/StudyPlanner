/**
 * Request 인터셉터
 * GB-Front의 패턴 적용
 */

import { InternalAxiosRequestConfig } from 'axios';
import { getAccessToken } from '../token-manager';

/**
 * 인증 Request 인터셉터
 * - Authorization 헤더에 Bearer 토큰 추가
 */
export const authRequestInterceptor = (
  config: InternalAxiosRequestConfig,
): InternalAxiosRequestConfig => {
  // Access Token 추가
  const accessToken = getAccessToken();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
};

/**
 * Request 인터셉터 에러 핸들러
 */
export const authRequestErrorInterceptor = (error: unknown) => {
  return Promise.reject(error);
};




