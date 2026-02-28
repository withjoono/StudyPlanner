import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AppPermission, PermissionsPayload } from '../types/jwt-payload.type';

/**
 * Hub JWT 권한 처리를 위한 헬퍼 서비스
 */
@Injectable()
export class JwtHelperService {
  constructor(private readonly jwtService: JwtService) {}

  /**
   * JWT 토큰에서 앱별 권한 정보 추출
   * @param token JWT 토큰
   * @param appId 앱 ID (예: 'studyplanner')
   * @returns 앱 권한 정보 또는 undefined
   */
  getAppPermission(token: string, appId: string): AppPermission | undefined {
    try {
      const payload = this.jwtService.decode(token) as any;
      return payload?.permissions?.[appId];
    } catch {
      return undefined;
    }
  }

  /**
   * Hub JWT 토큰에서 모든 권한 정보 추출
   * @param token JWT 토큰
   * @returns 전체 권한 정보 또는 undefined
   */
  getAllPermissions(token: string): PermissionsPayload | undefined {
    try {
      const payload = this.jwtService.decode(token) as any;
      return payload?.permissions;
    } catch {
      return undefined;
    }
  }

  /**
   * JWT 토큰 검증
   * @param token JWT 토큰
   * @returns 유효 여부
   */
  verifyToken(token: string): boolean {
    try {
      this.jwtService.verify(token);
      return true;
    } catch {
      return false;
    }
  }
}
