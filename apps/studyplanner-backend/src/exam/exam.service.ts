import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * 시험 성적 관리 서비스
 * 모의고사/내신 성적 입력, 조회, 추이 분석
 */
@Injectable()
export class ExamService {
    private readonly logger = new Logger(ExamService.name);

    constructor(private readonly prisma: PrismaService) { }

    /** 성적 입력 */
    async addScore(data: {
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
        const score = await (this.prisma as any).examScore.create({
            data: {
                studentId: BigInt(data.studentId),
                examType: data.examType,
                examName: data.examName,
                examDate: new Date(data.examDate),
                subject: data.subject,
                rawScore: data.rawScore,
                standardScore: data.standardScore,
                percentile: data.percentile,
                grade: data.grade,
                rank: data.rank,
                totalStudents: data.totalStudents,
                memo: data.memo,
            },
        });
        return this.serialize(score);
    }

    /** 성적 수정 */
    async updateScore(id: number, data: Partial<{
        rawScore: number;
        standardScore: number;
        percentile: number;
        grade: number;
        rank: number;
        totalStudents: number;
        memo: string;
    }>) {
        const score = await (this.prisma as any).examScore.update({
            where: { id: BigInt(id) },
            data,
        });
        return this.serialize(score);
    }

    /** 성적 삭제 */
    async deleteScore(id: number) {
        await (this.prisma as any).examScore.delete({
            where: { id: BigInt(id) },
        });
        return { success: true };
    }

    /** 전체 성적 목록 */
    async getScores(studentId: number, params?: {
        examType?: string;
        subject?: string;
        limit?: number;
    }) {
        const where: any = { studentId: BigInt(studentId) };
        if (params?.examType) where.examType = params.examType;
        if (params?.subject) where.subject = params.subject;

        const scores = await (this.prisma as any).examScore.findMany({
            where,
            orderBy: { examDate: 'desc' },
            take: params?.limit || 50,
        });
        return scores.map(this.serialize);
    }

    /** 과목별 성적 추이 (시계열) */
    async getSubjectTrend(studentId: number, subject: string) {
        const scores = await (this.prisma as any).examScore.findMany({
            where: {
                studentId: BigInt(studentId),
                subject,
            },
            orderBy: { examDate: 'asc' },
        });

        return {
            subject,
            dataPoints: scores.map((s: any) => ({
                id: Number(s.id),
                examName: s.examName,
                examDate: s.examDate,
                examType: s.examType,
                rawScore: s.rawScore ? Number(s.rawScore) : null,
                standardScore: s.standardScore ? Number(s.standardScore) : null,
                percentile: s.percentile ? Number(s.percentile) : null,
                grade: s.grade,
            })),
            summary: this.calculateTrendSummary(scores),
        };
    }

    /** 전체 과목 요약 (대시보드용) */
    async getScoreSummary(studentId: number) {
        const scores = await (this.prisma as any).examScore.findMany({
            where: { studentId: BigInt(studentId) },
            orderBy: { examDate: 'desc' },
        });

        // 과목별 그룹핑
        const subjectMap = new Map<string, any[]>();
        for (const s of scores) {
            const arr = subjectMap.get(s.subject) || [];
            arr.push(s);
            subjectMap.set(s.subject, arr);
        }

        const subjects = Array.from(subjectMap.entries()).map(([subject, items]) => {
            const latest = items[0];
            const previous = items.length > 1 ? items[1] : null;

            return {
                subject,
                latestGrade: latest.grade,
                latestPercentile: latest.percentile ? Number(latest.percentile) : null,
                latestExamName: latest.examName,
                latestDate: latest.examDate,
                change: previous && latest.grade && previous.grade
                    ? previous.grade - latest.grade // 양수 = 등급 상승
                    : null,
                totalExams: items.length,
            };
        });

        return {
            totalExams: scores.length,
            subjects,
        };
    }

    /** 학습량-성적 상관관계 데이터 */
    async getCorrelation(studentId: number, subject: string) {
        const scores = await (this.prisma as any).examScore.findMany({
            where: { studentId: BigInt(studentId), subject },
            orderBy: { examDate: 'asc' },
        });

        // 각 시험 전 2주간 학습시간 가져오기
        const correlationData = [];
        for (const score of scores) {
            const examDate = new Date(score.examDate);
            const twoWeeksBefore = new Date(examDate);
            twoWeeksBefore.setDate(twoWeeksBefore.getDate() - 14);

            const studyTime = await this.prisma.timerSession.aggregate({
                where: {
                    studentId: BigInt(studentId),
                    subject,
                    startedAt: { gte: twoWeeksBefore, lte: examDate },
                    isCompleted: true,
                },
                _sum: { durationMin: true },
            });

            correlationData.push({
                examName: score.examName,
                examDate: score.examDate,
                grade: score.grade,
                percentile: score.percentile ? Number(score.percentile) : null,
                studyMinBefore: (studyTime._sum as any)?.durationMin || 0,
            });
        }

        return { subject, data: correlationData };
    }

    private calculateTrendSummary(scores: any[]) {
        if (scores.length < 2) return { trend: 'insufficient_data', message: '데이터가 부족합니다.' };

        const grades = scores.filter((s: any) => s.grade != null).map((s: any) => s.grade);
        if (grades.length < 2) return { trend: 'insufficient_data', message: '등급 데이터가 부족합니다.' };

        const firstHalf = grades.slice(0, Math.ceil(grades.length / 2));
        const secondHalf = grades.slice(Math.ceil(grades.length / 2));
        const avgFirst = firstHalf.reduce((a: number, b: number) => a + b, 0) / firstHalf.length;
        const avgSecond = secondHalf.reduce((a: number, b: number) => a + b, 0) / secondHalf.length;
        const diff = avgFirst - avgSecond; // 양수 = 등급 하락(숫자가 올라감이 하락)

        if (diff > 0.5) return { trend: 'improving', message: '성적이 꾸준히 상승하고 있어요! 🔥' };
        if (diff < -0.5) return { trend: 'declining', message: '최근 성적이 하락 추세예요. 학습 전략을 점검해보세요.' };
        return { trend: 'stable', message: '안정적인 성적을 유지하고 있습니다.' };
    }

    private serialize(obj: any) {
        if (!obj) return null;
        const result: any = { ...obj };
        for (const key of Object.keys(result)) {
            if (typeof result[key] === 'bigint') result[key] = Number(result[key]);
            if (result[key]?.constructor?.name === 'Decimal') result[key] = Number(result[key]);
        }
        return result;
    }
}
