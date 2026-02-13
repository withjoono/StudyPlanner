import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { QuizService } from './quiz.service';

@ApiTags('quiz')
@Controller('quiz')
export class QuizController {
    constructor(private readonly quizService: QuizService) { }

    @Post('generate')
    @ApiOperation({ summary: 'AI 퀴즈 생성' })
    async generateQuiz(
        @Body() body: {
            studentId: number;
            subject: string;
            topic: string;
            difficulty?: number;
            itemCount?: number;
        },
    ) {
        return this.quizService.generateQuiz(body);
    }

    @Post('submit')
    @ApiOperation({ summary: '퀴즈 제출 & 채점' })
    async submitQuiz(
        @Body() body: {
            quizId: number;
            studentId: number;
            answers: number[];
            timeTakenSec?: number;
        },
    ) {
        return this.quizService.submitQuiz(body);
    }

    @Get('list')
    @ApiOperation({ summary: '퀴즈 목록 조회' })
    async getQuizzes(
        @Query('studentId') studentId: number,
        @Query('subject') subject?: string,
    ) {
        return this.quizService.getQuizzes(studentId, subject);
    }

    @Get('average')
    @ApiOperation({ summary: '과목별 퀴즈 평균 점수' })
    async getSubjectAverage(
        @Query('studentId') studentId: number,
        @Query('subject') subject: string,
    ) {
        const average = await this.quizService.getSubjectQuizAverage(studentId, subject);
        return { subject, average };
    }
}
