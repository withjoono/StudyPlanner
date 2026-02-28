import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { JwtHelperService } from '../services/jwt-helper.service';
import { REQUIRED_FEATURE_KEY } from '../decorators/require-feature.decorator';
import { AppPermission } from '../types/jwt-payload.type';

/**
 * Hub JWT 권한 체크 가드
 * JWT 토큰의 permissions 필드에서 앱별 권한을 확인
 *
 * 사용법:
 * 1. 컨트롤러 메서드에 @RequireFeature('planner') 데코레이터 추가
 * 2. APP_GUARD로 등록하면 전역적으로 작동
 */
@Injectable()
export class HubPermissionGuard implements CanActivate {
  private readonly APP_ID = 'studyplanner'; // StudyPlanner 앱 ID

  constructor(
    private reflector: Reflector,
    private jwtHelperService: JwtHelperService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    // @RequireFeature() 데코레이터가 있는지 확인
    const requiredFeature = this.reflector.getAllAndOverride<string>(REQUIRED_FEATURE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 데코레이터가 없으면 권한 체크 생략
    if (!requiredFeature) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);

    if (!token) {
      throw new ForbiddenException('권한이 없습니다. 로그인이 필요합니다.');
    }

    try {
      const permission = this.jwtHelperService.getAppPermission(token, this.APP_ID);

      if (!permission) {
        throw new ForbiddenException(`${this.APP_ID} 앱에 대한 권한이 없습니다.`);
      }

      // 만료일 체크
      if (this.isExpired(permission)) {
        throw new ForbiddenException('구독이 만료되었습니다.');
      }

      // 기능 권한 체크
      if (!this.hasFeature(permission, requiredFeature)) {
        throw new ForbiddenException(`'${requiredFeature}' 기능을 사용할 권한이 없습니다.`);
      }

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new ForbiddenException('권한 확인에 실패했습니다.');
    }
  }

  /**
   * Authorization 헤더 또는 쿠키에서 토큰 추출
   */
  private extractToken(request: Request): string | undefined {
    const authHeader = request.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    return request.cookies?.access_token;
  }

  /**
   * 구독 만료 여부 확인
   */
  private isExpired(permission: AppPermission): boolean {
    if (!permission.expires) {
      return false; // 만료일이 없으면 무제한
    }
    return new Date(permission.expires) < new Date();
  }

  /**
   * 특정 기능에 대한 권한 확인
   */
  private hasFeature(permission: AppPermission, feature: string): boolean {
    if (permission.plan === 'none') {
      return false;
    }
    if (!permission.features) {
      return true; // features가 없으면 플랜에 따라 모든 기능 허용
    }
    return permission.features.includes(feature);
  }
}
