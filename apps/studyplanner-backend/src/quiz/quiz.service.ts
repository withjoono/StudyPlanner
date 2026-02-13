import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface QuizQuestion {
    question: string;
    choices: string[];
    answer: number; // 0-based index
    explanation: string;
}

/**
 * AI 퀴즈 생성 & 관리 서비스
 * Phase 2: LLM API 연동 시 generateQuiz를 교체
 */
@Injectable()
export class QuizService {
    private readonly logger = new Logger(QuizService.name);

    constructor(private readonly prisma: PrismaService) { }

    /** 퀴즈 생성 (현재: 템플릿 기반 / 향후: LLM API) */
    async generateQuiz(data: {
        studentId: number;
        subject: string;
        topic: string;
        difficulty?: number;
        itemCount?: number;
    }) {
        const difficulty = data.difficulty || 3;
        const itemCount = data.itemCount || 5;

        // TODO: LLM API 연동 (Gemini / GPT)
        // const prompt = `${data.subject} 과목의 "${data.topic}" 단원에 대해
        //   난이도 ${difficulty}/5 수준의 ${itemCount}문항을 생성해주세요.
        //   JSON 형식: [{question, choices: [4개], answer: 정답인덱스, explanation}]`;
        // const response = await this.llmService.generate(prompt);

        const questions = this.generateTemplateQuestions(
            data.subject, data.topic, difficulty, itemCount,
        );

        const quiz = await (this.prisma as any).quiz.create({
            data: {
                studentId: BigInt(data.studentId),
                subject: data.subject,
                topic: data.topic,
                difficulty,
                totalItems: itemCount,
                questions: questions as any,
                generatedBy: 'template', // 향후 'ai'로 변경
            },
        });

        return this.serialize(quiz);
    }

    /** 퀴즈 제출 & 채점 */
    async submitQuiz(data: {
        quizId: number;
        studentId: number;
        answers: number[]; // 선택한 답 인덱스 배열
        timeTakenSec?: number;
    }) {
        const quiz = await (this.prisma as any).quiz.findUnique({
            where: { id: BigInt(data.quizId) },
        });

        if (!quiz) throw new Error('Quiz not found');

        const questions = quiz.questions as any as QuizQuestion[];
        let correctCount = 0;

        for (let i = 0; i < questions.length; i++) {
            if (data.answers[i] === questions[i].answer) {
                correctCount++;
            }
        }

        const scoreRate = questions.length > 0
            ? Math.round((correctCount / questions.length) * 100) / 100
            : 0;

        const result = await (this.prisma as any).quizResult.create({
            data: {
                quizId: BigInt(data.quizId),
                studentId: BigInt(data.studentId),
                answers: data.answers as any,
                correctCount,
                totalCount: questions.length,
                scoreRate,
                timeTakenSec: data.timeTakenSec,
            },
        });

        return {
            ...this.serialize(result),
            correctCount,
            totalCount: questions.length,
            scoreRate,
            corrections: questions.map((q, i) => ({
                question: q.question,
                yourAnswer: data.answers[i],
                correctAnswer: q.answer,
                isCorrect: data.answers[i] === q.answer,
                explanation: q.explanation,
            })),
        };
    }

    /** 특정 학생의 퀴즈 목록 */
    async getQuizzes(studentId: number, subject?: string) {
        const where: any = { studentId: BigInt(studentId) };
        if (subject) where.subject = subject;

        const quizzes = await (this.prisma as any).quiz.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 20,
            include: { results: true },
        });

        return quizzes.map((q: any) => ({
            ...this.serialize(q),
            hasResult: q.results.length > 0,
            bestScore: q.results.length > 0
                ? Math.max(...q.results.map((r: any) => Number(r.scoreRate)))
                : null,
        }));
    }

    /** 과목별 퀴즈 평균 점수 (성과 점수 공식의 Q 값) */
    async getSubjectQuizAverage(studentId: number, subject: string): Promise<number> {
        const results = await (this.prisma as any).quizResult.findMany({
            where: {
                studentId: BigInt(studentId),
                quiz: { subject },
            },
            orderBy: { completedAt: 'desc' },
            take: 5, // 최근 5회 평균
        });

        if (results.length === 0) return 0;
        const avg = results.reduce((sum: number, r: any) => sum + Number(r.scoreRate), 0) / results.length;
        return Math.round(avg * 100) / 100;
    }

    /** 템플릿 기반 문항 생성 (LLM 연동 전 placeholder) */
    private generateTemplateQuestions(
        subject: string, topic: string, difficulty: number, count: number,
    ): QuizQuestion[] {
        const questions: QuizQuestion[] = [];
        for (let i = 0; i < count; i++) {
            questions.push({
                question: `[${subject}] ${topic} - 문항 ${i + 1} (난이도 ${difficulty})`,
                choices: [
                    `보기 A`,
                    `보기 B`,
                    `보기 C`,
                    `보기 D`,
                ],
                answer: Math.floor(Math.random() * 4),
                explanation: `이 문항은 ${topic}의 핵심 개념을 평가합니다.`,
            });
        }
        return questions;
    }

    private serialize(obj: any) {
        const result: any = { ...obj };
        for (const key of Object.keys(result)) {
            if (typeof result[key] === 'bigint') result[key] = Number(result[key]);
        }
        return result;
    }
}
