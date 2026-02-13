import { Controller, Get, Post, Put, Delete, Body, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ExamService } from './exam.service';

@ApiTags('exam')
@Controller('exam')
export class ExamController {
    constructor(private readonly examService: ExamService) { }

    @Post()
    @ApiOperation({ summary: '성적 입력' })
    async addScore(@Body() body: {
        studentId: number;
        examType: 'mock' | 'school';
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
    }) {
        return this.examService.addScore(body);
    }

    @Put(':id')
    @ApiOperation({ summary: '성적 수정' })
    async updateScore(
        @Param('id') id: string,
        @Body() body: any,
    ) {
        return this.examService.updateScore(parseInt(id, 10), body);
    }

    @Delete(':id')
    @ApiOperation({ summary: '성적 삭제' })
    async deleteScore(@Param('id') id: string) {
        return this.examService.deleteScore(parseInt(id, 10));
    }

    @Get('list')
    @ApiOperation({ summary: '성적 목록' })
    async getScores(
        @Query('studentId') studentId: number,
        @Query('examType') examType?: string,
        @Query('subject') subject?: string,
    ) {
        return this.examService.getScores(studentId, { examType, subject });
    }

    @Get('trend')
    @ApiOperation({ summary: '과목별 성적 추이' })
    async getSubjectTrend(
        @Query('studentId') studentId: number,
        @Query('subject') subject: string,
    ) {
        return this.examService.getSubjectTrend(studentId, subject);
    }

    @Get('summary')
    @ApiOperation({ summary: '전체 성적 요약' })
    async getScoreSummary(@Query('studentId') studentId: number) {
        return this.examService.getScoreSummary(studentId);
    }

    @Get('correlation')
    @ApiOperation({ summary: '학습량-성적 상관관계' })
    async getCorrelation(
        @Query('studentId') studentId: number,
        @Query('subject') subject: string,
    ) {
        return this.examService.getCorrelation(studentId, subject);
    }
}
