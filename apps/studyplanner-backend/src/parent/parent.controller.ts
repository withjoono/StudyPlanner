import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ParentService } from './parent.service';

@Controller('parent')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('parent')
export class ParentController {
  constructor(private readonly parentService: ParentService) {}

  @Get('children')
  async getChildren(@Req() req: any) {
    const userId = Number(req.user?.sub || 0);
    return this.parentService.getChildren(userId);
  }

  @Get('children/:studentId/dashboard')
  async getChildDashboard(@Req() req: any, @Param('studentId') studentId: string) {
    const userId = Number(req.user?.sub || 0);
    return this.parentService.getChildDashboard(userId, parseInt(studentId));
  }

  @Get('children/:studentId/missions')
  async getChildMissions(
    @Req() req: any,
    @Param('studentId') studentId: string,
    @Query('date') date?: string,
  ) {
    const userId = Number(req.user?.sub || 0);
    return this.parentService.getChildMissions(userId, parseInt(studentId), date);
  }

  @Get('children/:studentId/scores')
  async getChildScores(
    @Req() req: any,
    @Param('studentId') studentId: string,
    @Query('days') days?: string,
  ) {
    const userId = Number(req.user?.sub || 0);
    return this.parentService.getChildScores(userId, parseInt(studentId), days ? parseInt(days) : undefined);
  }

  @Get('children/:studentId/study-time')
  async getChildStudyTime(
    @Req() req: any,
    @Param('studentId') studentId: string,
    @Query('days') days?: string,
  ) {
    const userId = Number(req.user?.sub || 0);
    return this.parentService.getChildStudyTime(userId, parseInt(studentId), days ? parseInt(days) : undefined);
  }

  @Get('children/:studentId/photos')
  async getChildPhotos(
    @Req() req: any,
    @Param('studentId') studentId: string,
    @Query('limit') limit?: string,
  ) {
    const userId = Number(req.user?.sub || 0);
    return this.parentService.getChildPhotos(userId, parseInt(studentId), limit ? parseInt(limit) : undefined);
  }
}
