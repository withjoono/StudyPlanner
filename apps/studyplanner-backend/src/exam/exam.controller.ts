import { Controller, Get, Post, Put, Delete, Param, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ExamService } from './exam.service';

@ApiTags('exam')
@Controller('exam')
export class ExamController {
  constructor(private readonly examService: ExamService) {}

  @Post()
  @ApiOperation({ summary: '시험 성적 등록' })
  async createExamScore(
    @Body()
    body: {
      studentId: number;
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
    return this.examService.createExamScore(body);
  }

  @Get(':studentId')
  @ApiOperation({ summary: '시험 성적 조회' })
  async getExamScores(
    @Param('studentId') studentId: number,
    @Query('examType') examType?: string,
    @Query('subject') subject?: string,
    @Query('limit') limit?: number,
  ) {
    return this.examService.getExamScores(+studentId, {
      examType,
      subject,
      limit: limit ? +limit : undefined,
    });
  }

  @Get(':studentId/trends')
  @ApiOperation({ summary: '과목별 성적 추이' })
  async getTrends(@Param('studentId') studentId: number, @Query('subject') subject?: string) {
    return this.examService.getTrends(+studentId, subject);
  }

  @Put(':id')
  @ApiOperation({ summary: '시험 성적 수정' })
  async updateExamScore(@Param('id') id: number, @Body() body: any) {
    return this.examService.updateExamScore(+id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: '시험 성적 삭제' })
  async deleteExamScore(@Param('id') id: number) {
    return this.examService.deleteExamScore(+id);
  }
}
