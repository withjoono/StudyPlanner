import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * AI 학습 분석 & 피드백 생성 서비스
 * 주간 학습 패턴을 분석하고 성장 마인드셋 기반 피드백 제공
 */
@Injectable()
export class AnalysisService {
    private readonly logger = new Logger(AnalysisService.name);

    constructor(private readonly prisma: PrismaService) { }

    /** 주간 리포트 생성 */
    async generateWeeklyReport(studentId: number, weekStart?: Date) {
        const start = weekStart || this.getCurrentWeekStart();
        const end = new Date(start);
        end.setDate(end.getDate() + 6);

        // 주간 데이터 수집
        const missions = await this.prisma.dailyMission.findMany({
            where: {
                studentId: BigInt(studentId),
                date: { gte: start, lte: end },
            },
            include: { missionResults: true },
        });

        const timerSessions = await (this.prisma as any).timerSession.findMany({
            where: {
                studentId: BigInt(studentId),
                startedAt: { gte: start, lte: end },
                isCompleted: true,
            },
        });

        // 과목별 분석
        const subjectMap = new Map<string, { studyMin: number; missions: number; completed: number; pages: number }>();
        for (const m of missions) {
            const subj = (m as any).subject || '기타';
            const existing = subjectMap.get(subj) || { studyMin: 0, missions: 0, completed: 0, pages: 0 };
            existing.missions++;
            if ((m as any).status === 'completed') existing.completed++;
            existing.pages += (m as any).amount || 0;
            subjectMap.set(subj, existing);
        }

        for (const s of timerSessions) {
            const subj = (s as any).subject || '기타';
            const existing = subjectMap.get(subj) || { studyMin: 0, missions: 0, completed: 0, pages: 0 };
            existing.studyMin += (s as any).durationMin || 0;
            subjectMap.set(subj, existing);
        }

        const totalStudyMin = timerSessions.reduce(
            (sum: number, s: any) => sum + (s.durationMin || 0), 0,
        );

        // 학습 일관성 계산 (7일 중 학습한 날 비율)
        const studyDays = new Set<string>();
        for (const m of missions) {
            if ((m as any).status === 'completed') {
                studyDays.add(new Date((m as any).date).toISOString().split('T')[0]);
            }
        }
        for (const s of timerSessions) {
            studyDays.add(new Date((s as any).startedAt).toISOString().split('T')[0]);
        }
        const consistency = Math.round((studyDays.size / 7) * 100) / 100;

        // 과목 편중도 분석
        const subjectBreakdown = Object.fromEntries(subjectMap);
        const subjects = Array.from(subjectMap.entries());
        const totalSubjectMin = subjects.reduce((s, [, v]) => s + v.studyMin, 0);

        // AI 피드백 생성 (현재: 규칙 기반 / 향후: LLM)
        const feedback = this.generateFeedback({
            totalStudyMin,
            consistency,
            subjects,
            totalSubjectMin,
            totalMissions: missions.length,
            completedMissions: missions.filter((m: any) => m.status === 'completed').length,
        });

        // 리포트 저장
        const report = await (this.prisma as any).weeklyReport.upsert({
            where: {
                studentId_weekStart: {
                    studentId: BigInt(studentId),
                    weekStart: start,
                },
            },
            create: {
                studentId: BigInt(studentId),
                weekStart: start,
                weekEnd: end,
                totalStudyMin,
                totalScore: 0,
                subjectBreakdown: subjectBreakdown as any,
                strengths: feedback.strengths,
                improvements: feedback.improvements,
                encouragement: feedback.encouragement,
                consistency,
            },
            update: {
                totalStudyMin,
                subjectBreakdown: subjectBreakdown as any,
                strengths: feedback.strengths,
                improvements: feedback.improvements,
                encouragement: feedback.encouragement,
                consistency,
            },
        });

        return this.serialize(report);
    }

