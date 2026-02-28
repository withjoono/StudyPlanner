import { Controller, Get, Patch, Body, Param, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { StudentService } from './student.service';

@Controller('student')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('student')
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  /**
   * 연결된 사용자(선생님, 학부모, 학생) 목록 조회
   */
  @Get('connections')
  async getConnections(@Req() req: any) {
    const userId = Number(req.user?.sub || 0);
    return this.studentService.getConnections(userId);
  }

  /**
   * 선생님 권한 설정 (과목별)
   */
  @Patch('connections/teacher/:teacherId/permissions')
  async updateTeacherPermissions(
    @Req() req: any,
    @Param('teacherId') teacherId: string,
    @Body() body: { permissions: { kyokwa: string; allowed: boolean; subjectId?: string }[] },
  ) {
    const userId = Number(req.user?.sub || 0);
    return this.studentService.updateTeacherPermissions(userId, teacherId, body.permissions);
  }
}
