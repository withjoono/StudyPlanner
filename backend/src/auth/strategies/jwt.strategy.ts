import { Strategy } from 'passport-jwt';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '../../config/config.type';
import { JwtPayloadType } from '../types/jwt-payload.type';
import { Request } from 'express';

/**
 * JWT 인증 전략 (HttpOnly Cookie 지원)
 * - Authorization 헤더의 Bearer 토큰을 우선 확인
 * - 헤더에 토큰이 없으면 쿠키에서 access_token 추출
 * - XSS 공격으로부터 JWT 토큰 보호
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService<AllConfigType>) {
    // Hub JWT는 base64로 인코딩된 시크릿을 Buffer.from(secret, 'base64')로 디코딩 후 HS512로 서명
    const secretBase64 = process.env.AUTH_SECRET || 'studyplanner-secret-key-change-in-production';
    const decodedSecret = Buffer.from(secretBase64, 'base64');
    super({
      jwtFromRequest: JwtStrategy.extractJwtFromRequestOrCookie,
      secretOrKey: decodedSecret,
      algorithms: ['HS512'], // Hub JWT는 HS512로 서명됨
    });
  }

  /**
   * 요청에서 JWT 토큰 추출 (헤더 또는 쿠키)
   * 1순위: Authorization 헤더 (Bearer 토큰)
   * 2순위: HttpOnly 쿠키 (access_token)
   */
  private static extractJwtFromRequestOrCookie(req: Request): string | null {
    // 1. Authorization 헤더에서 Bearer 토큰 추출
    const authHeader = req.headers?.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // 2. HttpOnly 쿠키에서 access_token 추출
    if (req.cookies?.access_token) {
      return req.cookies.access_token;
    }

    return null;
  }

  public validate(payload: JwtPayloadType): JwtPayloadType | never {
    if (!payload.jti) {
      throw new UnauthorizedException('Invalid token payload');
    }

    return payload;
  }
}
