import { Injectable, UnauthorizedException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AllConfigType } from '../config/config.type';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly hubApiUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
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
          serviceId: 'planner', // Study Planner service identifier
        }),
      );

      const hubUser = response.data;
      const spUserId = `sp_${hubUser.id}`;

      // User Sync Logic
      let user = await this.prisma.user.findUnique({
        where: { id: spUserId },
      });

      if (!user) {
        // Create new user if not exists
        user = await this.prisma.user.create({
          data: {
            id: spUserId,
            email: hubUser.email,
            name: hubUser.name,
            role: hubUser.role as UserRole, // Ensure role matches enum
            hubUserId: String(hubUser.id),
            avatarUrl: hubUser.avatarUrl,
            phone: hubUser.phone,
          },
        });
      } else {
        // Optional: Update user info if needed
        // await this.prisma.user.update(...)
      }

      // Return user data with the new ID structure
      return {
        ...hubUser,
        id: spUserId, // Override ID with sp_ prefix
        originalId: hubUser.id,
      };
    } catch (error: any) {
      console.error('SSO Code Verification Failed:', error.response?.data || error.message);
      throw new UnauthorizedException('SSO 인증에 실패했습니다.');
    }
  }
}
