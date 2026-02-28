import { Controller, Get, Post, Delete, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TeacherService } from './teacher.service';

@Controller('teacher')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('teacher')
export class TeacherController {
  constructor(private readonly teacherService: TeacherService) {}

  // ================================================================
  // Dashboard & Students
  // ================================================================

  @Get('dashboard')
  async getDashboard(@Req() req: any) {
    const userId = Number(req.user?.sub || 0);
    return this.teacherService.getDashboard(userId);
  }

  @Get('students')
  async getStudents(@Req() req: any) {
    const userId = Number(req.user?.sub || 0);
    return this.teacherService.getStudents(userId);
  }

  @Post('students')
  async addStudent(@Req() req: any, @Body() body: { studentCode: string }) {
    const userId = Number(req.user?.sub || 0);
    return this.teacherService.addStudent(userId, body.studentCode);
  }

  @Delete('students/:studentId')
  async removeStudent(@Req() req: any, @Param('studentId') studentId: string) {
    const userId = Number(req.user?.sub || 0);
    return this.teacherService.removeStudent(userId, parseInt(studentId));
  }

  @Get('students/:studentId')
  async getStudentDetail(@Req() req: any, @Param('studentId') studentId: string) {
    const userId = Number(req.user?.sub || 0);
    return this.teacherService.getStudentDetail(userId, parseInt(studentId));
  }

  // ================================================================
  // Subjects (교과/과목)
  // ================================================================

  /** 사용 가능한 교과/과목 목록 (사용자 ID 기반 교육과정) */
  @Get('subjects')
  async getAvailableSubjects(@Query('userId') userId: string) {
    return this.teacherService.getAvailableSubjects(userId);
  }

  /** 학생 관리 과목 추가 */
  @Post('links/:teacherStudentId/subjects')
  async addStudentSubject(
    @Param('teacherStudentId') teacherStudentId: string,
    @Body()
    body: {
      kyokwa?: string;
      kyokwaCode?: string;
      subjectName?: string;
      subjectId?: string;
      allSubjects?: boolean;
      curriculum: string;
      startDate: string;
      endDate?: string;
    },
  ) {
    return this.teacherService.addStudentSubject(parseInt(teacherStudentId), body);
  }

  /** 학생 관리 과목 목록 */
  @Get('links/:teacherStudentId/subjects')
  async getStudentSubjects(@Param('teacherStudentId') teacherStudentId: string) {
    return this.teacherService.getStudentSubjects(parseInt(teacherStudentId));
  }

  /** 관리 과목 제거 */
  @Delete('subjects/:subjectId')
  async removeStudentSubject(@Param('subjectId') subjectId: string) {
    return this.teacherService.removeStudentSubject(parseInt(subjectId));
  }

  // ================================================================
  // Comments (코멘트)
  // ================================================================

  /** 코멘트 목록 */
  @Get('links/:teacherStudentId/comments')
  async getComments(
    @Param('teacherStudentId') teacherStudentId: string,
    @Query('limit') limit?: string,
  ) {
    return this.teacherService.getComments(
      parseInt(teacherStudentId),
      limit ? parseInt(limit) : undefined,
    );
  }

  /** 코멘트 작성 */
  @Post('links/:teacherStudentId/comments')
  async addComment(
    @Req() req: any,
    @Param('teacherStudentId') teacherStudentId: string,
    @Body() body: { content: string },
  ) {
    const authorId = req.user?.sub ? `sp_${req.user.sub}` : '';
    return this.teacherService.addComment(parseInt(teacherStudentId), authorId, body.content);
  }

  /** 코멘트 읽음 처리 */
  @Post('links/:teacherStudentId/comments/read')
  async markCommentsRead(@Req() req: any, @Param('teacherStudentId') teacherStudentId: string) {
    const readerId = req.user?.sub ? `sp_${req.user.sub}` : '';
    return this.teacherService.markCommentsRead(parseInt(teacherStudentId), readerId);
  }

  // ================================================================
  // Missions & Photos (기존)
  // ================================================================

  @Get('students/:studentId/missions')
  async getStudentMissions(
    @Req() req: any,
    @Param('studentId') studentId: string,
    @Query('date') date?: string,
  ) {
    const userId = Number(req.user?.sub || 0);
    return this.teacherService.getStudentMissions(userId, parseInt(studentId), date);
  }

  @Post('students/:studentId/missions')
  async createMission(
    @Req() req: any,
    @Param('studentId') studentId: string,
    @Body()
    body: {
      date: string;
      subject?: string;
      content?: string;
      startTime?: string;
      endTime?: string;
      amount?: number;
    },
  ) {
    const userId = Number(req.user?.sub || 0);
    return this.teacherService.createMission(userId, parseInt(studentId), body);
  }

  @Get('students/:studentId/photos')
  async getStudentPhotos(
    @Req() req: any,
    @Param('studentId') studentId: string,
    @Query('limit') limit?: string,
  ) {
    const userId = Number(req.user?.sub || 0);
    return this.teacherService.getStudentPhotos(
      userId,
      parseInt(studentId),
      limit ? parseInt(limit) : undefined,
    );
  }
}
