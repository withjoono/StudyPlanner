import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * 모의고사/내신 성적 추적 서비스
 * Phase 3: 성적 입력, 조회, 추이 분석
 */
@Injectable()
export class ExamService {
  private readonly logger = new Logger(ExamService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 시험 성적 등록
   */
  async createExamScore(data: {
    studentId: number;
    examType: string; // mock | school
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
    const examScore = await this.prisma.examScore.create({
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

    this.logger.log(
      `ExamScore created: student=${data.studentId}, exam=${data.examName}, subject=${data.subject}`,
    );

    return this.serialize(examScore);
  }

  /**
   * 학생의 시험 성적 조회
   */
  async getExamScores(
    studentId: number,
    filters?: {
      examType?: string;
      subject?: string;
      limit?: number;
    },
  ) {
    const where: any = { studentId: BigInt(studentId) };
    if (filters?.examType) where.examType = filters.examType;
    if (filters?.subject) where.subject = filters.subject;

    const scores = await this.prisma.examScore.findMany({
      where,
      orderBy: { examDate: 'desc' },
      take: filters?.limit || 50,
    });

    return scores.map(this.serialize.bind(this));
  }

  /**
   * 시험 성적 수정
   */
  async updateExamScore(
    id: number,
    data: Partial<{
      rawScore: number;
      standardScore: number;
      percentile: number;
      grade: number;
      rank: number;
      totalStudents: number;
      memo: string;
    }>,
  ) {
    const updated = await this.prisma.examScore.update({
      where: { id: BigInt(id) },
      data,
    });
    return this.serialize(updated);
  }

  /**
   * 시험 성적 삭제
   */
  async deleteExamScore(id: number) {
    await this.prisma.examScore.delete({
      where: { id: BigInt(id) },
    });
    return { success: true };
  }

  /**
   * 과목별 성적 추이
   */
  async getTrends(studentId: number, subject?: string) {
    const where: any = { studentId: BigInt(studentId) };
    if (subject) where.subject = subject;

    const scores = await this.prisma.examScore.findMany({
      where,
      orderBy: { examDate: 'asc' },
    });

    // 과목별 그룹화
    const trends: Record<
      string,
      Array<{
        examName: string;
        examDate: string;
        examType: string;
        rawScore: number | null;
        grade: number | null;
        percentile: number | null;
      }>
    > = {};

    for (const score of scores) {
      const subj = score.subject;
      if (!trends[subj]) trends[subj] = [];
      trends[subj].push({
        examName: score.examName,
        examDate: score.examDate.toISOString().split('T')[0],
        examType: score.examType,
        rawScore: score.rawScore ? Number(score.rawScore) : null,
        grade: score.grade,
        percentile: score.percentile ? Number(score.percentile) : null,
      });
    }

    return trends;
  }

  private serialize(obj: any) {
    if (!obj) return null;
    const result: any = { ...obj };
    for (const key of Object.keys(result)) {
      if (typeof result[key] === 'bigint') {
        result[key] = Number(result[key]);
      } else if (
        result[key] !== null &&
        typeof result[key] === 'object' &&
        typeof result[key].toNumber === 'function'
      ) {
        result[key] = result[key].toNumber();
      }
    }
    return result;
  }
}
