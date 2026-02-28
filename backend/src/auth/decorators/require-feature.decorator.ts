import { SetMetadata } from '@nestjs/common';

/**
 * Hub JWT 권한 체크 데코레이터
 * 특정 기능에 대한 권한이 필요한 엔드포인트에 사용
 *
 * @example
 * @RequireFeature('planner')
 * async getPlans() { ... }
 */
export const REQUIRED_FEATURE_KEY = 'requiredFeature';
export const RequireFeature = (feature: string) => SetMetadata(REQUIRED_FEATURE_KEY, feature);
