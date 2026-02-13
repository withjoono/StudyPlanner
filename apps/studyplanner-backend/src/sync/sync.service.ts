import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * 크로스앱 데이터 동기화 서비스
 * StudyPlanner → StudyArena 데이터 전송
 * - 일간 학습 점수 동기화
 * - 성적 변화 이벤트 전달
 * - 스트릭 데이터 공유
 */
@Injectable()
export class SyncService {
    private readonly logger = new Logger(SyncService.name);

    constructor(private readonly prisma: PrismaService) { }

    /** 일간 점수 데이터 수집 (StudyArena 전송용) */
    async collectDailyScoreData(studentId: number, date?: string) {
        const targetDate = date ? new Date(date) : new Date();
        targetDate.setHours(0, 0, 0, 0);

        const nextDate = new Date(targetDate);
        nextDate.setDate(nextDate.getDate() + 1);

        // 1) 미션 결과
        const missions = await this.prisma.dailyMission.findMany({
            where: {
                studentId: BigInt(studentId),
                date: targetDate,
            },
            include: { missionResults: true },
        });

        // 2) 타이머 세션 (학습 시간)
        const sessions = await this.prisma.timerSession.findMany({
            where: {
                studentId: BigInt(studentId),
                startedAt: { gte: targetDate, lt: nextDate },
                isCompleted: true,
            },
        });

        // 3) 퀴즈 결과
        const quizResults = await (this.prisma as any).quizResult.findMany({
            where: {
                studentId: BigInt(studentId),
                submittedAt: { gte: targetDate, lt: nextDate },
            },
        });

        const totalStudyMin = sessions.reduce(
            (sum: number, s: any) => sum + (s.durationMin || 0), 0,
        );
        const completedMissions = missions.filter(
            (m: any) => m.status === 'completed',
        ).length;
        const avgQuizScore = quizResults.length > 0
            ? quizResults.reduce((sum: number, q: any) => sum + Number(q.score || 0), 0) / quizResults.length
            : 0;

        return {
            studentId,
            date: targetDate.toISOString().split('T')[0],
            totalStudyMin,
            totalMissions: missions.length,
            completedMissions,
            completionRate: missions.length > 0
                ? Math.round((completedMissions / missions.length) * 100)
                : 0,
            avgQuizScore: Math.round(avgQuizScore * 100) / 100,
            sessionCount: sessions.length,
        };
    }

    /** 주간 데이터 수집 (일주일치 한 번에) */
    async collectWeeklyData(studentId: number) {
        const today = new Date();
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);

        const dailyData = [];
        for (let d = new Date(weekAgo); d <= today; d.setDate(d.getDate() + 1)) {
            const data = await this.collectDailyScoreData(
                studentId,
                d.toISOString().split('T')[0],
            );
            dailyData.push(data);
        }

        const totalStudyMin = dailyData.reduce((sum, d) => sum + d.totalStudyMin, 0);
        const activeDays = dailyData.filter(d => d.totalStudyMin > 0).length;

        return {
            studentId,
            weekStart: weekAgo.toISOString().split('T')[0],
            weekEnd: today.toISOString().split('T')[0],
            totalStudyMin,
            activeDays,
            consistency: Math.round((activeDays / 7) * 100),
            dailyData,
        };
    }

    /** 스트릭 계산 */
    async calculateStreak(studentId: number): Promise<number> {
        let streak = 0;
        const today = new Date();

        for (let i = 0; i < 365; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);

            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);

            const sessions = await this.prisma.timerSession.count({
                where: {
                    studentId: BigInt(studentId),
                    startedAt: { gte: date, lt: nextDate },
                    isCompleted: true,
                },
            });

            if (sessions > 0) {
                streak++;
            } else if (i > 0) {
                break; // 오늘이 아닌 날에 끊기면 종료
            }
        }

        return streak;
    }

    /** StudyArena로 전송할 종합 패키지 */
    async buildSyncPackage(studentId: number) {
        const [dailyScore, streak] = await Promise.all([
            this.collectDailyScoreData(studentId),
            this.calculateStreak(studentId),
        ]);

        return {
            studentId,
            timestamp: new Date(),
            daily: dailyScore,
            streak,
            // StudyArena SnapshotService가 이 데이터를 소비하여 리더보드를 업데이트
        };
    }
}
