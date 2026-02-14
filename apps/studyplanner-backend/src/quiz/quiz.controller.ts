import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { QuizService } from './quiz.service';

@ApiTags('quiz')
@Controller('quiz')
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Post('generate')
  @ApiOperation({ summary: 'AI 퀴즈 생성' })
  async generateQuiz(
    @Body()
    body: {
      studentId: number;
      subject: string;
      topic: string;
      difficulty?: number;
      totalItems?: number;
    },
  ) {
    return this.quizService.generateQuiz(body);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: '퀴즈 제출 및 채점' })
  async submitQuiz(
    @Param('id') id: number,
    @Body()
    body: {
      studentId: number;
      answers: number[];
      timeTakenSec?: number;
    },
  ) {
    return this.quizService.submitQuiz(+id, body);
  }

  @Get('history')
  @ApiOperation({ summary: '퀴즈 히스토리 조회' })
  async getHistory(@Query('studentId') studentId: number, @Query('limit') limit?: number) {
    return this.quizService.getHistory(+studentId, limit ? +limit : 20);
  }

  @Get(':id')
  @ApiOperation({ summary: '퀴즈 상세 조회' })
  async getQuizDetail(@Param('id') id: number) {
    return this.quizService.getQuizDetail(+id);
  }

  @Get('stats/:studentId')
  @ApiOperation({ summary: '과목별 퀴즈 통계' })
  async getSubjectStats(@Param('studentId') studentId: number) {
    return this.quizService.getSubjectStats(+studentId);
  }
}
