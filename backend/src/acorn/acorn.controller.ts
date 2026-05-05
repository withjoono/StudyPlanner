import { Controller, Get, Post, Body, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AcornService } from './acorn.service';

@ApiTags('acorn')
@Controller('acorn')
export class AcornController {
  constructor(private readonly acornService: AcornService) {}

  @Get('balance')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '도토리 잔액 및 최근 거래내역 조회' })
  async getBalance(@Req() req: any) {
    const userId = req.user?.sub || req.user?.userId;
    return this.acornService.getBalance(String(userId));
  }

  @Post('earn')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '도토리 획득 (행동 보상)' })
  async earn(@Req() req: any, @Body() body: { type: string; referenceId?: string }) {
    const userId = req.user?.sub || req.user?.userId;
    return this.acornService.earn(String(userId), body.type, body.referenceId);
  }

  @Post('spend')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '도토리 사용 (기능 해금)' })
  async spend(
    @Req() req: any,
    @Body() body: { amount: number; type: string; description?: string },
  ) {
    const userId = req.user?.sub || req.user?.userId;
    return this.acornService.spend(String(userId), body.amount, body.type, body.description);
  }
}
