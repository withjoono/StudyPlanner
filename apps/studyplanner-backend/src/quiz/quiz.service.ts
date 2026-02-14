import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * AI 퀴즈 서비스
 * Phase 2: LLM 기반 퀴즈 생성 및 채점
 * 현재는 LLM stub으로 동작, 추후 실제 LLM API 연동
 */
@Injectable()
export class QuizService {
  private readonly logger = new Logger(QuizService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 퀴즈 생성 (LLM stub → 추후 실제 API 연동)
   */
  async generateQuiz(data: {
    studentId: number;
    subject: string;
    topic: string;
    difficulty?: number;
    totalItems?: number;
  }) {
    const difficulty = data.difficulty || 3;
    const totalItems = data.totalItems || 5;

    // LLM 기반 퀴즈 생성 stub
    const questions = this.generateStubQuestions(data.subject, data.topic, totalItems, difficulty);

    const quiz = await this.prisma.quiz.create({
      data: {
        studentId: BigInt(data.studentId),
        subject: data.subject,
        topic: data.topic,
        difficulty,
        totalItems,
        questions,
        generatedBy: 'ai',
      },
    });

    this.logger.log(
      `Quiz generated: student=${data.studentId}, subject=${data.subject}, topic=${data.topic}, items=${totalItems}`,
    );

    return this.serialize(quiz);
  }

  /**
   * 퀴즈 제출 및 채점
   */
  async submitQuiz(
    quizId: number,
    data: {
      studentId: number;
      answers: number[];
      timeTakenSec?: number;
    },
  ) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: BigInt(quizId) },
    });

    if (!quiz) throw new Error('Quiz not found');

    const questions = quiz.questions as any[];
    let correctCount = 0;

    for (let i = 0; i < questions.length; i++) {
      if (data.answers[i] === questions[i].answer) {
        correctCount++;
      }
    }

    const totalCount = questions.length;
    const scoreRate = totalCount > 0 ? correctCount / totalCount : 0;

    const result = await this.prisma.quizResult.create({
      data: {
        quizId: BigInt(quizId),
        studentId: BigInt(data.studentId),
        answers: data.answers,
        correctCount,
        totalCount,
        scoreRate,
        timeTakenSec: data.timeTakenSec,
      },
    });

    this.logger.log(
      `Quiz submitted: quiz=${quizId}, correct=${correctCount}/${totalCount}, rate=${(scoreRate * 100).toFixed(0)}%`,
    );

    return this.serialize({
      ...result,
      scoreRate: Number(scoreRate),
      questions: questions.map((q, i) => ({
        ...q,
        userAnswer: data.answers[i],
        isCorrect: data.answers[i] === q.answer,
      })),
    });
  }

  /**
   * 퀴즈 히스토리 조회
   */
  async getHistory(studentId: number, limit: number = 20) {
    const results = await this.prisma.quizResult.findMany({
      where: { studentId: BigInt(studentId) },
      include: {
        quiz: {
          select: {
            subject: true,
            topic: true,
            difficulty: true,
            totalItems: true,
          },
        },
      },
      orderBy: { completedAt: 'desc' },
      take: limit,
    });

    return results.map(this.serialize);
  }

  /**
   * 특정 퀴즈 상세 조회
   */
  async getQuizDetail(quizId: number) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: BigInt(quizId) },
      include: { results: true },
    });

    if (!quiz) return null;
    return this.serialize(quiz);
  }

  /**
   * 과목별 퀴즈 통계
   */
  async getSubjectStats(studentId: number) {
    const results = await this.prisma.quizResult.findMany({
      where: { studentId: BigInt(studentId) },
      include: {
        quiz: { select: { subject: true } },
      },
    });

    const statsBySubject: Record<
      string,
      {
        totalQuizzes: number;
        avgScoreRate: number;
        totalCorrect: number;
        totalQuestions: number;
      }
    > = {};

    for (const r of results) {
      const subject = r.quiz.subject;
      if (!statsBySubject[subject]) {
        statsBySubject[subject] = {
          totalQuizzes: 0,
          avgScoreRate: 0,
          totalCorrect: 0,
          totalQuestions: 0,
        };
      }
      statsBySubject[subject].totalQuizzes++;
      statsBySubject[subject].totalCorrect += r.correctCount;
      statsBySubject[subject].totalQuestions += r.totalCount;
    }

    for (const subject of Object.keys(statsBySubject)) {
      const s = statsBySubject[subject];
      s.avgScoreRate = s.totalQuestions > 0 ? s.totalCorrect / s.totalQuestions : 0;
    }

    return statsBySubject;
  }

  /**
   * LLM 퀴즈 생성 Stub (추후 실제 LLM API로 교체)
   */
  private generateStubQuestions(subject: string, topic: string, count: number, difficulty: number) {
    const questions = [];
    for (let i = 0; i < count; i++) {
      questions.push({
        question: `[${subject}] ${topic} 관련 문제 ${i + 1} (난이도 ${difficulty})`,
        choices: [`선택지 A`, `선택지 B`, `선택지 C`, `선택지 D`],
        answer: Math.floor(Math.random() * 4), // 0~3
        explanation: `${topic} 에 대한 해설입니다. 정답은 위의 선택지입니다.`,
      });
    }
    return questions;
  }

  private serialize(obj: any): any {
    if (!obj) return null;
    if (Array.isArray(obj)) return obj.map((item) => this.serialize(item));
    if (typeof obj !== 'object') return obj;

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
      } else if (result[key] instanceof Date) {
        // keep as-is
      } else if (
        typeof result[key] === 'object' &&
        result[key] !== null &&
        !Array.isArray(result[key])
      ) {
        result[key] = this.serialize(result[key]);
      }
    }
    return result;
  }
}
