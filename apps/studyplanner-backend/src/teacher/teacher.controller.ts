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
  async addStudent(
    @Req() req: any,
    @Body() body: { studentCode: string; subject?: string },
  ) {
    const userId = Number(req.user?.sub || 0);
    return this.teacherService.addStudent(userId, body.studentCode, body.subject);
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
    @Body() body: {
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
    return this.teacherService.getStudentPhotos(userId, parseInt(studentId), limit ? parseInt(limit) : undefined);
  }

  @Post('students/:studentId/exam-scores')
  async addExamScore(
    @Req() req: any,
    @Param('studentId') studentId: string,
    @Body() body: {
      examType: string;
      examName: string;
      examDate: string;
      subject: string;
      rawScore?: number;
      standardScore?: number;
      percentile?: number;
      grade?: number;
      rank?: number;
      totalStudents?: number;
      memo?: string;
    },
  ) {
    const userId = Number(req.user?.sub || 0);
    return this.teacherService.addExamScore(userId, parseInt(studentId), body);
  }
}
