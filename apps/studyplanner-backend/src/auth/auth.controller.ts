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
   */
  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async getProfile(@Req() req: Request) {
    const payload = (req as any).user;
    const hubId = payload.sub; // Hub auth_member.id (예: "S26H208011")
    const spUserId = `sp_${hubId}`; // SP 내부 ID (예: "sp_S26H208011")

    // sp_auth_member에서 조회 또는 자동 생성
    let user = await this.prisma.user.findUnique({ where: { id: spUserId } });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          id: spUserId,
          email: payload.email || `${hubId}@hub.local`,
          name: hubId,
          role: 'student',
          hubUserId: hubId,
        },
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
    };
  }

  @Post('sso/exchange')
  async exchangeSsoCode(@Body() body: { code: string }) {
    return this.authService.verifySsoCode(body.code);
  }
}
