/**
 * Response 인터셉터
 */

import { AxiosResponse } from 'axios';

/**
 * 성공 Response 인터셉터
 */
export const authResponseInterceptor = (response: AxiosResponse) => {
  return response;
};




