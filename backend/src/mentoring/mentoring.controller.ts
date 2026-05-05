import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { MentoringService } from './mentoring.service';
import { CreateSessionDto } from './dto/create-session.dto';

@Controller('mentoring')
@UseGuards(JwtAuthGuard)
export class MentoringController {
  constructor(private readonly svc: MentoringService) {}

  /** 선생님: 학생 주간 검사 요약 자동 생성 */
  @Get('inspection/:studentId')
  getInspection(
    @Request() req: any,
    @Param('studentId', ParseIntPipe) studentId: number,
    @Query('week') week?: string,
  ) {
    return this.svc.getInspectionSummary(String(req.user.id), studentId, week);
  }

  /** 선생님: 멘토링 대시보드 (일괄 검사 현황) */
  @Get('dashboard')
  getDashboard(@Request() req: any, @Query('week') week?: string) {
    return this.svc.getTeacherDashboard(String(req.user.id), week);
  }

  /** 공통: 멘토링 이력 조회 */
  @Get('sessions')
  getSessions(
    @Request() req: any,
    @Query('role') role: 'teacher' | 'student' = 'student',
    @Query('studentId') studentId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.svc.getSessions(
      String(req.user.id),
      role,
      studentId ? Number(studentId) : undefined,
      limit ? Number(limit) : 12,
    );
  }

  /** 선생님: 멘토링 피드백 저장 (create or update) */
  @Post('sessions/:studentId')
  saveSession(
    @Request() req: any,
    @Param('studentId', ParseIntPipe) studentId: number,
    @Body() dto: CreateSessionDto,
  ) {
    return this.svc.createOrUpdateSession(String(req.user.id), studentId, dto);
  }

  /** 학생: 미확인 피드백 수 */
  @Get('unread')
  getUnread(@Request() req: any) {
    return this.svc.getUnreadCount(String(req.user.id));
  }

  /** 학생: 피드백 확인(Ack) */
  @Patch('sessions/:id/ack')
  ackSession(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.svc.ackSession(String(req.user.id), id);
  }
}
