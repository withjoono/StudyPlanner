import { Controller, Get, UseGuards, Req, Post, Body } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  getProfile(@Req() req: Request) {
    return (req as any).user;
  }

  @Post('sso/exchange')
  async exchangeSsoCode(@Body() body: { code: string }) {
    return this.authService.verifySsoCode(body.code);
  }
}
