import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SharedScheduleService } from './shared-schedule.service';

@Controller('shared-schedule')
export class SharedScheduleController {
  constructor(private readonly sharedScheduleService: SharedScheduleService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async getMySchedule(@Req() req: any, @Query('start') start: string, @Query('end') end: string) {
    const hubUserId = req.user.hubUserId || req.user.sub;
    return this.sharedScheduleService.getMySchedule(hubUserId, start, end);
  }
}
