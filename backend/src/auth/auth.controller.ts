import { Controller, Get, UseGuards, Req, Post, Body } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * 현재 사용자 정보 조회
   * JWT sub (Hub auth_member.id, 예: "S26H208011") → sp_auth_member 자동 생성/조회
   * Hub에서 최신 닉네임을 가져와 로컬 DB와 동기화
   */
  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async getProfile(@Req() req: Request) {
    const payload = (req as any).user;
    const hubId = payload.sub; // Hub auth_member.id (예: "S26H208011")
    const spUserId = `sp_${hubId}`; // SP 내부 ID (예: "sp_S26H208011")

    // Hub에서 최신 닉네임 조회 (실패 시 null)
    const rawToken = (req.headers.authorization ?? '').split(' ')[1];
    const hubInfo = rawToken ? await this.authService.getHubUserInfo(rawToken) : null;
    const freshName = hubInfo
      ? (hubInfo.nickname as string) ||
        (hubInfo.userName as string) ||
        (hubInfo.name as string) ||
        null
      : null;

    // 역할: Hub 토큰의 role(jti 접두어 기반 파생 포함). 없으면 student.
    const role = payload.role || 'student';

    // sp_auth_member에서 조회 또는 자동 생성
    let user = await this.prisma.user.findUnique({ where: { id: spUserId } });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          id: spUserId,
          email: payload.email || `${hubId}@hub.local`,
          name: freshName || hubId,
          role,
          hubUserId: hubId,
        },
      });
    } else if ((freshName && freshName !== user.name) || user.role !== role) {
      // Hub 닉네임 변경 또는 역할 불일치 시 로컬 DB 동기화
      user = await this.prisma.user.update({
        where: { id: spUserId },
        data: { name: freshName || user.name, role },
      });
    }

    // Student 레코드도 자동 생성 (없으면)
    const existingStudent = await this.prisma.student.findUnique({
      where: { userId: spUserId },
    });
    if (!existingStudent) {
      await this.prisma.student.create({
        data: {
          studentCode: spUserId,
          userId: spUserId,
          year: new Date().getFullYear(),
          schoolLevel: 'high',
          name: user.name,
        },
      });
    }

    return {
      id: user.id, // "sp_S26H208011"
      email: user.email,
      userName: user.name,
      role: user.role,
      hubUserId: user.hubUserId,
      studentProfile: (hubInfo?.studentProfile as Record<string, unknown>) || null,
    };
  }

  @Post('sso/exchange')
  async exchangeSsoCode(@Body() body: { code: string }) {
    return this.authService.verifySsoCode(body.code);
  }
}
