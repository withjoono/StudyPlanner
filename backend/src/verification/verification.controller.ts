import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { VerificationService } from './verification.service';

@ApiTags('verification')
@Controller('verification')
export class VerificationController {
    constructor(private readonly verificationService: VerificationService) { }

    @Post('upload')
    @ApiOperation({ summary: '사진 인증 업로드' })
    async submitVerification(
        @Body() body: {
            studentId: number;
            missionId: number;
            photoUrl: string;
            reportedPages: number;
        },
    ) {
        return this.verificationService.submitVerification(body);
    }

    @Get('history')
    @ApiOperation({ summary: '인증 이력 조회' })
    async getVerifications(@Query('missionId') missionId: number) {
        return this.verificationService.getVerifications(missionId);
    }

    @Get('stats')
    @ApiOperation({ summary: '인증 통계' })
    async getVerificationStats(@Query('studentId') studentId: number) {
        return this.verificationService.getVerificationStats(studentId);
    }
}