    /** 주간 리포트 목록 */
    async getWeeklyReports(studentId: number, limit = 4) {
        const reports = await (this.prisma as any).weeklyReport.findMany({
            where: { studentId: BigInt(studentId) },
            orderBy: { weekStart: 'desc' },
            take: limit,
        });
        return reports.map(this.serialize);
    }

    /** 규칙 기반 피드백 생성 */
    private generateFeedback(data: {
        totalStudyMin: number;
        consistency: number;
        subjects: [string, { studyMin: number; missions: number; completed: number; pages: number }][];
        totalSubjectMin: number;
        totalMissions: number;
        completedMissions: number;
    }) {
        const strengths: string[] = [];
        const improvements: string[] = [];
        let encouragement = '';

        // 총 학습시간 피드백
        const hours = Math.floor(data.totalStudyMin / 60);
        if (hours >= 20) {
            strengths.push(`이번 주 총 ${hours}시간 학습! 놀라운 집중력이에요 🔥`);
        } else if (hours >= 10) {
            strengths.push(`${hours}시간 꾸준히 학습했어요. 좋은 습관이 자리잡고 있습니다 👍`);
        } else if (hours > 0) {
            improvements.push(`이번 주 ${hours}시간 학습했어요. 조금씩 시간을 늘려보는 건 어떨까요?`);
        }

        // 일관성 피드백
        if (data.consistency >= 0.85) {
            strengths.push(`7일 중 ${Math.round(data.consistency * 7)}일 학습! 꾸준함이 최고의 무기예요 💪`);
        } else if (data.consistency < 0.5) {
            improvements.push(`학습 일관성을 높여보세요. 매일 조금씩이라도 공부하면 효과가 커져요.`);
        }

        // 과목 편중 분석
        if (data.subjects.length > 1 && data.totalSubjectMin > 0) {
            const maxSubject = data.subjects.reduce((max, curr) =>
                curr[1].studyMin > max[1].studyMin ? curr : max,
            );
            const ratio = maxSubject[1].studyMin / data.totalSubjectMin;
            if (ratio > 0.7) {
                improvements.push(`${maxSubject[0]}에 집중하고 있네요 (${Math.round(ratio * 100)}%). 다른 과목도 균형있게 배분해보세요.`);
            }
        }

        // 미션 달성률
        if (data.totalMissions > 0) {
            const rate = data.completedMissions / data.totalMissions;
            if (rate >= 0.9) {
                strengths.push(`미션 달성률 ${Math.round(rate * 100)}%! 목표를 거의 다 달성했어요 🎯`);
            } else if (rate < 0.5) {
                improvements.push(`미션 달성률이 ${Math.round(rate * 100)}%예요. 목표량을 조정하거나 우선순위를 재설정해보세요.`);
            }
        }

        // 격려 메시지
        if (strengths.length >= 2) {
            encouragement = '정말 훌륭한 한 주였어요! 이 페이스를 유지하면 놀라운 성장을 경험할 거예요 🌟';
        } else if (improvements.length > strengths.length) {
            encouragement = '성장은 작은 변화에서 시작돼요. 오늘 10분만 더 집중해보는 건 어떨까요? 당신의 가능성을 믿어요 💫';
        } else {
            encouragement = '꾸준히 노력하고 있는 모습이 보여요. 다음 주가 기대됩니다! 🚀';
        }

        return {
            strengths: strengths.join('\n'),
            improvements: improvements.join('\n'),
            encouragement,
        };
    }

    private getCurrentWeekStart(): Date {
        const now = new Date();
        const day = now.getDay();
        const diff = day === 0 ? 6 : day - 1;
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - diff);
        weekStart.setHours(0, 0, 0, 0);
        return weekStart;
    }

    private serialize(obj: any) {
        if (!obj) return null;
        const result: any = { ...obj };
        for (const key of Object.keys(result)) {
            if (typeof result[key] === 'bigint') result[key] = Number(result[key]);
            if (result[key] instanceof Object && result[key]?.constructor?.name === 'Decimal')
                result[key] = Number(result[key]);
        }
        return result;
    }
}
