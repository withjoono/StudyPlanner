import { Injectable, UnauthorizedException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AuthService {
  private readonly hubApiUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    // Hub Backend URL (defaults to localhost:4000 if not set)
    this.hubApiUrl = this.configService.get('HUB_API_URL') || 'http://localhost:4000';
  }

  /**
   * SSO 코드 검증 및 토큰 발급
   * Hub Backend에 SSO 코드를 보내 토큰을 받아옵니다.
   */
  async verifySsoCode(code: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.hubApiUrl}/auth/sso/verify-code`, {
          code,
          serviceId: 'studyplanner',
        }),
      );

      const result = response.data;
      const data = result.data || result;

      if (data.accessToken) {
        return {
          success: true,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        };
      }

      throw new UnauthorizedException('Invalid SSO response');
    } catch (error: any) {
      console.error('SSO Code Verification Failed:', error.response?.data || error.message);
      throw new UnauthorizedException('SSO 인증에 실패했습니다.');
    }
  }
}
